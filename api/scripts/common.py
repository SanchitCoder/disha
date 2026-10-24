"""Shared helpers for evaluate / tune / predict."""
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import numpy as np
from sklearn.metrics import confusion_matrix, f1_score, precision_recall_fscore_support

from app import groq_client, pipeline
from app.data_loader import FOLLOW_UP, NO_URGENCY, load_taxonomy
from app.schemas import TriageRequest

groq_client.PACE_TPM = 7000      # batch scripts wait for token budget instead of dropping to the fallback


def care_labels():
    return load_taxonomy().care_types + [FOLLOW_UP]


def urgency_labels():
    return load_taxonomy().urgency_levels + [NO_URGENCY]


def predict_one(text: str, location=None, force: bool = False):
    """One single-turn request through the contract pipeline (follow-ups allowed unless force)."""
    return pipeline.run(TriageRequest(user_input=text, location=location), force_decision=force).contract


def label_of(resp):
    return resp.care_type or FOLLOW_UP, resp.urgency or NO_URGENCY


def run_parallel(fn, items, workers=4):
    with ThreadPoolExecutor(workers) as ex:
        return list(ex.map(fn, items))


def is_emergency_label(care, urg):
    tax = load_taxonomy()
    return care == tax.emergency_label or urg == tax.immediate_label


def metrics(gold_care, gold_urg, pred_care, pred_urg):
    tax = load_taxonomy()
    m = {
        "macro_f1_care": f1_score(gold_care, pred_care, labels=care_labels(), average="macro", zero_division=0),
        "macro_f1_urgency": f1_score(gold_urg, pred_urg, labels=urgency_labels(), average="macro", zero_division=0),
        "accuracy_care": float(np.mean([g == p for g, p in zip(gold_care, pred_care)])),
    }
    em = [i for i, (c, u) in enumerate(zip(gold_care, gold_urg)) if is_emergency_label(c, u)]
    hit = sum(1 for i in em if is_emergency_label(pred_care[i], pred_urg[i]))
    m["emergency_recall"] = hit / len(em) if em else 1.0
    m["emergency_n"] = len(em)
    m["false_emergency"] = sum(1 for i in range(len(gold_care)) if i not in set(em) and is_emergency_label(pred_care[i], pred_urg[i]))
    rank = {**tax.urgency_rank, NO_URGENCY: -1}
    m["under_triage_idx"] = [i for i in range(len(gold_urg)) if gold_urg[i] != NO_URGENCY and rank[pred_urg[i]] < rank[gold_urg[i]]]
    m["under_triage"] = len(m["under_triage_idx"])
    return m


def per_class(gold, pred, labels):
    p, r, f, s = precision_recall_fscore_support(gold, pred, labels=labels, zero_division=0)
    return {l: {"precision": round(float(p[i]), 3), "recall": round(float(r[i]), 3), "f1": round(float(f[i]), 3), "support": int(s[i])} for i, l in enumerate(labels)}


def conf(gold, pred, labels):
    return confusion_matrix(gold, pred, labels=labels).tolist()


def ndcg_at_k(ranked_ids, reference_ids, k=3):
    """NDCG@k with graded relevance from the reference list order (3,2,1); 1.0 if both are empty."""
    if not reference_ids:
        return 1.0 if not ranked_ids else 0.0
    rel = {cid: len(reference_ids) - i for i, cid in enumerate(reference_ids)}
    dcg = sum(rel.get(cid, 0) / np.log2(i + 2) for i, cid in enumerate(ranked_ids[:k]))
    idcg = sum(g / np.log2(i + 2) for i, g in enumerate(sorted(rel.values(), reverse=True)[:k]))
    return float(dcg / idcg) if idcg else 0.0
