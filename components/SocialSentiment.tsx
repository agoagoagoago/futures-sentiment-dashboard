import type { SocialSentimentSummary } from "@/lib/types";
import { impactBadge } from "@/lib/scoring";

/** Live social-sentiment widget: bull/bear bar, counts, tickers, sample posts. */
export default function SocialSentiment({ social }: { social?: SocialSentimentSummary }) {
  if (!social || !social.available) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">
          Social / media
        </div>
        <p className="text-sm text-zinc-400">
          Live social feed (StockTwits) is currently unavailable — try again after the next refresh.
        </p>
      </div>
    );
  }

  const directional = social.bullish + social.bearish;
  const pctBull = directional > 0 ? Math.round((social.bullish / directional) * 100) : 50;
  const pctBear = 100 - pctBull;

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Social / media — live
        </div>
        <span className="text-[10px] rounded-full bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20 px-2 py-0.5">
          ● {social.source}
        </span>
      </div>

      {/* Bull/bear bar */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-emerald-400">{social.bullish} bullish · {pctBull}%</span>
          <span className="text-rose-400">{pctBear}% · {social.bearish} bearish</span>
        </div>
        <div className="h-2 w-full rounded-full overflow-hidden bg-zinc-800 flex">
          <div className="bg-emerald-500/70 h-full" style={{ width: `${pctBull}%` }} />
          <div className="bg-rose-500/70 h-full" style={{ width: `${pctBear}%` }} />
        </div>
        <div className="text-xs text-zinc-500 mt-1">
          {social.total} recent messages ({social.nativeTagged} natively tagged) · as of {social.asOf}
        </div>
      </div>

      {/* Sample messages */}
      {social.samples.length > 0 && (
        <ul className="space-y-1.5">
          {social.samples.map((s, i) => (
            <li key={i} className="text-xs text-zinc-400 flex gap-2">
              <span className={`shrink-0 rounded px-1 py-0.5 ${impactBadge(s.sentiment)}`}>
                {s.sentiment[0]}
              </span>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-zinc-200"
              >
                <span className="text-zinc-500">${s.ticker}:</span> {s.body}
              </a>
            </li>
          ))}
        </ul>
      )}
      <p className="text-[11px] text-zinc-600">
        Retail chatter — contextual/contrarian signal only, not a standalone one.
      </p>
    </div>
  );
}
