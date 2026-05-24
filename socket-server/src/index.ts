import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { setupMarketHandler } from "./handlers/market";
import { setupOptionsHandler } from "./handlers/options";
import { setupSignalsHandler } from "./handlers/signals";
import { initRedis } from "./services/redis-pub-sub";

const PORT = parseInt(process.env.SOCKET_PORT ?? "4000", 10);

const app = express();
app.get("/health", (_, res) => res.json({ status: "ok" }));

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    credentials: true,
  },
  transports: ["websocket"],
});

// ─── Socket.IO connection handler ────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log(`[socket] client connected: ${socket.id}`);

  const userId: string | undefined = socket.handshake.auth?.userId;

  setupMarketHandler(socket, io);
  setupOptionsHandler(socket, io);
  setupSignalsHandler(socket, io, userId);

  socket.on("disconnect", () => {
    console.log(`[socket] client disconnected: ${socket.id}`);
  });
});

// ─── Startup ─────────────────────────────────────────────────────────────────
async function start() {
  await initRedis(io);
  httpServer.listen(PORT, () => {
    console.log(`[socket-server] listening on :${PORT}`);
  });
}

start().catch(console.error);
