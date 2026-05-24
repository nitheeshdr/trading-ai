/**
 * kite-ticker.ts
 * --------------
 * Wraps the KiteTicker WebSocket to stream live ticks
 * and publish them to Redis → Socket.IO clients.
 *
 * Note: KiteTicker requires a valid Kite access_token.
 * Call initKiteTicker() after broker auth is complete.
 */

import { getPublisher } from "./redis-pub-sub";

// Dynamic import since kiteconnect is ESM-compatible
let KiteTicker: typeof import("kiteconnect").KiteTicker;

export async function initKiteTicker(apiKey: string, accessToken: string, instrumentTokens: number[]) {
  const { KiteTicker: KT } = await import("kiteconnect");
  KiteTicker = KT;

  const ticker = new KiteTicker({ api_key: apiKey, access_token: accessToken });

  ticker.connect();

  ticker.on("ticks", (ticks: Array<{ instrument_token: number; last_price: number; [key: string]: unknown }>) => {
    const pub = getPublisher();
    for (const tick of ticks) {
      const payload = JSON.stringify({
        symbol: `TOKEN:${tick.instrument_token}`,  // replace with symbol lookup
        ltp: tick.last_price,
        change: (tick as Record<string, number>).change ?? 0,
        changePct: (tick as Record<string, number>).change_percent ?? 0,
        volume: (tick as Record<string, number>).volume_traded ?? 0,
        timestamp: Date.now(),
      });
      pub.publish("market:ticks", payload);
    }
  });

  ticker.on("connect", () => {
    ticker.subscribe(instrumentTokens);
    ticker.setMode(ticker.modeFull, instrumentTokens);
    console.log(`[kite-ticker] subscribed to ${instrumentTokens.length} instruments`);
  });

  ticker.on("error", (e: Error) => console.error("[kite-ticker] error:", e));
  ticker.on("disconnect", () => console.warn("[kite-ticker] disconnected"));
}
