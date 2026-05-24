import type { Metadata } from "next";
import { StrategyList } from "@/components/auto-trade/StrategyList";
import { RiskGuardStatus } from "@/components/auto-trade/RiskGuardStatus";

export const metadata: Metadata = { title: "Auto-Trade" };

export default function AutoTradePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Auto-Trade</h1>
        <RiskGuardStatus />
      </div>
      <StrategyList />
    </div>
  );
}
