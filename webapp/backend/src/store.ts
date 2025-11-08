import { Market, NewsItem, Preset, PriceCandle, ScreenerRow, Security, TechIndicatorPoint } from "./types.js";

export const markets = new Map<string, Market>();
export const securities = new Map<string, Security>();
export const prices = new Map<string, PriceCandle[]>();
export const intradayPrices = new Map<string, PriceCandle[]>();
export const indicators = new Map<string, TechIndicatorPoint[]>();
export const newsByTicker = new Map<string, NewsItem[]>();
export const presets: Preset[] = [];

export const screenerCache = new Map<string, ScreenerRow>();

export function upsertScreenerRow(row: ScreenerRow) {
  screenerCache.set(row.security.id, row);
}

export function getScreenerRow(securityId: string) {
  return screenerCache.get(securityId);
}
