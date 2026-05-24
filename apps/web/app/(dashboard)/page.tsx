import type { Metadata } from "next";
import { PortfolioSummary } from "@/components/portfolio/PortfolioSummary";
import { WatchlistPanel } from "@/components/watchlist/WatchlistPanel";
import { SignalCard } from "@/components/ai/SignalCard";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Left: Portfolio summary + AI signals */}
      <div className="lg:col-span-2 space-y-6">
        <PortfolioSummary />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SignalCard symbol="NIFTY 50" />
          <SignalCard symbol="BANKNIFTY" />
        </div>
      </div>
      {/* Right: Watchlist */}
      <div className="lg:col-span-1">
        <WatchlistPanel />
      </div>
    </div>
  );
}
