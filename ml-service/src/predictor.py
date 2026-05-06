# ml-service/src/predictor.py
# Main pipeline: data → features → train → predict → sentiment → package result

import pandas as pd
from .data_loader import download_stock_data
from .features    import calculate_features
from .model       import (
    train_test_split_timeseries,
    train_random_forest,
    evaluate_model,
    calculate_strategy_returns,
    predict_with_sentiment,
    walk_forward_validation,
    calculate_risk_metrics,
)
from .sentiment import get_news_sentiment, interpret_sentiment
from .config    import FEATURES


def predict_stock(ticker: str) -> dict:
    """
    Full pipeline for a single ticker.
    Returns a dict ready to be JSON-serialised and sent to the frontend.
    Raises ValueError for bad tickers / insufficient data.
    """

    # ── 1. Download data ──────────────────────────────────────
    df_raw = download_stock_data(ticker)          # raises ValueError on failure
    if len(df_raw) < 60:
        raise ValueError(f"Not enough historical data for {ticker}. Try a more liquid NSE stock.")

    # ── 2. Feature engineering ────────────────────────────────
    df = calculate_features(df_raw)
    if len(df) < 40:
        raise ValueError("Insufficient data after feature calculation.")

    # ── 3. Train / evaluate ───────────────────────────────────
    X_train, X_test, y_train, y_test, split = train_test_split_timeseries(df, FEATURES)
    model = train_random_forest(X_train, y_train)
    predictions, accuracy, report = evaluate_model(model, X_test, y_test)

    # ── 4. Strategy returns ───────────────────────────────────
    buy_hold, strategy = calculate_strategy_returns(df, predictions, split)
    risk_metrics = calculate_risk_metrics(df, predictions, split)

    # ── 5. Walk-forward validation (3 folds — faster for web) ─
    wf_accuracies, wf_avg = walk_forward_validation(df, FEATURES, n_splits=3)

    # ── 6. Sentiment ──────────────────────────────────────────
    sentiment_score, headlines = get_news_sentiment(ticker)

    # ── 7. Final prediction ───────────────────────────────────
    direction, confidence, signal = predict_with_sentiment(model, df, FEATURES, sentiment_score)

    # ── 8. Price series for charts (last 120 trading days) ────
    chart_df = df_raw.tail(120).copy()
    chart_df.index = pd.to_datetime(chart_df.index)

    price_series = [
        {
            "time":  row.Index.strftime("%Y-%m-%d"),
            "open":  round(float(row.Open),  2),
            "high":  round(float(row.High),  2),
            "low":   round(float(row.Low),   2),
            "close": round(float(row.Close), 2),
            "volume": int(row.Volume) if hasattr(row, "Volume") and row.Volume else 0,
        }
        for row in chart_df.itertuples()
        if row.Open and row.Close
    ]

    # SMA overlays
    closes = [p["close"] for p in price_series]
    sma20  = _rolling_sma(closes, 20)
    sma50  = _rolling_sma(closes, 50)

    sma20_series = [{"time": price_series[i]["time"], "value": v} for i, v in enumerate(sma20) if v is not None]
    sma50_series = [{"time": price_series[i]["time"], "value": v} for i, v in enumerate(sma50) if v is not None]

    # ── 9. RSI series ─────────────────────────────────────────
    rsi_series = _compute_rsi_series(chart_df, price_series)

    # ── 10. Technical indicators snapshot ────────────────────
    last_row = df.iloc[-1]
    indicators = {
        "rsi":       round(float(last_row.get("RSI", 50)),          2),
        "macd":      round(float(last_row.get("MACD", 0)),          4),
        "signal":    round(float(last_row.get("Signal_Line", 0)),   4),
        "macdHist":  round(float(last_row.get("MACD_Histogram", 0)),4),
        "sma20":     round(float(last_row.get("SMA_20", 0)),        2),
        "sma50":     round(float(last_row.get("SMA_50", 0)),        2),
        "bbWidth":   round(float(last_row.get("bb_Width", 0)),      4),
        "momentum":  round(float(last_row.get("Momentum", 0)),      2),
        "volatility":round(float(last_row.get("Volatility", 0)),    4),
    }

    # ── 11. Feature importance ────────────────────────────────
    importances = [
        {"feature": feat, "importance": round(float(imp), 4)}
        for feat, imp in sorted(
            zip(FEATURES, model.feature_importances_),
            key=lambda x: x[1], reverse=True
        )
    ]

    return {
        "ticker":       ticker.replace(".NS", ""),
        "signal":       signal,
        "direction":    "UP" if direction == 1 else "DOWN",
        "confidence":   round(float(confidence) * 100, 1),
        "accuracy":     round(float(accuracy) * 100, 1),
        "buyHoldReturn":round(float(buy_hold), 2),
        "mlReturn":     round(float(strategy), 2),
        "outperformance": round(float(strategy - buy_hold), 2),
        "riskMetrics": risk_metrics,

        "sentiment": {
            "score":  round(float(sentiment_score), 3),
            "label":  interpret_sentiment(sentiment_score),
            "headlines": headlines[:8],   # top 8 news items
        },

        "walkForward": {
            "folds":       [round(a * 100, 1) for a in wf_accuracies],
            "average":     round(float(wf_avg) * 100, 1),
        },

        "charts": {
            "price":   price_series,
            "sma20":   sma20_series,
            "sma50":   sma50_series,
            "rsi":     rsi_series,
        },

        "indicators": indicators,
        "featureImportance": importances,
    }


# ── Helpers ───────────────────────────────────────────────────

def _rolling_sma(values: list, period: int) -> list:
    result = []
    for i in range(len(values)):
        if i < period - 1:
            result.append(None)
        else:
            result.append(round(sum(values[i - period + 1: i + 1]) / period, 2))
    return result


def _compute_rsi_series(df_raw, price_series: list, period: int = 14) -> list:
    closes = df_raw["Close"].dropna().tolist()
    dates  = [p["time"] for p in price_series]

    if len(closes) < period + 1:
        return []

    gains, losses = [], []
    for i in range(1, len(closes)):
        d = closes[i] - closes[i - 1]
        gains.append(max(d, 0))
        losses.append(max(-d, 0))

    ag = sum(gains[:period]) / period
    al = sum(losses[:period]) / period

    rsi_values = []
    for i in range(period, len(closes)):
        ag = (ag * (period - 1) + gains[i - 1]) / period
        al = (al * (period - 1) + losses[i - 1]) / period
        rs = ag / al if al != 0 else 100
        rsi_values.append(round(100 - 100 / (1 + rs), 2))

    # Align with price_series dates (last N entries)
    offset = len(price_series) - len(rsi_values)
    result = []
    for i, val in enumerate(rsi_values):
        date_idx = offset + i
        if 0 <= date_idx < len(dates):
            result.append({"time": dates[date_idx], "value": val})
    return result
