// Shared types for the Futures Sentiment Dashboard.
// These mirror the structure of data/market_sentiment.json.

export type Symbol = "CL" | "ES";

export type Bias =
  | "Strongly bullish"
  | "Bullish"
  | "Mildly bullish"
  | "Neutral"
  | "Mildly bearish"
  | "Bearish"
  | "Strongly bearish"
  | "Mixed";

export type Confidence = "Low" | "Medium" | "High";

export type DirectionalImpact = "Bullish" | "Bearish" | "Neutral" | "Mixed";

export type Strength = "Low" | "Medium" | "High";

export type EvidenceStrength = "Low" | "Medium" | "High" | "Unavailable";

export interface SubScore {
  /** Sub-score dimension name, e.g. "Supply outlook". */
  name: string;
  /** Integer in the range -10..+10. */
  score: number;
  /** Explanation; should separate observed data from inference. */
  reasoning: string;
  evidenceStrength: EvidenceStrength;
}

export interface Driver {
  driver: string;
  category: string;
  directionalImpact: DirectionalImpact;
  strength: Strength;
  evidence: string;
  timeHorizon: string;
  sourceUrl: string;
}

export interface Narrative {
  name: string;
  summary: string;
  implication: DirectionalImpact;
  evidence: string;
  confirmation: string;
  invalidation: string;
  timeHorizon: string;
}

export interface TechnicalContext {
  /** null when live price data is unavailable in this run. */
  currentPrice: number | null;
  trend: string;
  supportLevels: (number | string)[];
  resistanceLevels: (number | string)[];
  movingAverages?: string;
  momentum: string;
  volatility: string;
  invalidationLevels: (number | string)[];
}

export interface Positioning {
  summary: string;
  /** false when exact CFTC / options / flow numbers are not available. */
  available: boolean;
  limitations: string;
}

export interface Catalyst {
  /** YYYY-MM-DD; may be a placeholder pending manual update. */
  date: string;
  market: string;
  event: string;
  whyItMatters: string;
  bullishScenario: string;
  bearishScenario: string;
  sourceUrl: string;
}

export interface BullBearScenario {
  requirements: string[];
  confirmationSignals: string[];
  keyLevels: string[];
  risks: string[];
}

export interface NeutralScenario {
  requirements: string[];
  rangeConditions: string[];
  volatilityRisks: string[];
  rangeBreakSignals: string[];
}

export interface Scenarios {
  bullish: BullBearScenario;
  bearish: BullBearScenario;
  neutral: NeutralScenario;
}

export interface Source {
  title: string;
  publisher: string;
  url: string;
  date: string;
}

export interface Risk {
  risk: string;
  impact: DirectionalImpact;
  description: string;
}

export interface MarketSentiment {
  symbol: Symbol;
  name: string;
  /** Aggregate sentiment score, -100..+100. Placeholder until data is updated. */
  sentimentScore: number;
  bias: Bias;
  confidence: Confidence;
  /** YYYY-MM-DD HH:mm; placeholder token until refreshed. */
  lastUpdated: string;
  summary: string;
  /** Macro / news / social narrative context blocks (free text). */
  macroContext: string;
  newsContext: string;
  socialContext: string;
  /** What would change the current view (higher and lower). */
  whatWouldChange: string;
  subScores: SubScore[];
  drivers: Driver[];
  risks: Risk[];
  narratives: Narrative[];
  technicalContext: TechnicalContext;
  positioning: Positioning;
  catalysts: Catalyst[];
  scenarios: Scenarios;
  sources: Source[];
}
