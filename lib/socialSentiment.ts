// Real social sentiment from the StockTwits public API (keyless).
// Each message may carry a native entities.sentiment.basic ("Bullish"/"Bearish");
// untagged messages are classified with a small keyword lexicon to enlarge the
// sample. Several related tickers are aggregated per market for robustness.

import type { Symbol, SocialSample, SocialSentimentSummary } from "./types";
import { scoreSocialSentiment } from "./scoring";

/** Related StockTwits tickers aggregated per market. */
const STOCKTWITS_SYMBOLS: Record<Symbol, string[]> = {
  CL: ["CL_F", "USOIL"],
  ES: ["ES_F", "SPY", "SPX"],
};

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

export const SOCIAL_REVALIDATE_SECONDS = 900;

const BULL_WORDS = [
  "bull", "bullish", "long", "calls", "buy", "buying", "breakout", "bounce",
  "support", "rip", "ripping", "moon", "rocket", "ath", "up", "green", "rally",
  "higher", "send", "pump", "squeeze", "uptrend", "dip buy",
];
const BEAR_WORDS = [
  "bear", "bearish", "short", "puts", "sell", "selling", "breakdown", "dump",
  "dumping", "crash", "resistance", "top", "down", "red", "drop", "lower",
  "tank", "rug", "rejected", "downtrend", "fade", "rollover",
];

export type SocialLabel = SocialSample["sentiment"];

/** Keyword-based fallback classifier for messages with no native tag. */
export function classifyBody(body: string): SocialLabel {
  const text = ` ${body.toLowerCase()} `;
  let bull = 0;
  let bear = 0;
  for (const w of BULL_WORDS) if (text.includes(` ${w}`)) bull++;
  for (const w of BEAR_WORDS) if (text.includes(` ${w}`)) bear++;
  if (bull > bear) return "Bullish";
  if (bear > bull) return "Bearish";
  return "Neutral";
}

interface STMessage {
  id: number;
  body: string;
  created_at: string;
  entities?: { sentiment?: { basic?: string } | null };
}

function isoNow(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}

async function fetchStockTwitsSymbol(ticker: string): Promise<STMessage[]> {
  const url = `https://api.stocktwits.com/api/2/streams/symbol/${encodeURIComponent(ticker)}.json`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    next: { revalidate: SOCIAL_REVALIDATE_SECONDS },
  });
  if (!res.ok) throw new Error(`StockTwits ${ticker} responded ${res.status}`);
  const json = (await res.json()) as { messages?: STMessage[] };
  return json.messages ?? [];
}

/**
 * Aggregate social sentiment for a market across its related tickers.
 * Throws only if every ticker fetch fails (caller handles fallback).
 */
export async function fetchSocial(symbol: Symbol): Promise<SocialSentimentSummary> {
  const tickers = STOCKTWITS_SYMBOLS[symbol];
  const results = await Promise.allSettled(tickers.map((t) => fetchStockTwitsSymbol(t)));

  let bullish = 0;
  let bearish = 0;
  let neutral = 0;
  let nativeTagged = 0;
  const symbolsUsed: string[] = [];
  const samples: SocialSample[] = [];

  results.forEach((r, i) => {
    if (r.status !== "fulfilled") return;
    const ticker = tickers[i];
    symbolsUsed.push(ticker);
    for (const msg of r.value) {
      const native = msg.entities?.sentiment?.basic;
      let label: SocialLabel;
      if (native === "Bullish" || native === "Bearish") {
        label = native;
        nativeTagged++;
      } else {
        label = classifyBody(msg.body ?? "");
      }
      if (label === "Bullish") bullish++;
      else if (label === "Bearish") bearish++;
      else neutral++;

      if (samples.length < 5 && (msg.body ?? "").trim()) {
        samples.push({
          ticker,
          body: msg.body.length > 220 ? `${msg.body.slice(0, 217)}...` : msg.body,
          sentiment: label,
          createdAt: msg.created_at ?? "",
          url: `https://stocktwits.com/symbol/${ticker}`,
        });
      }
    }
  });

  if (symbolsUsed.length === 0) {
    throw new Error(`All StockTwits requests failed for ${symbol}`);
  }

  const total = bullish + bearish + neutral;
  const { score } = scoreSocialSentiment({ bullish, bearish, nativeTagged });

  return {
    available: true,
    score,
    bullish,
    bearish,
    neutral,
    total,
    nativeTagged,
    symbolsUsed,
    samples,
    source: `StockTwits (${symbolsUsed.map((s) => `$${s}`).join(", ")})`,
    asOf: isoNow(),
  };
}
