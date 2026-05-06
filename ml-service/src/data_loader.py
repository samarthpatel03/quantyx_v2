# ml-service/src/data_loader.py

import yfinance as yf
import pandas as pd


def download_stock_data(ticker: str, period: str = "2y") -> pd.DataFrame:
    """
    Download OHLCV data from Yahoo Finance for a given NSE ticker.
    Raises ValueError if ticker is invalid or no data is returned.
    """
    try:
        df = yf.download(ticker, period=period, interval="1d", progress=False, auto_adjust=True)
    except Exception as e:
        raise ValueError(f"Failed to download data for {ticker}: {e}")

    if df is None or df.empty:
        raise ValueError(f"No data found for ticker '{ticker}'. Make sure it's a valid NSE symbol (e.g. RELIANCE.NS).")

    # Flatten multi-level columns if present (yfinance sometimes returns them)
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)

    # Ensure required columns exist
    required = {"Open", "High", "Low", "Close", "Volume"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Missing columns in data: {missing}")

    df = df[list(required)].dropna()

    if len(df) < 30:
        raise ValueError(f"Insufficient data for {ticker} — only {len(df)} rows found.")

    return df
