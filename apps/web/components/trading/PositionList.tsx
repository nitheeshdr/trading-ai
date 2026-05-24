"use client";

import { usePortfolio } from "@/hooks/usePortfolio";
import { useMarketStore } from "@/store/useMarketStore";
import { formatCurrency, colorForChange } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils/cn";
import type { TradeMode } from "@/types/trade";

interface Props { mode: TradeMode }

export function PositionList({ mode }: Props) {
  const { data: holdings } = usePortfolio();
  const ticks = useMarketStore((s) => s.ticks);

  const filtered = holdings?.filter((h) => (h as { mode?: TradeMode }).mode === mode) ?? [];

  if (!filtered.length) return <div className="text-muted-foreground text-sm">No open positions.</div>;

  return (
    <div className="space-y-2">
      {filtered.map((h) => {
        const ltp = ticks[h.symbol]?.ltp ?? h.ltp;
        const pnl = (ltp - h.avg_price) * h.quantity;
        return (
          <div key={h.symbol} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
            <div>
              <p className="font-semibold text-sm">{h.symbol}</p>
              <p className="text-xs text-muted-foreground">Qty: {h.quantity} · Avg: {formatCurrency(h.avg_price)}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-sm">{formatCurrency(ltp)}</p>
              <p className={cn("text-xs font-mono", colorForChange(pnl))}>{formatCurrency(pnl)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
