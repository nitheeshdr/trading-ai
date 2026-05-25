import type { Metadata } from "next";
import { PaperTradingClient } from "@/components/trading/PaperTradingClient";

export const metadata: Metadata = { title: "Paper Trading" };

export default function PaperTradingPage() {
  return <PaperTradingClient />;
}
