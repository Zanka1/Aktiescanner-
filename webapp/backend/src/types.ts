export type MarketId = string;
export type SecurityId = string;
export type Ticker = string;

export interface Market {
  id: MarketId;
  name: string;
  currency: string;
  timezone: string;
  sourceTag: string;
}

export interface Security {
  id: SecurityId;
  marketId: MarketId;
  ticker: Ticker;
  companyName: string;
  sector?: string;
  industry?: string;
  country?: string;
  primaryExchange?: string;
  marketCap?: number;
  sharesOut?: number;
  ipoDate?: string;
  floatShares?: number;
  shortFloat?: number;
  optionable?: boolean;
}

export interface PriceCandle {
  securityId: SecurityId;
  ts: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  interval: "1d" | "60min" | "5min";
  sourceTag: string;
}

export type IndicatorKind =
  | "SMA"
  | "EMA"
  | "RSI"
  | "MACD"
  | "MACD_SIGNAL"
  | "MACD_HIST"
  | "STOCH_K"
  | "STOCH_D"
  | "ATR"
  | "ADX"
  | "BOLL_UP"
  | "BOLL_MID"
  | "BOLL_LOW";

export interface TechIndicatorPoint {
  securityId: SecurityId;
  ts: string;
  kind: IndicatorKind;
  paramsHash: string;
  value: number;
}

export interface NewsItem {
  id: string;
  publishedAt: string;
  source: string;
  headline: string;
  url: string;
  sentiment?: number;
  tickers: Ticker[];
  summary?: string;
}

export interface ScreenerFilter {
  descriptive?: {
    exchange?: string[];
    sector?: string[];
    industry?: string[];
    country?: string[];
    marketCap?: { min?: number; max?: number };
    price?: { min?: number; max?: number };
    avgVolume?: { min?: number; max?: number };
  };
  technical?: {
    rsi?: { min?: number; max?: number };
    sma?: { period: number; relation: "above" | "below"; to: number }[];
    relVolume?: { min?: number };
    breakout?: "20d_high" | "55d_high" | "20d_low" | "55d_low";
    macdCross?: "bullish" | "bearish";
  };
  news?: {
    freshHours?: number;
    minSentiment?: number;
    keywords?: string[];
  };
  sort?: { by: "Ticker" | "Price" | "Change" | "Volume" | "MarketCap"; dir: "asc" | "desc" };
  signal?: "None" | "MA_CROSS" | "RSI_OVERSOLD" | "RSI_OVERBOUGHT" | "BREAKOUT";
}

export interface Preset {
  id: string;
  name: string;
  filter: ScreenerFilter;
  createdAt: string;
}

export interface ScreenerRow {
  security: Security;
  lastPrice?: number;
  changePct?: number;
  volume?: number;
  marketCap?: number;
  rsi14?: number;
  sma20?: number;
  sma50?: number;
  sma200?: number;
  relVolume?: number;
  latestHeadline?: NewsItem | null;
  signals: string[];
  avgVolume20?: number;
  valuation?: {
    peRatio?: number;
    pbRatio?: number;
    buffettIntrinsic?: number;
    buffettMargin?: number;
    magicFormulaRank?: number;
    roc?: number;
  };
}
