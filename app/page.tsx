import MarketSentimentCard from "@/components/MarketSentimentCard";
import { getLiveMarkets } from "@/lib/liveMarket";

export const revalidate = 600;

export default async function Home() {
  const markets = await getLiveMarkets();
  const lastUpdated = markets[0]?.lastUpdated ?? "—";

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h1 className="text-2xl font-bold text-zinc-100">Futures Sentiment Dashboard</h1>
        <p className="text-zinc-400 max-w-2xl">
          Sentiment tracking and scenario analysis for Crude Oil (CL) and S&amp;P 500
          E-mini (ES) futures, built from public data sources, macro indicators,
          positioning frameworks and narrative analysis. Scores run from −100
          (strongly bearish) to +100 (strongly bullish).
        </p>
        <p className="text-xs text-amber-300/90 rounded-md bg-amber-500/10 ring-1 ring-amber-500/20 px-3 py-2 max-w-2xl">
          Prices &amp; technicals are <strong>live</strong> (Yahoo Finance, cached ~10 min);
          the technical sub-score is auto-computed. Positioning, macro, inventory and
          news signals remain framework/manual until those feeds are added. Research
          only — not financial advice.
        </p>
        <p className="text-xs text-zinc-500">Last updated: {lastUpdated}</p>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {markets.map((m) => (
          <MarketSentimentCard key={m.symbol} market={m} />
        ))}
      </section>
    </div>
  );
}
