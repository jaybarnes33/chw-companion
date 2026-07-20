#!/usr/bin/env python3
"""Evaluate EN→Dagbani model: BLEU, chrF, latency + native-speaker review sheet."""

from __future__ import annotations

import argparse
import json
import time
from pathlib import Path

import pandas as pd
import sacrebleu
import torch
from peft import PeftModel
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

ROOT = Path(__file__).resolve().parent
PREFIX = "translate English to Dagbani: "

# Clinical review focus from the plan
REVIEW_FOCUS = [
    "negation",
    "quantities",
    "feeding_advice",
    "named_foods",
    "clinical_meaning",
]


def load_model(model_dir: Path, base_model: str):
    model_dir = model_dir.resolve()
    if not model_dir.exists():
        raise SystemExit(
            f"Checkpoint not found: {model_dir}\n"
            "Train first: python train.py --epochs 3 --merge-adapter --output-dir ./artifacts/checkpoint"
        )
    tok_src = model_dir if (model_dir / "tokenizer_config.json").exists() else base_model
    tokenizer = AutoTokenizer.from_pretrained(tok_src)
    adapter_cfg = model_dir / "adapter_config.json"
    if adapter_cfg.exists():
        base = AutoModelForSeq2SeqLM.from_pretrained(base_model)
        model = PeftModel.from_pretrained(base, str(model_dir))
    else:
        model = AutoModelForSeq2SeqLM.from_pretrained(str(model_dir), local_files_only=True)
    model.eval()
    return tokenizer, model


def translate(tokenizer, model, texts: list[str], max_length: int = 128) -> list[str]:
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = model.to(device)
    outs = []
    for text in texts:
        inputs = tokenizer(PREFIX + text, return_tensors="pt", truncation=True, max_length=max_length).to(device)
        with torch.no_grad():
            ids = model.generate(**inputs, max_new_tokens=max_length, num_beams=4)
        outs.append(tokenizer.decode(ids[0], skip_special_tokens=True))
    return outs


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model-dir", type=Path, required=True)
    parser.add_argument("--base-model", default="google-t5/t5-small")
    parser.add_argument("--data-dir", type=Path, default=ROOT / "data" / "processed")
    parser.add_argument("--split", default="test")
    parser.add_argument("--limit", type=int, default=200)
    parser.add_argument("--output-dir", type=Path, default=ROOT / "artifacts" / "eval")
    args = parser.parse_args()

    path = args.data_dir / f"{args.split}.parquet"
    if path.exists():
        df = pd.read_parquet(path)
    else:
        df = pd.read_csv(args.data_dir / f"{args.split}.csv")
    df = df[(df["english"].astype(str).str.strip() != "") & (df["dagbani"].astype(str).str.strip() != "")]
    if args.limit:
        df = df.head(args.limit)

    tokenizer, model = load_model(args.model_dir, args.base_model)
    sources = df["english"].astype(str).tolist()
    refs = df["dagbani"].astype(str).tolist()

    t0 = time.perf_counter()
    hyps = translate(tokenizer, model, sources)
    elapsed = time.perf_counter() - t0
    latency_ms = (elapsed / max(len(sources), 1)) * 1000

    bleu = sacrebleu.corpus_bleu(hyps, [refs])
    chrf = sacrebleu.corpus_chrf(hyps, [refs])

    args.output_dir.mkdir(parents=True, exist_ok=True)
    report = {
        "split": args.split,
        "n": len(sources),
        "bleu": bleu.score,
        "chrf": chrf.score,
        "avg_latency_ms": latency_ms,
        "status": "experimental",
        "quality_gate": {
            "requires_native_speaker_review": True,
            "focus": REVIEW_FOCUS,
            "pass_criteria": [
                "BLEU/chrF improve over untrained baseline",
                "Native speaker signs off clinical meaning in native_review.csv",
                "No harmful negation/quantity errors on health tips",
            ],
        },
    }
    (args.output_dir / "report.json").write_text(json.dumps(report, indent=2))

    pred_df = pd.DataFrame(
        {
            "english": sources,
            "reference_dagbani": refs,
            "hypothesis_dagbani": hyps,
            "domain": df.get("domain", pd.Series([""] * len(df))).tolist(),
            "source": df.get("source", pd.Series([""] * len(df))).tolist(),
        }
    )
    pred_df.to_csv(args.output_dir / "predictions.csv", index=False)

    # Native-speaker sheet: health tips + sample of general
    health_path = args.data_dir / "health_review.csv"
    review_rows = []
    if health_path.exists():
        health = pd.read_csv(health_path)
        health_hyps = translate(tokenizer, model, health["english"].astype(str).tolist())
        for i, tip in health.iterrows():
            review_rows.append(
                {
                    "key": tip.get("verse_id", ""),
                    "english": tip["english"],
                    "model_dagbani": health_hyps[i] if i < len(health_hyps) else "",
                    "corrected_dagbani": "",
                    "clinical_ok": "",
                    "negation_ok": "",
                    "quantities_ok": "",
                    "foods_ok": "",
                    "notes": "",
                    "reviewer": "",
                }
            )
    # Also include up to 20 test samples
    for i in range(min(20, len(pred_df))):
        review_rows.append(
            {
                "key": f"test-{i}",
                "english": pred_df.iloc[i]["english"],
                "model_dagbani": pred_df.iloc[i]["hypothesis_dagbani"],
                "corrected_dagbani": pred_df.iloc[i]["reference_dagbani"],
                "clinical_ok": "",
                "negation_ok": "",
                "quantities_ok": "",
                "foods_ok": "",
                "notes": "test-set sample",
                "reviewer": "",
            }
        )
    pd.DataFrame(review_rows).to_csv(args.output_dir / "native_review.csv", index=False)

    print(json.dumps(report, indent=2))
    print(f"[ok] wrote {args.output_dir}")


if __name__ == "__main__":
    main()