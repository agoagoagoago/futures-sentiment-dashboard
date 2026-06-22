import type { MarketSentiment } from "@/lib/types";
import { scoreColor } from "@/lib/scoring";
import SentimentGauge from "./SentimentGauge";
import DriverTable from "./DriverTable";
import NarrativeCard from "./NarrativeCard";
import RiskPanel from "./RiskPanel";
import KeyLevelsTable from "./KeyLevelsTable";
import CatalystCalendar from "./CatalystCalendar";
import SourceList from "./SourceList";

function Section({
  title,
  children,
  subtitle,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
        {subtitle && <p className="text-sm text-zinc-500">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

/** Full per-market detail view, shared by /markets/cl and /markets/es. */
export default function MarketDetail({ market }: { market: MarketSentiment }) {
  const tech = market.technicalContext;
  return (
    <div className="space-y-10">
      {/* Header + gauge + summary */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="md:col-span-2 space-y-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-zinc-500">{market.symbol}</div>
            <h1 className="text-2xl font-bold text-zinc-100">{market.name}</h1>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-zinc-300">
              Confidence: {market.confidence}
            </span>
            <span className="text-zinc-500">Updated: {market.lastUpdated}</span>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">{market.summary}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <SentimentGauge
            score={market.sentimentScore}
            bias={market.bias}
            confidence={market.confidence}
          />
        </div>
      </section>

      {/* Sub-score breakdown */}
      <Section
        title="Sentiment score breakdown"
        subtitle="Ten sub-scores (−10 to +10) sum to the aggregate. Each notes observed vs inferred evidence."
      >
        <div className="overflow-x-auto rounded-lg border border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900/60 text-zinc-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left font-medium px-3 py-2">Sub-score</th>
                <th className="text-right font-medium px-3 py-2">Score</th>
                <th className="text-left font-medium px-3 py-2">Evidence</th>
                <th className="text-left font-medium px-3 py-2">Reasoning</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {market.subScores.map((s) => (
                <tr key={s.name} className="align-top hover:bg-zinc-900/30">
                  <td className="px-3 py-2 font-medium text-zinc-200 whitespace-nowrap">{s.name}</td>
                  <td className={`px-3 py-2 text-right font-mono ${scoreColor(s.score)}`}>
                    {s.score > 0 ? `+${s.score}` : s.score}
                  </td>
                  <td className="px-3 py-2 text-zinc-400 whitespace-nowrap">{s.evidenceStrength}</td>
                  <td className="px-3 py-2 text-zinc-400">{s.reasoning}</td>
                </tr>
              ))}
              <tr className="bg-zinc-900/40 font-semibold">
                <td className="px-3 py-2 text-zinc-200">Aggregate</td>
                <td className={`px-3 py-2 text-right font-mono ${scoreColor(market.sentimentScore)}`}>
                  {market.sentimentScore > 0 ? `+${market.sentimentScore}` : market.sentimentScore}
                </td>
                <td className="px-3 py-2 text-zinc-400" colSpan={2}>
                  Bias: {market.bias} · Confidence: {market.confidence}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      {/* Narratives */}
      <Section title="Key narratives">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {market.narratives.map((n) => (
            <NarrativeCard key={n.name} narrative={n} />
          ))}
        </div>
      </Section>

      {/* Drivers */}
      <Section title="Market drivers">
        <DriverTable drivers={market.drivers} />
      </Section>

      {/* Technical context */}
      <Section title="Technical context">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <Field label="Current price" value={tech.currentPrice ?? "Unavailable (not connected)"} />
          <Field label="Trend" value={tech.trend} />
          <Field label="Momentum" value={tech.momentum} />
          <Field label="Volatility" value={tech.volatility} />
          <Field label="Moving averages" value={tech.movingAverages ?? "—"} />
        </div>
        <KeyLevelsTable tech={tech} />
      </Section>

      {/* Positioning */}
      <Section title="Positioning context">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 space-y-2 text-sm">
          <p className="text-zinc-300">{market.positioning.summary}</p>
          <p
            className={`text-xs rounded px-2 py-1 inline-block ${
              market.positioning.available
                ? "bg-emerald-500/10 text-emerald-300"
                : "bg-amber-500/10 text-amber-300"
            }`}
          >
            {market.positioning.available
              ? "Live positioning data connected."
              : `Data limitation: ${market.positioning.limitations}`}
          </p>
        </div>
      </Section>

      {/* Macro / News / Social */}
      <Section title="Macro, news & social context">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <ContextBox label="Macro" body={market.macroContext} />
          <ContextBox label="News" body={market.newsContext} />
          <ContextBox label="Social / media" body={market.socialContext} />
        </div>
      </Section>

      {/* Catalysts */}
      <Section
        title="Upcoming catalysts"
        subtitle="Dates are placeholders pending manual update against the official calendars."
      >
        <CatalystCalendar catalysts={market.catalysts} />
      </Section>

      {/* Scenarios */}
      <Section title="Scenario analysis">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ScenarioCard
            title="Bullish scenario"
            tone="bull"
            blocks={[
              ["What needs to happen", market.scenarios.bullish.requirements],
              ["Confirmation signals", market.scenarios.bullish.confirmationSignals],
              ["Key levels", market.scenarios.bullish.keyLevels],
              ["Risks", market.scenarios.bullish.risks],
            ]}
          />
          <ScenarioCard
            title="Bearish scenario"
            tone="bear"
            blocks={[
              ["What needs to happen", market.scenarios.bearish.requirements],
              ["Confirmation signals", market.scenarios.bearish.confirmationSignals],
              ["Key levels", market.scenarios.bearish.keyLevels],
              ["Risks", market.scenarios.bearish.risks],
            ]}
          />
          <ScenarioCard
            title="Neutral / range scenario"
            tone="neutral"
            blocks={[
              ["What needs to happen", market.scenarios.neutral.requirements],
              ["Range conditions", market.scenarios.neutral.rangeConditions],
              ["Volatility risks", market.scenarios.neutral.volatilityRisks],
              ["What breaks the range", market.scenarios.neutral.rangeBreakSignals],
            ]}
          />
        </div>
      </Section>

      {/* Bull / Bear case + what changes view */}
      <Section title="Bull case, bear case & what would change the view">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2">
              Bull case
            </div>
            <ul className="space-y-1 text-zinc-300 list-disc list-inside">
              {market.scenarios.bullish.requirements.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-rose-400 mb-2">
              Bear case
            </div>
            <ul className="space-y-1 text-zinc-300 list-disc list-inside">
              {market.scenarios.bearish.requirements.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-zinc-700 bg-zinc-900/40 p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              What would change the view
            </div>
            <p className="text-zinc-300">{market.whatWouldChange}</p>
          </div>
        </div>
      </Section>

      {/* Risks */}
      <Section title="Biggest risks to the current narrative">
        <RiskPanel risks={market.risks} />
      </Section>

      {/* Sources */}
      <Section title="Sources">
        <SourceList sources={market.sources} />
      </Section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-zinc-500">{label}</div>
      <div className="text-zinc-200">{value}</div>
    </div>
  );
}

function ContextBox({ label, body }: { label: string; body: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">{label}</div>
      <p className="text-zinc-300">{body}</p>
    </div>
  );
}

function ScenarioCard({
  title,
  tone,
  blocks,
}: {
  title: string;
  tone: "bull" | "bear" | "neutral";
  blocks: [string, string[]][];
}) {
  const ring =
    tone === "bull"
      ? "border-emerald-500/30"
      : tone === "bear"
        ? "border-rose-500/30"
        : "border-zinc-700";
  const head =
    tone === "bull" ? "text-emerald-400" : tone === "bear" ? "text-rose-400" : "text-zinc-300";
  return (
    <div className={`rounded-lg border ${ring} bg-zinc-900/40 p-4 space-y-3`}>
      <h3 className={`font-semibold ${head}`}>{title}</h3>
      {blocks.map(([label, items]) => (
        <div key={label}>
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</div>
          <ul className="text-sm text-zinc-300 list-disc list-inside space-y-0.5">
            {items.map((it) => (
              <li key={it}>{it}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
