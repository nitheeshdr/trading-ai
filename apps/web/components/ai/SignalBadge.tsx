"use client";

import { useAISignals } from "@/hooks/useAISignals";
import { cn } from "@/lib/utils/cn";

interface Props { symbol: string }

export function SignalBadge({ symbol }: Props) {
  const { data, isLoading } = useAISignals(symbol);
  const latest = data?.[0];

  if (isLoading || !latest) return null;

  const colors: Record<string, string> = {
    BUY:  "bg-bull/20 text-bull border-bull/30",
    SELL: "bg-bear/20 text-bear border-bear/30",
    HOLD: "bg-hold/20 text-hold border-hold/30",
  };

  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold", colors[latest.signal])}>
      {latest.signal}
      <span className="opacity-70">{(latest.confidence * 100).toFixed(0)}%</span>
    </span>
  );
}
