import MarketSentimentCard from "@/components/MarketSentimentCard";
import { getMarkets } from "@/lib/data";

export default function Home() {
  const markets = getMarkets();
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
          Note: prices, scores and positioning figures are illustrative placeholders
          until manually updated (see README → &ldquo;How to update the data&rdquo;).
          Research only — not financial advice.
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
