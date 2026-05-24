"""
Feature engineering using TA-Lib indicators.
Converts raw OHLCV data into ML-ready feature vectors.
"""
import numpy as np
import pandas as pd

try:
    import talib
    HAS_TALIB = True
except ImportError:
    HAS_TALIB = False


def compute_features(ohlcv: list[list[float]]) -> np.ndarray:
    """
    Input: list of [timestamp, open, high, low, close, volume]
    Returns: feature matrix (rows = candles, cols = features)
    """
    if not ohlcv:
        return np.array([])

    df = pd.DataFrame(ohlcv, columns=["ts", "open", "high", "low", "close", "volume"])
    o, h, l, c, v = df["open"].values, df["high"].values, df["low"].values, df["close"].values, df["volume"].values

    features = {}

    if HAS_TALIB:
        features["rsi"]       = talib.RSI(c, timeperiod=14)
        features["macd"]      = talib.MACD(c, fastperiod=12, slowperiod=26, signalperiod=9)[0]
        features["macd_sig"]  = talib.MACD(c, fastperiod=12, slowperiod=26, signalperiod=9)[1]
        features["bb_upper"]  = talib.BBANDS(c, timeperiod=20)[0]
        features["bb_lower"]  = talib.BBANDS(c, timeperiod=20)[2]
        features["atr"]       = talib.ATR(h, l, c, timeperiod=14)
        features["ema_9"]     = talib.EMA(c, timeperiod=9)
        features["ema_21"]    = talib.EMA(c, timeperiod=21)
        features["volume_ma"] = talib.SMA(v, timeperiod=20)
        features["adx"]       = talib.ADX(h, l, c, timeperiod=14)
    else:
        # Fallback: simple returns if TA-Lib not installed
        features["returns"]   = np.diff(c, prepend=c[0]) / c

    feat_df = pd.DataFrame(features).fillna(0)
    return feat_df.values


def compute_latest_features(ohlcv: list[list[float]]) -> np.ndarray:
    """Returns just the last row of features (for inference)."""
    features = compute_features(ohlcv)
    if features.size == 0:
        return np.zeros(10)
    return features[-1:]
