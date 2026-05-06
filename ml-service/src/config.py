FEATURES = [
    'Close', 'High', 'Low', 'Open', 'Volume',
    'SMA_20', 'SMA_50', 'RSI', 'MACD',
    'Signal_Line', 'MACD_Histogram', 'bb_Width',
    'Momentum', 'Volatility'
]

# Increase training window to 3 years
DATA_PERIOD_DAYS = 1095

MODEL_PARAMS = {
    "n_estimators": 100,
    "random_state": 42,
}