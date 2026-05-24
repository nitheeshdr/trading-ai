from fastapi import APIRouter
from app.schemas.sentiment import SentimentRequest, SentimentResponse

router = APIRouter()

# FinBERT loaded lazily
_finbert = None
_tokenizer = None


def _get_finbert():
    global _finbert, _tokenizer
    if _finbert is None:
        try:
            from transformers import pipeline
            _finbert = pipeline("sentiment-analysis", model="ProsusAI/finbert")
        except Exception:
            _finbert = "stub"
    return _finbert


@router.post("/analyze", response_model=SentimentResponse)
async def analyze_sentiment(req: SentimentRequest):
    text = req.text or f"{req.symbol} stock news"
    model = _get_finbert()

    if model == "stub" or model is None:
        # Stub response
        return SentimentResponse(symbol=req.symbol, sentiment="neutral", score=0.5)

    result = model(text[:512])[0]
    label_map = {"positive": "positive", "negative": "negative", "neutral": "neutral"}
    sentiment = label_map.get(result["label"].lower(), "neutral")

    return SentimentResponse(
        symbol=req.symbol,
        sentiment=sentiment,
        score=round(result["score"], 4),
    )
