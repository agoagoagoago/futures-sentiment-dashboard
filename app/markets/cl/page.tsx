import { notFound } from "next/navigation";
import MarketDetail from "@/components/MarketDetail";
import { getLiveMarket } from "@/lib/liveMarket";

export const metadata = {
  title: "Crude Oil (CL) Sentiment — Futures Sentiment Dashboard",
};

export const revalidate = 600;

export default async function CLPage() {
  const market = await getLiveMarket("CL").catch(() => null);
  if (!market) notFound();
  return <MarketDetail market={market} />;
}
