"use client";

import Link from "next/link";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useMarketStore } from "@/store/useMarketStore";
import { formatCurrency, colorForChange } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils/cn";

export function HoldingsList() {
  const { data: holdings, isLoading } = usePortfolio();
  const ticks = useMarketStore((s) => s.ticks);

  if (isLoading) return <div className="animate-pulse text-muted-foreground text-sm">Loading holdings…</div>;
  if (!holdings?.length) return <div className="text-muted-foreground text-sm">No holdings. Connect broker or place paper trades.</div>;

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/50">
          <tr>
            <th className="text-left px-4 py-2 font-medium text-muted-foreground">Symbol</th>
            <th className="text-right px-4 py-2 font-medium text-muted-foreground">Qty</th>
            <th className="text-right px-4 py-2 font-medium text-muted-foreground">Avg</th>
            <th className="text-right px-4 py-2 font-medium text-muted-foreground">LTP</th>
            <th className="text-right px-4 py-2 font-medium text-muted-foreground">P&amp;L</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {holdings.map((h) => {
            const ltp = ticks[h.symbol]?.ltp ?? h.ltp;
            const pnl = (ltp - h.avg_price) * h.quantity;
            return (
              <tr key={h.symbol} className="hover:bg-accent/30">
                <td className="px-4 py-2">
                  <Link href={`/chart/${h.symbol}`} className="font-medium hover:underline">{h.symbol}</Link>
                </td>
                <td className="px-4 py-2 text-right font-mono">{h.quantity}</td>
                <td className="px-4 py-2 text-right font-mono">{formatCurrency(h.avg_price)}</td>
                <td className="px-4 py-2 text-right font-mono">{formatCurrency(ltp)}</td>
                <td className={cn("px-4 py-2 text-right font-mono", colorForChange(pnl))}>
                  {formatCurrency(pnl)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
