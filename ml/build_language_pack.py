#!/usr/bin/env python3
"""Assemble the downloadable CHW Dagbani language pack (translation + TTS)."""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def copy_tree_files(src: Path, dest: Path, role_prefix: str) -> list[dict]:
    meta = []
    if not src.exists():
        return meta
    for f in sorted(src.rglob("*")):
        if not f.is_file():
            continue
        rel = f.relative_to(src)
        out = dest / rel
        out.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(f, out)
        meta.append(
            {
                "role": f"{role_prefix}/{rel.as_posix()}",
                "path": f"{dest.name}/{rel.as_posix()}",
                "bytes": out.stat().st_size,
                "sha256": sha256_file(out),
            }
        )
    return meta


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", type=Path, default=ROOT / "artifacts" / "language-pack")
    parser.add_argument(
        "--translation-dir",
        type=Path,
        default=ROOT / "dagbani-translation" / "artifacts" / "onnx" / "int8",
    )
    parser.add_argument(
        "--tts-dir",
        type=Path,
        default=ROOT / "dagbani-tts" / "artifacts" / "pack" / "tts",
    )
    parser.add_argument("--version", default="0.1.0")
    args = parser.parse_args()

    if args.out.exists():
        shutil.rmtree(args.out)
    args.out.mkdir(parents=True)

    translation_files = copy_tree_files(args.translation_dir, args.out / "translation", "translation")
    tts_files = copy_tree_files(args.tts_dir, args.out / "tts", "tts")

    # Always include license notes if present
    license_src = ROOT / "dagbani-tts" / "artifacts" / "pack" / "LICENSE-NOTES.md"
    if license_src.exists():
        shutil.copy2(license_src, args.out / "LICENSE-NOTES.md")

    manifest = {
        "pack_id": f"chw-dagbani-lang-v{args.version}",
        "version": args.version,
        "status": "experimental",
        "languages": ["en", "dag"],
        "components": {
            "translation": {
                "engine": "onnxruntime",
                "task": "en->dag",
                "prefix": "translate English to Dagbani: ",
                "files": translation_files,
                "ready": len(translation_files) > 0,
            },
            "tts": {
                "engine": "sherpa-onnx",
                "files": tts_files,
                "ready": len(tts_files) > 0,
            },
        },
        "total_bytes": sum(f["bytes"] for f in translation_files + tts_files),
        "license_status": "uncleared",
        "quality_gate": {
            "translation": "experimental until native_review.csv signed off",
            "tts": "listen to samples before clinical use",
        },
    }
    (args.out / "manifest.json").write_text(json.dumps(manifest, indent=2))
    print(json.dumps(manifest, indent=2))
    print(f"[ok] language pack at {args.out}")


if __name__ == "__main__":
    main()