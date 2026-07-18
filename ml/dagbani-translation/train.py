#!/usr/bin/env python3
"""LoRA fine-tune t5-small for English → Dagbani translation."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import pandas as pd
import torch
from datasets import Dataset
from peft import LoraConfig, TaskType, get_peft_model
from transformers import (
    AutoModelForSeq2SeqLM,
    AutoTokenizer,
    DataCollatorForSeq2Seq,
    Seq2SeqTrainer,
    Seq2SeqTrainingArguments,
)

ROOT = Path(__file__).resolve().parent
DEFAULT_DATA = ROOT / "data" / "processed"
PREFIX = "translate English to Dagbani: "


def load_split(data_dir: Path, split: str) -> Dataset:
    path_csv = data_dir / f"{split}.csv"
    path_parquet = data_dir / f"{split}.parquet"
    if path_csv.exists():
        df = pd.read_csv(path_csv)
    elif path_parquet.exists():
        df = pd.read_parquet(path_parquet)
    else:
        raise SystemExit(f"Missing {path_csv}. Run prepare_data.py first.")
    df = df[(df["english"].astype(str).str.strip() != "") & (df["dagbani"].astype(str).str.strip() != "")]
    return Dataset.from_pandas(df[["english", "dagbani"]], preserve_index=False)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-model", default="google-t5/t5-small")
    parser.add_argument("--data-dir", type=Path, default=DEFAULT_DATA)
    parser.add_argument("--output-dir", type=Path, default=ROOT / "artifacts" / "checkpoint")
    parser.add_argument("--epochs", type=float, default=3.0)
    parser.add_argument("--batch-size", type=int, default=8)
    parser.add_argument("--lr", type=float, default=2e-4)
    parser.add_argument("--max-source-length", type=int, default=128)
    parser.add_argument("--max-target-length", type=int, default=128)
    parser.add_argument("--lora-r", type=int, default=8)
    parser.add_argument("--lora-alpha", type=int, default=16)
    parser.add_argument("--merge-adapter", action="store_true", help="Merge LoRA into base before save")
    args = parser.parse_args()

    train_ds = load_split(args.data_dir, "train")
    val_ds = load_split(args.data_dir, "val")
    print(f"[ok] train={len(train_ds)} val={len(val_ds)}")

    tokenizer = AutoTokenizer.from_pretrained(args.base_model)
    model = AutoModelForSeq2SeqLM.from_pretrained(args.base_model)

    lora = LoraConfig(
        task_type=TaskType.SEQ_2_SEQ_LM,
        r=args.lora_r,
        lora_alpha=args.lora_alpha,
        lora_dropout=0.05,
        target_modules=["q", "v"],
    )
    model = get_peft_model(model, lora)
    model.print_trainable_parameters()

    def preprocess(batch):
        inputs = [PREFIX + t for t in batch["english"]]
        model_inputs = tokenizer(
            inputs,
            max_length=args.max_source_length,
            truncation=True,
            padding=False,
        )
        labels = tokenizer(
            text_target=batch["dagbani"],
            max_length=args.max_target_length,
            truncation=True,
            padding=False,
        )
        model_inputs["labels"] = labels["input_ids"]
        return model_inputs

    train_tok = train_ds.map(preprocess, batched=True, remove_columns=train_ds.column_names)
    val_tok = val_ds.map(preprocess, batched=True, remove_columns=val_ds.column_names)

    collator = DataCollatorForSeq2Seq(tokenizer=tokenizer, model=model)
    args.output_dir.mkdir(parents=True, exist_ok=True)

    training_args = Seq2SeqTrainingArguments(
        output_dir=str(args.output_dir),
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch_size,
        per_device_eval_batch_size=args.batch_size,
        learning_rate=args.lr,
        eval_strategy="epoch",
        save_strategy="epoch",
        logging_steps=50,
        predict_with_generate=True,
        fp16=torch.cuda.is_available(),
        report_to=[],
        load_best_model_at_end=True,
        metric_for_best_model="eval_loss",
    )

    trainer = Seq2SeqTrainer(
        model=model,
        args=training_args,
        train_dataset=train_tok,
        eval_dataset=val_tok,
        data_collator=collator,
        processing_class=tokenizer,
    )
    trainer.train()

    if args.merge_adapter:
        print("[ok] merging LoRA adapter into base weights")
        model = model.merge_and_unload()
        model.save_pretrained(args.output_dir)
    else:
        model.save_pretrained(args.output_dir)
    tokenizer.save_pretrained(args.output_dir)

    meta = {
        "base_model": args.base_model,
        "prefix": PREFIX,
        "epochs": args.epochs,
        "lora_r": args.lora_r,
        "lora_alpha": args.lora_alpha,
        "merged": bool(args.merge_adapter),
        "status": "experimental",
        "train_rows": len(train_ds),
        "val_rows": len(val_ds),
    }
    (args.output_dir / "train_meta.json").write_text(json.dumps(meta, indent=2))
    print(f"[ok] saved checkpoint -> {args.output_dir}")


if __name__ == "__main__":
    main()