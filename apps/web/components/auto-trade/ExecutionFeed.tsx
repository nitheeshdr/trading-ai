"use client";

import { useExecutions } from "@/hooks/useAutoTrade";
import { PLBadge } from "./PLBadge";
import { format } from "date-fns";
import type { AutoTradeExecution } from "@/types/trade";

interface Props { strategyId?: string }

export function ExecutionFeed({ strategyId }: Props) {
  const { data: executions, isLoading } = useExecutions(strategyId);

  if (isLoading) return <div className="text-muted-foreground text-sm animate-pulse">Loading executions…</div>;
  if (!executions?.length) return <div className="text-muted-foreground text-sm">No executions yet.</div>;

  return (
    <div className="space-y-2">
      {executions.map((e: AutoTradeExecution) => (
        <div key={e.id} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{e.symbol}</span>
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${e.side === "BUY" ? "bg-bull/20 text-bull" : "bg-bear/20 text-bear"}`}>{e.side}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground`}>{e.status}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {format(new Date(e.entered_at), "dd MMM HH:mm")}
              {e.exit_reason && ` · ${e.exit_reason.replace(/_/g, " ")}`}
            </p>
          </div>
          <div className="text-right">
            {e.profit_loss != null && <PLBadge value={e.profit_loss} pct={e.profit_loss_pct} />}
            {e.ai_signal_confidence && <p className="text-xs text-muted-foreground mt-0.5">AI: {(e.ai_signal_confidence * 100).toFixed(0)}%</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
