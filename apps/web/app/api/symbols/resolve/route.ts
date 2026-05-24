/**
 * GET /api/symbols/resolve?symbol=INFY&exchange=NSE
 *
 * Validates that a symbol exists. Returns 200 if valid, 404 otherwise.
 * TradingView datafeed calls this before resolving; a 404 causes it to
 * fall back to optimistic resolution (still works for known symbols).
 */

import { NextRequest, NextResponse } from "next/server";

// Known valid symbols (keep in sync with /api/symbols/search)
const VALID_SYMBOLS = new Set([
  "NIFTY 50", "BANKNIFTY", "NIFTY IT", "SENSEX",
  "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK",
  "HINDUNILVR", "ITC", "SBIN", "BAJFINANCE", "BHARTIARTL",
  "LT", "KOTAKBANK", "AXISBANK", "ASIANPAINT", "MARUTI",
  "HCLTECH", "WIPRO", "TITAN", "ULTRACEMCO", "ONGC",
  "POWERGRID", "NTPC", "SUNPHARMA", "M&M", "TATAMOTORS",
  "ADANIENT", "ADANIPORTS",
]);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = (searchParams.get("symbol") ?? "").trim().toUpperCase();
  const exchange = (searchParams.get("exchange") ?? "NSE").trim().toUpperCase();

  // Optimistic: any uppercase alphabetic+ampersand symbol is plausible
  const isValid =
    VALID_SYMBOLS.has(symbol) ||
    /^[A-Z&0-9 ]{1,20}$/.test(symbol);

  if (!isValid) {
    return NextResponse.json(
      { error: `Symbol ${symbol} not found on ${exchange}` },
      { status: 404 }
    );
  }

  return NextResponse.json({ symbol, exchange, valid: true });
}
