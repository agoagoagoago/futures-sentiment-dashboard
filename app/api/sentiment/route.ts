import { NextResponse } from "next/server";
import { getMarkets } from "@/lib/data";
import { biasFromScore, resolveBias, sumSubScores } from "@/lib/scoring";
import type { Symbol } from "@/lib/types";

/**
 * GET /api/sentiment            -> all markets
 * GET /api/sentiment?symbol=CL  -> single market
 *
 * Aggregate score and bias are re-derived from sub-scores via lib/scoring so
 * the API stays consistent with the scoring model even if the stored fields
 * drift before a refresh.
 */
export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol")?.toUpperCase() as Symbol | undefined;

  const enriched = getMarkets().map((m) => {
    const computedScore = sumSubScores(m.subScores);
    return {
      ...m,
      computed: {
        score: computedScore,
        bias: resolveBias(computedScore, m.subScores),
        biasFromScoreOnly: biasFromScore(computedScore),
      },
    };
  });

  if (symbol) {
    const one = enriched.find((m) => m.symbol === symbol);
    if (!one) {
      return NextResponse.json(
        { error: `Unknown symbol '${symbol}'. Use CL or ES.` },
        { status: 404 },
      );
    }
    return NextResponse.json(one);
  }

  return NextResponse.json(enriched);
}
