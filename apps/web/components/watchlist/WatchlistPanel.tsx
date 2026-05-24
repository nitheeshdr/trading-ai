"use client";

import { useWatchlists } from "@/hooks/useWatchlist";
import { WatchlistItem } from "./WatchlistItem";
import { AddSymbolDialog } from "./AddSymbolDialog";
import { useWatchlistStore } from "@/store/useWatchlistStore";

interface Props { expanded?: boolean }

export function WatchlistPanel({ expanded = false }: Props) {
  const { data: watchlists, isLoading } = useWatchlists();
  const { activeWatchlistId, setActiveWatchlist } = useWatchlistStore();

  const active = watchlists?.find((w: { id: string }) => w.id === activeWatchlistId) ?? watchlists?.[0];

  if (isLoading) return <div className="p-4 text-muted-foreground text-sm animate-pulse">Loading watchlist…</div>;

  return (
    <div className="rounded-lg border bg-card flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="font-semibold text-sm">{active?.name ?? "Watchlist"}</h3>
        {active && <AddSymbolDialog watchlistId={active.id} />}
      </div>
      <div className="flex-1 overflow-y-auto divide-y">
        {active?.symbols?.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-8">No symbols yet. Add one above.</p>
        )}
        {active?.symbols?.map((symbol: string) => (
          <WatchlistItem key={symbol} symbol={symbol} watchlistId={active.id} />
        ))}
      </div>
    </div>
  );
}
