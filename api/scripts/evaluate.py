"""Evaluate the pipeline on a split (single-turn, contract mode: follow-ups allowed) + follow-up simulation.
Usage: python scripts/evaluate.py --split val [--workers 4] [--sim 40]"""
import argparse
import json
import statistics
import time
from datetime import datetime

from common import *   # noqa
from app import config, groq_client
from app.data_loader import FOLLOW_UP, NO_URGENCY, load_split, load_taxonomy
from app import data_loader
from app.modules import classifier, intake
from app.modules.retrieval import get_retriever
from app.modules.triage import care_urgency_prior
from app.schemas import TriageRequest


def simulate_followups(case) -> int:
    """Answer a vague request's follow-up with a clarifying reply and count the questions until a decision."""
    hist, cur, n = [], case.text, 0
    for _ in range(3):
        out = pipeline.run(TriageRequest(user_input=cur, location=case.location, conversation_history=hist))
        q = out.contract.follow_up_question
        if not q:
            return n
        n += 1
        hist += [{"role": "user", "content": cur}, {"role": "assistant", "content": q}]
        cur = "mummy ko 2 din se bukhar hai, ghar pe dikhana hai"     # the clarification used in the organisers' multi-turn example MT001
    return n


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--split", default="val")
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--unseen", action="store_true", help="hold out whole request templates (tests generalisation, not memorisation)")
    ap.add_argument("--clf-weight", type=float, default=None, help="blend weight of the trained classifier: 0 = LLM only, 1 = classifier only (default: thresholds.json)")
    ap.add_argument("--sim", type=int, default=0, help="vague cases to run through the follow-up simulation (0 = skip)")
    a = ap.parse_args()
    tax = load_taxonomy()
    if a.unseen:
        data_loader.TRAIN_SPLIT = "train_unseen"
        get_retriever.cache_clear(); care_urgency_prior.cache_clear(); classifier.reset(); pipeline.clear_cache()
        a.split = "val_unseen"
    if a.clf_weight is not None:
        config.THRESHOLDS["clf_weight"] = a.clf_weight
        pipeline.clear_cache()
    cases = load_split(a.split)
    print(f"split={a.split} n={len(cases)} llm={'groq' if groq_client.available() else 'OFF (trained classifier only)'} clf_weight={config.THRESHOLDS.get('clf_weight')}")

    lat = []
    def go(c):
        t0 = time.perf_counter()
        r = predict_one(c.text, c.location)
        lat.append(time.perf_counter() - t0)
        return r
    preds = run_parallel(go, cases, a.workers)
    gc, gu = [c.care_label for c in cases], [c.urgency_label for c in cases]
    pl = [label_of(p) for p in preds]
    pc, pu = [x[0] for x in pl], [x[1] for x in pl]
    m = metrics(gc, gu, pc, pu)

    nd, empty_ok, n_ref = [], 0, 0
    for c, p in zip(cases, preds):
        if c.care_type and c.care_type != tax.emergency_label:
            got, ref = [x.caregiver_id for x in p.matched_caregivers], c.reference_matches
            if p.care_type == c.care_type:                    # matching quality only where routing was right
                nd.append(ndcg_at_k(got, ref)); n_ref += 1
                empty_ok += (not got and not ref)
    rep = {"when": datetime.now().isoformat(timespec="seconds"), "split": a.split, "n": len(cases), "llm": groq_client.available(),
           "thresholds": dict(config.THRESHOLDS),
           "macro_f1_care": round(m["macro_f1_care"], 4), "macro_f1_urgency": round(m["macro_f1_urgency"], 4), "accuracy_care": round(m["accuracy_care"], 4),
           "emergency_recall": round(m["emergency_recall"], 4), "emergency_n": m["emergency_n"], "false_emergency": m["false_emergency"], "under_triage": m["under_triage"],
           "ndcg_at_3": round(sum(nd) / len(nd), 4) if nd else None, "ndcg_cases": n_ref, "ndcg_cases_with_empty_reference": empty_ok,
           "per_class_care": per_class(gc, pc, care_labels()), "per_class_urgency": per_class(gu, pu, urgency_labels()),
           "confusion_care": {"labels": care_labels(), "matrix": conf(gc, pc, care_labels())},
           "confusion_urgency": {"labels": urgency_labels(), "matrix": conf(gu, pu, urgency_labels())},
           "under_triage_cases": [{"id": cases[i].id, "text": cases[i].text, "gold": [gc[i], gu[i]], "pred": [pc[i], pu[i]]} for i in m["under_triage_idx"]],
           "wrong_care_cases": [{"id": c.id, "text": c.text, "gold": g, "pred": p} for c, g, p in zip(cases, gc, pc) if g != p],
           "latency_p50_s": round(statistics.median(lat), 3), "latency_p95_s": round(sorted(lat)[int(0.95 * (len(lat) - 1))], 3)}
    if a.sim:
        vague = [c for c in cases if c.care_type is None][:a.sim]
        qs = run_parallel(simulate_followups, vague, a.workers)
        rep["avg_followups_on_vague"] = round(sum(qs) / len(qs), 3) if qs else None
        rep["followup_sim_n"] = len(qs)

    config.REPORTS_DIR.mkdir(exist_ok=True)
    out = config.REPORTS_DIR / f"eval_{a.split}_{datetime.now():%Y%m%d_%H%M%S}.json"
    out.write_text(json.dumps(rep, ensure_ascii=False, indent=2))
    print(f"\nmacro-F1 care type : {rep['macro_f1_care']}   (accuracy {rep['accuracy_care']})\nmacro-F1 urgency   : {rep['macro_f1_urgency']}")
    print(f"EMERGENCY RECALL   : {rep['emergency_recall']}  ({m['emergency_n']} emergency cases, {rep['false_emergency']} false emergencies)")
    print(f"under-triage       : {rep['under_triage']}\nNDCG@3 (matching)  : {rep['ndcg_at_3']}  over {n_ref} routed-correctly cases")
    for k in ("per_class_care", "per_class_urgency"):
        print(f"\n{k}"); [print(f"  {l:<24}{v}") for l, v in rep[k].items()]
    for k in ("confusion_care", "confusion_urgency"):
        print(f"\n{k} (rows=gold, cols=pred) {rep[k]['labels']}"); [print("  ", r) for r in rep[k]["matrix"]]
    for key in ("under_triage_cases", "wrong_care_cases"):
        if rep[key]:
            print(f"\n{key}:"); [print("  ", x) for x in rep[key][:15]]
    print(f"\nlatency p50={rep['latency_p50_s']}s p95={rep['latency_p95_s']}s" + (f" | avg follow-ups on vague={rep.get('avg_followups_on_vague')}" if a.sim else ""))
    print("report ->", out)


if __name__ == "__main__":
    main()
