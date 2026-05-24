import type { Metadata } from "next";
import { StrategyDetail } from "@/components/auto-trade/StrategyDetail";
import { ExecutionFeed } from "@/components/auto-trade/ExecutionFeed";

export const metadata: Metadata = { title: "Strategy Detail" };

// Next.js 15: params is a Promise
export default async function StrategyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="space-y-6">
      <StrategyDetail id={id} />
      <h2 className="text-xl font-semibold">Execution History</h2>
      <ExecutionFeed strategyId={id} />
    </div>
  );
}
