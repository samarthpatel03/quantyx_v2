import { useState } from "react";
import {
  BookOpen, TrendingUp, Shield, AlertTriangle, BarChart2,
  ChevronDown, ChevronUp, Lightbulb, Target, DollarSign,
  Activity, PieChart, Clock
} from "lucide-react";

const SECTIONS = [
  {
    id: "basics",
    icon: BookOpen,
    title: "What is the Stock Market?",
    color: "text-primary",
    bg: "bg-primary/10",
    content: [
      {
        q: "What is a share / stock?",
        a: "A share (also called a stock) is a small ownership piece of a company. When a company wants to raise money, it divides itself into millions of tiny pieces and sells them to the public. If you buy one share of Reliance Industries, you own a tiny fraction of Reliance — and if the company does well, your share becomes more valuable."
      },
      {
        q: "What is the stock market?",
        a: "The stock market is a marketplace where buyers and sellers trade shares of publicly listed companies. In India, the two main exchanges are NSE (National Stock Exchange) and BSE (Bombay Stock Exchange). Think of it like a giant auction that runs on weekdays from 9:15 AM to 3:30 PM IST."
      },
      {
        q: "Why do stock prices change?",
        a: "Stock prices change because of supply and demand. When more people want to buy a stock than sell it, the price goes up. When more people want to sell, it goes down. Prices are influenced by company earnings, news, economic data, global events, and investor sentiment."
      },
      {
        q: "What is Sensex and Nifty 50?",
        a: "Sensex is an index of the top 30 companies on BSE. Nifty 50 tracks the top 50 companies on NSE. These indices act like a thermometer for the overall market — when Nifty 50 goes up, it generally means most big companies are doing well that day."
      },
      {
        q: "What is an IPO?",
        a: "An IPO (Initial Public Offering) is when a private company lists on the stock exchange for the first time to raise money from the public. When you apply for an IPO, you are buying shares directly from the company before they start trading on the exchange."
      }
    ]
  },
  {
    id: "trading",
    icon: TrendingUp,
    title: "How Trading Works",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    content: [
      {
        q: "What is a Demat account?",
        a: "A Demat (Dematerialised) account is like a digital locker for your shares. Just like a bank account holds your money, a Demat account holds your shares electronically. You need a Demat account linked to a trading account to buy and sell stocks in India."
      },
      {
        q: "What is intraday vs delivery trading?",
        a: "Intraday trading means buying and selling the same stock within a single trading day — you don't take home any shares overnight. Delivery trading means you buy shares and hold them beyond the same day — the shares land in your Demat account and you own them until you choose to sell."
      },
      {
        q: "What are market orders and limit orders?",
        a: "A market order executes immediately at the best available price — fast but you don't control the exact price. A limit order lets you set the price you want to buy or sell at — it only executes if the market reaches your price, giving you control but no guarantee of execution."
      },
      {
        q: "What is a circuit breaker / upper/lower circuit?",
        a: "To prevent extreme price swings, SEBI sets circuit limits for stocks (often ±5%, ±10%, or ±20%). If a stock hits its upper circuit, no one can buy it above that price for the day. Lower circuit works the same way in the opposite direction. These are safety valves in the system."
      },
      {
        q: "What is volume in stocks?",
        a: "Volume is the total number of shares traded in a given time period. High volume means a lot of activity and interest. When a stock moves significantly on high volume, it is considered a stronger signal than the same move on low volume."
      }
    ]
  },
  {
    id: "analysis",
    icon: BarChart2,
    title: "Reading Charts & Analysis",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    content: [
      {
        q: "What is fundamental analysis?",
        a: "Fundamental analysis means studying the actual business — its revenues, profits, debt, management, and future growth potential. Investors who do fundamental analysis ask: 'Is this a good company at a fair price?' They typically hold stocks for months or years."
      },
      {
        q: "What is technical analysis?",
        a: "Technical analysis studies price charts and patterns to predict future price movements. It ignores the company's business and focuses purely on price history and volume. Day traders and swing traders often rely on technical analysis for short-term entry and exit points."
      },
      {
        q: "What is support and resistance?",
        a: "Support is a price level where a stock tends to stop falling — buyers step in. Resistance is a price level where it tends to stop rising — sellers appear. These are key levels traders watch because when price breaks through them, it often signals a strong move."
      },
      {
        q: "What are moving averages?",
        a: "A moving average smooths out price data by calculating the average price over a set period (e.g., 50 days or 200 days). When the shorter moving average crosses above the longer one, it is often seen as a buy signal (called a 'golden cross'). The opposite is called a 'death cross'."
      },
      {
        q: "What is RSI (Relative Strength Index)?",
        a: "RSI is a momentum indicator that measures how fast prices are moving. It ranges from 0 to 100. Above 70 suggests a stock may be overbought (due for a pullback). Below 30 suggests it may be oversold (potentially due for a bounce). It helps traders spot reversals."
      }
    ]
  },
  {
    id: "risk",
    icon: Shield,
    title: "Risk Management",
    color: "text-green-500",
    bg: "bg-green-500/10",
    content: [
      {
        q: "What is diversification?",
        a: "Diversification means spreading your money across different stocks, sectors, and asset classes so that a loss in one area doesn't destroy your entire portfolio. The classic saying is 'Don't put all your eggs in one basket.' A diversified portfolio might include IT, pharma, banking, and consumer stocks."
      },
      {
        q: "What is a stop-loss?",
        a: "A stop-loss is a pre-set price at which you automatically exit a trade to limit your loss. For example, if you buy a stock at ₹500 and set a stop-loss at ₹450, your trade automatically closes if the price falls to ₹450 — capping your loss at 10%. It removes emotion from losing trades."
      },
      {
        q: "How much of my money should I invest in stocks?",
        a: "A common rule is to never invest money you cannot afford to lose in the short term. Many advisors suggest the '100 minus age' rule — subtract your age from 100 to get the percentage to keep in equities. So at age 25, up to 75% in equities; at 50, around 50%. Always keep an emergency fund in a safe, liquid account first."
      },
      {
        q: "What is the risk-reward ratio?",
        a: "Before entering a trade, good traders calculate how much they could lose vs. how much they could gain. A 1:3 risk-reward ratio means you risk ₹1 to potentially make ₹3. Most experienced traders only take trades where the potential reward is at least 2x the risk."
      },
      {
        q: "What is position sizing?",
        a: "Position sizing means deciding how many shares to buy based on your risk tolerance. A popular rule: risk no more than 1-2% of your total portfolio on any single trade. If your portfolio is ₹1,00,000 and you risk 1%, you won't lose more than ₹1,000 on any single bad trade."
      }
    ]
  },
  {
    id: "mistakes",
    icon: AlertTriangle,
    title: "Common Mistakes to Avoid",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    content: [
      {
        q: "Chasing hot tips without research",
        a: "Acting on tips from friends, WhatsApp groups, or social media without doing your own research is one of the fastest ways to lose money. By the time a 'hot tip' reaches you, insiders and big investors have often already made their move. Always understand WHY you are buying a stock."
      },
      {
        q: "Averaging down blindly",
        a: "Buying more of a falling stock to 'average down' your cost can be dangerous if the company has underlying problems. It's fine to add to a solid stock on a temporary dip, but adding to a stock that is falling because of business deterioration can amplify your losses."
      },
      {
        q: "Letting emotions drive decisions",
        a: "Fear and greed are the biggest enemies of investors. Fear causes you to sell at the bottom (panic selling). Greed causes you to hold too long hoping for more gains. Having a clear plan — with entry, target, and stop-loss defined before you enter — helps remove emotional decision-making."
      },
      {
        q: "Overtrading",
        a: "Buying and selling too frequently generates brokerage fees, STT (Securities Transaction Tax), and other charges that silently eat your profits. Research shows most active traders underperform simply holding a diversified index fund. Trade less, think more."
      },
      {
        q: "No exit strategy",
        a: "Many beginners plan their entry but have no plan for exiting. A proper trade has three scenarios defined beforehand: your profit target, your stop-loss level, and what would change your view. Without an exit strategy, emotions take over — and emotions usually lose."
      }
    ]
  },
  {
    id: "glossary",
    icon: Lightbulb,
    title: "Key Terms Glossary",
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
    content: [
      {
        q: "Bull Market vs Bear Market",
        a: "A bull market is a prolonged period of rising stock prices (typically 20%+ rise). A bear market is a prolonged decline (20%+ fall). In a bull market, optimism drives buying. In a bear market, pessimism drives selling. These cycles are normal and alternate over time."
      },
      {
        q: "Market Cap (Market Capitalisation)",
        a: "Market cap = Share price × Total number of shares. It represents the total market value of a company. Large-cap companies (₹20,000 cr+) are more stable. Mid-cap (₹5,000–20,000 cr) have more growth potential but more risk. Small-cap (below ₹5,000 cr) are the most volatile."
      },
      {
        q: "P/E Ratio (Price-to-Earnings)",
        a: "P/E = Share price ÷ Earnings per share. It tells you how much you're paying for each rupee of profit. A P/E of 20 means investors pay ₹20 for every ₹1 of annual profit. High P/E can mean expensive or high-growth expectations. Low P/E can mean undervalued or slow growth."
      },
      {
        q: "Dividend",
        a: "A dividend is a portion of a company's profits paid to shareholders. If a company declares a ₹5 dividend and you hold 100 shares, you receive ₹500. Dividend yield = Annual dividend ÷ Share price. Some investors focus on dividend stocks for regular passive income."
      },
      {
        q: "Derivative (Futures & Options)",
        a: "Derivatives are financial contracts whose value is derived from an underlying asset like a stock or index. Futures obligate you to buy/sell at a future date. Options give you the right (but not obligation) to buy/sell. These are complex instruments best suited for experienced traders — beginners should avoid them initially."
      }
    ]
  }
];

function AccordionItem({ item, isOpen, onToggle }) {
  return (
    <div className="border border-border/50 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full text-left px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
      >
        <span className="font-medium text-sm sm:text-base">{item.q}</span>
        {isOpen
          ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
          : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>
      {isOpen && (
        <div className="px-4 sm:px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border/30 pt-3">
          {item.a}
        </div>
      )}
    </div>
  );
}

function SectionCard({ section, openItems, onToggle }) {
  const Icon = section.icon;
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="glass rounded-xl sm:rounded-2xl overflow-hidden">
      {/* Section header */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center gap-3 sm:gap-4 p-4 sm:p-6 hover:bg-muted/20 transition-colors"
      >
        <div className={`p-2 sm:p-2.5 rounded-xl ${section.bg} shrink-0`}>
          <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${section.color}`} />
        </div>
        <h2 className="font-bold text-base sm:text-xl text-left flex-1">{section.title}</h2>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground hidden sm:block">
            {section.content.length} topics
          </span>
          {collapsed
            ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
            : <ChevronUp className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Section items */}
      {!collapsed && (
        <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-2 sm:space-y-3">
          {section.content.map((item, idx) => (
            <AccordionItem
              key={idx}
              item={item}
              isOpen={openItems.has(`${section.id}-${idx}`)}
              onToggle={() => onToggle(`${section.id}-${idx}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Learn() {
  const [openItems, setOpenItems] = useState(new Set());

  const toggleItem = (key) => {
    setOpenItems(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const stats = [
    { icon: Target,      label: "Topics covered",    value: "30+",   color: "text-primary" },
    { icon: Clock,       label: "Avg read time",      value: "15 min", color: "text-blue-500" },
    { icon: PieChart,    label: "Sections",           value: "6",     color: "text-purple-500" },
    { icon: Activity,    label: "Difficulty",         value: "Beginner", color: "text-green-500" },
  ];

  return (
    <div className="min-h-full p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">

        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold">Learn the Markets</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Everything you need to understand the Indian stock market, explained simply.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="glass rounded-xl p-3 sm:p-4 text-center">
              <Icon className={`w-5 h-5 ${color} mx-auto mb-1.5`} />
              <div className="font-bold text-base sm:text-lg">{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="glass rounded-xl p-4 border-l-4 border-yellow-500/60">
          <div className="flex gap-3 items-start">
            <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Educational content only.</span>{" "}
              Nothing here is financial advice. Always do your own research before investing. Past performance doesn&apos;t guarantee future results.
            </p>
          </div>
        </div>

        {/* Sections */}
        {SECTIONS.map((section) => (
          <SectionCard
            key={section.id}
            section={section}
            openItems={openItems}
            onToggle={toggleItem}
          />
        ))}

        {/* Bottom CTA */}
        <div className="glass rounded-xl sm:rounded-2xl p-5 sm:p-8 text-center space-y-3">
          <DollarSign className="w-10 h-10 text-primary mx-auto" />
          <h3 className="font-bold text-lg sm:text-xl">Ready to practice?</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Use the Paper Trading Simulator to practice buying and selling with virtual ₹1,00,000 — zero real risk.
          </p>
          <a
            href="/simulator"
            className="inline-block mt-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Open Simulator →
          </a>
        </div>

      </div>
    </div>
  );
}
