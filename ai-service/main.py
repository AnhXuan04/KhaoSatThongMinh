from __future__ import annotations

import json
import os
import re
from datetime import datetime
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

try:
    import joblib
    import pandas as pd
    from sklearn.compose import ColumnTransformer
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.linear_model import LogisticRegression
    from sklearn.metrics import accuracy_score, confusion_matrix, f1_score, precision_score, recall_score
    from sklearn.model_selection import train_test_split
    from sklearn.pipeline import Pipeline
    from sklearn.preprocessing import StandardScaler

    SKLEARN_READY = True
except Exception:
    SKLEARN_READY = False

try:
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import seaborn as sns

    VISUALIZATION_READY = True
except Exception:
    VISUALIZATION_READY = False

try:
    import nltk
    from nltk.corpus import stopwords

    NLTK_READY = True
except Exception:
    NLTK_READY = False

try:
    import spacy

    SPACY_READY = True
except Exception:
    SPACY_READY = False

try:
    from transformers import pipeline

    TRANSFORMERS_READY = True
except Exception:
    TRANSFORMERS_READY = False


app = FastAPI(title="Survey Quality AI Service")

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "models"
MODEL_PATH = MODEL_DIR / "superficial_classifier.joblib"
METADATA_PATH = MODEL_DIR / "superficial_classifier_metadata.json"
CONFUSION_MATRIX_PATH = MODEL_DIR / "confusion_matrix.png"


class TrainingRecord(BaseModel):
    answerText: str = ""
    totalDurationMs: int = 0
    answerChangeCount: int = 0
    avgAnswerLength: float = 0
    questionCount: int = 0
    label: int = Field(ge=0, le=1)


class TrainRequest(BaseModel):
    records: List[TrainingRecord]
    modelName: str = "sklearn-tfidf-logistic-v1"


class AnswerPayload(BaseModel):
    questionId: Optional[int] = None
    questionType: Optional[str] = None
    questionKind: Optional[str] = None
    answerText: str = ""


class BehaviorLogPayload(BaseModel):
    questionId: Optional[int] = None
    eventType: str = ""
    eventValue: Optional[str] = None
    durationMs: Optional[int] = 0


class AnalyzeRequest(BaseModel):
    responseId: int
    surveyId: int
    answers: List[AnswerPayload] = []
    behaviorLogs: List[BehaviorLogPayload] = []


class AnalyzeResponse(BaseModel):
    qualityScore: int
    isSuperficial: bool
    rewardEligible: bool
    analysisSummary: str
    recommendation: str
    modelName: str


def preprocess_text(text: str) -> str:
    normalized = re.sub(r"\s+", " ", text.lower()).strip()
    normalized = re.sub(r"[^0-9a-zA-ZÀ-ỹ\s]", " ", normalized)

    if NLTK_READY:
        try:
            words = nltk.word_tokenize(normalized)
            try:
                stop_words = set(stopwords.words("vietnamese"))
            except Exception:
                stop_words = set(stopwords.words("english"))
            normalized = " ".join(word for word in words if word not in stop_words)
        except Exception:
            pass

    if SPACY_READY:
        try:
            nlp = spacy.blank("vi")
            doc = nlp(normalized)
            normalized = " ".join(token.text for token in doc if not token.is_space)
        except Exception:
            pass

    return normalized


def build_features(request: AnalyzeRequest) -> dict:
    answer_texts = [answer.answerText.strip() for answer in request.answers if answer.answerText.strip()]
    answer_text = " ".join(answer_texts)
    total_duration_ms = sum(log.durationMs or 0 for log in request.behaviorLogs)
    answer_change_count = sum(1 for log in request.behaviorLogs if log.eventType == "answer_change")
    avg_answer_length = sum(len(value) for value in answer_texts) / len(answer_texts) if answer_texts else 0

    return {
        "answer_text": preprocess_text(answer_text),
        "total_duration_ms": total_duration_ms,
        "answer_change_count": answer_change_count,
        "avg_answer_length": avg_answer_length,
        "question_count": len(request.answers),
    }


def detect_repeated_scale_pattern(request: AnalyzeRequest) -> Optional[dict]:
    scale_values = [
        answer.answerText.strip()
        for answer in request.answers
        if (answer.questionKind or "").lower() in {"linear_scale", "rating"}
        and answer.answerText.strip()
    ]

    if len(scale_values) < 3:
        return None

    counts = {}
    for value in scale_values:
        counts[value] = counts.get(value, 0) + 1

    repeated_value, repeated_count = max(counts.items(), key=lambda item: item[1])
    repeated_rate = repeated_count / len(scale_values)

    if repeated_rate >= 0.8:
        return {
            "value": repeated_value,
            "count": repeated_count,
            "total": len(scale_values),
            "rate": repeated_rate,
        }

    return None


def optional_transformer_summary(text: str) -> Optional[str]:
    model_name = os.getenv("TRANSFORMERS_TEXT_MODEL")
    if not TRANSFORMERS_READY or not model_name or not text.strip():
        return None

    try:
        classifier = pipeline("text-classification", model=model_name, tokenizer=model_name)
        result = classifier(text[:1000])[0]
        return f"Transformer signal: {result.get('label')} ({result.get('score'):.2f})."
    except Exception:
        return None


def save_confusion_matrix(y_true, y_pred) -> Optional[str]:
    if not VISUALIZATION_READY:
        return None

    MODEL_DIR.mkdir(exist_ok=True)
    matrix = confusion_matrix(y_true, y_pred, labels=[0, 1])
    plt.figure(figsize=(5, 4))
    sns.heatmap(
        matrix,
        annot=True,
        fmt="d",
        cmap="Blues",
        xticklabels=["Hoi hot", "Nghiem tuc"],
        yticklabels=["Hoi hot", "Nghiem tuc"],
    )
    plt.xlabel("Predicted")
    plt.ylabel("Actual")
    plt.tight_layout()
    plt.savefig(CONFUSION_MATRIX_PATH)
    plt.close()
    return str(CONFUSION_MATRIX_PATH)


@app.get("/")
def read_root():
    return {"message": "Survey Quality AI Service is running"}


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "sklearnReady": SKLEARN_READY,
        "nltkReady": NLTK_READY,
        "spacyReady": SPACY_READY,
        "transformersReady": TRANSFORMERS_READY,
        "visualizationReady": VISUALIZATION_READY,
        "modelExists": MODEL_PATH.exists(),
    }


@app.post("/api/train-superficial-model")
def train_superficial_model(request: TrainRequest):
    if not SKLEARN_READY:
        raise HTTPException(status_code=503, detail="Install pandas, scikit-learn, and joblib before training.")

    if len(request.records) < 4:
        raise HTTPException(status_code=400, detail="Need at least 4 labeled records to train.")

    df = pd.DataFrame([record.dict() for record in request.records])
    if df["label"].nunique() < 2:
        raise HTTPException(status_code=400, detail="Dataset must contain both superficial and quality labels.")

    df["answer_text"] = df["answerText"].fillna("").map(preprocess_text)
    feature_columns = ["answer_text", "totalDurationMs", "answerChangeCount", "avgAnswerLength", "questionCount"]
    x = df[feature_columns]
    y = df["label"]

    class_count = y.nunique()
    test_size = max(0.25, class_count / len(df))
    stratify = y if y.value_counts().min() >= 2 else None
    try:
        x_train, x_test, y_train, y_test = train_test_split(
            x,
            y,
            test_size=test_size,
            random_state=42,
            stratify=stratify,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=f"Cannot split training data: {exc}") from exc

    preprocessor = ColumnTransformer(
        transformers=[
            ("text", TfidfVectorizer(max_features=3000, ngram_range=(1, 2)), "answer_text"),
            ("numeric", StandardScaler(), ["totalDurationMs", "answerChangeCount", "avgAnswerLength", "questionCount"]),
        ]
    )
    model = Pipeline(
        steps=[
            ("features", preprocessor),
            ("classifier", LogisticRegression(max_iter=1000)),
        ]
    )

    try:
        model.fit(x_train, y_train)
        predictions = model.predict(x_test)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=f"Cannot train model: {exc}") from exc
    confusion_matrix_file = save_confusion_matrix(y_test, predictions)

    metrics = {
        "accuracy": float(accuracy_score(y_test, predictions)),
        "precision": float(precision_score(y_test, predictions, zero_division=0)),
        "recall": float(recall_score(y_test, predictions, zero_division=0)),
        "f1Score": float(f1_score(y_test, predictions, zero_division=0)),
    }

    MODEL_DIR.mkdir(exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    metadata = {
        "modelName": request.modelName,
        "trainedAt": datetime.utcnow().isoformat() + "Z",
        "recordCount": len(request.records),
        "metrics": metrics,
        "confusionMatrixPath": confusion_matrix_file,
        "uses": {
            "pandas": True,
            "scikitLearn": True,
            "nltk": NLTK_READY,
            "spacy": SPACY_READY,
            "transformers": TRANSFORMERS_READY and bool(os.getenv("TRANSFORMERS_TEXT_MODEL")),
            "matplotlibSeaborn": VISUALIZATION_READY,
        },
    }
    METADATA_PATH.write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    return {"status": "success", **metadata}


@app.post("/api/analyze-response", response_model=AnalyzeResponse)
def analyze_response(request: AnalyzeRequest):
    if not SKLEARN_READY or not MODEL_PATH.exists():
        raise HTTPException(
            status_code=503,
            detail="AI model is not available. Train a model with /api/train-superficial-model before analysis.",
        )

    features = build_features(request)
    model = joblib.load(MODEL_PATH)
    df = pd.DataFrame([{
        "answer_text": features["answer_text"],
        "totalDurationMs": features["total_duration_ms"],
        "answerChangeCount": features["answer_change_count"],
        "avgAnswerLength": features["avg_answer_length"],
        "questionCount": features["question_count"],
    }])

    probabilities = model.predict_proba(df)[0]
    quality_probability = float(probabilities[1])
    quality_score = round(quality_probability * 100)
    is_superficial = quality_score < 60
    reward_eligible = (not is_superficial) and quality_score >= 70
    repeated_scale_pattern = detect_repeated_scale_pattern(request)

    if repeated_scale_pattern:
        quality_score = min(quality_score, 55)
        is_superficial = True
        reward_eligible = False

    transformer_summary = optional_transformer_summary(features["answer_text"])
    summary = (
        "Model AI danh gia phan hoi co noi dung va hanh vi du tin cay."
        if reward_eligible
        else "Model AI phat hien dau hieu phan hoi ngan, nhanh hoac thieu tin hieu nghiem tuc."
    )
    if repeated_scale_pattern:
        summary = (
            f"{summary} Phat hien {repeated_scale_pattern['count']}/{repeated_scale_pattern['total']} "
            f"cau dang thang do/xep hang cung chon muc {repeated_scale_pattern['value']}."
        )
    if transformer_summary:
        summary = f"{summary} {transformer_summary}"

    model_name = "sklearn-tfidf-logistic-v1"
    if METADATA_PATH.exists():
        try:
            model_name = json.loads(METADATA_PATH.read_text(encoding="utf-8")).get("modelName", model_name)
        except Exception:
            pass

    return AnalyzeResponse(
        qualityScore=quality_score,
        isSuperficial=is_superficial,
        rewardEligible=reward_eligible,
        analysisSummary=summary,
        recommendation="Du dieu kien cho admin duyet coin." if reward_eligible else "Chua du dieu kien thuong coin.",
        modelName=model_name,
    )
