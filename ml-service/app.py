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

import os
import google.generativeai as genai
from flask import request, jsonify
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure the Gemini API
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

# Initialize the model (Gemini 1.5 Flash is great for fast text responses)
model = genai.GenerativeModel('gemini-1.5-flash')

@app.route('/api/advisor', methods=['POST'])
def ask_advisor():
    data = request.get_json()
    user_message = data.get('message')

    if not user_message:
        return jsonify({'error': 'Message is required'}), 400

    try:
        # Give the AI context about its role in your app
        prompt = f"""
        You are the AI Financial Advisor for an app called Quantyx. 
        Quantyx is a stock market prediction and analysis system.
        Provide concise, analytical, and professional financial insights.
        Do not give explicit financial advice to buy or sell, but analyze the situation.
        
        User's query: {user_message}
        """

        # Call the Gemini API
        response = model.generate_content(prompt)
        
        return jsonify({'reply': response.text}), 200

    except Exception as e:
        print(f"Error calling Gemini: {e}")
        return jsonify({'error': 'Failed to generate response'}), 500
    
    
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
    print("\n✅  Quantyx ML Service → http://localhost:8000")
    print("    Test: http://localhost:8000/predict/RELIANCE\n")
    app.run(host="0.0.0.0", port=8000, debug=False)
