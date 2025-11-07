export interface ScreenerRow {
  security: {
    id: string;
    marketId: string;
    ticker: string;
    companyName: string;
    sector?: string;
    industry?: string;
    country?: string;
    primaryExchange?: string;
    marketCap?: number;
    sharesOut?: number;
    floatShares?: number;
    optionable?: boolean;
  };
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

export interface NewsItem {
  id: string;
  publishedAt: string;
  source: string;
  headline: string;
  url: string;
  sentiment?: number;
}

export interface ScreenerResponse {
  total: number;
  rows: ScreenerRow[];
}

export interface PriceCandle {
  securityId?: string;
  ts: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  interval?: string;
  sourceTag?: string;
}

export interface IndicatorPoint {
  securityId?: string;
  ts: string;
  kind: string;
  paramsHash: string;
  value: number;
}

export interface Preset {
  id: string;
  name: string;
  createdAt: string;
  filter: any;
}
