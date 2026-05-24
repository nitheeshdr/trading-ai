"use client";

import Link from "next/link";
import { useAISignals } from "@/hooks/useAISignals";
import { SignalBadge } from "./SignalBadge";
import { useMarketStore } from "@/store/useMarketStore";
import { formatCurrency, formatChangePct } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils/cn";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Props {
  symbol: string;
  /** Compact variant — smaller card for the 4-stock grid */
  compact?: boolean;
}

export function SignalCard({ symbol, compact = false }: Props) {
  const { data: signals } = useAISignals(symbol);
  const tick = useMarketStore((s) => s.ticks[symbol]);
  const latest = signals?.[0];

  const isUp = (tick?.changePct ?? 0) >= 0;

  if (compact) {
    return (
      <Link
        href={`/chart/${encodeURIComponent(symbol)}`}
        className="block rounded-lg border bg-card p-3 hover:bg-accent/30 transition-colors"
      >
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-xs text-muted-foreground">{symbol}</span>
          {isUp
            ? <TrendingUp size={12} className="text-green-500" />
            : <TrendingDown size={12} className="text-red-500" />}
        </div>
        {tick ? (
          <>
            <p className="text-sm font-mono font-bold">{formatCurrency(tick.ltp)}</p>
            <p className={cn("text-[11px] font-medium", isUp ? "text-green-500" : "text-red-500")}>
              {formatChangePct(tick.changePct)}
            </p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground animate-pulse">Loading…</p>
        )}
      </Link>
    );
  }

  return (
    <Link
      href={`/chart/${encodeURIComponent(symbol)}`}
      className="block rounded-lg border bg-card p-4 hover:bg-accent/30 transition-colors"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-sm">{symbol}</span>
        <SignalBadge symbol={symbol} />
      </div>

      {tick ? (
        <div>
          <p className="text-2xl font-mono font-bold">{formatCurrency(tick.ltp)}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn("text-sm font-medium flex items-center gap-1", isUp ? "text-green-500" : "text-red-500")}>
              {isUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {formatChangePct(tick.changePct)}
            </span>
            <span className="text-xs text-muted-foreground">
              ({tick.change >= 0 ? "+" : ""}{tick.change.toFixed(2)})
            </span>
          </div>
          <div className="flex gap-3 mt-2 text-[11px] text-muted-foreground">
            <span>H: {formatCurrency(tick.high)}</span>
            <span>L: {formatCurrency(tick.low)}</span>
            <span>Vol: {(tick.volume / 1e6).toFixed(1)}M</span>
          </div>
        </div>
      ) : (
        <div className="h-12 animate-pulse bg-muted rounded mt-2" />
      )}

      {latest && (
        <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
          AI: {latest.model_type} · {latest.signal ?? "—"}
        </p>
      )}
    </Link>
  );
}
