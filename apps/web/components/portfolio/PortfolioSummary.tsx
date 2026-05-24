"use client";

import { usePortfolio } from "@/hooks/usePortfolio";
import { useMarketStore } from "@/store/useMarketStore";
import { formatCurrency, formatChangePct, colorForChange } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils/cn";

export function PortfolioSummary() {
  const { data: holdings, isLoading } = usePortfolio();
  const ticks = useMarketStore((s) => s.ticks);

  if (isLoading) return <div className="rounded-lg border bg-card p-4 animate-pulse h-32" />;

  const totalValue = holdings?.reduce((sum, h) => {
    const ltp = ticks[h.symbol]?.ltp ?? h.ltp;
    return sum + ltp * h.quantity;
  }, 0) ?? 0;

  const totalPnl = holdings?.reduce((sum, h) => {
    const ltp = ticks[h.symbol]?.ltp ?? h.ltp;
    return sum + (ltp - h.avg_price) * h.quantity;
  }, 0) ?? 0;

  return (
    <div className="rounded-lg border bg-card p-5">
      <h2 className="text-sm text-muted-foreground mb-3">Portfolio Value</h2>
      <p className="text-3xl font-bold font-mono">{formatCurrency(totalValue)}</p>
      <p className={cn("text-sm mt-1", colorForChange(totalPnl))}>
        P&amp;L: {formatCurrency(totalPnl)}
      </p>
    </div>
  );
}
