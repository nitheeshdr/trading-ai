import { type Socket, type Server } from "socket.io";

export function setupSignalsHandler(socket: Socket, io: Server, userId?: string) {
  socket.on("subscribe:signals", ({ symbol }: { symbol: string }) => {
    socket.join(`signals:${symbol}`);
    if (userId) socket.join(`user:${userId}`);
    console.log(`[signals] ${socket.id} subscribed to signals: ${symbol}`);
  });
}
