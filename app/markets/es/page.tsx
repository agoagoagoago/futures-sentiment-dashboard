import { notFound } from "next/navigation";
import MarketDetail from "@/components/MarketDetail";
import { getMarket } from "@/lib/data";

export const metadata = {
  title: "S&P 500 E-mini (ES) Sentiment — Futures Sentiment Dashboard",
};

export default function ESPage() {
  const market = getMarket("ES");
  if (!market) notFound();
  return <MarketDetail market={market} />;
}
