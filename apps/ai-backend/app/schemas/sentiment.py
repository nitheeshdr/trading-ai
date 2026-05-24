from pydantic import BaseModel
from typing import Literal


class SentimentRequest(BaseModel):
    text: str | None = None
    symbol: str | None = None


class SentimentResponse(BaseModel):
    symbol: str | None
    sentiment: Literal["positive", "negative", "neutral"]
    score: float
    sources: list[str] = []
