import Redis from "ioredis";
import { type Server } from "socket.io";

let pub: Redis;
let sub: Redis;

export function getPublisher(): Redis {
  if (!pub) pub = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");
  return pub;
}

export async function initRedis(io: Server) {
  const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
  pub = new Redis(redisUrl);
  sub = new Redis(redisUrl);

  // Subscribe to channels published by the AI backend / other services
  await sub.subscribe("signals", "market:ticks", "options");

  sub.on("message", (channel: string, message: string) => {
    const data = JSON.parse(message);

    if (channel === "market:ticks") {
      // Cache tick in Redis for auto-trade engine
      pub.set(`tick:${data.symbol}`, message, "EX", 60);
      io.emit("tick:update", data);
    } else if (channel === "signals") {
      io.emit("signal:update", data);
    } else if (channel === "options") {
      io.to(`options:${data.symbol}`).emit("option:update", data);
    }
  });

  console.log("[redis] pub/sub initialized");
}
