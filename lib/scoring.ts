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
