# ml-service/app.py
# Quantyx Analyse — Flask ML Microservice
# Run: pip install -r requirements.txt && python app.py
# Listens on http://localhost:8000

from flask import Flask, jsonify, request
from flask_cors import CORS
import traceback
import time

from src.predictor import predict_stock

app = Flask(__name__)
CORS(app, origins=["http://localhost:3001", "http://localhost:5173"])

# ── Simple in-memory cache (ticker → {result, timestamp}) ────
_cache = {}
CACHE_TTL = 3600  # 1 hour

def get_cached(ticker):
    entry = _cache.get(ticker)
    if entry and (time.time() - entry["ts"]) < CACHE_TTL:
        return entry["data"]
    return None

def set_cache(ticker, data):
    _cache[ticker] = {"data": data, "ts": time.time()}


# ── Health ────────────────────────────────────────────────────
@app.get("/health")
def health():
    return jsonify({"ok": True, "service": "quantyx-ml"})

    
# ── Predict ───────────────────────────────────────────────────
@app.get("/predict/<ticker>")
def predict(ticker: str):
    ticker = ticker.strip().upper()

    # Auto-append .NS if missing
    if not ticker.endswith(".NS") and not ticker.endswith(".BO"):
        ticker += ".NS"

    # Serve from cache if fresh
    cached = get_cached(ticker)
    if cached:
        return jsonify({**cached, "cached": True})

    try:
        result = predict_stock(ticker)
        set_cache(ticker, result)
        return jsonify({**result, "cached": False})

    except ValueError as e:
        return jsonify({"error": str(e)}), 422
    except Exception:
        traceback.print_exc()
        return jsonify({"error": "Prediction failed. Check ticker or try again later."}), 500


# ── Clear cache (dev utility) ─────────────────────────────────
@app.delete("/cache")
def clear_cache():
    _cache.clear()
    return jsonify({"ok": True})


if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 8000)) # Default to 8000 for local, Render uses PORT
    app.run(host="0.0.0.0", port=port)