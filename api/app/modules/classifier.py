"""Trained text classifier (supervised, scikit-learn): care type (incl. 'follow_up') and urgency.

Features : char_wb 2-5-grams (TF-IDF, sublinear) over the normalised text; Devanagari is also romanised, so Hindi and Hinglish share
           features. (Grouped CV showed adding word n-grams did not help on this small dataset.)
Model    : multinomial logistic regression (class-balanced). Trains in milliseconds on the dataset, so it is (re)trained in-process at startup
           and again whenever nurse feedback arrives (see learning.refresh_models).
Role     : its probabilities are blended with the LLM's (triage.score); on its own it replaces the nearest-neighbour fallback when Groq is down.
"""
from __future__ import annotations

import threading
import time
from dataclasses import dataclass
from functools import lru_cache
from typing import Optional

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

from ..data_loader import Case, load_taxonomy
from .normalise import normalise

_lock = threading.Lock()


def feature_text(text: str) -> str:
    """All normalised variants (repeat-collapsed, and the romanised copy for Devanagari) in one string."""
    return " ".join(normalise(text).variants)


@dataclass
class Info:
    algorithm: str
    n_train: int
    n_feedback: int
    classes_care: list[str]
    trained_at: float
    train_seconds: float
    train_accuracy: float

    def as_dict(self) -> dict:
        return {"algorithm": self.algorithm, "trained_on": {"labelled_examples": self.n_train - self.n_feedback, "nurse_feedback": self.n_feedback},
                "classes": self.classes_care, "trained_at": self.trained_at, "train_seconds": round(self.train_seconds, 3),
                "train_accuracy": round(self.train_accuracy, 4)}


class CareClassifier:
    ALGO = "TF-IDF (char 2-5-grams) -> multinomial logistic regression"

    def __init__(self, C: float = 50.0):
        self.C = C
        self.char = TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 5), sublinear_tf=True, min_df=1)
        self.care = LogisticRegression(C=C, max_iter=3000, class_weight="balanced")
        self.urg = LogisticRegression(C=C, max_iter=3000, class_weight="balanced")
        self.info_: Optional[Info] = None
        self._care_labels: list[str] = []
        self._urg_labels: list[str] = []

    def _X(self, texts: list[str], fit: bool = False):
        t = [feature_text(x) for x in texts]
        if fit:
            return self.char.fit_transform(t).tocsr()
        return self.char.transform(t).tocsr()

    def fit(self, cases: list[Case], n_feedback: int = 0) -> "CareClassifier":
        t0 = time.perf_counter()
        tax = load_taxonomy()
        X = self._X([c.text for c in cases], fit=True)
        y_care = [c.care_label for c in cases]
        self.care.fit(X, y_care)
        mask = np.array([c.urgency is not None for c in cases])
        self.urg.fit(X[mask], [c.urgency for c in cases if c.urgency is not None])
        self._care_labels, self._urg_labels = list(self.care.classes_), list(self.urg.classes_)
        acc = float(np.mean(self.care.predict(X) == np.array(y_care)))
        self.info_ = Info(self.ALGO, len(cases), n_feedback, list(self.care.classes_), time.time(), time.perf_counter() - t0, acc)
        return self

    def predict_proba(self, text: str, care_labels: list[str], urgency_levels: list[str]) -> tuple[dict[str, float], dict[str, float]]:
        X = self._X([text])
        pc = dict(zip(self._care_labels, self.care.predict_proba(X)[0]))
        pu = dict(zip(self._urg_labels, self.urg.predict_proba(X)[0]))
        c = {l: float(pc.get(l, 0.0)) for l in care_labels}
        u = {l: float(pu.get(l, 0.0)) for l in urgency_levels}
        sc, su = sum(c.values()) or 1.0, sum(u.values()) or 1.0
        return {k: v / sc for k, v in c.items()}, {k: v / su for k, v in u.items()}

    def info(self) -> dict:
        return self.info_.as_dict() if self.info_ else {}


def _train() -> CareClassifier:
    from . import learning
    fb = learning.load_feedback()
    from .. import data_loader
    cases = data_loader.load_split(data_loader.TRAIN_SPLIT) + fb
    return CareClassifier().fit(cases, n_feedback=len(fb))


_clf: Optional[CareClassifier] = None


def get_classifier() -> CareClassifier:
    global _clf
    if _clf is None:
        with _lock:
            if _clf is None:
                _clf = _train()
    return _clf


def retrain() -> CareClassifier:
    global _clf
    with _lock:
        _clf = _train()
    return _clf


def reset() -> None:
    """Drop the trained model (used when the training split changes, e.g. evaluate --unseen)."""
    global _clf
    with _lock:
        _clf = None
