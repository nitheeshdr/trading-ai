/**
 * tradingview/datafeed.ts
 * -----------------------
 * UDF-compatible datafeed that connects TradingView Charting Library
 * to your own historical OHLCV API and real-time Socket.IO ticks.
 *
 * TradingView calls these methods in order:
 *   onReady → searchSymbols → resolveSymbol → getBars → subscribeBars
 */

import type {
  IBasicDataFeed,
  OnReadyCallback,
  SearchSymbolsCallback,
  ResolveCallback,
  ErrorCallback,
  HistoryCallback,
  SubscribeBarsCallback,
  LibrarySymbolInfo,
  ResolutionString,
  Bar,
} from "./charting_library";

// NSE / BSE session: Mon-Fri 09:15-15:30 IST (UTC+5:30)
const NSE_SESSION = "0915-1530";
const NSE_TIMEZONE = "Asia/Kolkata";

// Resolution → minutes map
const RESOLUTION_TO_MINUTES: Record<string, number> = {
  "1": 1, "3": 3, "5": 5, "15": 15, "30": 30,
  "60": 60, "120": 120, "240": 240,
  "D": 1440, "W": 10080, "M": 43200,
};

interface SubscriptionRecord {
  listenerGuid: string;
  symbolInfo: LibrarySymbolInfo;
  resolution: ResolutionString;
  callback: SubscribeBarsCallback;
  lastBar: Bar | null;
}

// ─── Datafeed class ─────────────────────────────────────────────────────────

export class TradeViewDatafeed implements IBasicDataFeed {
  private subscriptions: Map<string, SubscriptionRecord> = new Map();
  private onTick: ((symbol: string, callback: SubscribeBarsCallback, lastBar: Bar | null) => void) | null = null;

  /** Wire up live tick handler (called from the React component with socket) */
  setTickHandler(
    handler: (symbol: string, callback: SubscribeBarsCallback, lastBar: Bar | null) => void
  ) {
    this.onTick = handler;
  }

  // ── onReady ─────────────────────────────────────────────────────────────────
  onReady(callback: OnReadyCallback): void {
    setTimeout(() =>
      callback({
        supported_resolutions: ["1", "3", "5", "15", "30", "60", "120", "240", "D", "W"],
        exchanges: [
          { value: "NSE", name: "NSE", desc: "National Stock Exchange India" },
          { value: "BSE", name: "BSE", desc: "Bombay Stock Exchange India" },
        ],
        symbols_types: [
          { name: "Stock", value: "stock" },
          { name: "Index", value: "index" },
        ],
        supports_marks: true,
        supports_time: true,
      })
    );
  }

  // ── searchSymbols ────────────────────────────────────────────────────────────
  searchSymbols(
    userInput: string,
    _exchange: string,
    _symbolType: string,
    onResult: SearchSymbolsCallback
  ): void {
    // Delegate to your symbol search API
    fetch(`/api/symbols/search?q=${encodeURIComponent(userInput)}&limit=20`)
      .then((r) => (r.ok ? r.json() : []))
      .then((results: Array<{ symbol: string; name: string; exchange: string; type: string }>) => {
        onResult(
          results.map((r) => ({
            symbol: r.symbol,
            full_name: `${r.exchange}:${r.symbol}`,
            description: r.name,
            exchange: r.exchange,
            type: r.type ?? "stock",
          }))
        );
      })
      .catch(() => onResult([]));
  }

  // ── resolveSymbol ────────────────────────────────────────────────────────────
  resolveSymbol(
    symbolName: string,
    onResolve: ResolveCallback,
    onError: ErrorCallback
  ): void {
    // symbolName might be "NSE:INFY" or just "INFY"
    const [exchange, sym] = symbolName.includes(":")
      ? symbolName.split(":")
      : ["NSE", symbolName];

    const symbolInfo: LibrarySymbolInfo = {
      name: sym.toUpperCase(),
      full_name: `${exchange}:${sym.toUpperCase()}`,
      description: sym.toUpperCase(),
      type: "stock",
      session: NSE_SESSION,
      timezone: NSE_TIMEZONE,
      exchange: exchange ?? "NSE",
      minmov: 1,
      pricescale: 100,          // 2 decimal places
      has_intraday: true,
      has_daily: true,
      has_weekly_and_monthly: true,
      supported_resolutions: ["1", "3", "5", "15", "30", "60", "120", "240", "D", "W"],
      volume_precision: 0,
      data_status: "streaming",
      currency_code: "INR",
    };

    // Validate the symbol exists via API
    fetch(`/api/symbols/resolve?symbol=${encodeURIComponent(sym)}&exchange=${exchange}`)
      .then((r) => (r.ok ? onResolve(symbolInfo) : onError(`Symbol ${sym} not found`)))
      .catch(() => {
        // Fall back to resolving optimistically (works for known symbols)
        onResolve(symbolInfo);
      });
  }

  // ── getBars ──────────────────────────────────────────────────────────────────
  getBars(
    symbolInfo: LibrarySymbolInfo,
    resolution: ResolutionString,
    periodParams: { from: number; to: number; firstDataRequest: boolean; countBack?: number },
    onResult: HistoryCallback,
    onError: ErrorCallback
  ): void {
    const { from, to } = periodParams;
    const interval = RESOLUTION_TO_MINUTES[resolution] ?? 5;

    fetch(
      `/api/market/history` +
      `?symbol=${encodeURIComponent(symbolInfo.name)}` +
      `&exchange=${encodeURIComponent(symbolInfo.exchange)}` +
      `&resolution=${resolution}` +
      `&interval=${interval}` +
      `&from=${from}` +
      `&to=${to}`
    )
      .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then(
        (data: { bars: Array<{ t: number; o: number; h: number; l: number; c: number; v: number }> }) => {
          if (!data.bars?.length) {
            onResult([], { noData: true });
            return;
          }
          const bars: Bar[] = data.bars.map((b) => ({
            time: b.t * 1000,   // seconds → milliseconds
            open: b.o,
            high: b.h,
            low: b.l,
            close: b.c,
            volume: b.v,
          }));
          onResult(bars, { noData: false });
        }
      )
      .catch((err) => onError(String(err)));
  }

  // ── subscribeBars ────────────────────────────────────────────────────────────
  subscribeBars(
    symbolInfo: LibrarySymbolInfo,
    resolution: ResolutionString,
    onTick: SubscribeBarsCallback,
    listenerGuid: string,
    _onResetCache: () => void
  ): void {
    const record: SubscriptionRecord = {
      listenerGuid,
      symbolInfo,
      resolution,
      callback: onTick,
      lastBar: null,
    };
    this.subscriptions.set(listenerGuid, record);

    // Wire socket tick → bar update
    if (this.onTick) {
      this.onTick(symbolInfo.name, onTick, null);
    }
  }

  unsubscribeBars(listenerGuid: string): void {
    this.subscriptions.delete(listenerGuid);
  }

  /** Called by socket when a new tick arrives — updates the current bar */
  handleTick(symbol: string, price: number, volume: number, timestamp: number): void {
    for (const record of this.subscriptions.values()) {
      if (record.symbolInfo.name !== symbol) continue;

      const resolution = record.resolution;
      const minuteMs = (RESOLUTION_TO_MINUTES[resolution] ?? 1) * 60 * 1000;
      const barTime = Math.floor(timestamp / minuteMs) * minuteMs;

      if (!record.lastBar || barTime > record.lastBar.time) {
        // New bar
        record.lastBar = {
          time: barTime,
          open: price,
          high: price,
          low: price,
          close: price,
          volume: volume,
        };
      } else {
        // Update current bar
        record.lastBar.high = Math.max(record.lastBar.high, price);
        record.lastBar.low = Math.min(record.lastBar.low, price);
        record.lastBar.close = price;
        record.lastBar.volume = (record.lastBar.volume ?? 0) + volume;
      }

      record.callback({ ...record.lastBar });
    }
  }
}

// Singleton datafeed shared across chart instances
export const datafeed = new TradeViewDatafeed();
