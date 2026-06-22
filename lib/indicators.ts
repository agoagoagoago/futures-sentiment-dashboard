// Pure, stateless technical-indicator helpers operating on price arrays.
// Arrays are ordered oldest -> newest. No I/O; easy to reason about and test.

export type Trend = "Uptrend" | "Downtrend" | "Range" | "Breakout" | "Breakdown";

/** Round to a sensible number of decimals for display (futures prices). */
export function round(value: number, decimals = 2): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}

/** Simple moving average of the last n values; null if not enough data. */
export function sma(values: number[], n: number): number | null {
  if (values.length < n || n <= 0) return null;
  let sum = 0;
  for (let i = values.length - n; i < values.length; i++) sum += values[i];
  return sum / n;
}

/** Wilder-style RSI over `period` closes; null if not enough data. */
export function rsi(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null;
  let gains = 0;
  let losses = 0;
  // Seed with the first `period` changes.
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  // Smooth across the remaining closes.
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

/** Annualized realized volatility (%) from daily closes over the last n days. */
export function annualizedVol(closes: number[], n = 20): number | null {
  if (closes.length < n + 1) return null;
  const rets: number[] = [];
  for (let i = closes.length - n; i < closes.length; i++) {
    rets.push(Math.log(closes[i] / closes[i - 1]));
  }
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const variance = rets.reduce((a, b) => a + (b - mean) ** 2, 0) / (rets.length - 1);
  const daily = Math.sqrt(variance);
  return daily * Math.sqrt(252) * 100;
}

/**
 * Nearest support (below price) and resistance (above price) from recent
 * pivot highs/lows over the last `lookback` bars.
 */
export function swingLevels(
  highs: number[],
  lows: number[],
  price: number,
  lookback = 120,
  pivot = 3,
): { support: number[]; resistance: number[] } {
  const startH = Math.max(pivot, highs.length - lookback);
  const startL = Math.max(pivot, lows.length - lookback);
  const resistances: number[] = [];
  const supports: number[] = [];

  for (let i = startH; i < highs.length - pivot; i++) {
    const win = highs.slice(i - pivot, i + pivot + 1);
    if (highs[i] === Math.max(...win) && highs[i] > price) resistances.push(highs[i]);
  }
  for (let i = startL; i < lows.length - pivot; i++) {
    const win = lows.slice(i - pivot, i + pivot + 1);
    if (lows[i] === Math.min(...win) && lows[i] < price) supports.push(lows[i]);
  }

  // Nearest two on each side, de-duplicated by rounding.
  const resistance = [...new Set(resistances.map((v) => round(v)))]
    .sort((a, b) => a - b)
    .slice(0, 2);
  const support = [...new Set(supports.map((v) => round(v)))]
    .sort((a, b) => b - a)
    .slice(0, 2);
  return { support, resistance };
}

/** Classify the near-term trend from price vs moving averages and RSI. */
export function classifyTrend(
  price: number,
  sma50: number | null,
  sma200: number | null,
  rsiVal: number | null,
): Trend {
  if (sma50 == null || sma200 == null) {
    if (rsiVal != null && rsiVal >= 70) return "Breakout";
    if (rsiVal != null && rsiVal <= 30) return "Breakdown";
    return "Range";
  }
  const above50 = price > sma50;
  const above200 = price > sma200;
  const goldenCross = sma50 > sma200;

  if (above50 && above200 && goldenCross) {
    return rsiVal != null && rsiVal >= 70 ? "Breakout" : "Uptrend";
  }
  if (!above50 && !above200 && !goldenCross) {
    return rsiVal != null && rsiVal <= 30 ? "Breakdown" : "Downtrend";
  }
  return "Range";
}

/** The level whose breach flips the near-term view (the nearer key MA). */
export function invalidationLevel(
  trend: Trend,
  sma50: number | null,
  sma200: number | null,
): number | null {
  if (trend === "Uptrend" || trend === "Breakout") return sma50 ?? sma200;
  if (trend === "Downtrend" || trend === "Breakdown") return sma50 ?? sma200;
  return sma200 ?? sma50;
}

/** Human-readable momentum label from RSI. */
export function momentumLabel(rsiVal: number | null): string {
  if (rsiVal == null) return "Unavailable";
  if (rsiVal >= 70) return `Overbought (RSI ${round(rsiVal, 0)})`;
  if (rsiVal >= 55) return `Bullish (RSI ${round(rsiVal, 0)})`;
  if (rsiVal > 45) return `Neutral (RSI ${round(rsiVal, 0)})`;
  if (rsiVal > 30) return `Bearish (RSI ${round(rsiVal, 0)})`;
  return `Oversold (RSI ${round(rsiVal, 0)})`;
}

/** Human-readable volatility label from annualized realized vol (%). */
export function volatilityLabel(volPct: number | null): string {
  if (volPct == null) return "Unavailable";
  if (volPct >= 45) return `Very elevated (~${round(volPct, 0)}% annualized)`;
  if (volPct >= 30) return `Elevated (~${round(volPct, 0)}% annualized)`;
  if (volPct >= 18) return `Moderate (~${round(volPct, 0)}% annualized)`;
  return `Subdued (~${round(volPct, 0)}% annualized)`;
}
