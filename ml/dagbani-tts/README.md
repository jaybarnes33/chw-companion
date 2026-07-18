# Dagbani TTS packaging

Evaluate available Dagbani voices and package a sherpa-onnx-compatible artifact
for offline playback in the mobile app.

## Candidate voices

| Model | Notes |
|-------|-------|
| `FarmerlineML/dagbani_tts-2025_v2` | VITS (~36M params), Transformers `VitsModel` |
| `michsethowusu/stabletts-ghana-twi-ewe-dagbani` | Already has `sherpa-onnx/` export |

## Usage

```bash
cd ml/dagbani-tts
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Synthesize sample health sentences with VITS
python benchmark_voices.py --voice vits --out ./artifacts/samples

# Package sherpa-onnx files from StableTTS (preferred for on-device)
python package_sherpa.py --out ./artifacts/pack
```

## License blocker

Upstream model cards are sparse. Treat commercial rights as **uncleared** until
confirmed. Record status in `artifacts/pack/LICENSE-NOTES.md`.

## Output

`artifacts/pack/manifest.json` with file sizes + SHA-256 checksums for the
downloadable language pack.