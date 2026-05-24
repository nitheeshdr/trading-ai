from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class PatternRequest(BaseModel):
    ohlcv: list[list[float]]  # [ts, O, H, L, C, V]


class PatternResult(BaseModel):
    name: str
    signal: str
    confidence: float
    description: str | None = None


class PatternResponse(BaseModel):
    patterns: list[PatternResult]


@router.post("/detect", response_model=PatternResponse)
async def detect_patterns(req: PatternRequest):
    try:
        import talib
        import numpy as np

        ohlcv = req.ohlcv
        if len(ohlcv) < 10:
            return PatternResponse(patterns=[])

        o = np.array([x[1] for x in ohlcv], dtype=float)
        h = np.array([x[2] for x in ohlcv], dtype=float)
        l = np.array([x[3] for x in ohlcv], dtype=float)
        c = np.array([x[4] for x in ohlcv], dtype=float)

        pattern_fns = {
            "Doji":        (talib.CDLDOJI,        "HOLD"),
            "Hammer":      (talib.CDLHAMMER,      "BUY"),
            "Engulfing":   (talib.CDLENGULFING,   "BUY"),
            "ShootingStar":(talib.CDLSHOOTINGSTAR,"SELL"),
            "Harami":      (talib.CDLHARAMI,      "HOLD"),
        }

        found = []
        for name, (fn, default_signal) in pattern_fns.items():
            result = fn(o, h, l, c)
            if result[-1] != 0:
                signal = "BUY" if result[-1] > 0 else "SELL"
                found.append(PatternResult(name=name, signal=signal, confidence=0.72))

        return PatternResponse(patterns=found)

    except ImportError:
        return PatternResponse(patterns=[])
