"""Feedback loop: nurse-reviewed cases become extra labelled examples that the trained model and the retrieval index learn from.

Stored in data/feedback.jsonl (a separate file: the organisers' originals are never modified). Same nested shape as the dataset,
so it loads with the same code. Appending then calling refresh_models() retrains the classifier and rebuilds the retrieval index in-process.
"""
from __future__ import annotations

import json
import threading
from datetime import datetime, timezone
from pathlib import Path

from .. import config, data_loader
from ..data_loader import Case, _case_from_row

_lock = threading.Lock()


def feedback_path() -> Path:
    return data_loader.active_data_dir() / "feedback.jsonl"


def load_feedback() -> list[Case]:
    p = feedback_path()
    if not p.exists():
        return []
    return [_case_from_row(i, json.loads(l)) for i, l in enumerate(p.read_text(encoding="utf-8").splitlines()) if l.strip()]


def record(text: str, care_type: str | None, urgency: str | None, source: str = "nurse", location: dict | None = None) -> Case:
    """Append one reviewed example. care_type None = 'should have asked a follow-up'."""
    row = {"id": f"FB{datetime.now(timezone.utc):%Y%m%d%H%M%S%f}", "detected_language": "unknown", "source": source,
           "request": {"user_input": text, "language": "auto", "location": location, "conversation_history": []},
           "response": {"follow_up_question": None, "care_type": care_type, "urgency": urgency, "red_flags": [], "reasoning": f"{source} review", "matched_caregivers": []}}
    with _lock:
        with feedback_path().open("a", encoding="utf-8") as f:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")
    return _case_from_row(0, row)


def training_cases() -> list[Case]:
    """Everything the models learn from: the chosen training split plus all feedback."""
    return data_loader.load_split(data_loader.TRAIN_SPLIT) + load_feedback()


def refresh_models() -> dict:
    """Retrain the classifier and rebuild the retrieval index from the current training cases."""
    from . import classifier, retrieval
    from .triage import care_urgency_prior
    retrieval.get_retriever.cache_clear()
    care_urgency_prior.cache_clear()
    clf = classifier.retrain()
    retrieval.get_retriever()
    return clf.info()
