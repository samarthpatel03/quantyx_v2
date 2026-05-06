# ml-service/src/model.py

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics  import accuracy_score, classification_report
from typing import Tuple, List
from .config import MODEL_PARAMS


def train_test_split_timeseries(
    df: pd.DataFrame,
    features: List[str],
    target: str = "Target",
    split_ratio: float = 0.80,
) -> Tuple:
    """Chronological 80/20 split — no shuffling (time-series safe)."""
    available = [f for f in features if f in df.columns]
    X = df[available]
    y = df[target]
    split = int(len(df) * split_ratio)
    return X[:split], X[split:], y[:split], y[split:], split


def train_random_forest(
    X_train: pd.DataFrame,
    y_train: pd.Series,
) -> RandomForestClassifier:
    model = RandomForestClassifier(**MODEL_PARAMS)
    model.fit(X_train, y_train)
    return model


def evaluate_model(
    model: RandomForestClassifier,
    X_test: pd.DataFrame,
    y_test: pd.Series,
) -> Tuple[np.ndarray, float, str]:
    predictions = model.predict(X_test)
    accuracy    = accuracy_score(y_test, predictions)
    report      = classification_report(y_test, predictions, zero_division=0)
    return predictions, accuracy, report


def calculate_strategy_returns(
    df: pd.DataFrame,
    predictions: np.ndarray,
    split: int,
) -> Tuple[float, float]:
    """Compare ML strategy returns vs passive buy-and-hold."""
    returns      = df["Close"].pct_change().iloc[split + 1:].values
    pred_aligned = predictions[:len(returns)]

    strategy_returns   = returns * pred_aligned
    cumulative_market  = (1 + returns).cumprod()
    cumulative_strategy = (1 + strategy_returns).cumprod()

    if len(cumulative_market) == 0:
        return 0.0, 0.0

    buy_hold = (cumulative_market[-1] - 1) * 100
    strategy = (cumulative_strategy[-1] - 1) * 100
    return float(buy_hold), float(strategy)


def predict_with_sentiment(
    model: RandomForestClassifier,
    df: pd.DataFrame,
    features: List[str],
    sentiment_score: float,
) -> Tuple[int, float, str]:
    """
    Combine ML prediction with news sentiment to produce a final signal.
    Returns (direction: 0|1, confidence: float, signal: str).
    """
    available = [f for f in features if f in df.columns]
    latest     = df[available].iloc[-1:]
    direction  = model.predict(latest)[0]
    proba      = model.predict_proba(latest)[0]

    if direction == 1:  # Model says UP
        if sentiment_score < -0.2:
            signal     = "WEAK BUY"
            confidence = proba[1] * 0.8
        else:
            signal     = "STRONG BUY"
            confidence = proba[1]
    else:               # Model says DOWN
        if sentiment_score > 0.2:
            signal     = "WEAK SELL"
            confidence = proba[0] * 0.8
        else:
            signal     = "STRONG SELL"
            confidence = proba[0]

    return int(direction), float(confidence), signal


def walk_forward_validation(
    df: pd.DataFrame,
    features: List[str],
    n_splits: int = 3,
    target: str = "Target",
) -> Tuple[List[float], float]:
    """
    Walk-forward (expanding window) validation.
    Trains on past data only; tests on next window — simulates real trading.
    """
    available  = [f for f in features if f in df.columns]
    total_len  = len(df)
    fold_size  = total_len // (n_splits + 1)
    accuracies = []

    for i in range(1, n_splits + 1):
        train_end = fold_size * i
        test_end  = train_end + fold_size
        if test_end > total_len:
            break

        X_train = df[available].iloc[:train_end]
        y_train = df[target].iloc[:train_end]
        X_test  = df[available].iloc[train_end:test_end]
        y_test  = df[target].iloc[train_end:test_end]

        m = RandomForestClassifier(**MODEL_PARAMS)
        m.fit(X_train, y_train)
        acc = accuracy_score(y_test, m.predict(X_test))
        accuracies.append(float(acc))

    avg = sum(accuracies) / len(accuracies) if accuracies else 0.0
    return accuracies, avg
