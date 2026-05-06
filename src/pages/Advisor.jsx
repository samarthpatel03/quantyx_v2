import { useState, useRef, useEffect } from "react";
import {
  MessageSquare, Send, Bot, User, Sparkles, Key,
  TrendingUp, BookOpen, Shield, AlertCircle, X, Settings2,
  ChevronRight, Loader2
} from "lucide-react";

const SYSTEM_PROMPT = `You are Quantyx AI Advisor, a friendly and knowledgeable stock market expert focused on Indian markets (NSE/BSE). Help beginners and intermediate investors understand the stock market.

Guidelines:
- Explain things in simple, jargon-free language. If you use a technical term, immediately explain it in plain words.
- When asked about a specific stock, provide: 1) What the company does, 2) Key things to research (sector, fundamentals), 3) General considerations (never a definitive buy/sell), 4) Risks to be aware of.
- Always add a disclaimer that you provide educational information only, not financial advice.
- Keep responses concise — 3 to 5 paragraphs maximum.
- Use Indian market context (rupee sign, NSE/BSE, SEBI regulations).
- Be encouraging and supportive. Never give a definitive buy or sell recommendation.
- If asked about concepts, explain with simple examples from Indian markets.`;

const QUICK_QUESTIONS = [
  { icon: TrendingUp,  label: "Analyse a stock",  text: "What should I look for before buying a stock like RELIANCE or INFY?" },
  { icon: BookOpen,    label: "Market basics",    text: "What is the difference between NSE and BSE?" },
  { icon: Shield,      label: "Risk management",  text: "How should a beginner manage risk in the stock market?" },
  { icon: Sparkles,    label: "Portfolio",        text: "How should I diversify my portfolio starting with Rs 50,000?" },
  { icon: AlertCircle, label: "Mistakes",         text: "What are the most common mistakes beginners make in Indian stocks?" },
];

function MessageBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${isUser ? "bg-primary/20" : "bg-secondary/20"}`}>
        {isUser ? <User className="w-4 h-4 text-primary" /> : <Bot className="w-4 h-4 text-secondary" />}
      </div>
      <div className={`max-w-[80%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${isUser ? "bg-primary/15 border border-primary/20 text-foreground rounded-tr-sm" : "glass text-foreground rounded-tl-sm"}`}>
        {message.content.split("\n").map((line, i) => (
          line ? <p key={i} className="mb-1 last:mb-0">{line}</p> : <br key={i} />
        ))}
      </div>
    </div>
  );
}

function ApiKeyModal({ onSave, onClose }) {
  const [key, setKey] = useState("");
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg flex items-center gap-2"><Key className="w-5 h-5 text-primary" /> Enter API Key</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="glass rounded-xl p-4 space-y-2">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">How to get your key</p>
          <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Go to console.anthropic.com</li>
            <li>Create an account or sign in</li>
            <li>Click API Keys then Create Key</li>
            <li>Copy the key (starts with sk-ant-)</li>
            <li>Paste it below</li>
          </ol>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Anthropic API Key</label>
          <input type="password" placeholder="sk-ant-..." value={key} onChange={(e) => setKey(e.target.value)}
            className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary" />
          <p className="text-xs text-muted-foreground">Your key is stored only in your browser local storage and never sent to our servers.</p>
        </div>
        <button onClick={() => { if (key.trim()) { onSave(key.trim()); } }} disabled={!key.trim()}
          className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-40">
          Save and Start Chatting
        </button>
      </div>
    </div>
  );
}

export default function Advisor() {
  const [apiKey, setApiKey]       = useState(() => localStorage.getItem("quantyx_advisor_key") || "");
  const [showModal, setShowModal] = useState(false);
  const [messages, setMessages]   = useState([{
    role: "assistant",
    content: "Hi! I am Quantyx AI Advisor\n\nI am here to help you understand the Indian stock market. Ask me about a specific stock, market concepts, or how to manage risk.\n\nType a question or use the quick templates below. Remember — I provide educational guidance only, not financial advice!"
  }]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const bottomRef                 = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const saveApiKey = (key) => {
    setApiKey(key);
    localStorage.setItem("quantyx_advisor_key", key);
    setShowModal(false);
  };

  const clearApiKey = () => {
    setApiKey("");
    localStorage.removeItem("quantyx_advisor_key");
  };

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    if (!apiKey) { setShowModal(true); return; }

    setInput("");
    setError("");
    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages: newMessages.slice(1).map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 401) throw new Error("Invalid API key. Please check your Anthropic API key.");
        if (res.status === 429) throw new Error("Rate limit reached. Please wait a moment and try again.");
        throw new Error(errData?.error?.message || "API error " + res.status);
      }

      const data = await res.json();
      const reply = data.content?.find(b => b.type === "text")?.text || "Sorry, I could not generate a response.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      setMessages(newMessages.slice(0, -1));
      setInput(userText);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div className="flex flex-col" style={{ height: "100%" }}>
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-border/50 shrink-0">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary/15 rounded-xl">
              <MessageSquare className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <h1 className="font-bold text-base sm:text-lg">AI Market Advisor</h1>
              <p className="text-xs text-muted-foreground">Powered by Claude · Educational use only</p>
            </div>
          </div>
          <button onClick={() => apiKey ? clearApiKey() : setShowModal(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${apiKey ? "bg-primary/15 text-primary hover:bg-red-500/10 hover:text-red-500" : "bg-muted text-muted-foreground hover:bg-primary/15 hover:text-primary"}`}>
            <Key className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{apiKey ? "Key set · click to remove" : "Set API Key"}</span>
            <span className="sm:hidden">{apiKey ? "Key set" : "Set Key"}</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((msg, i) => <MessageBubble key={i} message={msg} />)}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-secondary" />
              </div>
              <div className="glass rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking...
              </div>
            </div>
          )}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Quick questions */}
      {messages.length === 1 && (
        <div className="px-4 sm:px-6 pb-2 shrink-0">
          <div className="max-w-3xl mx-auto">
            <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Quick questions</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_QUESTIONS.map(({ icon: Icon, label, text }) => (
                <button key={label} onClick={() => sendMessage(text)} disabled={loading || !apiKey}
                  className="flex items-center gap-1.5 px-3 py-1.5 glass rounded-lg text-xs font-medium hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-50">
                  <Icon className="w-3.5 h-3.5" />{label}<ChevronRight className="w-3 h-3 opacity-50" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No key prompt */}
      {!apiKey && (
        <div className="px-4 sm:px-6 pb-2 shrink-0">
          <div className="max-w-3xl mx-auto">
            <button onClick={() => setShowModal(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary/10 border border-primary/20 rounded-xl text-sm text-primary hover:bg-primary/15 transition-colors">
              <Key className="w-4 h-4" />Add your Anthropic API key to start chatting<Settings2 className="w-3.5 h-3.5 opacity-70" />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 sm:px-6 pb-4 sm:pb-6 shrink-0">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-2 items-end glass rounded-2xl p-2">
            <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
              placeholder={apiKey ? "Ask about a stock, concept, or strategy..." : "Set your API key to start chatting"}
              disabled={loading || !apiKey} rows={1}
              className="flex-1 bg-transparent resize-none px-2 py-1.5 text-sm focus:outline-none placeholder:text-muted-foreground disabled:opacity-50"
              style={{ minHeight: "36px", maxHeight: "128px", lineHeight: "1.5" }}
              onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px"; }} />
            <button onClick={() => sendMessage()} disabled={!input.trim() || loading || !apiKey}
              className="p-2 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 shrink-0">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-center text-[10px] text-muted-foreground mt-2">
            Educational guidance only. Not financial advice. Consult a SEBI-registered advisor for personal recommendations.
          </p>
        </div>
      </div>

      {showModal && <ApiKeyModal onSave={saveApiKey} onClose={() => setShowModal(false)} />}
    </div>
  );
}
