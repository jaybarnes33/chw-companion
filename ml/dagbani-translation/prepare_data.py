#!/usr/bin/env python3
"""Build a licensed, deduplicated EN→Dagbani parallel corpus.

Works with the Python stdlib. Optional Hub download if `datasets` is installed.

Each row tracks: source, license, domain, split.
Bible verse IDs (when available) prevent train/test leakage.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import random
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPO_ROOT = ROOT.parents[1]
OUT_DIR = ROOT / "data" / "processed"

EN_COL_CANDIDATES = ("english", "en", "eng", "source", "src", "text_en")
DAG_COL_CANDIDATES = ("dagbani", "dag", "target", "tgt", "text_dag", "translation")


def _norm(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip().lower())


def _row_id(en: str, dag: str) -> str:
    return hashlib.sha256(f"{_norm(en)}||{_norm(dag)}".encode()).hexdigest()[:16]


def _pick_col(columns: list[str], candidates: tuple[str, ...]) -> str | None:
    lower = {c.lower(): c for c in columns}
    for cand in candidates:
        if cand.lower() in lower:
            return lower[cand.lower()]
    return None


def _try_load_hub(dataset_id: str) -> list[dict]:
    try:
        from datasets import load_dataset
    except ImportError:
        return []

    try:
        ds = load_dataset(dataset_id)
        split = ds["train"] if "train" in ds else ds[next(iter(ds.keys()))]
    except Exception as exc:  # noqa: BLE001
        print(f"[warn] Could not load {dataset_id}: {exc}")
        return []

    cols = list(split.column_names)
    en_col = _pick_col(cols, EN_COL_CANDIDATES)
    dag_col = _pick_col(cols, DAG_COL_CANDIDATES)
    rows: list[dict] = []

    if en_col and dag_col:
        for item in split:
            en = str(item[en_col]).strip()
            dag = str(item[dag_col]).strip()
            if en and dag:
                rows.append(
                    {
                        "english": en,
                        "dagbani": dag,
                        "verse_id": str(item.get("verse_id") or item.get("id") or ""),
                    }
                )
    elif "translation" in cols:
        for item in split:
            t = item["translation"]
            if not isinstance(t, dict):
                continue
            en = str(t.get("en") or t.get("eng") or t.get("english") or "").strip()
            dag = str(t.get("dag") or t.get("dagbani") or "").strip()
            if en and dag:
                rows.append({"english": en, "dagbani": dag, "verse_id": ""})
    else:
        print(f"[warn] {dataset_id}: no EN/Dag columns among {cols}")
        return []

    print(f"[ok] {dataset_id}: {len(rows)} pairs")
    return rows


def demo_pairs() -> list[dict]:
    return [
        {"english": "Good morning", "dagbani": "Deseba", "verse_id": "demo-1"},
        {"english": "How are you?", "dagbani": "A wuhira?", "verse_id": "demo-2"},
        {"english": "Thank you", "dagbani": "N tipaya", "verse_id": "demo-3"},
        {"english": "Please sit down", "dagbani": "Moli ninyɔɣu", "verse_id": "demo-4"},
        {"english": "Drink water", "dagbani": "Nyuri kom", "verse_id": "demo-5"},
        {"english": "The child is sick", "dagbani": "Bia maa bɛri", "verse_id": "demo-6"},
        {"english": "Go to the clinic", "dagbani": "Chani asibiti", "verse_id": "demo-7"},
        {"english": "Breastfeed your baby", "dagbani": "Dihimi a bia bihili", "verse_id": "demo-8"},
        {"english": "Wash your hands", "dagbani": "Yohimi a nuhi", "verse_id": "demo-9"},
        {"english": "Eat soft food", "dagbani": "Di bindirigu ŋun mali yoli", "verse_id": "demo-10"},
        {"english": "Take the medicine", "dagbani": "Di tima maa", "verse_id": "demo-11"},
        {"english": "Come back tomorrow", "dagbani": "Labimi na biɛɣu", "verse_id": "demo-12"},
        {"english": "The baby needs milk", "dagbani": "Bia maa bora bihili", "verse_id": "demo-13"},
        {"english": "Do not give water to a newborn", "dagbani": "Di ti bipɔɣinga kom", "verse_id": "demo-14"},
        {"english": "Feed often day and night", "dagbani": "Dihimi yuli mini yuŋ", "verse_id": "demo-15"},
        {"english": "Keep breastfeeding until two years", "dagbani": "Dihi bihili hali ni yuun'ayi", "verse_id": "demo-16"},
        {"english": "Offer fruit and vegetables", "dagbani": "Ti wula mini alibarika", "verse_id": "demo-17"},
        {"english": "Rest when you can", "dagbani": "Vuhimi saha shɛli ni", "verse_id": "demo-18"},
        {"english": "Ask the health worker", "dagbani": "Bɔhi alaafee tumtumda", "verse_id": "demo-19"},
        {"english": "This is important", "dagbani": "Ŋɔ nyɛla barina", "verse_id": "demo-20"},
    ]


def health_seed_rows() -> list[dict]:
    nutrition = REPO_ROOT / "packages" / "content" / "nutrition.json"
    tips = json.loads(nutrition.read_text())["tips"]
    rows = []
    for tip in tips:
        rows.append(
            {
                "english": tip["text"],
                "dagbani": "",
                "source": "nyaaba/nutrition.json",
                "license": "app-content-prototype",
                "domain": "health",
                "verse_id": tip["key"],
                "pair_id": _row_id(tip["text"], tip["key"]),
                "group": tip["key"],
                "split": "health_review",
            }
        )
    print(f"[ok] health seed tips: {len(rows)}")
    return rows


def annotate(rows: list[dict], *, source: str, license_name: str, domain: str) -> list[dict]:
    out = []
    for r in rows:
        out.append(
            {
                "english": r["english"],
                "dagbani": r["dagbani"],
                "source": source,
                "license": license_name,
                "domain": domain,
                "verse_id": r.get("verse_id", ""),
                "pair_id": _row_id(r["english"], r["dagbani"]),
            }
        )
    return out


def build_corpus() -> tuple[list[dict], list[dict]]:
    sources = [
        ("narteybrown/sobolo-corpus-dagbani-bible", "unknown-check-source", "bible"),
        ("mohammednuruddin/dagbani", "apache-2.0", "dictionary"),
        ("Wuninsu/english_to_dagbani", "mit", "general"),
        ("abdulhafis/Dagbani_English_Dataset", "unknown-check-source", "general"),
        ("ghananlpcommunity/ghana-bible-combined-90k-twi-ewe-dagbani", "cc-by-nc-4.0", "bible"),
    ]
    frames: list[dict] = []
    for dataset_id, lic, domain in sources:
        frames.extend(annotate(_try_load_hub(dataset_id), source=dataset_id, license_name=lic, domain=domain))

    if not frames:
        print("[warn] No Hub datasets loaded — using bundled demo pairs")
        frames = annotate(demo_pairs(), source="demo", license_name="demo", domain="general")

    # Dedup
    seen: set[str] = set()
    unique: list[dict] = []
    for row in frames:
        if row["pair_id"] in seen:
            continue
        seen.add(row["pair_id"])
        unique.append(row)
    print(f"[ok] deduped {len(frames)} -> {len(unique)} pairs")

    for row in unique:
        row["group"] = row["verse_id"] if row["verse_id"] else row["pair_id"]

    groups = sorted({r["group"] for r in unique})
    rng = random.Random(42)
    rng.shuffle(groups)
    n = len(groups)
    n_test = max(1, int(n * 0.05))
    n_val = max(1, int(n * 0.05))
    test_g = set(groups[:n_test])
    val_g = set(groups[n_test : n_test + n_val])

    for row in unique:
        g = row["group"]
        if g in test_g:
            row["split"] = "test"
        elif g in val_g:
            row["split"] = "val"
        else:
            row["split"] = "train"

    trainable = [r for r in unique if r["dagbani"].strip()]
    health = health_seed_rows()
    return trainable, health


def write_csv(path: Path, rows: list[dict], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        for r in rows:
            w.writerow({k: r.get(k, "") for k in fieldnames})


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-dir", type=Path, default=OUT_DIR)
    args = parser.parse_args()
    args.out_dir.mkdir(parents=True, exist_ok=True)

    trainable, health = build_corpus()
    fields = [
        "english",
        "dagbani",
        "source",
        "license",
        "domain",
        "verse_id",
        "pair_id",
        "group",
        "split",
    ]

    counts: dict[str, int] = {}
    for split in ("train", "val", "test"):
        part = [r for r in trainable if r["split"] == split]
        write_csv(args.out_dir / f"{split}.csv", part, fields)
        counts[split] = len(part)
        print(f"[ok] wrote {args.out_dir / f'{split}.csv'} ({len(part)} rows)")

    write_csv(args.out_dir / "health_review.csv", health, fields)
    print(f"[ok] wrote {args.out_dir / 'health_review.csv'} ({len(health)} rows)")

    licenses: dict[str, int] = {}
    domains: dict[str, int] = {}
    sources_c: dict[str, int] = {}
    for r in trainable:
        licenses[r["license"]] = licenses.get(r["license"], 0) + 1
        domains[r["domain"]] = domains.get(r["domain"], 0) + 1
        sources_c[r["source"]] = sources_c.get(r["source"], 0) + 1

    meta = {
        "trainable_rows": len(trainable),
        "splits": counts,
        "licenses": licenses,
        "domains": domains,
        "sources": sources_c,
        "notes": [
            "Bible groups prevent verse leakage across splits.",
            "Health rows are EN-only seeds for native-speaker / model review.",
            "CC-BY-NC sources must not ship in commercial products without clearance.",
        ],
    }
    (args.out_dir / "manifest.json").write_text(json.dumps(meta, indent=2))
    print("[ok] wrote manifest.json")
    print(json.dumps(meta, indent=2))


if __name__ == "__main__":
    main()