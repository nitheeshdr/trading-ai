"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useMarketStore } from "@/store/useMarketStore";
import { useRemoveSymbol } from "@/hooks/useWatchlist";
import { formatCurrency, colorForChange } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils/cn";

interface Props {
  symbol: string;
  watchlistId: string;
}

export function WatchlistItem({ symbol, watchlistId }: Props) {
  const tick = useMarketStore((s) => s.ticks[symbol]);
  const remove = useRemoveSymbol();

  return (
    <div className="flex items-center justify-between px-4 py-3 hover:bg-accent/50 group">
      <Link href={`/chart/${symbol}`} className="flex-1">
        <p className="text-sm font-medium">{symbol}</p>
        {tick ? (
          <p className={cn("text-xs font-mono", colorForChange(tick.change))}>
            {formatCurrency(tick.ltp)} &nbsp;
            <span className="text-muted-foreground">({tick.changePct >= 0 ? "+" : ""}{tick.changePct.toFixed(2)}%)</span>
          </p>
        ) : (
          <p className="text-xs text-muted-foreground animate-pulse">—</p>
        )}
      </Link>
      <button
        onClick={() => remove.mutate({ id: watchlistId, symbol })}
        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
