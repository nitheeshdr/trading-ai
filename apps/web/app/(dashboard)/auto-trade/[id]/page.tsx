import type { Metadata } from "next";
import { StrategyDetail } from "@/components/auto-trade/StrategyDetail";
import { ExecutionFeed } from "@/components/auto-trade/ExecutionFeed";

export const metadata: Metadata = { title: "Strategy Detail" };

export default function StrategyDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6">
      <StrategyDetail id={params.id} />
      <h2 className="text-xl font-semibold">Execution History</h2>
      <ExecutionFeed strategyId={params.id} />
    </div>
  );
}
