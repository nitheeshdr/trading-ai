"use client";

import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      transports: ["websocket"],
      autoConnect: false,
    });
  }
  return socket;
}

export function connectSocket(userId?: string): Socket {
  const s = getSocket();
  if (!s.connected) {
    if (userId) s.auth = { userId };
    s.connect();
  }
  return s;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
