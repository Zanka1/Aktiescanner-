import cron from "node-cron";
import dayjs from "dayjs";
import { detectSignals, buildIndicatorPoints } from "./indicators.js";
import { fetchDailyAV, fetchIntradayAV, fetchNews } from "./providers.js";
import { indicators, intradayPrices, newsByTicker, prices, screenerCache, securities, upsertScreenerRow } from "./store.js";
import { ScreenerRow } from "./types.js";

async function refreshPrices(securityId: string, ticker: string) {
  const daily = await fetchDailyAV(ticker);
  const cutoff = dayjs().subtract(3, "year");
  let limitedDaily = daily.filter(candle => dayjs(candle.ts).isAfter(cutoff));
  if (limitedDaily.length === 0 && daily.length) {
    limitedDaily = daily.slice(-750); // fallback ≈3 års handelsdagar
  }
  const intraday = await fetchIntradayAV(ticker);
  const enrichedDaily = limitedDaily.map(c => ({ ...c, securityId }));
  const enrichedIntraday = intraday.map(c => ({ ...c, securityId }));
  prices.set(securityId, enrichedDaily);
  intradayPrices.set(securityId, enrichedIntraday);
  const indicatorPoints = buildIndicatorPoints(enrichedDaily);
  indicators.set(securityId, indicatorPoints);

  const lastDaily = enrichedDaily.at(-1);
  const prevDaily = enrichedDaily.at(-2);
  const changePct = lastDaily && prevDaily ? ((lastDaily.c - prevDaily.c) / prevDaily.c) * 100 : undefined;
  const volume = lastDaily?.v;
  const avgVolume = enrichedDaily
    .slice(-20)
    .reduce((acc, candle) => acc + candle.v, 0) / Math.max(1, Math.min(20, enrichedDaily.length));
  const relVolume = volume && avgVolume ? volume / avgVolume : undefined;
  const rsi14 = indicatorPoints.filter(p => p.kind === "RSI" && p.paramsHash === "RSI:14").at(-1)?.value;
  const sma20 = indicatorPoints.filter(p => p.kind === "SMA" && p.paramsHash === "SMA:20").at(-1)?.value;
  const sma50 = indicatorPoints.filter(p => p.kind === "SMA" && p.paramsHash === "SMA:50").at(-1)?.value;
  const sma200 = indicatorPoints.filter(p => p.kind === "SMA" && p.paramsHash === "SMA:200").at(-1)?.value;
  const signals = detectSignals(enrichedDaily, indicatorPoints);

  const prevRow = screenerCache.get(securityId);
  const baseRow: ScreenerRow = {
    security: prevRow?.security ?? securities.get(securityId)!,
    lastPrice: lastDaily?.c,
    changePct,
    volume,
    marketCap: prevRow?.marketCap ?? undefined,
    rsi14,
    sma20,
    sma50,
    sma200,
    relVolume,
    latestHeadline: prevRow?.latestHeadline ?? null,
    signals: Array.from(signals),
    avgVolume20: avgVolume || prevRow?.avgVolume20,
    valuation: prevRow?.valuation
  };
  upsertScreenerRow(baseRow);
}

async function refreshNews(ticker: string) {
  const items = await fetchNews(ticker);
  const filtered = items.filter(item => dayjs().diff(dayjs(item.publishedAt), "day") <= 7);
  newsByTicker.set(ticker, filtered);
  const secId = Array.from(screenerCache.values()).find(row => row.security.ticker === ticker)?.security.id;
  if (secId) {
    const row = screenerCache.get(secId);
    if (row) {
      upsertScreenerRow({ ...row, latestHeadline: filtered[0] ?? null });
    }
  }
}

export function startSchedulers() {
  cron.schedule("0 */6 * * *", async () => {
    for (const security of securities.values()) {
      try {
        await refreshPrices(security.id, security.ticker);
      } catch (error) {
        console.error(`Misslyckades uppdatera priser för ${security.ticker}`, error);
      }
    }
  });

  cron.schedule("15 */6 * * *", async () => {
    for (const security of securities.values()) {
      try {
        await refreshNews(security.ticker);
      } catch (error) {
        console.error(`Misslyckades hämta nyheter för ${security.ticker}`, error);
      }
    }
  });
}
