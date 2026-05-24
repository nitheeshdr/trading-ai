/**
 * GET /api/market/quote?symbols=NIFTY+50,BANKNIFTY,INFY,TCS
 *
 * Returns live price, change, change%, volume for one or more NSE symbols.
 * Data source: Yahoo Finance (free, no API key required).
 *
 * NSE → Yahoo Finance ticker mapping:
 *   NIFTY 50  → ^NSEI
 *   BANKNIFTY → ^NSEBANK
 *   NIFTY IT  → ^CNXIT
 *   SENSEX    → ^BSESN
 *   Stocks    → {SYMBOL}.NS  (e.g. INFY → INFY.NS)
 */

import { NextRequest, NextResponse } from "next/server";

// ── Symbol mapping ────────────────────────────────────────────────────────────

const NSE_TO_YAHOO: Record<string, string> = {
  "NIFTY 50":   "^NSEI",
  "BANKNIFTY":  "^NSEBANK",
  "NIFTY IT":   "^CNXIT",
  "NIFTY FMCG": "^CNXFMCG",
  "NIFTY AUTO": "^CNXAUTO",
  "SENSEX":     "^BSESN",
};

function toYahoo(symbol: string): string {
  return NSE_TO_YAHOO[symbol] ?? `${symbol}.NS`;
}

// ── Fetch a single quote from Yahoo Finance ───────────────────────────────────

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
  error?:    string;
}

async function fetchQuote(symbol: string): Promise<QuoteResult> {
  const yahooSymbol = toYahoo(symbol);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1m&range=1d&includePrePost=false`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "application/json",
      },
      next: { revalidate: 15 },   // cache 15 s
    });

    if (!res.ok) throw new Error(`Yahoo returned ${res.status}`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json: any = await res.json();
    const meta = json?.chart?.result?.[0]?.meta ?? {};

    const ltp       = meta.regularMarketPrice     ?? 0;
    const prevClose = meta.chartPreviousClose      ?? meta.previousClose ?? 0;
    const open      = meta.regularMarketOpen       ?? ltp;
    const high      = meta.regularMarketDayHigh    ?? ltp;
    const low       = meta.regularMarketDayLow     ?? ltp;
    const volume    = meta.regularMarketVolume     ?? 0;
    const change    = ltp - prevClose;
    const changePct = prevClose ? (change / prevClose) * 100 : 0;

    return {
      symbol, ltp: +ltp.toFixed(2), open: +open.toFixed(2),
      high: +high.toFixed(2), low: +low.toFixed(2),
      prevClose: +prevClose.toFixed(2),
      change: +change.toFixed(2), changePct: +changePct.toFixed(2),
      volume, timestamp: Date.now(),
    };
  } catch (err) {
    return {
      symbol, ltp: 0, open: 0, high: 0, low: 0, prevClose: 0,
      change: 0, changePct: 0, volume: 0, timestamp: Date.now(),
      error: String(err),
    };
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("symbols") ?? "";
  const symbols = raw.split(",").map(s => s.trim()).filter(Boolean);

  if (!symbols.length) {
    return NextResponse.json({ error: "?symbols= is required" }, { status: 400 });
  }

  // Fetch all in parallel (max 10 at a time)
  const results = await Promise.all(symbols.slice(0, 10).map(fetchQuote));

  return NextResponse.json(results, {
    headers: { "Cache-Control": "no-store" },
  });
}
