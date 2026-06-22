// Live market-data fetch via the Yahoo Finance chart API (keyless).
// Unofficial endpoint — resilience: query1 -> query2 host fallback, a
// browser-like User-Agent, and ISR caching to limit request volume.

import type { Symbol } from "./types";

const SYMBOL_MAP: Record<Symbol, string> = {
  CL: "CL=F",
  ES: "ES=F",
};

const HOSTS = ["https://query1.finance.yahoo.com", "https://query2.finance.yahoo.com"];

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

/** How long (seconds) Next.js should cache a fetched chart before revalidating. */
export const CHART_REVALIDATE_SECONDS = 600;

export interface ChartData {
  symbol: Symbol;
  yahooSymbol: string;
  price: number;
  previousClose: number | null;
  dayChangePct: number | null;
  currency: string | null;
  /** Cleaned daily series (oldest -> newest), null candles removed. */
  closes: number[];
  highs: number[];
  lows: number[];
  /** ISO-ish timestamp (UTC) of the read. */
  asOf: string;
  source: string;
}

interface YahooQuote {
  close?: (number | null)[];
  high?: (number | null)[];
  low?: (number | null)[];
}

interface YahooResult {
  meta?: { regularMarketPrice?: number; previousClose?: number; chartPreviousClose?: number; currency?: string };
  timestamp?: number[];
  indicators?: { quote?: YahooQuote[] };
}

interface YahooResponse {
  chart?: { result?: YahooResult[]; error?: { description?: string } | null };
}

function isoNow(): string {
  // YYYY-MM-DD HH:mm UTC
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}

async function fetchHost(host: string, yahooSymbol: string, range: string, interval: string): Promise<YahooResponse> {
  const url = `${host}/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=${range}&interval=${interval}`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    // ISR caching in the Next.js runtime; harmless in plain Node (ignored).
    next: { revalidate: CHART_REVALIDATE_SECONDS },
  });
  if (!res.ok) throw new Error(`Yahoo ${host} responded ${res.status}`);
  return (await res.json()) as YahooResponse;
}

/**
 * Fetch a cleaned daily OHLC series + latest price for a symbol.
 * Tries query1 then query2; throws if both fail (caller handles fallback).
 */
export async function fetchChart(
  symbol: Symbol,
  range = "1y",
  interval = "1d",
): Promise<ChartData> {
  const yahooSymbol = SYMBOL_MAP[symbol];
  let lastErr: unknown;

  for (const host of HOSTS) {
    try {
      const json = await fetchHost(host, yahooSymbol, range, interval);
      const result = json.chart?.result?.[0];
      const err = json.chart?.error?.description;
      if (err) throw new Error(`Yahoo error: ${err}`);
      if (!result?.meta?.regularMarketPrice) throw new Error("Yahoo: missing price in response");

      const quote = result.indicators?.quote?.[0] ?? {};
      const closesRaw = quote.close ?? [];
      const highsRaw = quote.high ?? [];
      const lowsRaw = quote.low ?? [];

      // Keep only candles with a non-null close; align high/low by index.
      const closes: number[] = [];
      const highs: number[] = [];
      const lows: number[] = [];
      for (let i = 0; i < closesRaw.length; i++) {
        const c = closesRaw[i];
        if (c == null || Number.isNaN(c)) continue;
        closes.push(c);
        highs.push(highsRaw[i] ?? c);
        lows.push(lowsRaw[i] ?? c);
      }

      const price = result.meta.regularMarketPrice;
      const previousClose =
        result.meta.previousClose ?? result.meta.chartPreviousClose ?? closes[closes.length - 2] ?? null;
      const dayChangePct =
        previousClose && previousClose !== 0 ? ((price - previousClose) / previousClose) * 100 : null;

      return {
        symbol,
        yahooSymbol,
        price,
        previousClose,
        dayChangePct,
        currency: result.meta.currency ?? null,
        closes,
        highs,
        lows,
        asOf: isoNow(),
        source: `Yahoo Finance (${yahooSymbol})`,
      };
    } catch (e) {
      lastErr = e;
    }
  }
  throw new Error(
    `Failed to fetch ${yahooSymbol} from Yahoo Finance: ${lastErr instanceof Error ? lastErr.message : String(lastErr)}`,
  );
}
