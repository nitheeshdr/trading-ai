"use client";

import { useEffect, useRef } from "react";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket/client";
import { TICK_UPDATE, OPTION_UPDATE, SIGNAL_UPDATE, AUTO_TRADE_ENTRY, AUTO_TRADE_EXIT, AUTO_TRADE_BLOCKED, SUBSCRIBE_TICKS } from "@/lib/socket/events";
import { useMarketStore } from "@/store/useMarketStore";
import { useAutoTradeStore } from "@/store/useAutoTradeStore";
import type { Tick } from "@/types/market";
import type { AISignal } from "@/types/ai";
import { toast } from "sonner";

export function useSocket(userId?: string) {
  const setTick = useMarketStore((s) => s.setTick);
  const addExecution = useAutoTradeStore((s) => s.addExecution);
  const updateExecution = useAutoTradeStore((s) => s.updateExecution);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const socket = connectSocket(userId);

    socket.on(TICK_UPDATE, (tick: Tick) => {
      setTick(tick.symbol, tick);
    });

    socket.on(SIGNAL_UPDATE, (signal: AISignal) => {
      // Signal updates are handled by individual components / stores
      console.debug("[signal]", signal);
    });

    socket.on(AUTO_TRADE_ENTRY, (data: { executionId: string; strategyId: string; symbol: string; price: number; qty: number }) => {
      toast.success(`🟢 Auto-Buy ${data.symbol} @ ₹${data.price}`);
    });

    socket.on(AUTO_TRADE_EXIT, (data: { executionId: string; pl: number; plPct: number; reason: string }) => {
      updateExecution(data.executionId, { status: "CLOSED", profit_loss: data.pl, profit_loss_pct: data.plPct });
      const emoji = data.pl >= 0 ? "🟢" : "🔴";
      toast.info(`${emoji} Auto-exit (${data.reason}): ₹${data.pl.toFixed(2)}`);
    });

    socket.on(AUTO_TRADE_BLOCKED, (data: { reason: string }) => {
      toast.warning(`⚠️ Auto-trade blocked: ${data.reason}`);
    });

    return () => {
      initialized.current = false;
      disconnectSocket();
    };
  }, [userId, setTick, addExecution, updateExecution]);

  return getSocket();
}

export function useSubscribeTicks(symbols: string[]) {
  const socket = getSocket();

  useEffect(() => {
    if (!symbols.length) return;
    socket.emit(SUBSCRIBE_TICKS, { symbols });
    return () => {
      socket.emit("unsubscribe:ticks", { symbols });
    };
  }, [symbols.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps
}
