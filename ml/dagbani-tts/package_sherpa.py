#!/usr/bin/env python3
"""Download and package sherpa-onnx Dagbani TTS files with checksums."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
MODEL_ID = "michsethowusu/stabletts-ghana-twi-ewe-dagbani"
SHERPA_FILES = [
    "sherpa-onnx/model-steps-4.onnx",
    "sherpa-onnx/tokens.txt",
    "sherpa-onnx/lexicon.txt",
    "sherpa-onnx/vocos.onnx",
]


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", type=Path, default=ROOT / "artifacts" / "pack")
    parser.add_argument("--model-id", default=MODEL_ID)
    parser.add_argument("--skip-download", action="store_true", help="Only write manifest skeleton")
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)

    license_notes = args.out / "LICENSE-NOTES.md"
    license_notes.write_text(
        f"""# License notes — Dagbani TTS pack

## Upstream

- Primary sherpa pack: `{args.model_id}`
- Alternate VITS: `FarmerlineML/dagbani_tts-2025_v2`

## Status

**UNCLEARED FOR COMMERCIAL USE.** Upstream README/model cards are incomplete.
Do not assume Apache/MIT. Confirm with authors before production distribution.

For hackathon / research prototypes: document attribution and keep this file
bundled with the language pack.

## Attribution

- GhanaNLP / Farmerline community voices
- StableTTS Ghana (Twi / Ewe / Dagbani) sherpa-onnx export
"""
    )

    files_meta = []
    if not args.skip_download:
        try:
            from huggingface_hub import hf_hub_download
        except ImportError as e:
            raise SystemExit("pip install huggingface_hub") from e

        tts_dir = args.out / "tts"
        tts_dir.mkdir(parents=True, exist_ok=True)
        for rel in SHERPA_FILES:
            print(f"[ok] downloading {rel}")
            local = hf_hub_download(repo_id=args.model_id, filename=rel)
            dest = tts_dir / Path(rel).name
            dest.write_bytes(Path(local).read_bytes())
            files_meta.append(
                {
                    "role": Path(rel).name,
                    "path": f"tts/{dest.name}",
                    "bytes": dest.stat().st_size,
                    "sha256": sha256_file(dest),
                }
            )
    else:
        for rel in SHERPA_FILES:
            files_meta.append(
                {
                    "role": Path(rel).name,
                    "path": f"tts/{Path(rel).name}",
                    "bytes": 0,
                    "sha256": "",
                    "pending_download": True,
                }
            )

    manifest = {
        "pack_id": "chw-dagbani-lang-v0.1.0",
        "version": "0.1.0",
        "languages": ["en", "dag"],
        "components": {
            "tts": {
                "engine": "sherpa-onnx",
                "model_type": "matcha-or-vits-export",
                "upstream": args.model_id,
                "files": files_meta,
            },
            "translation": {
                "engine": "onnxruntime",
                "status": "experimental",
                "note": "Populate from ml/dagbani-translation/artifacts/onnx after training",
                "files": [],
            },
        },
        "license_status": "uncleared",
        "license_notes": "LICENSE-NOTES.md",
    }
    (args.out / "manifest.json").write_text(json.dumps(manifest, indent=2))
    print(f"[ok] wrote {args.out / 'manifest.json'}")


if __name__ == "__main__":
    main()