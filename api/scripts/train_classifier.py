"""Train the classifier and measure it honestly with GROUPED cross-validation: all rows of a request text stay in one fold,
so every fold is tested on phrasings it has never seen. Writes reports/classifier_cv.json (shown by GET /v1/model/info).
Usage: python scripts/train_classifier.py [--folds 5]"""
import argparse
import json
from datetime import datetime

import numpy as np
from sklearn.metrics import f1_score
from sklearn.model_selection import GroupKFold

from common import *   # noqa
from app import config
from app.data_loader import load_cases, load_taxonomy
from app.modules.classifier import CareClassifier

ap = argparse.ArgumentParser()
ap.add_argument("--folds", type=int, default=5)
a = ap.parse_args()
tax = load_taxonomy()
cases = load_cases()
groups = [c.text for c in cases]
y_care = np.array([c.care_label for c in cases])
y_urg = np.array([c.urgency_label for c in cases])
pred_c, pred_u = np.empty(len(cases), dtype=object), np.empty(len(cases), dtype=object)
for tr, te in GroupKFold(n_splits=a.folds).split(cases, groups=groups):
    clf = CareClassifier().fit([cases[i] for i in tr])
    for i in te:
        pc, pu = clf.predict_proba(cases[i].text, care_labels(), tax.urgency_levels)
        pred_c[i] = max(pc, key=pc.get)
        pred_u[i] = max(pu, key=pu.get) if pc[max(pc, key=pc.get)] and max(pc, key=pc.get) != "follow_up" else "none"
em = [i for i, c in enumerate(cases) if c.care_type == tax.emergency_label]
rep = {"when": datetime.now().isoformat(timespec="seconds"), "protocol": f"{a.folds}-fold GroupKFold by request text (unseen phrasings)", "n": len(cases),
       "accuracy_care": round(float(np.mean(pred_c == y_care)), 4),
       "macro_f1_care": round(float(f1_score(y_care, pred_c, labels=care_labels(), average="macro", zero_division=0)), 4),
       "macro_f1_urgency": round(float(f1_score(y_urg, pred_u, labels=urgency_labels(), average="macro", zero_division=0)), 4),
       "emergency_recall": round(float(np.mean([pred_c[i] == tax.emergency_label for i in em])), 4),
       "per_class": per_class(list(y_care), list(pred_c), care_labels())}
config.REPORTS_DIR.mkdir(exist_ok=True)
(config.REPORTS_DIR / "classifier_cv.json").write_text(json.dumps(rep, indent=2))
print(json.dumps({k: v for k, v in rep.items() if k != "per_class"}, indent=2))
for l, v in rep["per_class"].items():
    print(f"  {l:<24}{v}")
