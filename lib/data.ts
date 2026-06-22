// Typed access to the local sentiment dataset.
import type { MarketSentiment, Symbol } from "./types";
import raw from "@/data/market_sentiment.json";

const markets = raw as unknown as MarketSentiment[];

export function getMarkets(): MarketSentiment[] {
  return markets;
}

export function getMarket(symbol: Symbol): MarketSentiment | undefined {
  return markets.find((m) => m.symbol === symbol);
}
