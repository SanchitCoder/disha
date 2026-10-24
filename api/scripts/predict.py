"""Hidden test -> predictions CSV. Resume-safe: skips ids already written.
Usage: python scripts/predict.py --input <file.jsonl|csv|json> --output predictions.csv [--workers 4] [--force]
Accepted inputs: the organisers' nested JSONL ({id, request:{user_input, location}}), or a flat CSV/JSONL with
id + user_input (+ lat, lng). Single-turn requests go through the contract pipeline exactly as POST /triage would (follow-up questions
allowed, so vague requests come back with an empty care_type/urgency and a follow_up_question); --force always decides.
Output columns mirror the organisers' flat CSV: id, care_type, urgency, red_flags (;), follow_up_question, reasoning, matched_caregiver_ids (;), top_score.
If the organisers' submission format differs, edit COLUMNS and row() below."""
import argparse
import csv
import threading
from pathlib import Path

from common import *   # noqa
from app.data_loader import _case_from_row, _rows, read_any

COLUMNS = ["id", "care_type", "urgency", "red_flags", "follow_up_question", "reasoning", "matched_caregiver_ids", "top_score"]


def row(rid, c):
    return {"id": rid, "care_type": c.care_type or "", "urgency": c.urgency or "", "red_flags": ";".join(c.red_flags),
            "follow_up_question": c.follow_up_question or "", "reasoning": c.reasoning or "",
            "matched_caregiver_ids": ";".join(m.caregiver_id for m in c.matched_caregivers),
            "top_score": c.matched_caregivers[0].score if c.matched_caregivers else ""}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", required=True)
    ap.add_argument("--output", default="predictions.csv")
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--force", action="store_true", help="never return a follow-up question")
    a = ap.parse_args()
    items = []
    for i, r in enumerate(_rows(read_any(Path(a.input)), "cases", "data", "items")):
        case = _case_from_row(i, r)
        items.append((case.id, case.text, case.location))
    out = Path(a.output)
    done = set()
    if out.exists():
        with out.open(encoding="utf-8") as f:
            done = {r["id"] for r in csv.DictReader(f)}
    todo = [it for it in items if it[0] not in done]
    print(f"{len(items)} rows, {len(done)} already done, {len(todo)} to predict")
    fresh = not done
    lock = threading.Lock()
    f = out.open("w" if fresh else "a", encoding="utf-8", newline="")
    w = csv.DictWriter(f, COLUMNS)
    if fresh:
        w.writeheader()

    def go(it):
        c = predict_one(it[1], it[2], force=a.force)
        with lock:
            w.writerow(row(it[0], c))
            f.flush()
    run_parallel(go, todo, a.workers)
    f.close()
    print("wrote", out)


if __name__ == "__main__":
    main()
