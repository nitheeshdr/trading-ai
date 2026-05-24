"use client";

import { useStrategies, useToggleStrategy } from "@/hooks/useAutoTrade";
import { StrategyCard } from "./StrategyCard";

interface Props { id: string }

export function StrategyDetail({ id }: Props) {
  const { data: strategies } = useStrategies();
  const strategy = strategies?.find((s) => s.id === id);

  if (!strategy) return <div className="text-muted-foreground text-sm animate-pulse">Loading strategy…</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{strategy.name}</h1>
      <StrategyCard strategy={strategy} />
      <div className="rounded-lg border bg-card p-4 grid grid-cols-2 gap-4 text-sm">
        <div><p className="text-muted-foreground">Entry Signal</p><p className="font-medium">{strategy.entry_signal}</p></div>
        <div><p className="text-muted-foreground">Min Confidence</p><p className="font-medium">{(strategy.min_confidence * 100).toFixed(0)}%</p></div>
        <div><p className="text-muted-foreground">Max Hold</p><p className="font-medium">{strategy.max_hold_minutes} min</p></div>
        <div><p className="text-muted-foreground">Max Daily Trades</p><p className="font-medium">{strategy.max_daily_trades}</p></div>
        <div><p className="text-muted-foreground">Max Daily Loss</p><p className="font-medium text-bear">{strategy.max_daily_loss_pct}%</p></div>
        <div><p className="text-muted-foreground">Trailing Stop</p><p className="font-medium">{strategy.trailing_stop ? `Yes (${strategy.trailing_stop_pct}%)` : "No"}</p></div>
      </div>
    </div>
  );
}
