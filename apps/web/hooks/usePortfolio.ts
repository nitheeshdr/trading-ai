import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import type { Holding } from "@/types/trade";

export function usePortfolio() {
  return useQuery<Holding[]>({
    queryKey: ["portfolio"],
    queryFn: async () => {
      const { data } = await axios.get("/api/portfolio");
      return data;
    },
    staleTime: 60_000,
  });
}
