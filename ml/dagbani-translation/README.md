# English → Dagbani translation pipeline

Reproducible pipeline for a compact, phone-sized English→Dagbani translator.

## Why t5-small (not NLLB)

- Existing NLLB LoRA adapters for Dagbani report ~0.1 BLEU (unusable).
- Dagbani is **not** an official NLLB-200 language code.
- `t5-small` + LoRA is small enough to INT8-quantize for on-device use.

## Quick start (GPU / Colab)

```bash
cd ml/dagbani-translation
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# 1. Build licensed parallel corpus
python prepare_data.py

# 2. Fine-tune
python train.py --epochs 3 --output-dir ./artifacts/checkpoint

# 3. Evaluate + native-speaker review sheet
python evaluate.py --model-dir ./artifacts/checkpoint --split test

# 4. Export ONNX + INT8
python export_onnx.py --model-dir ./artifacts/checkpoint --output-dir ./artifacts/onnx
```

## Outputs

| Path | Purpose |
|------|---------|
| `data/processed/*.parquet` | Clean train/val/test with license + domain tags |
| `artifacts/checkpoint/` | LoRA-merged or adapter checkpoint |
| `artifacts/eval/report.json` | BLEU, chrF, latency |
| `artifacts/eval/native_review.csv` | Sentences for human clinical review |
| `artifacts/onnx/` | INT8 encoder/decoder for the mobile pack |

## Licenses

Most GhanaNLP / Bible datasets are **CC-BY-NC-4.0**. Tracked per-row in
`license` column. Do not ship commercial releases without clearing rights.

## Quality gate

Mark the model `experimental` until:
1. BLEU / chrF improve over baseline on held-out test
2. A native speaker reviews `native_review.csv` (negation, quantities, feeding advice)
3. On-device latency and peak memory are acceptable on target phones