# Futures Sentiment Dashboard — CL & ES

A simple Next.js dashboard and research report that tracks and summarizes market **sentiment**
for two futures markets:

- **Crude Oil futures — `CL`**
- **S&P 500 E-mini futures — `ES`**

It answers: what is sentiment now, what is driving it, is it bullish/bearish/neutral/mixed, what
are the strongest narratives and biggest risks, what catalysts come next, which levels to watch,
what would shift the view, and how confident the read is.

> **Research and educational use only — not financial advice.** The dashboard presents scenario
> analysis and sentiment framing, never buy/sell recommendations.

---

## What this project does

- A **home page** with CL and ES side by side: score, bias label, confidence, top drivers, top
  risks, next catalysts, and last-updated timestamp.
- A **detail page** per market (`/markets/cl`, `/markets/es`) with the full breakdown: sentiment
  gauge, ten-factor score breakdown, narratives, drivers, technical context, positioning, macro/
  news/social context, catalyst calendar, bull/bear/neutral scenarios, key levels, risks, and
  sources.
- A **JSON API** at `/api/sentiment` (optionally `?symbol=CL`) that re-derives the score/bias
  from the scoring model.
- A **research report** at `reports/futures_sentiment_report.md` (regenerable).
- **Data exports** in `data/` as JSON + CSV.

## Tech stack

- [Next.js 15](https://nextjs.org/) (App Router)
- TypeScript
- Tailwind CSS v4
- React 19
- `tsx` for running the TypeScript data/report scripts
- No database, no required external APIs — fully Vercel-ready out of the box.

## How the sentiment scoring works

Each market gets a **−100 to +100** aggregate score, built from **ten sub-scores** (each −10 to
+10). Positive = bullish for price, negative = bearish, zero = neutral.

The aggregate maps to a **bias band** (`lib/scoring.ts`):

| Score | Bias |
| --- | --- |
| +75 … +100 | Strongly bullish |
| +40 … +74 | Bullish |
| +10 … +39 | Mildly bullish |
| −9 … +9 | Neutral |
| −10 … −39 | Mildly bearish |
| −40 … −74 | Bearish |
| −75 … −100 | Strongly bearish |

**Conflict rule:** if signals genuinely conflict (a meaningful mix of strongly bullish and
strongly bearish sub-scores), the market is labeled **`Mixed`** even if the number leans one way.

**CL sub-scores:** Supply outlook · Demand outlook · Inventory trend · OPEC+/geopolitical risk ·
USD/rates pressure · Positioning · Technical trend · News/social sentiment · Volatility/risk
premium · Cross-market confirmation.

**ES sub-scores:** Earnings outlook · Rates/Fed policy · Inflation trend · Growth/labor data ·
Market breadth · Volatility/credit conditions · Positioning · Technical trend · News/social
sentiment · Liquidity/flows.

Every sub-score carries `reasoning` (separating **observed** data from **inference**) and an
`evidenceStrength`. Where data is unavailable it is marked as such and confidence is reduced.

## How to update the data manually

All content lives in **`data/market_sentiment.json`** — this is the single source of truth.

1. Edit `data/market_sentiment.json`:
   - Update each `subScores[].score` and `reasoning` based on current EIA/OPEC/IEA, Fed/BLS/BEA,
     CFTC positioning, technicals, etc.
   - Replace placeholder prices, support/resistance and invalidation levels in
     `technicalContext`.
   - Fill in real catalyst `date`s from the official calendars.
   - Set `positioning.available` to `true` and add detail once you have CFTC/options/flow data.
   - Adjust `confidence` to reflect data quality.
2. Regenerate the aggregate score, bias, timestamp, and all CSVs:
   ```bash
   npm run refresh
   ```
   This recomputes `sentimentScore` from the sub-scores, applies the bias/conflict rules, stamps
   `lastUpdated`, and rewrites `sentiment_scores.csv`, `market_drivers.csv`,
   `catalyst_calendar.csv`, and `key_levels.csv`.
3. Regenerate the markdown report:
   ```bash
   npm run report
   ```

> Tip: keep prices/positioning honest. Don't invent CFTC numbers or live prices — mark them
> unavailable until you have the real data.

## How to run locally

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>. Useful routes:

- `/` — home (both markets)
- `/markets/cl` and `/markets/es` — detail pages
- `/api/sentiment` and `/api/sentiment?symbol=ES` — JSON API

Production build check (the same gate Vercel uses):

```bash
npm run build
```

## How to deploy to Vercel

1. Push the repo to GitHub (already at
   `https://github.com/agoagoagoago/futures-sentiment-dashboard` if you used the included git
   steps).
2. Log in to [Vercel](https://vercel.com) and **Add New → Project**.
3. **Import** `agoagoagoago/futures-sentiment-dashboard`.
4. Keep the **default Next.js settings** (no env vars required).
5. Click **Deploy**.

Add environment variables only later, if you wire in optional external data APIs.

### Git setup (for reference)

```bash
git init
git add .
git commit -m "Initial futures sentiment dashboard"
git branch -M main
git remote add origin https://github.com/agoagoagoago/futures-sentiment-dashboard.git
git push -u origin main
```

## Limitations

- **No live price feed** — technical levels are placeholders for manual update.
- **No live positioning data** — exact CFTC COT, options skew/gamma, and fund flows are not wired
  in; positioning is framework-only until you add it.
- **Catalyst dates are placeholders** — confirm against the official EIA/Fed/BLS/BEA calendars.
- Sentiment scores in the shipped dataset are **illustrative placeholders**, not a live market
  read. Update them before drawing conclusions.
- Sentiment analysis is inherently subjective; corroborate across multiple independent sources.

## Disclaimer

This project is for **research and educational purposes only** and does **not** constitute
financial, investment, or trading advice. Nothing here is a recommendation to buy or sell any
instrument. Futures trading involves substantial risk of loss. Do your own research and consult a
licensed professional before making any decision.
