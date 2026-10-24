"""Phase-1 data report: every file in the active data dir, label distribution, splits."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app import data_loader as dl

d = dl.active_data_dir()
print(f"DATA DIR: {d}")
for p in sorted(d.rglob("*")):
    if not p.is_file() or p.name.startswith("."):
        continue
    print(f"\n== {p.relative_to(d)}  ({p.stat().st_size} bytes)")
    if p.suffix.lower() in dl.SUFFIXES:
        try:
            obj = dl.read_any(p)
        except Exception as e:
            print("  unreadable:", e); continue
        rows = obj if isinstance(obj, list) else next((v for v in obj.values() if isinstance(v, list)), None) if isinstance(obj, dict) else None
        if isinstance(obj, dict):
            print("  top-level keys:", list(obj))
        if rows:
            print(f"  rows: {len(rows)}   columns: {list(rows[0]) if isinstance(rows[0], dict) else type(rows[0]).__name__}")
            for r in rows[:3]:
                print("   ", json.dumps(r, ensure_ascii=False)[:230])

tax = dl.load_taxonomy()
print("\n== TAXONOMY (", tax.source, ")")
print("  care types   :", tax.care_types)
print("  urgency      :", tax.urgency_levels, "(least -> most urgent)")
print("  emergency    :", tax.emergency_label, "| nurse label:", tax.nurse_label)
print("  red-flag vocabulary:", tax.red_flag_vocab)

cgs, now = dl.load_caregivers()
print(f"\n== CAREGIVERS: {len(cgs)} ({sum(c.active for c in cgs)} active)")
print("  roles:", sorted({c.role for c in cgs}), "| languages:", sorted({l for c in cgs for l in c.languages}))
print("  skills:", sorted({s for c in cgs for s in c.skills}))
print("  radius km:", sorted({c.max_radius_km for c in cgs}), "| rating range:", min(c.rating for c in cgs), "-", max(c.rating for c in cgs))

cases = dl.load_cases()
print(f"\n== LABELLED REQUESTS: {len(cases)} rows, {len({c.text for c in cases})} distinct texts (templates repeated with different locations)")
train, val = dl.make_splits()
dl.make_unseen_split()
print(f"\n== SPLITS (seed 42, stratified 80/20): train={len(train)} val={len(val)}  -> {dl.splits_dir()}")
print(f"   unseen-template split: train={len(dl.load_split('train_unseen'))} val={len(dl.load_split('val_unseen'))}")
dist = dl.label_distribution(train + val)
print("  (care_type, urgency): total")
for k, v in sorted(dist.items()):
    print(f"   {k[0]:<24}{k[1]:<10}{v:>5}" + ("   <-- fewer than 10 examples" if v < 10 else ""))
