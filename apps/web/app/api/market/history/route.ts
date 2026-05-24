/**
 * GET /api/market/history
 *
 * Returns OHLCV bars for a symbol/resolution/time-range.
 *
 * Query params:
 *   symbol     NSE instrument token or ticker (e.g. INFY)
 *   exchange   NSE | BSE
 *   resolution TradingView resolution string (1, 5, 15, 30, 60, D, W …)
 *   interval   minutes (derived from resolution, passed by datafeed)
 *   from       Unix timestamp (seconds) — range start
 *   to         Unix timestamp (seconds) — range end
 *
 * Response:
 *   { bars: [{ t, o, h, l, c, v }] }   (t in seconds)
 *
 * Implementation note:
 *   This stub generates synthetic OHLCV data so the chart renders
 *   immediately. Replace the body of `fetchHistoricalBars()` with a
 *   real Kite Connect Historical Data API call (or your data provider).
 *
 * Kite Connect Historical Data (production):
 *   GET https://api.kite.trade/instruments/historical/{instrument_token}/{interval}
 *     ?from=YYYY-MM-DD+HH:MM:SS&to=YYYY-MM-DD+HH:MM:SS&continuous=0&oi=0
 *   Headers: Authorization: token {api_key}:{access_token}
 */

import { NextRequest, NextResponse } from "next/server";

interface OHLCVBar {
  t: number;   // Unix seconds
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

// ── Synthetic data generator (replace with real data source) ─────────────────

function generateSyntheticBars(
  symbol: string,
  from: number,
  to: number,
  intervalMinutes: number
): OHLCVBar[] {
  const bars: OHLCVBar[] = [];

  // Seed price based on symbol hash so each symbol has a different base price
  let seed = 0;
  for (let i = 0; i < symbol.length; i++) seed += symbol.charCodeAt(i);
  let price = 500 + (seed % 4000);  // 500 – 4500 range (realistic NSE prices)

  const intervalMs = intervalMinutes * 60;
  let t = from;

  // NSE session hours: 09:15 – 15:30 IST  (UTC+5:30 → UTC: 03:45 – 10:00)
  const SESSION_START_MIN = 9 * 60 + 15;  // minutes from midnight IST
  const SESSION_END_MIN   = 15 * 60 + 30;

  while (t <= to) {
    const date = new Date(t * 1000);
    // IST offset: UTC+5:30
    const istMin = ((date.getUTCHours() * 60 + date.getUTCMinutes()) + 330) % 1440;
    const dayOfWeek = new Date((t + 330 * 60) * 1000).getUTCDay(); // 0=Sun, 6=Sat

    // Skip weekends and outside-session bars
    const inSession =
      dayOfWeek >= 1 && dayOfWeek <= 5 &&
      istMin >= SESSION_START_MIN &&
      istMin < SESSION_END_MIN;

    if (inSession) {
      // Simple random walk
      const change = (Math.random() - 0.495) * price * 0.005;
      const open  = price;
      const close = Math.max(1, price + change);
      const high  = Math.max(open, close) * (1 + Math.random() * 0.003);
      const low   = Math.min(open, close) * (1 - Math.random() * 0.003);
      const vol   = Math.floor(10000 + Math.random() * 200000);

      bars.push({
        t,
        o: parseFloat(open.toFixed(2)),
        h: parseFloat(high.toFixed(2)),
        l: parseFloat(low.toFixed(2)),
        c: parseFloat(close.toFixed(2)),
        v: vol,
      });

      price = close;
    }

    t += intervalMs;
  }

  return bars;
}

// ── Resolution → interval minutes map ────────────────────────────────────────

const RESOLUTION_MINUTES: Record<string, number> = {
  "1": 1, "3": 3, "5": 5, "15": 15, "30": 30,
  "60": 60, "120": 120, "240": 240,
  "D": 1440, "W": 10080, "M": 43200,
};

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const symbol   = (searchParams.get("symbol")   ?? "INFY").trim().toUpperCase();
  const exchange = (searchParams.get("exchange")  ?? "NSE").trim().toUpperCase();
  const resolution = searchParams.get("resolution") ?? "5";
  const from     = parseInt(searchParams.get("from") ?? "0", 10);
  const to       = parseInt(searchParams.get("to")   ?? String(Math.floor(Date.now() / 1000)), 10);

  if (!from || !to || from >= to) {
    return NextResponse.json({ bars: [], error: "Invalid time range" }, { status: 400 });
  }

  const intervalMinutes = RESOLUTION_MINUTES[resolution] ?? 5;

  // ── Production: replace this block with Kite Historical API ──────────────
  // Example Kite call:
  //   const kite = getAuthorizedKiteClient(accessToken);
  //   const data = await kite.getHistoricalData(instrumentToken, interval, fromDate, toDate);
  //   const bars = data.map((c: any) => ({
  //     t: Math.floor(new Date(c.date).getTime() / 1000),
  //     o: c.open, h: c.high, l: c.low, c: c.close, v: c.volume,
  //   }));
  // ─────────────────────────────────────────────────────────────────────────

  const bars = generateSyntheticBars(symbol, from, to, intervalMinutes);

  // Suppress unused variable warnings (exchange used in production Kite call)
  void exchange;

  return NextResponse.json({ bars }, {
    headers: {
      "Cache-Control": "no-store",  // live market data — never cache
    },
  });
}
