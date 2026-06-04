from __future__ import annotations

import json
import hashlib
import os
import re
import urllib.error
import urllib.request
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
FAST_ANSWER_MS_PER_QUESTION = 5000
LONGEST_SAME_ANSWER_MIN_SCALE_QUESTIONS = 5
LONGEST_SAME_ANSWER_RATE_THRESHOLD = 0.7
SAME_ANSWER_RATE_MIN_SCALE_QUESTIONS = 10
SAME_ANSWER_RATE_THRESHOLD = 0.8
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "gemini").lower()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_BASE_URL = os.getenv("GEMINI_BASE_URL", "https://generativelanguage.googleapis.com")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
LLM_TIMEOUT_SECONDS = int(os.getenv("LLM_TIMEOUT_SECONDS", "90"))


class TrainingRecord(BaseModel):
    answerText: str = ""
    totalDurationMs: int = 0
    answerChangeCount: int = 0
    avgAnswerLength: float = 0
    questionCount: int = 0
    longestSameAnswerRate: float = 0
    sameAnswerRate: float = 0
    avgDurationPerQuestionMs: float = 0
    scaleQuestionCount: int = 0
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

#BÁO CÁO
class ReportOptionInsight(BaseModel):
    label: str = ""
    count: int = 0
    percentage: int = 0


class ReportQuestion(BaseModel):
    questionId: Optional[int] = None
    title: str = ""
    type: str = ""
    kind: str = ""
    totalAnswers: int = 0
    options: List[ReportOptionInsight] = []
    averageValue: Optional[float] = None
    sampleAnswers: List[str] = []
    notableAnswers: List[str] = []
    keywords: List[str] = []


class ReportSurveyInfo(BaseModel):
    id: Optional[int] = None
    title: str = ""
    description: str = ""
    field: str = ""


class SurveyReportRequest(BaseModel):
    survey: ReportSurveyInfo
    totalResponses: int = 0
    questionReports: List[ReportQuestion] = []


class SurveyReportResponse(BaseModel):
    executiveSummary: str
    respondentSummary: str = ""
    answerSummary: str
    recommendation: str
    highlights: List[str] = []
    plainText: str
    modelName: str = "ai-service-report-writer-v1"


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

def pydantic_to_dict(model: BaseModel) -> dict:
    if hasattr(model, "model_dump"):
        return model.model_dump()
    return model.dict()


def secret_fingerprint(value: str) -> str:
    if not value.strip():
        return ""
    return hashlib.sha256(value.encode("utf-8")).hexdigest()[:10]


def build_survey_report_prompt(request: SurveyReportRequest) -> str:
    survey_data = pydantic_to_dict(request)
    for question in survey_data.get("questionReports", []):
        if not question.get("sampleAnswers"):
            question["sampleAnswers"] = question.get("notableAnswers", [])

    payload = json.dumps(survey_data, ensure_ascii=False, indent=2)
    return f"""
Bạn là chuyên gia phân tích dữ liệu khảo sát và viết báo cáo tiếng Việt.

Dữ liệu dưới đây đã được Spring Boot tính sẵn thống kê như count, percentage, averageValue và sampleAnswers.
Nhiệm vụ của bạn là viết báo cáo phân tích dựa trên dữ liệu này.

Nguyên tắc bắt buộc:
- Không bịa số liệu, không tự tạo phản hồi, không suy đoán ngoài dữ liệu.
- Không tính lại count, percentage hoặc average nếu dữ liệu đã có.
- Nếu dữ liệu ít hoặc chưa đủ rõ, hãy nêu hạn chế trong báo cáo.
- Khuyến nghị phải bám vào lĩnh vực, tiêu đề khảo sát, câu hỏi, tỷ lệ, điểm trung bình và câu trả lời mẫu.
- Giọng văn chuyên nghiệp, dễ hiểu, phù hợp báo cáo đồ án.
- Chỉ trả về JSON hợp lệ, không thêm markdown, không thêm giải thích ngoài JSON.

Cấu trúc JSON bắt buộc:
{{
  "executiveSummary": "Tóm tắt điều hành 2-4 câu.",
  "respondentSummary": "Nhận xét ngắn về quy mô phản hồi và độ tin cậy dữ liệu.",
  "answerSummary": "Tổng hợp xu hướng nội dung trả lời.",
  "recommendation": "Khuyến nghị cụ thể theo dữ liệu khảo sát.",
  "highlights": ["3-5 điểm nổi bật, mỗi điểm là một câu ngắn"],
  "plainText": "Báo cáo đầy đủ có tiêu đề và các mục: Tóm tắt chung, Tổng quan câu trả lời, Xu hướng nổi bật, Phân tích theo từng câu hỏi, Khuyến nghị."
}}

Dữ liệu khảo sát:
{payload}
""".strip()


def extract_json_object(text: str) -> dict:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise
        return json.loads(cleaned[start:end + 1])


def call_gemini_report_writer(prompt: str) -> tuple[dict, str]:
    if not GEMINI_API_KEY.strip():
        raise ValueError("GEMINI_API_KEY is not configured.")

    url = f"{GEMINI_BASE_URL.rstrip('/')}/v1beta/models/{GEMINI_MODEL}:generateContent"
    body = json.dumps({
        "contents": [
            {
                "role": "user",
                "parts": [{"text": prompt}],
            }
        ],
        "generationConfig": {
            "temperature": 0.4,
            "responseMimeType": "application/json",
        },
    }).encode("utf-8")
    http_request = urllib.request.Request(
        url,
        data=body,
        headers={
            "Content-Type": "application/json",
            "x-goog-api-key": GEMINI_API_KEY,
        },
        method="POST",
    )

    with urllib.request.urlopen(http_request, timeout=LLM_TIMEOUT_SECONDS) as response:
        response_body = response.read().decode("utf-8")

    result = json.loads(response_body)
    candidates = result.get("candidates", [])
    if not candidates:
        raise ValueError("Gemini returned no candidates.")

    parts = candidates[0].get("content", {}).get("parts", [])
    raw_report = "".join(part.get("text", "") for part in parts)
    if not raw_report.strip():
        raise ValueError("Gemini returned an empty report.")
    return extract_json_object(raw_report), GEMINI_MODEL


def normalize_llm_report(data: dict, model_name: str) -> SurveyReportResponse:
    required_fields = ["executiveSummary", "answerSummary", "recommendation", "plainText"]
    missing = [field for field in required_fields if not str(data.get(field, "")).strip()]
    if missing:
        raise ValueError(f"LLM report is missing required fields: {', '.join(missing)}")

    highlights = data.get("highlights", [])
    if not isinstance(highlights, list):
        highlights = []

    return SurveyReportResponse(
        executiveSummary=str(data["executiveSummary"]).strip(),
        respondentSummary=str(data.get("respondentSummary", "")).strip(),
        answerSummary=str(data["answerSummary"]).strip(),
        recommendation=str(data["recommendation"]).strip(),
        highlights=[str(item).strip() for item in highlights if str(item).strip()],
        plainText=str(data["plainText"]).strip(),
        modelName=model_name,
    )


def build_ai_survey_report(request: SurveyReportRequest) -> SurveyReportResponse:
    if LLM_PROVIDER != "gemini":
        raise HTTPException(status_code=503, detail=f"Unsupported LLM_PROVIDER: {LLM_PROVIDER}")

    prompt = build_survey_report_prompt(request)
    try:
        report_data, model_name = call_gemini_report_writer(prompt)
        return normalize_llm_report(report_data, model_name)
    except urllib.error.HTTPError as exc:
        error_body = exc.read().decode("utf-8", errors="replace")
        raise HTTPException(status_code=502, detail=f"Gemini API error {exc.code}: {error_body}") from exc
    except (urllib.error.URLError, TimeoutError) as exc:
        raise HTTPException(status_code=503, detail=f"LLM service is not available: {exc}") from exc
    except (json.JSONDecodeError, ValueError) as exc:
        raise HTTPException(status_code=502, detail=f"LLM returned an invalid report: {exc}") from exc

#--------------------------------------------------------------------
def calculate_scale_answer_stats(request: AnalyzeRequest) -> dict:
    scale_values = [
        answer.answerText.strip()
        for answer in request.answers
        if (answer.questionKind or "").lower() in {"linear_scale", "rating"}
        and answer.answerText.strip()
    ]
    total = len(scale_values)

    if total == 0:
        return {
            "longestValue": None,
            "longestCount": 0,
            "longestRate": 0,
            "sameAnswerValue": None,
            "sameAnswerCount": 0,
            "sameAnswerRate": 0,
            "total": 0,
            "longestTriggered": False,
            "sameAnswerTriggered": False,
        }

    longest_value = scale_values[0]
    longest_count = 1
    current_value = scale_values[0]
    current_count = 1
    counts = {scale_values[0]: 1}

    for value in scale_values[1:]:
        counts[value] = counts.get(value, 0) + 1

        if value == current_value:
            current_count += 1
        else:
            current_value = value
            current_count = 1

        if current_count > longest_count:
            longest_value = current_value
            longest_count = current_count

    most_common_value, most_common_count = max(counts.items(), key=lambda item: item[1])
    longest_rate = longest_count / total
    same_answer_rate = most_common_count / total
    longest_triggered = (
        total >= LONGEST_SAME_ANSWER_MIN_SCALE_QUESTIONS
        and longest_rate >= LONGEST_SAME_ANSWER_RATE_THRESHOLD
    )
    same_answer_triggered = (
        total >= SAME_ANSWER_RATE_MIN_SCALE_QUESTIONS
        and same_answer_rate >= SAME_ANSWER_RATE_THRESHOLD
    )

    return {
        "longestValue": longest_value,
        "longestCount": longest_count,
        "longestRate": longest_rate,
        "sameAnswerValue": most_common_value,
        "sameAnswerCount": most_common_count,
        "sameAnswerRate": same_answer_rate,
        "total": total,
        "longestTriggered": longest_triggered,
        "sameAnswerTriggered": same_answer_triggered,
    }


def build_features(request: AnalyzeRequest) -> dict:
    answer_texts = [answer.answerText.strip() for answer in request.answers if answer.answerText.strip()]
    answer_text = " ".join(answer_texts)
    total_duration_ms = sum(log.durationMs or 0 for log in request.behaviorLogs)
    answer_change_count = sum(1 for log in request.behaviorLogs if log.eventType == "answer_change")
    avg_answer_length = sum(len(value) for value in answer_texts) / len(answer_texts) if answer_texts else 0
    question_count = len(request.answers)
    scale_stats = calculate_scale_answer_stats(request)
    avg_duration_per_question_ms = total_duration_ms / question_count if question_count else 0

    return {
        "answer_text": preprocess_text(answer_text),
        "total_duration_ms": total_duration_ms,
        "answer_change_count": answer_change_count,
        "avg_answer_length": avg_answer_length,
        "question_count": question_count,
        "longest_same_answer_rate": scale_stats["longestRate"],
        "same_answer_rate": scale_stats["sameAnswerRate"],
        "avg_duration_per_question_ms": avg_duration_per_question_ms,
        "scale_question_count": scale_stats["total"],
        "scale_stats": scale_stats,
    }


def is_fast_response(total_duration_ms: int, question_count: int) -> bool:
    if question_count <= 0:
        return False

    return (total_duration_ms / question_count) < FAST_ANSWER_MS_PER_QUESTION


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
        xticklabels=["Hời hợt", "Nghiêm túc"],
        yticklabels=["Hời hợt", "Nghiêm túc"],
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
        "llmProvider": LLM_PROVIDER,
        "geminiModel": GEMINI_MODEL if LLM_PROVIDER == "gemini" else None,
        "geminiBaseUrl": GEMINI_BASE_URL if LLM_PROVIDER == "gemini" else None,
        "geminiApiKeyConfigured": bool(GEMINI_API_KEY.strip()),
        "geminiApiKeyFingerprint": secret_fingerprint(GEMINI_API_KEY),
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
    df["avgDurationPerQuestionMs"] = df.apply(
        lambda row: row["avgDurationPerQuestionMs"] or (
            row["totalDurationMs"] / row["questionCount"] if row["questionCount"] else 0
        ),
        axis=1,
    )
    feature_columns = [
        "answer_text",
        "totalDurationMs",
        "answerChangeCount",
        "avgAnswerLength",
        "questionCount",
        "longestSameAnswerRate",
        "sameAnswerRate",
        "avgDurationPerQuestionMs",
        "scaleQuestionCount",
    ]
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
            (
                "numeric",
                StandardScaler(),
                [
                    "totalDurationMs",
                    "answerChangeCount",
                    "avgAnswerLength",
                    "questionCount",
                    "longestSameAnswerRate",
                    "sameAnswerRate",
                    "avgDurationPerQuestionMs",
                    "scaleQuestionCount",
                ],
            ),
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
        "longestSameAnswerRate": features["longest_same_answer_rate"],
        "sameAnswerRate": features["same_answer_rate"],
        "avgDurationPerQuestionMs": features["avg_duration_per_question_ms"],
        "scaleQuestionCount": features["scale_question_count"],
    }])

    probabilities = model.predict_proba(df)[0]
    quality_probability = float(probabilities[1])
    quality_score = round(quality_probability * 100)
    is_superficial = quality_score < 60
    reward_eligible = (not is_superficial) and quality_score >= 70
    repeated_scale_pattern = features["scale_stats"]
    fast_response = is_fast_response(features["total_duration_ms"], features["question_count"])

    transformer_summary = optional_transformer_summary(features["answer_text"])
    summary = (
        "Model AI đánh giá phản hồi có nội dung và hành vi đủ tin cậy."
        if reward_eligible
        else "Model AI phát hiện dấu hiệu phản hồi ngắn, nhanh hoặc thiếu tín hiệu nghiêm túc."
    )
    if repeated_scale_pattern["longestTriggered"] or repeated_scale_pattern["sameAnswerTriggered"]:
        repeated_reasons = []
        if repeated_scale_pattern["longestTriggered"]:
            repeated_reasons.append(
                f"chuỗi liên tiếp {repeated_scale_pattern['longestCount']}/{repeated_scale_pattern['total']} "
                f"câu cùng chọn mức {repeated_scale_pattern['longestValue']}"
            )
        if repeated_scale_pattern["sameAnswerTriggered"]:
            repeated_reasons.append(
                f"tỷ lệ cùng một đáp án {repeated_scale_pattern['sameAnswerCount']}/{repeated_scale_pattern['total']} "
                f"câu cùng chọn mức {repeated_scale_pattern['sameAnswerValue']}"
            )
        repeated_summary = (
            "kèm thời gian trả lời nhanh nên đánh dấu hời hợt."
            if fast_response
            else "nhưng thời gian trả lời không quá nhanh nên chỉ xem là dấu hiệu nghi ngờ."
        )
        summary = (
            f"{summary} Phát hiện {'; '.join(repeated_reasons)}, "
            f"{repeated_summary}"
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
        recommendation="Đủ điều kiện cho admin duyệt coin." if reward_eligible else "Chưa đủ điều kiện thưởng coin.",
        modelName=model_name,
    )


@app.post("/api/generate-survey-content-report", response_model=SurveyReportResponse)
def generate_survey_content_report(request: SurveyReportRequest):
    return build_ai_survey_report(request)
