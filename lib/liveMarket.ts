// Live market assembler: overlays live price/technicals onto the static
// narrative base, auto-computes price-derived sub-scores, and recomputes the
// aggregate score + bias. Falls back gracefully to the stored snapshot.

import { getMarket, getMarkets } from "./data";
import { fetchChart } from "./marketData";
import {
  annualizedVol,
  classifyTrend,
  invalidationLevel,
  momentumLabel,
  round,
  rsi as rsiFn,
  sma,
  swingLevels,
  volatilityLabel,
} from "./indicators";
import {
  LIVE_SCORERS,
  resolveBias,
  sumSubScores,
  type LiveSignals,
} from "./scoring";
import type { Confidence, MarketSentiment, Symbol } from "./types";

/** Confidence cannot exceed Medium while only price/technicals are live. */
function cappedConfidence(c: Confidence): Confidence {
  return c === "High" ? "Medium" : c;
}

/**
 * Returns the market enriched with live technicals + recomputed scores.
 * On any fetch/parse failure, returns the stored snapshot flagged `stale`.
 */
export async function getLiveMarket(symbol: Symbol): Promise<MarketSentiment> {
  const base = getMarket(symbol);
  if (!base) throw new Error(`Unknown symbol '${symbol}'`);

  // Deep-ish clone so we never mutate the shared static dataset.
  const m: MarketSentiment = JSON.parse(JSON.stringify(base));

  try {
    const chart = await fetchChart(symbol);
    const sma50 = sma(chart.closes, 50);
    const sma200 = sma(chart.closes, 200);
    const rsi = rsiFn(chart.closes, 14);
    const realizedVolPct = annualizedVol(chart.closes, 20);
    const trend = classifyTrend(chart.price, sma50, sma200, rsi);
    const { support, resistance } = swingLevels(chart.highs, chart.lows, chart.price);
    const invalid = invalidationLevel(trend, sma50, sma200);

    m.technicalContext = {
      currentPrice: round(chart.price),
      trend,
      supportLevels: support.length ? support : ["No clear pivot below price in lookback window"],
      resistanceLevels: resistance.length ? resistance : ["No clear pivot above price in lookback window"],
      movingAverages:
        sma50 != null && sma200 != null
          ? `50-DMA ${round(sma50)} · 200-DMA ${round(sma200)} · price ${chart.price > sma50 ? "above" : "below"} 50-DMA, ${chart.price > sma200 ? "above" : "below"} 200-DMA`
          : "Insufficient history for 50/200-DMA",
      momentum: momentumLabel(rsi),
      volatility: volatilityLabel(realizedVolPct),
      invalidationLevels: invalid != null ? [round(invalid)] : ["Insufficient data"],
      sma50: sma50 != null ? round(sma50) : null,
      sma200: sma200 != null ? round(sma200) : null,
      rsi: rsi != null ? round(rsi, 1) : null,
      realizedVolPct: realizedVolPct != null ? round(realizedVolPct, 1) : null,
      dayChangePct: chart.dayChangePct != null ? round(chart.dayChangePct, 2) : null,
    };

    // Apply live scorers to matching sub-scores; leave others untouched.
    const signals: LiveSignals = {
      price: chart.price,
      sma50,
      sma200,
      rsi,
      realizedVolPct,
      dayChangePct: chart.dayChangePct,
    };
    for (const s of m.subScores) {
      const scorer = LIVE_SCORERS[s.name];
      if (scorer) {
        const out = scorer(signals);
        s.score = out.score;
        s.reasoning = out.reasoning;
        s.evidenceStrength = out.evidenceStrength;
      }
    }

    m.sentimentScore = sumSubScores(m.subScores);
    m.bias = resolveBias(m.sentimentScore, m.subScores);
    m.confidence = cappedConfidence(m.confidence);
    m.live = true;
    m.stale = false;
    m.dataSource = chart.source;
    m.asOf = chart.asOf;
    m.lastUpdated = chart.asOf;
    return m;
  } catch (e) {
    // Graceful degradation: serve stored snapshot, flag as stale, lower confidence.
    m.live = false;
    m.stale = true;
    m.confidence = "Low";
    m.dataSource = "Stored snapshot (live feed unavailable)";
    m.positioning = {
      ...m.positioning,
      limitations: `Live price feed unavailable (${e instanceof Error ? e.message : "error"}). Showing last stored values. ${m.positioning.limitations}`,
    };
    return m;
  }
}

/** Both markets in parallel; one failure cannot block the other. */
export async function getLiveMarkets(): Promise<MarketSentiment[]> {
  const symbols = getMarkets().map((m) => m.symbol);
  return Promise.all(symbols.map((s) => getLiveMarket(s)));
}
