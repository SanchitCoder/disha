"""Grid-search thresholds on a validation split. LLM scores are cached (reports/score_cache_<split>.json), so re-tuning never re-calls Groq.
Objective: emergency recall = 1.0 first, then maximise mean macro-F1 (care, urgency) minus a penalty for under-triage.
Use --unseen to tune on held-out *templates* (recommended: the plain val split repeats training texts).
Usage: python scripts/tune_thresholds.py [--unseen] [--refresh]"""
import argparse
import itertools
import json

from common import *   # noqa
from app import config, data_loader, groq_client
from app.data_loader import FOLLOW_UP, NO_URGENCY, load_split, load_taxonomy
from app.modules import classifier, intake, red_flags
from app.modules.normalise import normalise
from app.modules.retrieval import get_retriever
from app.modules.triage import blend, care_urgency_prior, decide, score_clf, score_knn, score_llm


def build_cache(cases, workers=3):
    def one(c):
        norm = normalise(c.text)
        if red_flags.check_text(norm):
            return {"fixed_emergency": True}
        slots, _, _ = intake.extract(norm, [], c.text)
        if red_flags.check_slots(slots.red_flag_probes.model_dump()):
            return {"fixed_emergency": True}
        hits = get_retriever().top_k(norm.clean, 6)
        llm = score_llm(norm.full, slots, hits)
        clf = score_clf(norm.full)
        knn = score_knn(hits)
        return {"fixed_emergency": False, "llm": llm, "clf": clf, "knn": knn, "slots": slots.model_dump()}
    return dict(zip([c.id for c in cases], run_parallel(one, cases, workers)))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--unseen", action="store_true")
    ap.add_argument("--refresh", action="store_true")
    a = ap.parse_args()
    tax = load_taxonomy()
    split = "val_unseen" if a.unseen else "val"
    if a.unseen:
        data_loader.TRAIN_SPLIT = "train_unseen"
        get_retriever.cache_clear(); care_urgency_prior.cache_clear(); classifier.reset()
    cases = load_split(split)
    config.REPORTS_DIR.mkdir(exist_ok=True)
    cache_path = config.REPORTS_DIR / f"score_cache_{split}.json"
    cache = json.loads(cache_path.read_text()) if cache_path.exists() and not a.refresh else {}
    if not all(c.id in cache for c in cases):
        print(f"scoring {len(cases)} {split} cases (cached afterwards; llm={'groq' if groq_client.available() else 'OFF'}) ...")
        cache = build_cache(cases); cache_path.write_text(json.dumps(cache))
    gc, gu = [c.care_label for c in cases], [c.urgency_label for c in cases]

    def evaluate(T):
        pc, pu = [], []
        for c in cases:
            e = cache[c.id]
            if e["fixed_emergency"]:
                pc.append(tax.emergency_label); pu.append(tax.immediate_label); continue
            llm = tuple(e["llm"]) if e["llm"] and T["clf_weight"] < 1 else None
            clf = tuple(e["clf"]) if e["clf"] and (T["clf_weight"] > 0 or not llm) else None
            care_s, urg_s, kf, src, _ = blend(llm, clf, tuple(e["knn"]), T["clf_weight"])
            r = decide(care_s, urg_s, intake.Slots.model_validate(e["slots"]), kf, src, T)
            pc.append(r.care_type or FOLLOW_UP); pu.append(r.urgency or NO_URGENCY)
        return metrics(gc, gu, pc, pu)

    base = dict(config.THRESHOLDS)
    grid = itertools.product([0.15, 0.20, 0.30, 0.40], [0.30, 0.50], [0.30, 0.50], [0.30, 0.40, 0.50, 0.60, 0.70], [True], [0.0, 0.2, 0.4, 0.5, 0.6, 0.8])
    b = evaluate(base)
    print(f"baseline  F1 care={b['macro_f1_care']:.3f} urg={b['macro_f1_urgency']:.3f} emergency_recall={b['emergency_recall']:.3f} under_triage={b['under_triage']} false_em={b['false_emergency']}")
    best, best_key = None, None
    for te, ti, ts, tf, ru, cw in grid:
        T = {**base, "t_emergency": te, "t_immediate": ti, "t_same_day": ts, "t_follow_up": tf, "fallback_round_up": ru, "clf_weight": cw}
        m = evaluate(T)
        obj = (m["macro_f1_care"] + m["macro_f1_urgency"]) / 2 - 0.5 * m["under_triage"] / len(cases)
        key = (round(m["emergency_recall"], 6), round(obj, 6), -te)       # recall first, then objective, then prefer the safer (lower) t_emergency
        if best_key is None or key > best_key:
            best_key, best, bm = key, T, m
    print(f"tuned     F1 care={bm['macro_f1_care']:.3f} urg={bm['macro_f1_urgency']:.3f} emergency_recall={bm['emergency_recall']:.3f} under_triage={bm['under_triage']} false_em={bm['false_emergency']}")
    print({k: best[k] for k in ("t_emergency", "t_immediate", "t_same_day", "t_follow_up", "clf_weight")})
    if bm["emergency_recall"] < 1.0:
        print("WARNING: emergency recall < 1.0 even after tuning - fix lexicon/probes, not thresholds")
    config.THRESHOLDS_PATH.write_text(json.dumps(best, indent=2) + "\n")
    print("saved ->", config.THRESHOLDS_PATH)


if __name__ == "__main__":
    main()
