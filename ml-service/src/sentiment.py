# ml-service/src/sentiment.py
# Fixed for the new yfinance news content structure (2024+)

import yfinance as yf
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from typing import Tuple, List

_analyzer = SentimentIntensityAnalyzer()


def get_news_sentiment(ticker: str) -> Tuple[float, List[dict]]:
    """
    Fetch stock-specific news headlines from Yahoo Finance via yfinance.
    Returns (avg_sentiment_score, list_of_headline_dicts).
    Score is between -1 (very negative) and +1 (very positive).
    """
    try:
        stock = yf.Ticker(ticker)
        news  = stock.news or []

        headlines = []
        scores    = []

        for article in news[:20]:
            # yfinance wraps content in a nested 'content' dict (post-2024 structure)
            content = article.get("content", {})

            # Try nested title first, fall back to top-level
            title = (
                content.get("title")
                or article.get("title")
                or ""
            ).strip()

            published = (
                content.get("pubDate")
                or article.get("providerPublishTime", "")
            )

            if not title:
                continue

            score = _analyzer.polarity_scores(title)["compound"]
            scores.append(score)
            headlines.append({
                "headline":  title,
                "sentiment": round(score, 3),
                "label":     interpret_sentiment(score),
                "published": str(published),
            })

        avg = sum(scores) / len(scores) if scores else 0.0
        return round(avg, 3), headlines

    except Exception as e:
        print(f"[sentiment] Warning: could not fetch news for {ticker}: {e}")
        return 0.0, []


def interpret_sentiment(score: float) -> str:
    if score >= 0.05:
        return "Positive"
    elif score <= -0.05:
        return "Negative"
    return "Neutral"
