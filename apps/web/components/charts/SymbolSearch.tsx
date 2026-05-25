"use client";

/**
 * SymbolSearch
 * ------------
 * Search bar + top-stocks list for the chart page left panel.
 * Clicking a symbol navigates to /chart/{symbol}.
 */

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, TrendingUp, TrendingDown, X } from "lucide-react";
import { useMarketStore } from "@/store/useMarketStore";
import { useLiveQuotes } from "@/hooks/useLiveQuote";
import { formatCurrency, formatChangePct } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils/cn";

// ── Default top stocks list ───────────────────────────────────────────────────

const TOP_SYMBOLS = [
  { symbol: "NIFTY 50",   name: "Nifty 50 Index",            type: "index" },
  { symbol: "BANKNIFTY",  name: "Nifty Bank Index",           type: "index" },
  { symbol: "NIFTY IT",   name: "Nifty IT Index",             type: "index" },
  { symbol: "SENSEX",     name: "BSE Sensex",                 type: "index" },
  { symbol: "RELIANCE",   name: "Reliance Industries",        type: "stock" },
  { symbol: "TCS",        name: "Tata Consultancy Services",  type: "stock" },
  { symbol: "HDFCBANK",   name: "HDFC Bank",                  type: "stock" },
  { symbol: "INFY",       name: "Infosys",                    type: "stock" },
  { symbol: "ICICIBANK",  name: "ICICI Bank",                 type: "stock" },
  { symbol: "SBIN",       name: "State Bank of India",        type: "stock" },
  { symbol: "BHARTIARTL", name: "Bharti Airtel",              type: "stock" },
  { symbol: "HINDUNILVR", name: "Hindustan Unilever",         type: "stock" },
  { symbol: "BAJFINANCE", name: "Bajaj Finance",              type: "stock" },
  { symbol: "LT",         name: "Larsen & Toubro",            type: "stock" },
  { symbol: "KOTAKBANK",  name: "Kotak Mahindra Bank",        type: "stock" },
  { symbol: "AXISBANK",   name: "Axis Bank",                  type: "stock" },
  { symbol: "WIPRO",      name: "Wipro",                      type: "stock" },
  { symbol: "HCLTECH",    name: "HCL Technologies",           type: "stock" },
  { symbol: "MARUTI",     name: "Maruti Suzuki",              type: "stock" },
  { symbol: "TITAN",      name: "Titan Company",              type: "stock" },
];

interface SymbolRow {
  symbol: string;
  name:   string;
  type:   string;
}

interface Props {
  currentSymbol: string;
}

export function SymbolSearch({ currentSymbol }: Props) {
  const router  = useRouter();
  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState<SymbolRow[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const ticks    = useMarketStore((s) => s.ticks);

  // Keep top symbols populated with live prices
  useLiveQuotes(TOP_SYMBOLS.map((s) => s.symbol));

  // ── Search ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const q = query.trim().toUpperCase();
    if (!q) { setResults([]); return; }

    setSearching(true);
    fetch(`/api/symbols/search?q=${encodeURIComponent(q)}&limit=10`)
      .then((r) => r.json())
      .then((data: SymbolRow[]) => {
        setResults(data);
        setSearching(false);
      })
      .catch(() => setSearching(false));
  }, [query]);

  const displayList: SymbolRow[] = query.trim() ? results : TOP_SYMBOLS;

  function navigate(symbol: string) {
    router.push(`/chart/${encodeURIComponent(symbol)}`);
    setQuery("");
  }

  return (
    <div className="w-52 xl:w-60 shrink-0 flex flex-col h-full border-r bg-card max-md:hidden">
      {/* Search bar */}
      <div className="p-2 border-b">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-md border bg-background focus-within:ring-2 focus-within:ring-blue-500/50">
          <Search size={13} className="text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search symbol…"
            className="flex-1 text-xs bg-transparent outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground">
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b">
        {query ? (searching ? "Searching…" : `Results (${results.length})`) : "Top Markets"}
      </div>

      {/* Symbol list */}
      <div className="flex-1 overflow-y-auto">
        {displayList.length === 0 && query && !searching && (
          <p className="text-xs text-muted-foreground text-center py-6">No results for &ldquo;{query}&rdquo;</p>
        )}
        {displayList.map((row) => {
          const tick   = ticks[row.symbol];
          const isUp   = (tick?.changePct ?? 0) >= 0;
          const active = row.symbol === currentSymbol;

          return (
            <button
              key={row.symbol}
              onClick={() => navigate(row.symbol)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 text-left hover:bg-muted/50 transition-colors border-b border-border/40",
                active && "bg-blue-500/10 border-l-2 border-l-blue-500"
              )}
            >
              {/* Left: symbol + name */}
              <div className="min-w-0 mr-2">
                <p className={cn("text-xs font-semibold truncate", active && "text-blue-500")}>
                  {row.symbol}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">{row.name}</p>
              </div>

              {/* Right: price + change */}
              {tick && tick.ltp > 0 ? (
                <div className="text-right shrink-0">
                  <p className="text-xs font-mono font-semibold">{formatCurrency(tick.ltp)}</p>
                  <p className={cn("text-[10px] font-medium flex items-center justify-end gap-0.5", isUp ? "text-green-500" : "text-red-500")}>
                    {isUp ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                    {formatChangePct(tick.changePct)}
                  </p>
                </div>
              ) : (
                <div className="h-7 w-14 animate-pulse rounded bg-muted shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
