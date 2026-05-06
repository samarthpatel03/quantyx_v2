// server.js — Quantyx v4
// NSE-only proxy. All symbols normalized to SYMBOL.NS.
// Uses raw chart endpoint for NSE data — no Yahoo Finance library/SDK.
// Run: node server.js

import express       from "express";
import cors          from "cors";
import analyseRouter from "./routes/analyse.js";

const app  = express();
const PORT = 3001;
const NSE_BASE = "https://query2.finance.yahoo.com";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36";

app.use(cors({
  origin: (origin, cb) =>
    (!origin || /^http:\/\/localhost(:\d+)?$/.test(origin))
      ? cb(null, true)
      : cb(new Error("CORS: origin not allowed")),
}));
app.use(express.json());

// ── ML Analyse microservice proxy ─────────────────────────────
app.use("/api/analyse", analyseRouter);

// ── Symbol normalizer (NSE only) ──────────────────────────────
function normalizeSymbol(symbol) {
  if (!symbol) return "";
  symbol = symbol.toUpperCase().trim();
  if (symbol.includes(".") || symbol.startsWith("^") || symbol.includes("-")) {
    return symbol;
  }
  return symbol + ".NS";
}

// ── HTTP helper ───────────────────────────────────────────────
async function nseGet(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10_000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent": UA,
        "Accept": "application/json",
        "Referer": "https://finance.yahoo.com",
      },
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`Upstream HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ── Volume formatter ──────────────────────────────────────────
function fmtVol(v) {
  if (!v || v === 0) return "—";
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e7) return `${(v / 1e7).toFixed(2)}Cr`;
  if (v >= 1e5) return `${(v / 1e5).toFixed(2)}L`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return String(v);
}

// ── Technical calculators ─────────────────────────────────────
function sma(arr, p) {
  if (arr.length < p) return null;
  return +(arr.slice(-p).reduce((a, b) => a + b, 0) / p).toFixed(2);
}
function ema(arr, p) {
  const k = 2 / (p + 1);
  let e = arr[0];
  for (let i = 1; i < arr.length; i++) e = arr[i] * k + e * (1 - k);
  return e;
}
function rsi(closes, p = 14) {
  if (closes.length < p + 1) return 50;
  let ag = 0, al = 0;
  for (let i = 1; i <= p; i++) {
    const d = closes[i] - closes[i - 1];
    if (d > 0) ag += d; else al -= d;
  }
  ag /= p; al /= p;
  for (let i = p + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    ag = (ag * (p - 1) + (d > 0 ? d : 0)) / p;
    al = (al * (p - 1) + (d < 0 ? -d : 0)) / p;
  }
  if (!al) return 100;
  return +(100 - 100 / (1 + ag / al)).toFixed(2);
}
function macd(closes) {
  if (closes.length < 35) return { macdLine: 0, macdSignal: 0, macdHist: 0 };
  const series = [];
  for (let i = 26; i <= closes.length; i++) {
    const s = closes.slice(0, i);
    series.push(ema(s, 12) - ema(s, 26));
  }
  const line   = +(series[series.length - 1]).toFixed(2);
  const signal = series.length >= 9 ? +(ema(series, 9)).toFixed(2) : +(line * 0.9).toFixed(2);
  return { macdLine: line, macdSignal: signal, macdHist: +(line - signal).toFixed(2) };
}
function pivots(h, l, c) {
  const pp = +((h + l + c) / 3).toFixed(2);
  return {
    pivotPoint: pp,
    pivotR1: +((2 * pp) - l).toFixed(2),
    pivotR2: +(pp + (h - l)).toFixed(2),
    pivotS1: +((2 * pp) - h).toFixed(2),
    pivotS2: +(pp - (h - l)).toFixed(2),
  };
}

// ── 1. Health ─────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, ts: Date.now(), exchange: "NSE" });
});

// ── 2. Quotes ─────────────────────────────────────────────────
app.get("/api/quotes", async (req, res) => {
  try {
    const syms = (req.query.symbols || "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    if (!syms.length) {
      return res.status(400).json({ error: "No symbols provided" });
    }

    const results = await Promise.all(syms.map(async (rawSym) => {
      const sym = normalizeSymbol(rawSym);
      try {
        const data = await nseGet(
          `${NSE_BASE}/v8/finance/chart/${sym}?range=5d&interval=1d&includePrePost=false`
        );
        const r = data?.chart?.result?.[0];
        if (!r) return null;

        const meta  = r.meta ?? {};
        const ohlcv = r.indicators?.quote?.[0] ?? {};
        const ts    = r.timestamp ?? [];
        const last  = ts.length - 1;
        const prev  = Math.max(0, last - 1);

        const price     = +(meta.regularMarketPrice   ?? ohlcv.close?.[last] ?? 0).toFixed(2);
        const prevClose = +(meta.chartPreviousClose   ?? meta.previousClose  ?? ohlcv.close?.[prev] ?? price).toFixed(2);
        const change    = +(price - prevClose).toFixed(2);
        const changePct = prevClose ? +((change / prevClose) * 100).toFixed(2) : 0;
        const open   = +(meta.regularMarketOpen    ?? ohlcv.open?.[last]   ?? price).toFixed(2);
        const high   = +(meta.regularMarketDayHigh ?? ohlcv.high?.[last]   ?? price).toFixed(2);
        const low    = +(meta.regularMarketDayLow  ?? ohlcv.low?.[last]    ?? price).toFixed(2);
        const volume = fmtVol(meta.regularMarketVolume ?? ohlcv.volume?.[last] ?? 0);
        const displaySym = rawSym.toUpperCase().trim().replace(/\.NS$/i, "");

        return {
          symbol: displaySym,
          name:   meta.longName || meta.shortName || displaySym,
          price, change, changePercent: changePct,
          open, high, low, volume,
          fiftyTwoWeekHigh: +(meta.fiftyTwoWeekHigh ?? 0).toFixed(2),
          fiftyTwoWeekLow:  +(meta.fiftyTwoWeekLow  ?? 0).toFixed(2),
        };
      } catch {
        return null;
      }
    }));

    res.json(results.filter(Boolean));
  } catch {
    res.status(500).json({ error: "Failed to fetch quotes" });
  }
});

// ── 3. Candles ────────────────────────────────────────────────
app.get("/api/candles", async (req, res) => {
  try {
    const { symbol, range = "1mo", interval = "1d" } = req.query;
    if (!symbol) return res.status(400).json({ error: "symbol is required" });

    const sym  = normalizeSymbol(symbol);
    const data = await nseGet(
      `${NSE_BASE}/v8/finance/chart/${sym}?range=${range}&interval=${interval}&includePrePost=false`
    );
    const r = data?.chart?.result?.[0];
    if (!r) return res.json([]);

    const ts    = r.timestamp ?? [];
    const ohlcv = r.indicators?.quote?.[0] ?? {};
    const intra = interval.includes("m") || interval.includes("h");

    const candles = ts.map((t, i) => {
      const o = ohlcv.open?.[i];
      const h = ohlcv.high?.[i];
      const l = ohlcv.low?.[i];
      const c = ohlcv.close?.[i];
      if (o == null || c == null) return null;
      const d    = new Date(t * 1000);
      const time = intra ? t : d.toISOString().split("T")[0];
      return {
        date:   time,
        open:   +o.toFixed(2),
        high:   +h.toFixed(2),
        low:    +l.toFixed(2),
        close:  +c.toFixed(2),
        volume: ohlcv.volume?.[i] ?? 0,
      };
    }).filter(Boolean);

    res.json(candles);
  } catch {
    res.status(500).json({ error: "Failed to fetch candles" });
  }
});

// ── 4. Technicals ─────────────────────────────────────────────
app.get("/api/technicals", async (req, res) => {
  try {
    const { symbol } = req.query;
    if (!symbol) return res.status(400).json({ error: "symbol is required" });

    const sym  = normalizeSymbol(symbol);
    const data = await nseGet(
      `${NSE_BASE}/v8/finance/chart/${sym}?range=6mo&interval=1d`
    );
    const r     = data?.chart?.result?.[0];
    const ohlcv = r?.indicators?.quote?.[0] ?? {};

    const closes = (ohlcv.close ?? []).filter(v => v != null);
    const highs  = (ohlcv.high  ?? []).filter(v => v != null);
    const lows   = (ohlcv.low   ?? []).filter(v => v != null);

    if (closes.length < 20) {
      return res.status(422).json({ error: "Not enough historical data" });
    }

    res.json({
      rsi:  rsi(closes, 14),
      ...macd(closes),
      sma50:  sma(closes, 50),
      sma200: sma(closes, 200),
      ...pivots(
        highs[highs.length - 1],
        lows[lows.length - 1],
        closes[closes.length - 1]
      ),
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch technicals" });
  }
});

// ── 5. Heatmap (Nifty 50 core) ───────────────────────────────
const NIFTY50 = [
  "RELIANCE","TCS","HDFCBANK","INFY","ICICIBANK",
  "HINDUNILVR","ITC","SBIN","BHARTIARTL","KOTAKBANK",
  "LT","AXISBANK","BAJFINANCE","MARUTI","TITAN",
  "SUNPHARMA","TATASTEEL","NTPC","POWERGRID","WIPRO",
];

app.get("/api/heatmap", async (_req, res) => {
  try {
    const results = await Promise.all(NIFTY50.map(async (rawSym) => {
      const sym = normalizeSymbol(rawSym);
      try {
        const data  = await nseGet(
          `${NSE_BASE}/v8/finance/chart/${sym}?range=5d&interval=1d&includePrePost=false`
        );
        const meta  = data?.chart?.result?.[0]?.meta ?? {};
        const price = meta.regularMarketPrice ?? 0;
        const prev  = meta.chartPreviousClose ?? meta.previousClose ?? price;
        const chg   = prev ? +((price - prev) / prev * 100).toFixed(2) : 0;
        return { symbol: rawSym, change: chg };
      } catch {
        return { symbol: rawSym, change: 0 };
      }
    }));
    res.json(results);
  } catch {
    res.status(500).json({ error: "Failed to fetch heatmap" });
  }
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅  Quantyx v4 NSE proxy → http://localhost:${PORT}`);
  console.log(`    Test: http://localhost:${PORT}/api/quotes?symbols=RELIANCE\n`);
});

process.on("uncaughtException",  (e) => console.error("Uncaught:", e.message));
process.on("unhandledRejection", (e) => console.error("Unhandled:", e));
