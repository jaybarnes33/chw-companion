#!/usr/bin/env python3
"""Export fine-tuned EN→Dagbani model to ONNX + INT8 for on-device use."""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PREFIX = "translate English to Dagbani: "


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model-dir", type=Path, required=True)
    parser.add_argument("--base-model", default="google-t5/t5-small")
    parser.add_argument("--output-dir", type=Path, default=ROOT / "artifacts" / "onnx")
    parser.add_argument("--quantize", action="store_true", default=True)
    args = parser.parse_args()

    args.output_dir.mkdir(parents=True, exist_ok=True)

    try:
        from optimum.onnxruntime import ORTModelForSeq2SeqLM, ORTQuantizer
        from optimum.onnxruntime.configuration import AutoQuantizationConfig
        from transformers import AutoTokenizer
        from peft import PeftModel
        from transformers import AutoModelForSeq2SeqLM
    except ImportError as e:
        raise SystemExit(
            "Missing deps. pip install -r requirements.txt (needs optimum[onnxruntime])"
        ) from e

    adapter_cfg = args.model_dir / "adapter_config.json"
    export_src = args.model_dir
    if adapter_cfg.exists():
        print("[ok] merging LoRA before ONNX export")
        merged_dir = args.output_dir / "_merged_tmp"
        if merged_dir.exists():
            shutil.rmtree(merged_dir)
        base = AutoModelForSeq2SeqLM.from_pretrained(args.base_model)
        model = PeftModel.from_pretrained(base, str(args.model_dir))
        model = model.merge_and_unload()
        model.save_pretrained(merged_dir)
        tok = AutoTokenizer.from_pretrained(
            args.model_dir if (args.model_dir / "tokenizer_config.json").exists() else args.base_model
        )
        tok.save_pretrained(merged_dir)
        export_src = merged_dir

    print(f"[ok] exporting ONNX from {export_src}")
    ort_model = ORTModelForSeq2SeqLM.from_pretrained(export_src, export=True)
    fp_dir = args.output_dir / "fp32"
    ort_model.save_pretrained(fp_dir)
    tok = AutoTokenizer.from_pretrained(export_src)
    tok.save_pretrained(fp_dir)

    out_dir = fp_dir
    if args.quantize:
        print("[ok] INT8 dynamic quantization")
        q_dir = args.output_dir / "int8"
        q_dir.mkdir(parents=True, exist_ok=True)
        # Quantize encoder + decoder
        for name in ("encoder_model.onnx", "decoder_model.onnx", "decoder_with_past_model.onnx"):
            onnx_path = fp_dir / name
            if not onnx_path.exists():
                # optimum may use slightly different names
                candidates = list(fp_dir.glob(f"*{name.split('_')[0]}*.onnx"))
                if not candidates:
                    print(f"[warn] missing {name}")
                    continue
                onnx_path = candidates[0]
            quantizer = ORTQuantizer.from_pretrained(fp_dir, file_name=onnx_path.name)
            qconfig = AutoQuantizationConfig.avx512_vnni(is_static=False, per_channel=False)
            quantizer.quantize(save_dir=q_dir, quantization_config=qconfig)
        for f in fp_dir.iterdir():
            if f.suffix in {".json", ".model", ".txt"} or "tokenizer" in f.name or "spiece" in f.name:
                shutil.copy2(f, q_dir / f.name)
        out_dir = q_dir

    files = []
    for f in sorted(out_dir.rglob("*")):
        if f.is_file():
            files.append(
                {
                    "path": str(f.relative_to(args.output_dir)),
                    "bytes": f.stat().st_size,
                    "sha256": sha256_file(f),
                }
            )

    manifest = {
        "task": "en-dag-translation",
        "base_model": args.base_model,
        "prefix": PREFIX,
        "format": "onnx-int8" if args.quantize else "onnx-fp32",
        "status": "experimental",
        "src_lang": "en",
        "tgt_lang": "dag",
        "files": files,
        "total_bytes": sum(x["bytes"] for x in files),
    }
    (args.output_dir / "manifest.json").write_text(json.dumps(manifest, indent=2))
    print(json.dumps({k: manifest[k] for k in ("format", "total_bytes", "status")}, indent=2))
    print(f"[ok] ONNX pack ready at {args.output_dir}")

    # Cleanup temp
    merged = args.output_dir / "_merged_tmp"
    if merged.exists():
        shutil.rmtree(merged)


if __name__ == "__main__":
    main()