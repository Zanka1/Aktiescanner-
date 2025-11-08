import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import { v4 as uuid } from "uuid";
import dayjs from "dayjs";
import { z } from "zod";

import { importYahooCSV, importYahooExcel } from "./import.js";
import { startSchedulers } from "./scheduler.js";
import { indicators, intradayPrices, markets, newsByTicker, presets, prices, screenerCache, securities, upsertScreenerRow } from "./store.js";
import { Preset, ScreenerFilter, ScreenerRow } from "./types.js";

const app = express();
app.use(cors());
app.use(express.json());
const upload = multer();

const filterSchema: z.ZodType<ScreenerFilter> = z.object({
  descriptive: z
    .object({
      exchange: z.array(z.string()).optional(),
      sector: z.array(z.string()).optional(),
      industry: z.array(z.string()).optional(),
      country: z.array(z.string()).optional(),
      marketCap: z.object({ min: z.number().optional(), max: z.number().optional() }).optional(),
      price: z.object({ min: z.number().optional(), max: z.number().optional() }).optional(),
      avgVolume: z.object({ min: z.number().optional(), max: z.number().optional() }).optional()
    })
    .optional(),
  technical: z
    .object({
      rsi: z.object({ min: z.number().optional(), max: z.number().optional() }).optional(),
      sma: z
        .array(
          z.object({
            period: z.number(),
            relation: z.enum(["above", "below"]),
            to: z.number()
          })
        )
        .optional(),
      relVolume: z.object({ min: z.number().optional() }).optional(),
      breakout: z.enum(["20d_high", "55d_high", "20d_low", "55d_low"]).optional(),
      macdCross: z.enum(["bullish", "bearish"]).optional()
    })
    .optional(),
  news: z
    .object({
      freshHours: z.number().optional(),
      minSentiment: z.number().optional(),
      keywords: z.array(z.string()).optional()
    })
    .optional(),
  sort: z
    .object({
      by: z.enum(["Ticker", "Price", "Change", "Volume", "MarketCap"]),
      dir: z.enum(["asc", "desc"])
    })
    .optional(),
  signal: z.enum(["None", "MA_CROSS", "RSI_OVERSOLD", "RSI_OVERBOUGHT", "BREAKOUT"]).optional()
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, markets: markets.size, securities: securities.size });
});

app.post("/api/markets", (req, res) => {
  const body = z
    .object({
      id: z.string(),
      name: z.string(),
      currency: z.string(),
      timezone: z.string().default("UTC"),
      sourceTag: z.string().default("manual-import")
    })
    .parse(req.body);
  markets.set(body.id, body);
  res.json(body);
});

app.post("/api/import/:marketId", upload.single("file"), async (req, res) => {
  const market = markets.get(req.params.marketId);
  if (!market) return res.status(404).json({ error: "market_not_found" });
  if (!req.file) return res.status(400).json({ error: "file_required" });
  const buffer = req.file.buffer;
  const isExcel = req.file.originalname.endsWith(".xlsx") || req.file.originalname.endsWith(".xls");
  const securitiesImported = isExcel ? importYahooExcel(buffer, market) : await importYahooCSV(buffer, market);
  for (const security of securitiesImported) {
    securities.set(security.id, security);
    if (!screenerCache.has(security.id)) {
      upsertScreenerRow({ security, signals: [] } as ScreenerRow);
    }
  }
  res.json({ imported: securitiesImported.length });
});

app.post("/api/presets", (req, res) => {
  const data = z
    .object({
      name: z.string(),
      filter: filterSchema
    })
    .parse(req.body);
  const preset: Preset = { id: uuid(), name: data.name, filter: data.filter, createdAt: new Date().toISOString() };
  presets.push(preset);
  res.json(preset);
});

app.get("/api/presets", (_req, res) => {
  res.json(presets);
});

app.post("/api/securities/search", (req, res) => {
  const q = (req.body?.q ?? "").toString().toLowerCase();
  const filter = req.body?.filter ? filterSchema.parse(req.body.filter) : undefined;
  let result = Array.from(screenerCache.values());
  if (q) {
    result = result.filter(row =>
      row.security.ticker.toLowerCase().includes(q) || row.security.companyName.toLowerCase().includes(q)
    );
  }
  if (filter?.descriptive?.sector?.length) {
    result = result.filter(row => row.security.sector && filter.descriptive!.sector!.includes(row.security.sector));
  }
  if (filter?.descriptive?.country?.length) {
    result = result.filter(row => row.security.country && filter.descriptive!.country!.includes(row.security.country));
  }
  if (filter?.descriptive?.marketCap?.min != null) {
    result = result.filter(row => (row.marketCap ?? row.security.marketCap ?? 0) >= filter.descriptive!.marketCap!.min!);
  }
  if (filter?.descriptive?.marketCap?.max != null) {
    result = result.filter(row => (row.marketCap ?? row.security.marketCap ?? Infinity) <= filter.descriptive!.marketCap!.max!);
  }
  if (filter?.technical?.rsi?.min != null) {
    result = result.filter(row => (row.rsi14 ?? Infinity) >= filter.technical!.rsi!.min!);
  }
  if (filter?.technical?.rsi?.max != null) {
    result = result.filter(row => (row.rsi14 ?? -Infinity) <= filter.technical!.rsi!.max!);
  }
  if (filter?.technical?.relVolume?.min != null) {
    result = result.filter(row => (row.relVolume ?? 0) >= filter.technical!.relVolume!.min!);
  }
  if (filter?.news?.freshHours) {
    result = result.filter(row => {
      const latest = row.latestHeadline?.publishedAt;
      return latest ? dayjs().diff(dayjs(latest), "hour") <= filter.news!.freshHours! : false;
    });
  }
  switch (filter?.signal) {
    case "MA_CROSS":
      result = result.filter(row => row.signals.some(sig => sig.includes("MA50_cross")));
      break;
    case "RSI_OVERSOLD":
      result = result.filter(row => row.signals.includes("RSI_Oversold"));
      break;
    case "RSI_OVERBOUGHT":
      result = result.filter(row => row.signals.includes("RSI_Overbought"));
      break;
    case "BREAKOUT":
      result = result.filter(row => row.signals.some(sig => sig.startsWith("Breakout")));
      break;
    default:
      break;
  }

  if (filter?.sort) {
    const { by, dir } = filter.sort;
    const factor = dir === "asc" ? 1 : -1;
    result = [...result].sort((a, b) => {
      switch (by) {
        case "Ticker":
          return a.security.ticker.localeCompare(b.security.ticker) * factor;
        case "Price":
          return ((a.lastPrice ?? 0) - (b.lastPrice ?? 0)) * factor;
        case "Change":
          return ((a.changePct ?? 0) - (b.changePct ?? 0)) * factor;
        case "Volume":
          return ((a.volume ?? 0) - (b.volume ?? 0)) * factor;
        case "MarketCap":
          return ((a.marketCap ?? a.security.marketCap ?? 0) - (b.marketCap ?? b.security.marketCap ?? 0)) * factor;
        default:
          return 0;
      }
    });
  }

  const page = Number(req.body?.page ?? 1);
  const pageSize = Number(req.body?.pageSize ?? 50);
  const start = (page - 1) * pageSize;
  const paged = result.slice(start, start + pageSize);
  res.json({ total: result.length, rows: paged });
});

app.get("/api/data/:marketId/:ticker", (req, res) => {
  const key = `${req.params.marketId}:${req.params.ticker.toUpperCase()}`;
  const allDaily = prices.get(key) ?? [];
  const cutoff = dayjs().subtract(3, "year");
  const filteredDaily = allDaily.filter(entry => dayjs(entry.ts).isAfter(cutoff));
  const response = {
    prices: filteredDaily,
    intraday: intradayPrices.get(key) ?? [],
    indicators: (indicators.get(key) ?? []).filter(point => dayjs(point.ts).isAfter(cutoff)),
    profile: screenerCache.get(key) ?? null
  };
  res.json(response);
});

app.get("/api/news/:ticker", (req, res) => {
  res.json(newsByTicker.get(req.params.ticker.toUpperCase()) ?? []);
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Aktiescanner backend kör på port ${port}`);
  startSchedulers();
});
