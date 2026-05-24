import { type Socket, type Server } from "socket.io";
import { getPublisher } from "../services/redis-pub-sub";

export function setupMarketHandler(socket: Socket, io: Server) {
  socket.on("subscribe:ticks", ({ symbols }: { symbols: string[] }) => {
    symbols.forEach((s) => socket.join(`ticks:${s}`));
    console.log(`[market] ${socket.id} subscribed to: ${symbols.join(", ")}`);
  });

  socket.on("unsubscribe:ticks", ({ symbols }: { symbols: string[] }) => {
    symbols.forEach((s) => socket.leave(`ticks:${s}`));
  });
}
