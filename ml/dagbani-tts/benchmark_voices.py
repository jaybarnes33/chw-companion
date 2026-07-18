#!/usr/bin/env python3
"""Benchmark Dagbani TTS voices on health-domain sample sentences."""

from __future__ import annotations

import argparse
import json
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPO_ROOT = ROOT.parents[1]

# Placeholder Dagbani strings — replace with native-speaker approved text.
# Used only to exercise the voice pipeline end-to-end.
SAMPLE_SENTENCES = [
    {
        "key": "exclusive_breastfeeding_0_6mo",
        "english": "For the first 6 months, feed your baby only breast milk.",
        "dagbani": "Bihili piligu goli ayobu ni, dihimi a bia mɔɣisim bihili ko.",
    },
    {
        "key": "early_initiation",
        "english": "Start breastfeeding within the first hour after birth.",
        "dagbani": "Pihimi bihili dihibu awa tuuli ni nyaanga dɔɣibu.",
    },
    {
        "key": "complementary_feeding_start",
        "english": "At 6 months, start adding soft mashed foods alongside breastfeeding.",
        "dagbani": "Goli ayobu ni, pahi bindirigu ŋun mali yoli ka dihimi bihili.",
    },
    {
        "key": "thank_you",
        "english": "Thank you",
        "dagbani": "N tipaya",
    },
    {
        "key": "good_morning",
        "english": "Good morning",
        "dagbani": "Deseba",
    },
]


def normalize_dagbani(text: str) -> str:
    """Light text normalization for TTS (numbers, whitespace)."""
    text = text.strip()
    text = " ".join(text.split())
    # Expand simple digits if present
    digit_map = {
        "0": "zia",
        "1": "yini",
        "2": "ayi",
        "3": "ata",
        "4": "anahi",
        "5": "anu",
        "6": "ayobu",
        "7": "ayopɔin",
        "8": "anii",
        "9": "awɔi",
    }
    out = []
    for ch in text:
        out.append(digit_map.get(ch, ch))
    return "".join(out)


def synth_vits(out_dir: Path) -> list[dict]:
    import numpy as np
    import soundfile as sf
    import torch
    from transformers import AutoTokenizer, VitsModel

    model_id = "FarmerlineML/dagbani_tts-2025_v2"
    print(f"[ok] loading {model_id}")
    model = VitsModel.from_pretrained(model_id)
    tokenizer = AutoTokenizer.from_pretrained(model_id)
    model.eval()

    results = []
    out_dir.mkdir(parents=True, exist_ok=True)
    for item in SAMPLE_SENTENCES:
        text = normalize_dagbani(item["dagbani"])
        inputs = tokenizer(text, return_tensors="pt")
        t0 = time.perf_counter()
        with torch.no_grad():
            wav = model(**inputs).waveform
        latency_ms = (time.perf_counter() - t0) * 1000
        arr = wav.squeeze().cpu().numpy().astype(np.float32)
        path = out_dir / f"vits_{item['key']}.wav"
        sf.write(path, arr, model.config.sampling_rate)
        results.append(
            {
                "voice": "vits",
                "model": model_id,
                "key": item["key"],
                "text": text,
                "path": str(path),
                "latency_ms": latency_ms,
                "duration_s": float(len(arr) / model.config.sampling_rate),
                "sample_rate": model.config.sampling_rate,
            }
        )
        print(f"[ok] {item['key']}: {latency_ms:.0f}ms -> {path.name}")
    return results


def note_stabletts(out_dir: Path) -> list[dict]:
    """StableTTS is packaged via package_sherpa.py; record expected files here."""
    model_id = "michsethowusu/stabletts-ghana-twi-ewe-dagbani"
    expected = [
        "sherpa-onnx/model-steps-4.onnx",
        "sherpa-onnx/tokens.txt",
        "sherpa-onnx/lexicon.txt",
        "sherpa-onnx/vocos.onnx",
    ]
    note = {
        "voice": "stabletts-sherpa",
        "model": model_id,
        "expected_files": expected,
        "status": "package_via_package_sherpa.py",
        "samples_on_hub": [
            "sherpa-onnx/test/dagbani.wav",
            "fast-ghana-voice-samples/dagbani.wav",
        ],
    }
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "stabletts_notes.json").write_text(json.dumps(note, indent=2))
    return [note]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--voice", choices=("vits", "stabletts", "all"), default="all")
    parser.add_argument("--out", type=Path, default=ROOT / "artifacts" / "samples")
    args = parser.parse_args()

    results: list[dict] = []
    if args.voice in ("vits", "all"):
        try:
            results.extend(synth_vits(args.out / "vits"))
        except Exception as exc:  # noqa: BLE001
            print(f"[warn] VITS benchmark failed (network/GPU?): {exc}")
            results.append({"voice": "vits", "error": str(exc)})
    if args.voice in ("stabletts", "all"):
        results.extend(note_stabletts(args.out / "stabletts"))

    report = {
        "sentences": SAMPLE_SENTENCES,
        "results": results,
        "recommendation": (
            "Prefer StableTTS sherpa-onnx export for on-device (already ONNX). "
            "Use Farmerline VITS if StableTTS quality/lexicon is poor; export separately."
        ),
        "license_status": "uncleared — see LICENSE-NOTES.md",
    }
    args.out.mkdir(parents=True, exist_ok=True)
    (args.out / "benchmark_report.json").write_text(json.dumps(report, indent=2))
    print(json.dumps({"n_results": len(results), "out": str(args.out)}, indent=2))


if __name__ == "__main__":
    main()