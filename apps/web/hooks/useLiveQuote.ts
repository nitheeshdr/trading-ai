"use client";

/**
 * useLiveQuote(symbols)
 * ---------------------
 * Polls /api/market/quote every 15 seconds and syncs results into
 * the Zustand market store so any component using useMarketStore(ticks)
 * gets live prices even without a socket server running.
 */

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMarketStore } from "@/store/useMarketStore";
import type { Tick } from "@/types/market";

interface QuoteResult {
  symbol:    string;
  ltp:       number;
  open:      number;
  high:      number;
  low:       number;
  prevClose: number;
  change:    number;
  changePct: number;
  volume:    number;
  timestamp: number;
}

async function fetchQuotes(symbols: string[]): Promise<QuoteResult[]> {
  if (!symbols.length) return [];
  const resp = await fetch(`/api/market/quote?symbols=${symbols.map(encodeURIComponent).join(",")}`);
  if (!resp.ok) throw new Error("quote fetch failed");
  return resp.json();
}

export function useLiveQuotes(symbols: string[]) {
  const setTick = useMarketStore((s) => s.setTick);
  const key = symbols.join(",");

  const query = useQuery({
    queryKey: ["live-quotes", key],
    queryFn: () => fetchQuotes(symbols),
    refetchInterval: 15_000,   // every 15 s
    enabled: symbols.length > 0,
    staleTime: 10_000,
  });

  // Sync fetched prices into Zustand market store
  useEffect(() => {
    if (!query.data) return;
    query.data.forEach((q) => {
      if (q.ltp <= 0) return;
      const tick: Tick = {
        symbol:    q.symbol,
        ltp:       q.ltp,
        open:      q.open,
        high:      q.high,
        low:       q.low,
        close:     q.prevClose,
        change:    q.change,
        changePct: q.changePct,
        volume:    q.volume,
        timestamp: q.timestamp,
      };
      setTick(q.symbol, tick);
    });
  }, [query.data, setTick]);

  return query;
}
