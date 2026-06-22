/**
 * refresh-sentiment.ts
 *
 * Recomputes each market's aggregate sentimentScore from its sub-scores,
 * re-derives the bias label (with the "Mixed" conflict rule), stamps
 * lastUpdated, writes market_sentiment.json back, and regenerates the four
 * CSV exports so every data file stays in sync.
 *
 * Run:  npm run refresh
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { resolveBias, sumSubScores } from "../lib/scoring";
import { getLiveMarket } from "../lib/liveMarket";
import { getMarkets } from "../lib/data";
import type { MarketSentiment } from "../lib/types";

const DATA_DIR = join(process.cwd(), "data");
const JSON_PATH = join(DATA_DIR, "market_sentiment.json");

function csv(value: unknown): string {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function stamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function main() {
  const now = stamp();

  // Fetch live technicals per market (graceful fallback inside getLiveMarket),
  // then snapshot the result into the JSON. Recompute aggregate for safety.
  const symbols = getMarkets().map((m) => m.symbol);
  const markets: MarketSentiment[] = [];
  for (const sym of symbols) {
    const m = await getLiveMarket(sym);
    m.sentimentScore = sumSubScores(m.subScores);
    m.bias = resolveBias(m.sentimentScore, m.subScores);
    if (!m.live) m.lastUpdated = now; // live runs already stamp asOf
    markets.push(m);
  }

  writeFileSync(JSON_PATH, JSON.stringify(markets, null, 2) + "\n", "utf8");

  // sentiment_scores.csv
  const scoreRows = [
    "symbol,market_name,sentiment_score,bias,confidence,last_updated,key_bullish_driver,key_bearish_driver,top_catalyst",
    ...markets.map((m) => {
      const bull = m.drivers.find((d) => d.directionalImpact === "Bullish")?.driver ?? "";
      const bear = m.drivers.find((d) => d.directionalImpact === "Bearish")?.driver ?? "";
      const cat = m.catalysts[0]?.event ?? "";
      return [
        m.symbol,
        m.name,
        m.sentimentScore,
        m.bias,
        m.confidence,
        m.lastUpdated,
        bull,
        bear,
        cat,
      ]
        .map(csv)
        .join(",");
    }),
  ].join("\n");
  writeFileSync(join(DATA_DIR, "sentiment_scores.csv"), scoreRows + "\n", "utf8");

  // market_drivers.csv
  const driverRows = [
    "symbol,driver,category,directional_impact,strength,evidence,time_horizon,source_url",
    ...markets.flatMap((m) =>
      m.drivers.map((d) =>
        [m.symbol, d.driver, d.category, d.directionalImpact, d.strength, d.evidence, d.timeHorizon, d.sourceUrl]
          .map(csv)
          .join(","),
      ),
    ),
  ].join("\n");
  writeFileSync(join(DATA_DIR, "market_drivers.csv"), driverRows + "\n", "utf8");

  // catalyst_calendar.csv
  const catRows = [
    "date,symbol,catalyst,why_it_matters,bullish_scenario,bearish_scenario,source_url",
    ...markets.flatMap((m) =>
      m.catalysts.map((c) =>
        [c.date, m.symbol, c.event, c.whyItMatters, c.bullishScenario, c.bearishScenario, c.sourceUrl]
          .map(csv)
          .join(","),
      ),
    ),
  ].join("\n");
  writeFileSync(join(DATA_DIR, "catalyst_calendar.csv"), catRows + "\n", "utf8");

  // key_levels.csv
  const levelRows = [
    "symbol,level,type,reason,invalidation_or_confirmation",
    ...markets.flatMap((m) => {
      const t = m.technicalContext;
      const rows: string[] = [];
      for (const l of t.resistanceLevels)
        rows.push([m.symbol, l, "Resistance", "Upside level / supply zone", "Break + hold above confirms upside"].map(csv).join(","));
      for (const l of t.supportLevels)
        rows.push([m.symbol, l, "Support", "Downside level / demand zone", "Close below opens further downside"].map(csv).join(","));
      for (const l of t.invalidationLevels)
        rows.push([m.symbol, l, "Invalidation", "Flips the near-term view", "Close beyond changes the bias"].map(csv).join(","));
      return rows;
    }),
  ].join("\n");
  writeFileSync(join(DATA_DIR, "key_levels.csv"), levelRows + "\n", "utf8");

  console.log(`Refreshed ${markets.length} markets at ${now}:`);
  for (const m of markets) {
    const feed = m.live ? `live ${m.technicalContext.currentPrice}` : "snapshot (live unavailable)";
    console.log(`  ${m.symbol}: score ${m.sentimentScore} -> ${m.bias} (confidence ${m.confidence}) [${feed}]`);
  }
  console.log("Regenerated: sentiment_scores.csv, market_drivers.csv, catalyst_calendar.csv, key_levels.csv");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
