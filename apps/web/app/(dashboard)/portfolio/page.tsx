import type { Metadata } from "next";
import { PortfolioSummary } from "@/components/portfolio/PortfolioSummary";
import { HoldingsList } from "@/components/portfolio/HoldingsList";

export const metadata: Metadata = { title: "Portfolio" };

export default function PortfolioPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Portfolio</h1>
      <PortfolioSummary />
      <HoldingsList />
    </div>
  );
}
