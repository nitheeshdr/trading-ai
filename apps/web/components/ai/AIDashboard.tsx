"use client";

import { useAISignals } from "@/hooks/useAISignals";

export function AIDashboard() {
  const { data: signals } = useAISignals();

  const stats = signals?.reduce((acc, s) => {
    acc[s.model_type] = (acc[s.model_type] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const buys  = signals?.filter((s) => s.signal === "BUY").length ?? 0;
  const sells = signals?.filter((s) => s.signal === "SELL").length ?? 0;
  const holds = signals?.filter((s) => s.signal === "HOLD").length ?? 0;
  const avgConf = signals?.length ? (signals.reduce((a, s) => a + s.confidence, 0) / signals.length * 100).toFixed(1) : "—";

  return (
    <div className="space-y-6">
      {/* Signal distribution */}
      <div className="grid grid-cols-3 gap-4">
        {[{ label: "BUY", value: buys, color: "text-bull" }, { label: "SELL", value: sells, color: "text-bear" }, { label: "HOLD", value: holds, color: "text-hold" }].map(({ label, value, color }) => (
          <div key={label} className="rounded-lg border bg-card p-4 text-center">
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Avg confidence */}
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm text-muted-foreground">Average Confidence</p>
        <p className="text-2xl font-bold mt-1">{avgConf}%</p>
      </div>

      {/* Model breakdown */}
      {stats && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="text-sm font-semibold mb-3">Signals by Model</h3>
          <div className="space-y-2">
            {Object.entries(stats).map(([model, count]) => (
              <div key={model} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground capitalize">{model}</span>
                <span className="font-mono font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
