/**
 * GET /api/symbols/search?q=INFY&limit=20
 *
 * Symbol search for the TradingView datafeed.
 * In production, replace the static list with a DB/Kite API lookup.
 */

import { NextRequest, NextResponse } from "next/server";

// ── Static symbol catalogue (NSE top stocks + indices) ────────────────────────
// Replace or extend with a database query or Kite Instruments CSV in production.
const SYMBOLS: Array<{
  symbol: string;
  name: string;
  exchange: string;
  type: string;
}> = [
  // Indices
  { symbol: "NIFTY 50",   name: "Nifty 50",                  exchange: "NSE", type: "index" },
  { symbol: "BANKNIFTY",  name: "Nifty Bank",                 exchange: "NSE", type: "index" },
  { symbol: "NIFTY IT",   name: "Nifty IT",                   exchange: "NSE", type: "index" },
  { symbol: "SENSEX",     name: "BSE Sensex",                 exchange: "BSE", type: "index" },

  // Large caps
  { symbol: "RELIANCE",   name: "Reliance Industries",        exchange: "NSE", type: "stock" },
  { symbol: "TCS",        name: "Tata Consultancy Services",  exchange: "NSE", type: "stock" },
  { symbol: "HDFCBANK",   name: "HDFC Bank",                  exchange: "NSE", type: "stock" },
  { symbol: "INFY",       name: "Infosys",                    exchange: "NSE", type: "stock" },
  { symbol: "ICICIBANK",  name: "ICICI Bank",                 exchange: "NSE", type: "stock" },
  { symbol: "HINDUNILVR", name: "Hindustan Unilever",         exchange: "NSE", type: "stock" },
  { symbol: "ITC",        name: "ITC",                        exchange: "NSE", type: "stock" },
  { symbol: "SBIN",       name: "State Bank of India",        exchange: "NSE", type: "stock" },
  { symbol: "BAJFINANCE", name: "Bajaj Finance",              exchange: "NSE", type: "stock" },
  { symbol: "BHARTIARTL", name: "Bharti Airtel",              exchange: "NSE", type: "stock" },
  { symbol: "LT",         name: "Larsen & Toubro",            exchange: "NSE", type: "stock" },
  { symbol: "KOTAKBANK",  name: "Kotak Mahindra Bank",        exchange: "NSE", type: "stock" },
  { symbol: "AXISBANK",   name: "Axis Bank",                  exchange: "NSE", type: "stock" },
  { symbol: "ASIANPAINT", name: "Asian Paints",               exchange: "NSE", type: "stock" },
  { symbol: "MARUTI",     name: "Maruti Suzuki",              exchange: "NSE", type: "stock" },
  { symbol: "HCLTECH",    name: "HCL Technologies",           exchange: "NSE", type: "stock" },
  { symbol: "WIPRO",      name: "Wipro",                      exchange: "NSE", type: "stock" },
  { symbol: "TITAN",      name: "Titan Company",              exchange: "NSE", type: "stock" },
  { symbol: "ULTRACEMCO", name: "UltraTech Cement",           exchange: "NSE", type: "stock" },
  { symbol: "ONGC",       name: "ONGC",                       exchange: "NSE", type: "stock" },
  { symbol: "POWERGRID",  name: "Power Grid Corporation",     exchange: "NSE", type: "stock" },
  { symbol: "NTPC",       name: "NTPC",                       exchange: "NSE", type: "stock" },
  { symbol: "SUNPHARMA",  name: "Sun Pharmaceutical",         exchange: "NSE", type: "stock" },
  { symbol: "M&M",        name: "Mahindra & Mahindra",        exchange: "NSE", type: "stock" },
  { symbol: "TATAMOTORS", name: "Tata Motors",                exchange: "NSE", type: "stock" },
  { symbol: "ADANIENT",   name: "Adani Enterprises",          exchange: "NSE", type: "stock" },
  { symbol: "ADANIPORTS", name: "Adani Ports",                exchange: "NSE", type: "stock" },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim().toUpperCase();
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 50);

  if (!q) {
    return NextResponse.json([]);
  }

  const results = SYMBOLS.filter(
    (s) =>
      s.symbol.includes(q) ||
      s.name.toUpperCase().includes(q) ||
      s.exchange.includes(q)
  ).slice(0, limit);

  return NextResponse.json(results);
}
