from fastapi import APIRouter, Depends
from app.schemas.risk import AutoSignalRequest, AutoSignalResponse
from app.services.prediction import predict_intraday_signal
from app.core.dependencies import get_redis_client
import redis.asyncio as aioredis

router = APIRouter()

MIN_CONFIDENCE = 0.60


@router.post("/evaluate", response_model=AutoSignalResponse)
async def evaluate_auto_signal(
    req: AutoSignalRequest,
    redis: aioredis.Redis = Depends(get_redis_client),
):
    result = await predict_intraday_signal(req.symbol, req.ohlcv, "5m", redis)

    confidence = result.get("confidence", 0.0)
    signal = result.get("signal", "HOLD")

    # Enforce minimum confidence
    if confidence < MIN_CONFIDENCE:
        return AutoSignalResponse(
            action="HOLD",
            confidence=confidence,
            reason=f"Confidence {confidence:.2%} below minimum {MIN_CONFIDENCE:.0%}",
        )

    # If position is open, only consider SELL signals for exit
    if req.open_position and signal == "BUY":
        return AutoSignalResponse(action="HOLD", confidence=confidence, reason="Position already open")

    return AutoSignalResponse(
        action=signal,
        confidence=confidence,
        reason=f"{result.get('model', 'xgboost')} signal with {confidence:.0%} confidence",
    )
