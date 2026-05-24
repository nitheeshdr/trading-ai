import type { Metadata } from "next";
import { WatchlistPanel } from "@/components/watchlist/WatchlistPanel";

export const metadata: Metadata = { title: "Watchlist" };

export default function WatchlistPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Watchlist</h1>
      <WatchlistPanel expanded />
    </div>
  );
}
