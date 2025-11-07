import { parse } from "csv-parse";
import * as XLSX from "xlsx";
import { Market, ScreenerRow, Security } from "./types.js";
import { upsertScreenerRow } from "./store.js";

function parseNumberLike(value?: string): number | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const suffix = trimmed.slice(-1).toUpperCase();
  const multiplier = suffix === "B" ? 1e9 : suffix === "M" ? 1e6 : suffix === "K" ? 1e3 : 1;
  const numeric = parseFloat(trimmed.replace(/[BMK,\s]/gi, ""));
  if (Number.isNaN(numeric)) return undefined;
  return numeric * multiplier;
}

function toBool(value?: string): boolean | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (["yes", "y", "true", "1"].includes(normalized)) return true;
  if (["no", "n", "false", "0"].includes(normalized)) return false;
  return undefined;
}

function normalizeTicker(value: string): string {
  return value.trim().toUpperCase();
}

function rowToSecurity(row: Record<string, string>, market: Market): Security | null {
  const ticker = normalizeTicker(row.Symbol || row.Ticker || row["Ticker Symbol"] || "");
  if (!ticker) return null;
  return {
    id: `${market.id}:${ticker}`,
    marketId: market.id,
    ticker,
    companyName: row.Name || row.Company || row.LongName || row["Company Name"] || ticker,
    sector: row.Sector || row["Sector/Industry"] || undefined,
    industry: row.Industry || undefined,
    country: row.Country || market.name,
    primaryExchange: row.Exchange || row["Primary Exchange"] || undefined,
    marketCap: parseNumberLike(row["Market Cap"] || row.MarketCap),
    sharesOut: parseNumberLike(row.Shares || row["Shares Outstanding"]),
    ipoDate: row["IPO Date"] || row["IPO"] || undefined,
    floatShares: parseNumberLike(row["Float"] || row["Float Shares"]),
    shortFloat: parseNumberLike(row["Short Float"]),
    optionable: toBool(row.Optionable)
  };
}

export async function importYahooCSV(buffer: Buffer, market: Market) {
  const records: Record<string, string>[] = [];
  await new Promise<void>((resolve, reject) => {
    parse(buffer, { columns: true, skip_empty_lines: true, trim: true }, (err, rows: Record<string, string>[]) => {
      if (err) return reject(err);
      records.push(...rows);
      resolve();
    });
  });
  return normalizeRecords(records, market);
}

export function importYahooExcel(buffer: Buffer, market: Market) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { raw: false });
  return normalizeRecords(rows, market);
}

function normalizeRecords(records: Record<string, string>[], market: Market) {
  const items: Security[] = [];
  for (const record of records) {
    const security = rowToSecurity(record, market);
    if (!security) continue;
    items.push(security);
  }
  const unique = new Map<string, Security>();
  for (const sec of items) {
    unique.set(sec.id, sec);
  }
  const normalized = Array.from(unique.values());
  normalized.forEach(sec => {
    upsertScreenerRow({
      security: sec,
      signals: []
    } as ScreenerRow);
  });
  return normalized;
}
