import numpy as np
import pytest
from sklearn.model_selection import GroupKFold

from app import config, data_loader
from app.data_loader import FOLLOW_UP, load_cases, load_taxonomy
from app.modules import classifier, learning, triage
from app.modules.classifier import CareClassifier

TAX = load_taxonomy()
LEVELS = TAX.urgency_levels


def labels():
    return TAX.care_types + [FOLLOW_UP]


def test_trained_on_the_dataset():
    clf = classifier.get_classifier()
    i = clf.info()
    assert i["trained_on"]["labelled_examples"] >= 250 and set(i["classes"]) == set(labels())
    pc, pu = clf.predict_proba("Need an IM injection given at home", labels(), LEVELS)
    assert max(pc, key=pc.get) == "home_nursing" and max(pu, key=pu.get) == "same_day"
    pc, pu = clf.predict_proba("kal subah sugar test ghar pe", labels(), LEVELS)
    assert max(pc, key=pc.get) == "lab_test_home" and max(pu, key=pu.get) == "scheduled"
    assert abs(sum(pc.values()) - 1) < 1e-6


def test_generalises_to_unseen_phrasings():
    """Grouped CV: no request text appears in both train and test folds."""
    cases = load_cases()
    y = np.array([c.care_label for c in cases])
    hit = 0
    for tr, te in GroupKFold(5).split(cases, groups=[c.text for c in cases]):
        m = CareClassifier().fit([cases[i] for i in tr])
        for i in te:
            pc, _ = m.predict_proba(cases[i].text, labels(), LEVELS)
            hit += max(pc, key=pc.get) == y[i]
    assert hit / len(cases) > 0.70


def test_blend_rules():
    care = lambda **k: {l: k.get(l, 0.0) for l in labels()}
    llm = (care(home_nursing=0.9, lab_test_home=0.1), {"scheduled": .1, "same_day": .8, "emergency": .1}, ["injection"])
    clf = (care(lab_test_home=0.8, home_nursing=0.2), {"scheduled": .7, "same_day": .2, "emergency": .1}, [])
    knn = (care(home_nursing=1.0), {"scheduled": 0, "same_day": 1, "emergency": 0})
    c, u, kf, src, sig = triage.blend(llm, clf, knn, 0.4)
    assert src == "llm+clf" and sig["agree"] is False and kf == ["injection"]
    assert abs(c["home_nursing"] - (0.6 * 0.9 + 0.4 * 0.2)) < 1e-9
    assert triage.blend(llm, clf, knn, 0.0)[0]["home_nursing"] == pytest.approx(0.9)      # weight 0 = the LLM alone
    assert triage.blend(llm, clf, knn, 1.0)[0]["home_nursing"] == pytest.approx(0.2)      # weight 1 = the trained model alone
    assert triage.blend(llm, None, knn, 0.4)[3] == "llm"
    assert triage.blend(None, clf, knn, 0.4)[3] == "clf+knn"
    assert triage.blend(None, None, knn, 0.4)[3] == "knn"


def test_lexical_models_cannot_raise_an_emergency_alone():
    from app.modules.intake import Slots
    care = {l: 0.0 for l in labels()} | {"emergency_112": 0.45, "paramedic_home_visit": 0.55}
    urg = {"scheduled": 0.0, "same_day": 0.55, "emergency": 0.45}
    assert triage.decide(care, urg, Slots(), [], "clf+knn").care_type != TAX.emergency_label       # 0.45 < offline threshold 0.7
    assert triage.decide(care, urg, Slots(), [], "llm+clf").care_type == TAX.emergency_label       # 0.45 >= t_emergency 0.2


@pytest.fixture
def isolated_feedback(tmp_path, monkeypatch):
    monkeypatch.setattr(learning, "feedback_path", lambda: tmp_path / "feedback.jsonl")
    classifier.retrain()
    yield
    monkeypatch.undo()
    classifier.retrain()


def test_nurse_feedback_is_learned(isolated_feedback):
    text = "need an oxygen cylinder fitted at home tonight"
    before = classifier.get_classifier().predict_proba(text, labels(), LEVELS)[0]["home_nursing"]
    for t in (text, text + " please", "oxygen cylinder lagana hai ghar par"):
        learning.record(t, "home_nursing", "same_day")
    info = learning.refresh_models()
    after = classifier.get_classifier().predict_proba(text, labels(), LEVELS)[0]["home_nursing"]
    assert info["trained_on"]["nurse_feedback"] == 3 and after > before and after > 0.5
