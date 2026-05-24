import type { Metadata } from "next";
import { PaperTradePanel } from "@/components/trading/PaperTradePanel";
import { PositionList } from "@/components/trading/PositionList";

export const metadata: Metadata = { title: "Paper Trading" };

export default function PaperTradingPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <h1 className="text-2xl font-bold mb-6">Paper Trading</h1>
        <PaperTradePanel />
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-6">Open Positions</h2>
        <PositionList mode="paper" />
      </div>
    </div>
  );
}
