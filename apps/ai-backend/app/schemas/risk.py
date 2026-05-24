from pydantic import BaseModel
from typing import Literal


class Holding(BaseModel):
    symbol: str
    quantity: int
    avg_price: float
    current_price: float


class RiskRequest(BaseModel):
    holdings: list[Holding]


class RiskResponse(BaseModel):
    score: float                              # 0–100 (higher = healthier)
    risk_level: Literal["low", "medium", "high"]
    recommendations: list[str]


class AutoSignalRequest(BaseModel):
    symbol: str
    ohlcv: list[list[float]]                  # [timestamp, O, H, L, C, V]
    current_price: float
    open_position: bool = False


class AutoSignalResponse(BaseModel):
    action: Literal["BUY", "SELL", "HOLD"]
    confidence: float
    reason: str
