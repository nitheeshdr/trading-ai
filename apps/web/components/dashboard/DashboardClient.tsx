"use client";

/**
 * DashboardClient
 * ---------------
 * Polls live prices for key indices / watchlist symbols and wires them
 * into the Zustand market store so every component (SignalCard, WatchlistItem,
 * PortfolioSummary) receives real-time data without a socket server.
 */

import { useLiveQuotes } from "@/hooks/useLiveQuote";
import { PortfolioSummary } from "@/components/portfolio/PortfolioSummary";
import { WatchlistPanel } from "@/components/watchlist/WatchlistPanel";
import { SignalCard } from "@/components/ai/SignalCard";

// Default symbols to keep live on the dashboard
const DASHBOARD_SYMBOLS = [
  "NIFTY 50",
  "BANKNIFTY",
  "NIFTY IT",
  "RELIANCE",
  "TCS",
  "HDFCBANK",
  "INFY",
  "ICICIBANK",
];

export function DashboardClient() {
  // Keeps Zustand market store populated with real live prices
  useLiveQuotes(DASHBOARD_SYMBOLS);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Left: Portfolio summary + AI signals */}
      <div className="lg:col-span-2 space-y-6">
        <PortfolioSummary />

        {/* Index signal cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SignalCard symbol="NIFTY 50" />
          <SignalCard symbol="BANKNIFTY" />
        </div>

        {/* Top stock signal cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {["RELIANCE", "TCS", "HDFCBANK", "INFY"].map((sym) => (
            <SignalCard key={sym} symbol={sym} compact />
          ))}
        </div>
      </div>

      {/* Right: Watchlist */}
      <div className="lg:col-span-1">
        <WatchlistPanel />
      </div>
    </div>
  );
}
