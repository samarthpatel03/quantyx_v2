# ml-service/src/features.py

import pandas as pd
import numpy as np


def calculate_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Calculate all technical indicators from OHLCV data.
    Returns a cleaned DataFrame with no NaN rows.
    """
    df = df.copy()

    # ── Moving Averages ───────────────────────────────────────
    df["SMA_20"] = df["Close"].rolling(window=20).mean()
    df["SMA_50"] = df["Close"].rolling(window=50).mean()

    # ── RSI (14-period) ───────────────────────────────────────
    delta = df["Close"].diff()
    gain  = delta.clip(lower=0)
    loss  = delta.clip(upper=0).abs()
    avg_gain = gain.rolling(14).mean()
    avg_loss = loss.rolling(14).mean()
    rs = avg_gain / avg_loss.replace(0, np.nan)
    df["RSI"] = 100 - (100 / (1 + rs))

    # ── MACD ──────────────────────────────────────────────────
    ema12 = df["Close"].ewm(span=12, adjust=False).mean()
    ema26 = df["Close"].ewm(span=26, adjust=False).mean()
    df["MACD"]         = ema12 - ema26
    df["Signal_Line"]  = df["MACD"].ewm(span=9, adjust=False).mean()
    df["MACD_Histogram"] = df["MACD"] - df["Signal_Line"]

    # ── Bollinger Band Width ──────────────────────────────────
    std20       = df["Close"].rolling(20).std()
    df["bb_Width"] = (4 * std20) / df["SMA_20"].replace(0, np.nan)

    # ── Momentum (10-day price change) ────────────────────────
    df["Momentum"] = df["Close"] - df["Close"].shift(10)

    # ── Volatility (20-day rolling std of returns) ────────────
    df["Volatility"] = df["Close"].pct_change().rolling(20).std()

    # ── Volume (ensure numeric) ───────────────────────────────
    df["Volume"] = pd.to_numeric(df["Volume"], errors="coerce")

    # ── Target: 1 if next day close > today's close ───────────
    df["Target"] = (df["Close"].shift(-1) > df["Close"]).astype(int)

    # Drop rows with any NaN in feature/target columns
    df.dropna(inplace=True)

    return df
