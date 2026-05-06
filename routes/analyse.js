import express from "express";
import authenticateToken from "../middleware/auth.js"; // Important: Must include .js extension

const router = express.Router();
const ML_SERVICE = "http://localhost:8000";
const TIMEOUT_MS = 60_000; // ML can take up to 60s on first run (training)

async function mlFetch(path) {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${ML_SERVICE}${path}`, { signal: ctrl.signal });
    clearTimeout(timer);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `ML service error ${res.status}`);
    return data;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === "AbortError") throw new Error("ML service timed out. Please try again.");
    throw err;
  }
}

// GET /api/analyse/health
// We leave this public so you can ping the ML service status without a token
router.get("/health", async (_req, res) => {
  try {
    const data = await mlFetch("/health");
    res.json(data);
  } catch {
    res.status(503).json({ error: "ML service is not running. Start it with: python app.py" });
  }
});

// GET /api/analyse/:ticker
// PROTECTED ROUTE: We added 'authenticateToken' as the second parameter
router.get("/:ticker", authenticateToken, async (req, res) => {
  const ticker = req.params.ticker.trim().toUpperCase();
  if (!ticker) return res.status(400).json({ error: "Ticker is required." });

  try {
    // If you need to know WHO made the request, you can access req.user here!
    // console.log("User requesting data:", req.user.userId);

    const data = await mlFetch(`/predict/${ticker}`);
    res.json(data);
  } catch (err) {
    const status = err.message.includes("timed out") ? 504 : 502;
    res.status(status).json({ error: err.message });
  }
});

export default router;