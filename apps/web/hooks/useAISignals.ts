import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { AILogEntry } from "@/types/ai";

export function useAISignals(symbol?: string) {
  return useQuery<AILogEntry[]>({
    queryKey: ["ai-signals", symbol],
    queryFn: async () => {
      const params = symbol ? `?symbol=${encodeURIComponent(symbol)}` : "";
      const { data } = await axios.get(`/api/ai/signals${params}`);
      return data;
    },
    refetchInterval: 30_000,
  });
}
