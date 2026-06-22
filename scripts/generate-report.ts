/**
 * generate-report.ts
 *
 * Reads data/market_sentiment.json and writes reports/futures_sentiment_report.md
 * with the 14-section research-report structure.
 *
 * Run:  npm run report
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { MarketSentiment } from "../lib/types";

const ROOT = process.cwd();
const JSON_PATH = join(ROOT, "data", "market_sentiment.json");
const OUT_DIR = join(ROOT, "reports");
const OUT_PATH = join(OUT_DIR, "futures_sentiment_report.md");

function fmt(n: number): string {
  return n > 0 ? `+${n}` : String(n);
}

function bullets(items: string[]): string {
  return items.map((i) => `- ${i}`).join("\n");
}

function marketOverview(m: MarketSentiment): string {
  return `### ${m.symbol} — ${m.name}

- **Sentiment score:** ${fmt(m.sentimentScore)} / 100
- **Bias:** ${m.bias}
- **Confidence:** ${m.confidence}
- **Last updated:** ${m.lastUpdated}

${m.summary}

**Top drivers:** ${m.drivers.slice(0, 3).map((d) => d.driver).join("; ")}

**Top risks:** ${m.risks.slice(0, 3).map((r) => r.risk).join("; ")}
`;
}

function scoreBreakdown(m: MarketSentiment): string {
  const rows = m.subScores
    .map((s) => `| ${s.name} | ${fmt(s.score)} | ${s.evidenceStrength} | ${s.reasoning.replace(/\|/g, "/")} |`)
    .join("\n");
  return `#### ${m.symbol} sub-scores (aggregate ${fmt(m.sentimentScore)} → ${m.bias})

| Sub-score | Score | Evidence | Reasoning |
| --- | ---: | --- | --- |
${rows}
`;
}

function narratives(m: MarketSentiment): string {
  return m.narratives
    .map(
      (n) =>
        `- **${n.name}** (${n.implication}, ${n.timeHorizon}): ${n.summary}\n  - Confirms: ${n.confirmation}\n  - Invalidates: ${n.invalidation}`,
    )
    .join("\n");
}

function catalysts(m: MarketSentiment): string {
  const rows = m.catalysts
    .map((c) => `| ${c.date} | ${c.event} | ${c.whyItMatters} | ${c.bullishScenario} | ${c.bearishScenario} |`)
    .join("\n");
  return `#### ${m.symbol}

| Date | Catalyst | Why it matters | Bullish | Bearish |
| --- | --- | --- | --- | --- |
${rows}
`;
}

function scenarios(m: MarketSentiment): string {
  const s = m.scenarios;
  return `#### ${m.symbol}

**Bullish**
${bullets(s.bullish.requirements)}
- _Confirmation:_ ${s.bullish.confirmationSignals.join("; ")}
- _Key levels:_ ${s.bullish.keyLevels.join("; ")}
- _Risks:_ ${s.bullish.risks.join("; ")}

**Bearish**
${bullets(s.bearish.requirements)}
- _Confirmation:_ ${s.bearish.confirmationSignals.join("; ")}
- _Key levels:_ ${s.bearish.keyLevels.join("; ")}
- _Risks:_ ${s.bearish.risks.join("; ")}

**Neutral / range**
${bullets(s.neutral.requirements)}
- _Range conditions:_ ${s.neutral.rangeConditions.join("; ")}
- _Volatility risks:_ ${s.neutral.volatilityRisks.join("; ")}
- _Breaks the range:_ ${s.neutral.rangeBreakSignals.join("; ")}
`;
}

function main() {
  const markets: MarketSentiment[] = JSON.parse(readFileSync(JSON_PATH, "utf8"));
  const [cl, es] = markets;

  const md = `# Futures Sentiment Research Report — CL & ES

> **Research and educational use only. Not financial advice.** This report presents
> scenario analysis and sentiment framing, not buy/sell recommendations. Scores,
> prices and positioning may be placeholder/illustrative until manually updated.
> Verify all figures against primary sources before acting.

_Generated from \`data/market_sentiment.json\`. Last updated: ${markets[0]?.lastUpdated ?? "—"}._

## 1. Executive summary

This report tracks sentiment for Crude Oil (CL) and S&P 500 E-mini (ES) futures using a
ten-factor scoring model (each factor −10..+10, summing to a −100..+100 aggregate) plus
qualitative narrative, driver, positioning and catalyst analysis.

| Market | Score | Bias | Confidence |
| --- | ---: | --- | --- |
| CL — ${cl.name} | ${fmt(cl.sentimentScore)} | ${cl.bias} | ${cl.confidence} |
| ES — ${es.name} | ${fmt(es.sentimentScore)} | ${es.bias} | ${es.confidence} |

## 2. CL sentiment overview

${marketOverview(cl)}

## 3. ES sentiment overview

${marketOverview(es)}

## 4. Side-by-side comparison

| Dimension | CL | ES |
| --- | --- | --- |
| Score | ${fmt(cl.sentimentScore)} | ${fmt(es.sentimentScore)} |
| Bias | ${cl.bias} | ${es.bias} |
| Confidence | ${cl.confidence} | ${es.confidence} |
| Dominant bullish driver | ${cl.drivers.find((d) => d.directionalImpact === "Bullish")?.driver ?? "—"} | ${es.drivers.find((d) => d.directionalImpact === "Bullish")?.driver ?? "—"} |
| Dominant bearish driver | ${cl.drivers.find((d) => d.directionalImpact === "Bearish")?.driver ?? "—"} | ${es.drivers.find((d) => d.directionalImpact === "Bearish")?.driver ?? "—"} |
| Top catalyst | ${cl.catalysts[0]?.event ?? "—"} | ${es.catalysts[0]?.event ?? "—"} |

## 5. Current dominant narratives

### CL
${narratives(cl)}

### ES
${narratives(es)}

## 6. Sentiment score breakdown

${scoreBreakdown(cl)}

${scoreBreakdown(es)}

## 7. Technical context

> Prices &amp; technicals are sourced live from Yahoo Finance (CL=F / ES=F) when reachable;
> the technical sub-score is auto-computed. Other levels remain framework where noted.

${[cl, es]
  .map((m) => {
    const t = m.technicalContext;
    const price = t.currentPrice != null ? t.currentPrice : "unavailable";
    const src = m.live ? `${m.dataSource}, as of ${m.asOf}` : "stored snapshot (live feed unavailable)";
    return `- **${m.symbol}:** price ${price}${t.dayChangePct != null ? ` (${t.dayChangePct >= 0 ? "+" : ""}${t.dayChangePct}% day)` : ""}; trend — ${t.trend}; 50-DMA ${t.sma50 ?? "—"} / 200-DMA ${t.sma200 ?? "—"}; RSI ${t.rsi ?? "—"}; vol — ${t.volatility}. _(${src})_`;
  })
  .join("\n")}

## 8. Positioning & social sentiment

**Positioning**
- **CL:** ${cl.positioning.summary}\n  - _Limitation:_ ${cl.positioning.limitations}
- **ES:** ${es.positioning.summary}\n  - _Limitation:_ ${es.positioning.limitations}

**Social sentiment (live)**
${[cl, es]
  .map((m) => {
    const s = m.social;
    if (!s || !s.available)
      return `- **${m.symbol}:** social feed unavailable in this run.`;
    const dir = s.bullish + s.bearish;
    const pct = dir > 0 ? Math.round((s.bullish / dir) * 100) : 50;
    return `- **${m.symbol}:** ${s.bullish} bullish / ${s.bearish} bearish (${pct}% bullish, ${s.nativeTagged} natively tagged) across ${s.total} recent messages — ${s.source}, as of ${s.asOf}.`;
  })
  .join("\n")}

## 9. Key catalysts

${catalysts(cl)}

${catalysts(es)}

## 10. Bullish, bearish, and neutral scenarios

${scenarios(cl)}

${scenarios(es)}

## 11. Risks and invalidation signals

### CL
${bullets(cl.risks.map((r) => `**${r.risk}** (${r.impact}) — ${r.description}`))}

### ES
${bullets(es.risks.map((r) => `**${r.risk}** (${r.impact}) — ${r.description}`))}

## 12. Monitoring checklist

**CL:** weekly EIA inventories (+ API preview), OPEC+ meetings, EIA STEO / IEA / OPEC monthly
reports, China demand data, USD / real rates, geopolitical supply events, CFTC managed-money
positioning, OVX / curve structure.

**ES:** FOMC meetings & guidance, CPI / PCE, Nonfarm Payrolls & jobless claims, ISM / GDP,
mega-cap earnings, 10Y & real yields, credit spreads, VIX regime, breadth (A/D, % > 200-DMA),
CFTC positioning & dealer gamma, fund flows.

## 13. Source limitations

- No live price feed is connected — technical levels are placeholders.
- Exact CFTC Commitments of Traders, options-skew/gamma, and fund-flow figures are not wired in;
  positioning is framework-only until updated.
- Catalyst dates are placeholders; confirm against the official EIA/Fed/BLS/BEA calendars.
- Sentiment sub-scores marked "Low" or "Unavailable" reflect inference, not measured data —
  confidence is reduced accordingly.
- Always corroborate across multiple independent sources; do not rely on a single headline,
  post, or influencer.

## 14. Disclaimer

This document is for research and educational purposes only and does **not** constitute
financial, investment, or trading advice. Nothing herein is a recommendation to buy or sell any
instrument. Futures trading involves substantial risk of loss. Do your own research and consult
a licensed professional before making any decision.
`;

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_PATH, md, "utf8");
  console.log(`Wrote report -> ${OUT_PATH} (${md.length} chars)`);
}

main();
