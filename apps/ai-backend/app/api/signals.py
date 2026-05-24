from fastapi import APIRouter, Depends
from app.schemas.signals import SignalRequest, SignalResponse
from app.services.prediction import predict_intraday_signal, predict_swing_signal
from app.core.dependencies import get_redis_client
import redis.asyncio as aioredis

router = APIRouter()


@router.post("/predict", response_model=SignalResponse)
async def predict_signal(
    req: SignalRequest,
    redis: aioredis.Redis = Depends(get_redis_client),
):
    ohlcv_raw = [[p.time, p.open, p.high, p.low, p.close, p.volume] for p in req.ohlcv]

    if req.timeframe in ("1m", "5m", "15m", "30m", "1h"):
        result = await predict_intraday_signal(req.symbol, ohlcv_raw, req.timeframe, redis)
    else:
        result = await predict_swing_signal(req.symbol, ohlcv_raw, redis)

    return SignalResponse(**result)
