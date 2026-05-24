"use client";

import Link from "next/link";
import { useToggleStrategy } from "@/hooks/useAutoTrade";
import type { AutoTradeStrategy } from "@/types/trade";
import { cn } from "@/lib/utils/cn";

interface Props { strategy: AutoTradeStrategy }

export function StrategyCard({ strategy }: Props) {
  const toggle = useToggleStrategy();

  return (
    <div className={cn("rounded-lg border bg-card p-4", strategy.enabled && "border-bull/50")}>
      <div className="flex items-start justify-between">
        <div>
          <Link href={`/auto-trade/${strategy.id}`} className="font-semibold text-sm hover:underline">{strategy.name}</Link>
          <p className="text-xs text-muted-foreground mt-0.5">{strategy.symbol} · {strategy.mode.toUpperCase()}</p>
        </div>
        {/* Toggle switch */}
        <button
          onClick={() => toggle.mutate(strategy.id)}
          disabled={toggle.isPending}
          className={cn(
            "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none",
            strategy.enabled ? "bg-bull" : "bg-muted-foreground/30"
          )}
        >
          <span className={cn("inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
            strategy.enabled ? "translate-x-4.5" : "translate-x-0.5"
          )} />
        </button>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div className="text-center rounded bg-bull/10 text-bull px-2 py-1">
          <p className="font-bold">{strategy.profit_target_pct}%</p>
          <p className="text-bull/70">Target</p>
        </div>
        <div className="text-center rounded bg-bear/10 text-bear px-2 py-1">
          <p className="font-bold">{strategy.stop_loss_pct}%</p>
          <p className="text-bear/70">Stop</p>
        </div>
        <div className="text-center rounded bg-muted px-2 py-1">
          <p className="font-bold">{strategy.quantity}</p>
          <p className="text-muted-foreground">Qty</p>
        </div>
      </div>
    </div>
  );
}
