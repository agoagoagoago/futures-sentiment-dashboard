import { notFound } from "next/navigation";
import MarketDetail from "@/components/MarketDetail";
import { getMarket } from "@/lib/data";

export const metadata = {
  title: "Crude Oil (CL) Sentiment — Futures Sentiment Dashboard",
};

export default function CLPage() {
  const market = getMarket("CL");
  if (!market) notFound();
  return <MarketDetail market={market} />;
}
