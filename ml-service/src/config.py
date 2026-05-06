# ml-service/src/config.py

FEATURES = [
    "SMA_20",
    "SMA_50",
    "RSI",
    "MACD",
    "Signal_Line",
    "MACD_Histogram",
    "bb_Width",
    "Momentum",
    "Volatility",
    "Volume",
]

MODEL_PARAMS = {
    "n_estimators": 100,
    "random_state": 42,
}
