// ✅ This checks for the Vercel variable first, then falls back to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";
// Normalize to bare symbol (no .NS) for storage/display consistency
export function normalizeSymbol(symbol) {
  if (!symbol) return "";
  return symbol.toUpperCase().trim().replace(/\.NS$/i, "");
}

// Core fetch wrapper that automatically handles JWT Authorization
async function fetchAPI(endpoint, options = {}) {
  // 1. Grab the token from localStorage
  const token = localStorage.getItem("token");

  // 2. Prepare headers (merging defaults with any custom headers passed in)
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // 3. If a token exists, attach it as a Bearer token
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // 4. Make the network request
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // 5. Handle errors globally
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    
    // Auto-logout if the token is invalid or expired (Optional but recommended)
    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        window.location.href = "/login"; // Force redirect to login page
    }

    throw new Error(err.message || err.error || `API error: ${response.status}`);
  }
  
  return response.json();
}

export async function fetchQuotes(symbols) {
  if (!symbols || symbols.length === 0) return [];
  const normalized = symbols.map(normalizeSymbol).filter(Boolean);
  return fetchAPI(`/quotes?symbols=${normalized.join(",")}`);
}

export async function fetchCandles(symbol, range = "1mo", interval = "1d") {
  const sym = normalizeSymbol(symbol);
  return fetchAPI(`/candles?symbol=${sym}&range=${range}&interval=${interval}`);
}

export async function fetchTechnicals(symbol) {
  const sym = normalizeSymbol(symbol);
  return fetchAPI(`/technicals?symbol=${sym}`);
}

export async function fetchHeatmap() {
  return fetchAPI("/heatmap");
}

export async function checkHealth() {
  return fetchAPI("/health");
}

export async function fetchCurrentPrice(symbol) {
  try {
    const quotes = await fetchQuotes([symbol]);
    if (quotes && quotes.length > 0) return quotes[0].price;
    return null;
  } catch {
    return null;
  }
}

// Added this to make logging in through the client easier!
export async function loginUser(email, password) {
    return fetchAPI("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
    });
}

// Added this to make signing up through the client easier!
export async function registerUser(name, email, password) {
    return fetchAPI("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password })
    });
}

// Add this to the bottom of src/services/apiClient.js
export async function fetchAnalysisData(symbol) {
  const sym = normalizeSymbol(symbol);
  return fetchAPI(`/analyse/${sym}`);
}