/**
 * GET /api/market/history
 *
 * Returns OHLCV bars for a symbol / resolution / time-range.
 * Data source: Yahoo Finance (free, no API key).
 *
 * Query params:
 *   symbol     NSE ticker (e.g. INFY) or index name (e.g. "NIFTY 50")
 *   exchange   NSE | BSE (informational)
 *   resolution TradingView resolution string (1, 5, 15, 30, 60, D, W)
 *   from       Unix timestamp seconds — range start
 *   to         Unix timestamp seconds — range end
 *
 * Response:  { bars: [{ t, o, h, l, c, v }] }   (t in seconds)
 */

import { NextRequest, NextResponse } from "next/server";

// ── Symbol mapping ────────────────────────────────────────────────────────────
const NSE_TO_YAHOO: Record<string, string> = {
  "NIFTY 50":   "^NSEI",
  "BANKNIFTY":  "^NSEBANK",
  "NIFTY IT":   "^CNXIT",
  "NIFTY FMCG": "^CNXFMCG",
  "SENSEX":     "^BSESN",
};

function toYahoo(symbol: string): string {
  return NSE_TO_YAHOO[symbol] ?? `${symbol}.NS`;
}

// ── Resolution mapping ────────────────────────────────────────────────────────
const TV_TO_YAHOO_INTERVAL: Record<string, string> = {
  "1": "1m", "3": "2m", "5": "5m", "15": "15m", "30": "30m",
  "60": "60m", "120": "60m", "240": "60m",
  "D": "1d", "W": "1wk", "M": "1mo",
};

// Max lookback Yahoo Finance allows per interval
const MAX_RANGE_DAYS: Record<string, number> = {
  "1m": 7, "2m": 60, "5m": 60, "15m": 60, "30m": 60,
  "60m": 730, "1d": 3650, "1wk": 3650, "1mo": 3650,
};

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const symbol     = (searchParams.get("symbol")     ?? "INFY").trim().toUpperCase();
  const resolution =  searchParams.get("resolution") ?? "5";
  let   from       = parseInt(searchParams.get("from") ?? "0", 10);
  const to         = parseInt(searchParams.get("to")   ?? String(Math.floor(Date.now() / 1000)), 10);

  const yahooInterval = TV_TO_YAHOO_INTERVAL[resolution] ?? "5m";
  const maxDays       = MAX_RANGE_DAYS[yahooInterval] ?? 60;

  // Clamp `from` to Yahoo's max lookback
  const minFrom = to - maxDays * 86400;
  if (from < minFrom) from = minFrom;

  const yahooSymbol = toYahoo(symbol);
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/` +
    `${encodeURIComponent(yahooSymbol)}` +
    `?interval=${yahooInterval}&period1=${from}&period2=${to}` +
    `&includePrePost=false`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "application/json",
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return NextResponse.json({ bars: [], error: `Yahoo ${res.status}` }, { status: 200 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json();
    const result = data?.chart?.result?.[0];

    if (!result) {
      return NextResponse.json({ bars: [] });
    }

    const timestamps: number[]  = result.timestamp ?? [];
    const quote = result.indicators?.quote?.[0] ?? {};
    const opens:   (number | null)[] = quote.open   ?? [];
    const highs:   (number | null)[] = quote.high   ?? [];
    const lows:    (number | null)[] = quote.low    ?? [];
    const closes:  (number | null)[] = quote.close  ?? [];
    const volumes: (number | null)[] = quote.volume ?? [];

    const bars = timestamps
      .map((t, i) => ({
        t, o: opens[i], h: highs[i], l: lows[i], c: closes[i], v: volumes[i] ?? 0,
      }))
      .filter(b => b.o !== null && b.h !== null && b.l !== null && b.c !== null)
      .map(b => ({
        t: b.t,
        o: +( b.o as number).toFixed(2),
        h: +( b.h as number).toFixed(2),
        l: +( b.l as number).toFixed(2),
        c: +( b.c as number).toFixed(2),
        v: b.v as number,
      }));

    return NextResponse.json({ bars }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("[market/history] Yahoo Finance error:", err);
    return NextResponse.json({ bars: [], error: String(err) }, { status: 200 });
  }
}
