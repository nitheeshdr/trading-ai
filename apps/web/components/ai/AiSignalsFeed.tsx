"use client";

import { useAISignals } from "@/hooks/useAISignals";
import { SignalBadge } from "./SignalBadge";
import { formatCurrency } from "@/lib/utils/formatters";
import { format } from "date-fns";

export function AiSignalsFeed() {
  const { data: signals, isLoading } = useAISignals();

  if (isLoading) return <div className="text-muted-foreground text-sm animate-pulse">Loading signals…</div>;
  if (!signals?.length) return <div className="text-muted-foreground text-sm">No signals yet.</div>;

  return (
    <div className="space-y-2">
      {signals.map((s) => (
        <div key={s.id} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
          <div>
            <span className="font-semibold text-sm">{s.symbol}</span>
            <span className="ml-2 text-xs text-muted-foreground">{s.model_type}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{format(new Date(s.created_at), "HH:mm:ss")}</span>
            <SignalBadge symbol={s.symbol} />
          </div>
        </div>
      ))}
    </div>
  );
}
