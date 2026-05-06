# Quantyx — Indian Stock Market Dashboard

A full-featured stock market app for NSE/BSE with live data, AI analysis, paper trading, an AI advisor, and a learn section.

---

## Features

- **Live Market Data** — Real-time NSE/BSE quotes via Yahoo Finance
- **AI Stock Analyser** — ML-powered predictions with Random Forest + VADER sentiment
- **Paper Trading Simulator** — Virtual ₹1,00,000 portfolio with P&L tracking
- **Learn Section** — 30+ beginner-friendly topics on stocks, trading, risk management
- **Watchlist** — Track your favourite stocks with live prices

---

## Project Structure

```
quantyx/
├── src/
│   ├── pages/
│   │   ├── Dashboard.jsx     ← Live market dashboard
│   │   ├── Analyse.jsx       ← ML stock analyser
│   │   ├── Watchlist.jsx     ← Watchlist with live prices
│   │   ├── Simulator.jsx     ← Paper trading simulator
│   │   ├── Learn.jsx         ← Educational content
│   │   └── Settings.jsx
│   ├── components/
│   │   ├── nav/              ← AppShell, DesktopNav, MobileNav, MarketStatusBar
│   │   └── dashboard/        ← StockChart, TechnicalTile, HeatmapTile
│   ├── hooks/                ← useMarketData, use-mobile
│   ├── lib/                  ← API helpers, NSE stock list, portfolio logic
│   └── services/             ← apiClient
├── routes/
│   └── analyse.js            ← Node.js proxy to ML service
├── ml-service/               ← Python Flask ML microservice
│   ├── app.py                ← Flask server (port 8000)
│   └── src/                  ← predictor, model, features, sentiment
├── server.js                 ← Node.js NSE data proxy (port 3001)
├── package.json
└── vite.config.js
```

---

## Running in VS Code (Step by Step)

### Prerequisites
- **Node.js** v18 or later — download from nodejs.org
- **Python** 3.9 or later — download from python.org
- **VS Code** — download from code.visualstudio.com

### Step 1 — Open the project in VS Code

```
File → Open Folder → select the quantyx folder
```

Or from terminal:
```bash
code .
```

### Step 2 — Install Node.js dependencies

Open the VS Code terminal (`Ctrl+` ` ` or **Terminal → New Terminal**) and run:

```bash
npm install
```

### Step 3 — Install Python dependencies

```bash
cd ml-service
pip install -r requirements.txt
cd ..
```

> On some systems use `pip3` instead of `pip`.

### Step 4 — Run the app (3 terminals needed)

Open three terminals in VS Code using the **+** button in the terminal panel.

**Terminal 1 — Python ML Service:**
```bash
npm run ml
# Starts Flask on http://localhost:8000
```

**Terminal 2 — Node.js Data Server:**
```bash
npm run server
# Starts Express on http://localhost:3001
```

**Terminal 3 — React Frontend:**
```bash
npm run dev
# Opens on http://localhost:5173
```

Then open your browser and go to **http://localhost:5173**

---


## Theme

Quantyx supports both **Dark mode** (default) and **Light mode**. Toggle using the moon/sun icon in the left navigation bar. The theme applies uniformly across all components.

---

## Notes

- First ML prediction takes 20–40 seconds (downloads 2yr data + trains model)
- Subsequent predictions are cached for 1 hour
- Paper trading data is stored in browser localStorage
- Best used after 3:30 PM IST for end-of-day analysis
- Supports all NSE stocks — enter symbols without the `.NS` suffix
