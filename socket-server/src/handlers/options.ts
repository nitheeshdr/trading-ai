import { type Socket, type Server } from "socket.io";

export function setupOptionsHandler(socket: Socket, io: Server) {
  socket.on("subscribe:options", ({ symbol }: { symbol: string }) => {
    socket.join(`options:${symbol}`);
    console.log(`[options] ${socket.id} subscribed to option chain: ${symbol}`);
  });
}
