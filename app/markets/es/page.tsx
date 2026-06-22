import { notFound } from "next/navigation";
import MarketDetail from "@/components/MarketDetail";
import { getLiveMarket } from "@/lib/liveMarket";

export const metadata = {
  title: "S&P 500 E-mini (ES) Sentiment — Futures Sentiment Dashboard",
};

export const revalidate = 600;

export default async function ESPage() {
  const market = await getLiveMarket("ES").catch(() => null);
  if (!market) notFound();
  return <MarketDetail market={market} />;
}
