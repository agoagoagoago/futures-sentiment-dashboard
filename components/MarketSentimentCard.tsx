import Link from "next/link";
import type { MarketSentiment } from "@/lib/types";
import { biasColor, scoreColor } from "@/lib/scoring";

interface Props {
  market: MarketSentiment;
}

/** Home-page summary card: score, bias, confidence, top drivers/risks, catalysts. */
export default function MarketSentimentCard({ market }: Props) {
  const href = `/markets/${market.symbol.toLowerCase()}`;
  const topDrivers = market.drivers.slice(0, 3);
  const topRisks = market.risks.slice(0, 3);
  const nextCatalysts = market.catalysts.slice(0, 3);

  const price = market.technicalContext.currentPrice;
  const chg = market.technicalContext.dayChangePct;
  const chgColor = chg == null ? "text-zinc-400" : chg >= 0 ? "text-emerald-400" : "text-rose-400";

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-zinc-500">{market.symbol}</div>
          <h2 className="text-lg font-semibold text-zinc-100">{market.name}</h2>
          {price != null && (
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-semibold tabular-nums text-zinc-100">
                {price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              {chg != null && (
                <span className={`text-sm tabular-nums ${chgColor}`}>
                  {chg >= 0 ? "+" : ""}
                  {chg.toFixed(2)}%
                </span>
              )}
            </div>
          )}
        </div>
        <div className="text-right">
          <div className={`text-3xl font-bold tabular-nums ${scoreColor(market.sentimentScore)}`}>
            {market.sentimentScore > 0 ? `+${market.sentimentScore}` : market.sentimentScore}
          </div>
          <div className={`text-sm font-medium ${biasColor(market.bias)}`}>{market.bias}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap text-xs text-zinc-400">
        <span className="rounded-full bg-zinc-800 px-2 py-0.5">
          Confidence: <span className="text-zinc-200">{market.confidence}</span>
        </span>
        {market.live ? (
          <span className="rounded-full bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20 px-2 py-0.5">
            ● Live
          </span>
        ) : (
          <span className="rounded-full bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20 px-2 py-0.5">
            ● Snapshot
          </span>
        )}
        <span className="text-zinc-500">Updated: {market.lastUpdated}</span>
      </div>

      {market.social?.available && market.social.bullish + market.social.bearish > 0 && (
        <div className="text-xs text-zinc-400">
          Social:{" "}
          <span className="text-emerald-400">
            {Math.round((market.social.bullish / (market.social.bullish + market.social.bearish)) * 100)}% bull
          </span>{" "}
          <span className="text-zinc-500">
            ({market.social.bullish}/{market.social.bearish} of {market.social.total} · StockTwits)
          </span>
        </div>
      )}

      <p className="text-sm text-zinc-400 leading-relaxed line-clamp-4">{market.summary}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400/80 mb-1">
            Top drivers
          </div>
          <ul className="space-y-1 text-zinc-300">
            {topDrivers.map((d) => (
              <li key={d.driver} className="flex gap-1.5">
                <span className="text-zinc-600">•</span>
                <span>{d.driver}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-rose-400/80 mb-1">
            Top risks
          </div>
          <ul className="space-y-1 text-zinc-300">
            {topRisks.map((r) => (
              <li key={r.risk} className="flex gap-1.5">
                <span className="text-zinc-600">•</span>
                <span>{r.risk}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">
          Next catalysts
        </div>
        <ul className="space-y-1 text-sm text-zinc-300">
          {nextCatalysts.map((c) => (
            <li key={c.event} className="flex justify-between gap-2">
              <span className="truncate">{c.event}</span>
              <span className="text-zinc-500 shrink-0 text-xs font-mono">{c.date}</span>
            </li>
          ))}
        </ul>
      </div>

      <Link
        href={href}
        className="mt-auto inline-block text-sm font-medium text-sky-400 hover:text-sky-300"
      >
        View full {market.symbol} analysis →
      </Link>
    </div>
  );
}
