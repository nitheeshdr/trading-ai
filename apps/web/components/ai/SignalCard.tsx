"use client";

import Link from "next/link";
import { useAISignals } from "@/hooks/useAISignals";
import { SignalBadge } from "./SignalBadge";
import { useMarketStore } from "@/store/useMarketStore";
import { formatCurrency, formatChangePct } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils/cn";

interface Props { symbol: string }

export function SignalCard({ symbol }: Props) {
  const { data: signals } = useAISignals(symbol);
  const tick = useMarketStore((s) => s.ticks[symbol]);
  const latest = signals?.[0];

  return (
    <Link href={`/chart/${symbol}`} className="block rounded-lg border bg-card p-4 hover:bg-accent/30 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-sm">{symbol}</span>
        <SignalBadge symbol={symbol} />
      </div>
      {tick && (
        <div>
          <p className="text-lg font-mono font-bold">{formatCurrency(tick.ltp)}</p>
          <p className={cn("text-xs", tick.change >= 0 ? "text-bull" : "text-bear")}>
            {formatChangePct(tick.changePct)}
          </p>
        </div>
      )}
      {latest && (
        <p className="text-xs text-muted-foreground mt-2">
          {latest.model_type} · {latest.timeframe ?? "—"}
        </p>
      )}
    </Link>
  );
}
