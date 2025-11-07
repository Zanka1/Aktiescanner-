import axios from "axios";
import dayjs from "dayjs";
import { NewsItem, PriceCandle } from "./types.js";

const AV = process.env.ALPHAVANTAGE_KEY;
const NEWS = process.env.NEWSAPI_KEY;

if (!AV) {
  console.warn("⚠️  ALPHAVANTAGE_KEY saknas. Lägg till den i .env för att få prisdata.");
}
if (!NEWS) {
  console.warn("⚠️  NEWSAPI_KEY saknas. Nyhetsflödet blir tomt tills du lägger till nyckeln.");
}

export async function fetchDailyAV(ticker: string): Promise<PriceCandle[]> {
  if (!AV) return [];
  const url = "https://www.alphavantage.co/query";
  const params = {
    function: "TIME_SERIES_DAILY_ADJUSTED",
    symbol: ticker,
    apikey: AV,
    outputsize: "full"
  } as const;
  const { data } = await axios.get(url, { params });
  const series = data["Time Series (Daily)"] ?? {};
  return Object.entries(series)
    .map(([date, v]: [string, any]) => ({
      ts: dayjs(date).endOf("day").toISOString(),
      o: parseFloat(v["1. open"]),
      h: parseFloat(v["2. high"]),
      l: parseFloat(v["3. low"]),
      c: parseFloat(v["4. close"]),
      v: parseInt(v["6. volume"], 10) || 0,
      interval: "1d" as const,
      sourceTag: "alpha-vantage"
    }))
    .sort((a, b) => a.ts.localeCompare(b.ts));
}

export async function fetchIntradayAV(ticker: string): Promise<PriceCandle[]> {
  if (!AV) return [];
  const url = "https://www.alphavantage.co/query";
  const params = {
    function: "TIME_SERIES_INTRADAY",
    symbol: ticker,
    interval: "60min",
    apikey: AV,
    outputsize: "compact"
  } as const;
  const { data } = await axios.get(url, { params });
  const series = data["Time Series (60min)"] ?? {};
  return Object.entries(series)
    .map(([date, v]: [string, any]) => ({
      ts: dayjs(date).toISOString(),
      o: parseFloat(v["1. open"]),
      h: parseFloat(v["2. high"]),
      l: parseFloat(v["3. low"]),
      c: parseFloat(v["4. close"]),
      v: parseInt(v["5. volume"], 10) || 0,
      interval: "60min" as const,
      sourceTag: "alpha-vantage"
    }))
    .sort((a, b) => a.ts.localeCompare(b.ts));
}

export async function fetchNews(keyword: string): Promise<NewsItem[]> {
  if (!NEWS) return [];
  const url = "https://newsapi.org/v2/everything";
  const { data } = await axios.get(url, {
    params: {
      q: keyword,
      sortBy: "publishedAt",
      language: "en",
      apiKey: NEWS,
      pageSize: 50
    }
  });
  const articles = data.articles ?? [];
  return articles.map((article: any) => ({
    id: article.url,
    publishedAt: article.publishedAt,
    source: article.source?.name ?? "unknown",
    headline: article.title,
    url: article.url,
    sentiment: undefined,
    tickers: [],
    summary: article.description
  }));
}
