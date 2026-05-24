"use client";

import { useAISignals } from "@/hooks/useAISignals";
import { SignalBadge } from "@/components/ai/SignalBadge";

interface Props { symbol: string }

export function AIOverlay({ symbol }: Props) {
  const { data: signals } = useAISignals(symbol);
  const latest = signals?.[0];

  if (!latest) return null;

  return (
    <div className="absolute top-3 right-3 z-10">
      <SignalBadge symbol={symbol} />
    </div>
  );
}
