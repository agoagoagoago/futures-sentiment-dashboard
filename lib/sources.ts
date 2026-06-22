// Curated, real public data sources used for citations across the dashboard
// and report. These are stable, verifiable URLs — not invented links.
// Update the list as you add or change sources.

export interface SourceRef {
  key: string;
  title: string;
  publisher: string;
  url: string;
  /** Which market(s) the source is most relevant to. */
  markets: ("CL" | "ES" | "both")[];
  category: string;
}

export const SOURCES: SourceRef[] = [
  // ---- Crude Oil (CL) ----
  {
    key: "eia-weekly",
    title: "Weekly Petroleum Status Report (crude inventories)",
    publisher: "U.S. Energy Information Administration (EIA)",
    url: "https://www.eia.gov/petroleum/supply/weekly/",
    markets: ["CL"],
    category: "Inventories",
  },
  {
    key: "eia-steo",
    title: "Short-Term Energy Outlook (STEO)",
    publisher: "U.S. Energy Information Administration (EIA)",
    url: "https://www.eia.gov/outlooks/steo/",
    markets: ["CL"],
    category: "Supply/Demand",
  },
  {
    key: "opec",
    title: "OPEC Monthly Oil Market Report & meeting schedule",
    publisher: "OPEC",
    url: "https://www.opec.org/opec_web/en/publications/338.htm",
    markets: ["CL"],
    category: "OPEC+",
  },
  {
    key: "iea-omr",
    title: "Oil Market Report",
    publisher: "International Energy Agency (IEA)",
    url: "https://www.iea.org/topics/oil-market-report",
    markets: ["CL"],
    category: "Supply/Demand",
  },
  {
    key: "api-stats",
    title: "Weekly Statistical Bulletin (API inventories)",
    publisher: "American Petroleum Institute (API)",
    url: "https://www.api.org/products-and-services/statistics",
    markets: ["CL"],
    category: "Inventories",
  },
  {
    key: "eia-china",
    title: "China energy data & analysis",
    publisher: "U.S. Energy Information Administration (EIA)",
    url: "https://www.eia.gov/international/analysis/country/CHN",
    markets: ["CL"],
    category: "China demand",
  },

  // ---- S&P 500 E-mini (ES) ----
  {
    key: "fomc-calendar",
    title: "FOMC meeting calendar & statements",
    publisher: "U.S. Federal Reserve",
    url: "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm",
    markets: ["ES"],
    category: "Fed policy",
  },
  {
    key: "bls-cpi",
    title: "Consumer Price Index (CPI) release schedule",
    publisher: "U.S. Bureau of Labor Statistics (BLS)",
    url: "https://www.bls.gov/cpi/",
    markets: ["ES"],
    category: "Inflation",
  },
  {
    key: "bls-employment",
    title: "Employment Situation (Nonfarm Payrolls)",
    publisher: "U.S. Bureau of Labor Statistics (BLS)",
    url: "https://www.bls.gov/news.release/empsit.toc.htm",
    markets: ["ES"],
    category: "Labor market",
  },
  {
    key: "bea-pce",
    title: "Personal Income & Outlays (PCE inflation)",
    publisher: "U.S. Bureau of Economic Analysis (BEA)",
    url: "https://www.bea.gov/data/personal-consumption-expenditures-price-index",
    markets: ["ES"],
    category: "Inflation",
  },
  {
    key: "bea-gdp",
    title: "Gross Domestic Product (GDP)",
    publisher: "U.S. Bureau of Economic Analysis (BEA)",
    url: "https://www.bea.gov/data/gdp/gross-domestic-product",
    markets: ["ES"],
    category: "Growth",
  },
  {
    key: "ism",
    title: "ISM Manufacturing & Services PMI reports",
    publisher: "Institute for Supply Management (ISM)",
    url: "https://www.ismworld.org/supply-management-news-and-reports/reports/",
    markets: ["ES"],
    category: "Growth",
  },

  // ---- Cross-market / shared ----
  {
    key: "cftc-cot",
    title: "Commitments of Traders (COT) reports",
    publisher: "U.S. Commodity Futures Trading Commission (CFTC)",
    url: "https://www.cftc.gov/MarketReports/CommitmentsofTraders/index.htm",
    markets: ["both"],
    category: "Positioning",
  },
  {
    key: "cme-cl",
    title: "Crude Oil (CL) futures contract specs & quotes",
    publisher: "CME Group",
    url: "https://www.cmegroup.com/markets/energy/crude-oil/light-sweet-crude.html",
    markets: ["CL"],
    category: "Technicals",
  },
  {
    key: "cme-es",
    title: "E-mini S&P 500 (ES) futures contract specs & quotes",
    publisher: "CME Group",
    url: "https://www.cmegroup.com/markets/equities/sp/e-mini-sandp500.html",
    markets: ["ES"],
    category: "Technicals",
  },
  {
    key: "cboe-vix",
    title: "Cboe Volatility Index (VIX)",
    publisher: "Cboe Global Markets",
    url: "https://www.cboe.com/tradable_products/vix/",
    markets: ["ES"],
    category: "Volatility",
  },
  {
    key: "fred",
    title: "Federal Reserve Economic Data (yields, USD, credit spreads)",
    publisher: "Federal Reserve Bank of St. Louis (FRED)",
    url: "https://fred.stlouisfed.org/",
    markets: ["both"],
    category: "Macro",
  },
  {
    key: "tradingview",
    title: "Community trade ideas & charts",
    publisher: "TradingView",
    url: "https://www.tradingview.com/",
    markets: ["both"],
    category: "Social/Technicals",
  },
  {
    key: "stocktwits",
    title: "Retail message-stream sentiment",
    publisher: "StockTwits",
    url: "https://stocktwits.com/",
    markets: ["both"],
    category: "Social",
  },
  {
    key: "google-trends",
    title: "Search-interest trends",
    publisher: "Google Trends",
    url: "https://trends.google.com/trends/",
    markets: ["both"],
    category: "Social",
  },
];

/** Look up a source URL by key (falls back to empty string). */
export function sourceUrl(key: string): string {
  return SOURCES.find((s) => s.key === key)?.url ?? "";
}

/** All sources relevant to a given market (includes shared "both" sources). */
export function sourcesFor(market: "CL" | "ES"): SourceRef[] {
  return SOURCES.filter(
    (s) => s.markets.includes(market) || s.markets.includes("both"),
  );
}
