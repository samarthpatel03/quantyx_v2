import { RefreshCw, WifiOff } from "lucide-react";
import { useQuotes, isMarketOpen } from "@/hooks/useMarketData";

function StatusBadge({ hasData, loading, error }) {
  if (loading && !hasData) return (
    <span className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground px-2.5 py-1 glass rounded-full">
      <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Connecting…
    </span>
  );
  if (error && !hasData) return (
    <span className="flex items-center gap-1.5 text-[10px] font-mono text-destructive px-2.5 py-1 glass rounded-full">
      <WifiOff className="w-2.5 h-2.5" /> Offline
    </span>
  );
  const open = isMarketOpen();
  if (open) return (
    <span className="flex items-center gap-1.5 text-[10px] font-mono text-primary px-2.5 py-1 glass rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" /> Live · NSE
    </span>
  );
  const ist = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  const day = ist.getUTCDay();
  const label = (day === 0 || day === 6) ? "Weekend · last close" : "Market closed · last close";
  return (
    <span className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground px-2.5 py-1 glass rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" /> {label}
    </span>
  );
}

export default function MarketStatusBar() {
  const { data, isLoading, isError } = useQuotes();

  return (
    <header className="h-14 glass border-b border-border/50 flex items-center px-4 sm:px-6 gap-4 shrink-0" style={{ zIndex: 40 }}>
      {/* Branding */}
      <span className="text-lg font-bold text-gradient-mint tracking-tight shrink-0">
        Quantyx
      </span>
      <div className="w-px h-5 bg-border/60 shrink-0" />
      {/* Status badge — right side */}
      <div className="ml-auto shrink-0">
        <StatusBadge hasData={!!data?.length} loading={isLoading} error={isError} />
      </div>
    </header>
  );
}
