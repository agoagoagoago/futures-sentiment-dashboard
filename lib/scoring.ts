// Single source of truth for sentiment scoring.
// Reused by components, the API route, and the data-refresh script.

import type { Bias, SubScore } from "./types";

/** Clamp a number into the inclusive [min, max] range. */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Map an aggregate score (-100..+100) to a bias band.
 * Bands per spec:
 *   +75..+100 Strongly bullish
 *   +40..+74  Bullish
 *   +10..+39  Mildly bullish
 *    -9..+9   Neutral
 *   -10..-39  Mildly bearish
 *   -40..-74  Bearish
 *   -75..-100 Strongly bearish
 */
export function biasFromScore(score: number): Bias {
  const s = clamp(score, -100, 100);
  if (s >= 75) return "Strongly bullish";
  if (s >= 40) return "Bullish";
  if (s >= 10) return "Mildly bullish";
  if (s >= -9) return "Neutral";
  if (s >= -39) return "Mildly bearish";
  if (s >= -74) return "Bearish";
  return "Strongly bearish";
}

/** Sum sub-scores into an aggregate clamped to [-100, +100]. */
export function sumSubScores(subScores: SubScore[]): number {
  const total = subScores.reduce((acc, s) => acc + (s.score ?? 0), 0);
  return clamp(total, -100, 100);
}

/**
 * Detect conflicting signals: a meaningful mix of strongly bullish and
 * strongly bearish sub-scores. When signals conflict, the market should be
 * labeled "Mixed" even if the numeric score leans one way (spec rule 3).
 */
export function hasConflict(subScores: SubScore[], threshold = 4): boolean {
  const strongBull = subScores.filter((s) => s.score >= threshold).length;
  const strongBear = subScores.filter((s) => s.score <= -threshold).length;
  return strongBull >= 2 && strongBear >= 2;
}

/**
 * Resolve the final bias label. If conflictFlag is true (or auto-detected
 * conflict is present), returns "Mixed"; otherwise maps score to a band.
 */
export function resolveBias(
  score: number,
  subScores: SubScore[],
  conflictFlag?: boolean,
): Bias {
  if (conflictFlag || hasConflict(subScores)) return "Mixed";
  return biasFromScore(score);
}

/** Tailwind text-color class for a bias label. */
export function biasColor(bias: Bias): string {
  switch (bias) {
    case "Strongly bullish":
    case "Bullish":
      return "text-emerald-400";
    case "Mildly bullish":
      return "text-emerald-300";
    case "Neutral":
      return "text-zinc-300";
    case "Mildly bearish":
      return "text-rose-300";
    case "Bearish":
    case "Strongly bearish":
      return "text-rose-400";
    case "Mixed":
      return "text-amber-300";
    default:
      return "text-zinc-300";
  }
}

/** Tailwind text-color class for a numeric score. */
export function scoreColor(score: number): string {
  if (score >= 10) return "text-emerald-400";
  if (score <= -10) return "text-rose-400";
  return "text-zinc-300";
}

// ---------------------------------------------------------------------------
// Live sub-score scorers
//
// Each scorer maps live signals to an integer in [-10, +10] and returns updated
// reasoning. getLiveMarket applies LIVE_SCORERS to the sub-scores whose `name`
// matches; all other sub-scores keep their manually-set values.
// ---------------------------------------------------------------------------

export interface LiveSignals {
  price: number;
  sma50: number | null;
  sma200: number | null;
  rsi: number | null;
  realizedVolPct: number | null;
  dayChangePct: number | null;
}

export interface ScoredSubScore {
  score: number;
  reasoning: string;
  evidenceStrength: "Low" | "Medium" | "High" | "Unavailable";
}

/** Technical-trend sub-score from price vs 50/200-DMA alignment + RSI. */
export function scoreTechnicalTrend(s: LiveSignals): ScoredSubScore {
  const { price, sma50, sma200, rsi } = s;
  if (sma50 == null || sma200 == null) {
    return {
      score: 0,
      reasoning: "OBSERVED (live): insufficient history to compute 50/200-DMA; trend score held neutral.",
      evidenceStrength: "Low",
    };
  }
  let score = 0;
  const parts: string[] = [];
  if (price > sma50) { score += 3; parts.push("price > 50-DMA"); } else { score -= 3; parts.push("price < 50-DMA"); }
  if (price > sma200) { score += 3; parts.push("price > 200-DMA"); } else { score -= 3; parts.push("price < 200-DMA"); }
  if (sma50 > sma200) { score += 2; parts.push("golden cross (50>200)"); } else { score -= 2; parts.push("death cross (50<200)"); }
  if (rsi != null) {
    if (rsi >= 70) { score -= 1; parts.push(`RSI ${rsi.toFixed(0)} overbought`); }
    else if (rsi <= 30) { score += 1; parts.push(`RSI ${rsi.toFixed(0)} oversold`); }
    else if (rsi >= 55) { score += 1; parts.push(`RSI ${rsi.toFixed(0)} firm`); }
    else if (rsi <= 45) { score -= 1; parts.push(`RSI ${rsi.toFixed(0)} soft`); }
  }
  return {
    score: clamp(Math.round(score), -10, 10),
    reasoning: `OBSERVED (live): ${parts.join(", ")}. Auto-computed from Yahoo Finance daily data.`,
    evidenceStrength: "High",
  };
}

/**
 * Volatility/risk-premium sub-score from realized vol. Higher realized vol is
 * treated as a mild negative for risk sentiment (more two-way / drawdown risk).
 */
export function scoreVolatilityFromVol(volPct: number | null): ScoredSubScore {
  if (volPct == null) {
    return {
      score: 0,
      reasoning: "OBSERVED (live): insufficient history to compute realized volatility.",
      evidenceStrength: "Low",
    };
  }
  let score: number;
  if (volPct >= 45) score = -4;
  else if (volPct >= 30) score = -2;
  else if (volPct >= 18) score = 1;
  else score = 3;
  return {
    score,
    reasoning: `OBSERVED (live): ~${volPct.toFixed(0)}% annualized realized vol (20d). Lower vol = steadier risk backdrop; higher vol = more two-way risk. Auto-computed from Yahoo Finance.`,
    evidenceStrength: "Medium",
  };
}

/**
 * Social-sentiment sub-score from bullish/bearish message counts.
 * Net ratio drives direction; sample volume drives magnitude and confidence.
 * Applied directly in getLiveMarket (not via LIVE_SCORERS, which take prices).
 */
export function scoreSocialSentiment(counts: {
  bullish: number;
  bearish: number;
  nativeTagged: number;
}): ScoredSubScore {
  const { bullish, bearish, nativeTagged } = counts;
  const directional = bullish + bearish;
  if (directional === 0) {
    return {
      score: 0,
      reasoning: "OBSERVED (live): no directional social messages found in the latest StockTwits sample.",
      evidenceStrength: "Low",
    };
  }
  const net = (bullish - bearish) / directional; // -1..+1
  // Dampen magnitude on small samples so a couple of posts can't dominate.
  const volumeFactor = Math.min(1, directional / 20);
  const score = clamp(Math.round(net * 10 * volumeFactor), -10, 10);
  const evidenceStrength: ScoredSubScore["evidenceStrength"] =
    nativeTagged >= 10 ? "High" : nativeTagged >= 3 || directional >= 15 ? "Medium" : "Low";
  const pctBull = Math.round((bullish / directional) * 100);
  return {
    score,
    reasoning: `OBSERVED (live): ${bullish} bullish / ${bearish} bearish across recent StockTwits messages (${pctBull}% bullish, ${nativeTagged} natively tagged). Auto-computed; small samples are dampened.`,
    evidenceStrength,
  };
}

/**
 * Registry mapping a sub-score `name` to a live scorer. Only price-derived
 * sub-scores are wired now; add CFTC/FRED/EIA scorers here as those feeds land.
 */
export const LIVE_SCORERS: Record<string, (s: LiveSignals) => ScoredSubScore> = {
  "Technical trend": (s) => scoreTechnicalTrend(s),
  "Volatility / risk premium": (s) => scoreVolatilityFromVol(s.realizedVolPct),
};

/** Tailwind classes for a directional-impact badge. */
export function impactBadge(impact: string): string {
  switch (impact) {
    case "Bullish":
      return "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30";
    case "Bearish":
      return "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30";
    case "Mixed":
      return "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30";
    default:
      return "bg-zinc-500/15 text-zinc-300 ring-1 ring-zinc-500/30";
  }
}
