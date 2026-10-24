import json

from fastapi import APIRouter

from .. import config, groq_client
from ..modules import classifier, learning

router = APIRouter(prefix="/v1/model", tags=["model"])


@router.get("/info", summary="What the routing models are, what they were trained on, and how well they do on unseen phrasings")
def info():
    clf = classifier.get_classifier()
    cv_path = config.REPORTS_DIR / "classifier_cv.json"
    cv = json.loads(cv_path.read_text()) if cv_path.exists() else None
    return {
        "language_model": {"provider": "Groq", "model": groq_client.current_model(), "available": groq_client.available(),
                           "role": "reads the request, scores care type and urgency from definitions plus retrieved examples"},
        "trained_classifier": {**clf.info(), "cross_validation": cv and {k: cv[k] for k in ("protocol", "accuracy_care", "macro_f1_care", "macro_f1_urgency", "emergency_recall")}},
        "blend": {"classifier_weight": config.THRESHOLDS.get("clf_weight"), "review_on_disagreement": config.THRESHOLDS.get("review_on_disagreement", True)},
        "rules": "red-flag gate (deterministic, runs first)",
        "learning": {"nurse_feedback_examples": len(learning.load_feedback()), "retrains_on": "every nurse approval or edit"},
    }


@router.post("/retrain", summary="Retrain the classifier and rebuild the retrieval index from the dataset plus nurse feedback")
def retrain():
    return learning.refresh_models()
