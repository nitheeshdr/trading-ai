"""
Model inference orchestrator.
Loads model weights lazily and caches predictions in Redis.
"""
import json
import hashlib
import numpy as np
from app.core.config import settings
from app.services.feature_engineering import compute_latest_features
from loguru import logger

# Lazy model registry
_models: dict = {}


def _get_model(name: str):
    if name in _models:
        return _models[name]

    import os
    weight_path = os.path.join(settings.model_cache_dir, f"{name}.pkl")

    if os.path.exists(weight_path):
        import joblib
        _models[name] = joblib.load(weight_path)
        logger.info(f"Loaded model: {name}")
    else:
        logger.warning(f"Model weights not found for {name} — using stub")
        _models[name] = None

    return _models[name]


async def predict_intraday_signal(symbol: str, ohlcv: list, timeframe: str, redis_client=None) -> dict:
    """XGBoost intraday signal prediction."""
    cache_key = f"signal:{symbol}:{timeframe}:{hashlib.md5(str(ohlcv[-5:]).encode()).hexdigest()}"

    if redis_client:
        cached = await redis_client.get(cache_key)
        if cached:
            return json.loads(cached)

    features = compute_latest_features(ohlcv)
    model = _get_model("xgboost_intraday")

    if model is not None:
        proba = model.predict_proba(features)[0]  # [HOLD, BUY, SELL]
        idx = int(np.argmax(proba))
        labels = ["HOLD", "BUY", "SELL"]
        result = {"signal": labels[idx], "confidence": float(proba[idx]), "model": "xgboost"}
    else:
        # Stub: random-ish signal based on last close vs prev close
        if len(ohlcv) >= 2:
            change = (ohlcv[-1][4] - ohlcv[-2][4]) / ohlcv[-2][4]
            if change > 0.003:
                result = {"signal": "BUY", "confidence": 0.71, "model": "xgboost_stub"}
            elif change < -0.003:
                result = {"signal": "SELL", "confidence": 0.68, "model": "xgboost_stub"}
            else:
                result = {"signal": "HOLD", "confidence": 0.65, "model": "xgboost_stub"}
        else:
            result = {"signal": "HOLD", "confidence": 0.60, "model": "xgboost_stub"}

    result["symbol"] = symbol
    result["timeframe"] = timeframe

    if redis_client:
        await redis_client.set(cache_key, json.dumps(result), ex=30)  # cache 30s

    return result


async def predict_swing_signal(symbol: str, ohlcv: list, redis_client=None) -> dict:
    """LSTM swing trading prediction."""
    result = {"signal": "HOLD", "confidence": 0.60, "model": "lstm_stub", "symbol": symbol, "timeframe": "1d"}
    return result
