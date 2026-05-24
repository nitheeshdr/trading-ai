from pydantic import BaseModel, Field
from typing import Literal


class OHLCVPoint(BaseModel):
    time: int
    open: float
    high: float
    low: float
    close: float
    volume: float


class SignalRequest(BaseModel):
    symbol: str
    ohlcv: list[OHLCVPoint]
    timeframe: str = "5m"


class SignalResponse(BaseModel):
    symbol: str
    signal: Literal["BUY", "SELL", "HOLD"]
    confidence: float = Field(ge=0, le=1)
    model: str
    timeframe: str
    reason: str | None = None
