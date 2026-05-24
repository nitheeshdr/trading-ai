import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket/client";
import { SUBSCRIBE_OPTIONS, OPTION_UPDATE } from "@/lib/socket/events";
import type { OptionChainData } from "@/types/market";

export function useOptionChain(symbol: string) {
  const [chain, setChain] = useState<OptionChainData | null>(null);

  useEffect(() => {
    const socket = getSocket();
    socket.emit(SUBSCRIBE_OPTIONS, { symbol });
    socket.on(OPTION_UPDATE, (data: OptionChainData) => {
      if (data.symbol === symbol) setChain(data);
    });
    return () => {
      socket.off(OPTION_UPDATE);
    };
  }, [symbol]);

  return chain;
}
