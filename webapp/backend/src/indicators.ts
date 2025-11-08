import { PriceCandle, TechIndicatorPoint } from "./types.js";

function rollingWindow<T>(values: T[], length: number, cb: (window: T[], idx: number) => void) {
  const window: T[] = [];
  for (let i = 0; i < values.length; i++) {
    window.push(values[i]);
    if (window.length > length) window.shift();
    cb(window, i);
  }
}

export function sma(values: number[], period: number): (number | null)[] {
  const out = Array<number | null>(values.length).fill(null);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

export function ema(values: number[], period: number): (number | null)[] {
  const out = Array<number | null>(values.length).fill(null);
  const k = 2 / (period + 1);
  let prev: number | null = null;
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    prev = prev === null ? value : value * k + prev * (1 - k);
    if (i >= period - 1) out[i] = prev;
  }
  return out;
}

export function rsi(values: number[], period = 14): (number | null)[] {
  const out = Array<number | null>(values.length).fill(null);
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i < values.length; i++) {
    const change = values[i] - values[i - 1];
    const gain = Math.max(change, 0);
    const loss = Math.max(-change, 0);
    if (i <= period) {
      avgGain += gain;
      avgLoss += loss;
      if (i === period) {
        avgGain /= period;
        avgLoss /= period;
        const rs = avgLoss === 0 ? 100 : avgGain / (avgLoss || 1e-9);
        out[i] = 100 - 100 / (1 + rs);
      }
    } else {
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
      const rs = avgLoss === 0 ? 100 : avgGain / (avgLoss || 1e-9);
      out[i] = 100 - 100 / (1 + rs);
    }
  }
  return out;
}

export function macd(values: number[], fast = 12, slow = 26, signal = 9) {
  const fastEma = ema(values, fast);
  const slowEma = ema(values, slow);
  const macdLine = values.map((_, i) =>
    fastEma[i] !== null && slowEma[i] !== null ? (fastEma[i]! - slowEma[i]!) : null
  );
  const signalLine = ema(macdLine.map(v => v ?? 0), signal);
  const hist = macdLine.map((v, i) => (v !== null && signalLine[i] !== null ? v - signalLine[i]! : null));
  return { macdLine, signalLine, hist };
}

export function stochasticOscillator(candles: PriceCandle[], period = 14, smoothK = 3, smoothD = 3) {
  const highs = candles.map(c => c.h);
  const lows = candles.map(c => c.l);
  const closes = candles.map(c => c.c);
  const rawK: (number | null)[] = Array(candles.length).fill(null);
  rollingWindow(closes, period, (_window, idx) => {
    if (idx < period - 1) return;
    const slice = closes.slice(idx - period + 1, idx + 1);
    const high = Math.max(...highs.slice(idx - period + 1, idx + 1));
    const low = Math.min(...lows.slice(idx - period + 1, idx + 1));
    rawK[idx] = high === low ? 0 : ((closes[idx] - low) / (high - low)) * 100;
  });
  const smoothedK = sma(rawK.map(v => v ?? 0), smoothK);
  const smoothedD = sma(smoothedK.map(v => v ?? 0), smoothD);
  return { k: smoothedK, d: smoothedD };
}

export function atr(candles: PriceCandle[], period = 14): (number | null)[] {
  const tr: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      tr.push(candles[i].h - candles[i].l);
    } else {
      const highLow = candles[i].h - candles[i].l;
      const highClose = Math.abs(candles[i].h - candles[i - 1].c);
      const lowClose = Math.abs(candles[i].l - candles[i - 1].c);
      tr.push(Math.max(highLow, highClose, lowClose));
    }
  }
  const out = Array<number | null>(candles.length).fill(null);
  let prevAtr: number | null = null;
  for (let i = 0; i < tr.length; i++) {
    if (i < period) {
      prevAtr = (prevAtr ?? 0) + tr[i] / period;
      if (i === period - 1) out[i] = prevAtr;
    } else {
      prevAtr = ((prevAtr ?? tr[i]) * (period - 1) + tr[i]) / period;
      out[i] = prevAtr;
    }
  }
  return out;
}

export function adx(candles: PriceCandle[], period = 14): (number | null)[] {
  if (candles.length < period + 1) return Array(candles.length).fill(null);
  const dmPlus: number[] = [];
  const dmMinus: number[] = [];
  const tr: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const upMove = candles[i].h - candles[i - 1].h;
    const downMove = candles[i - 1].l - candles[i].l;
    dmPlus.push(upMove > downMove && upMove > 0 ? upMove : 0);
    dmMinus.push(downMove > upMove && downMove > 0 ? downMove : 0);
    const highLow = candles[i].h - candles[i].l;
    const highClose = Math.abs(candles[i].h - candles[i - 1].c);
    const lowClose = Math.abs(candles[i].l - candles[i - 1].c);
    tr.push(Math.max(highLow, highClose, lowClose));
  }

  const smoothedTr = atr(candles.slice(1), period).map(v => v ?? 0);
  const smoothedPlus = ema(dmPlus, period).map(v => v ?? 0);
  const smoothedMinus = ema(dmMinus, period).map(v => v ?? 0);
  const diPlus = smoothedPlus.map((v, i) => (smoothedTr[i] === 0 ? 0 : (100 * v) / smoothedTr[i]));
  const diMinus = smoothedMinus.map((v, i) => (smoothedTr[i] === 0 ? 0 : (100 * v) / smoothedTr[i]));
  const dx = diPlus.map((v, i) => {
    const diff = Math.abs(v - diMinus[i]);
    const sum = v + diMinus[i];
    return sum === 0 ? 0 : (100 * diff) / sum;
  });
  const adxValues = ema(dx, period);
  return [null, ...adxValues];
}

export function bollingerBands(values: number[], period = 20, multiplier = 2) {
  const mid = sma(values, period);
  const upper: (number | null)[] = Array(values.length).fill(null);
  const lower: (number | null)[] = Array(values.length).fill(null);
  for (let i = 0; i < values.length; i++) {
    if (i >= period - 1 && mid[i] !== null) {
      const slice = values.slice(i - period + 1, i + 1);
      const mean = mid[i]!;
      const variance = slice.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / period;
      const std = Math.sqrt(variance);
      upper[i] = mean + multiplier * std;
      lower[i] = mean - multiplier * std;
    }
  }
  return { upper, mid, lower };
}

export function buildIndicatorPoints(candles: PriceCandle[]): TechIndicatorPoint[] {
  if (candles.length === 0) return [];
  const closes = candles.map(c => c.c);
  const dates = candles.map(c => c.ts);
  const sma20 = sma(closes, 20);
  const sma50 = sma(closes, 50);
  const sma200 = sma(closes, 200);
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const rsi14 = rsi(closes, 14);
  const macdData = macd(closes);
  const stoch = stochasticOscillator(candles);
  const atr14 = atr(candles, 14);
  const adx14 = adx(candles, 14);
  const boll = bollingerBands(closes, 20, 2);

  const pack: TechIndicatorPoint[] = [];
  for (let i = 0; i < candles.length; i++) {
    const ts = dates[i];
    if (sma20[i] != null) pack.push({ securityId: candles[i].securityId, ts, kind: "SMA", paramsHash: "SMA:20", value: sma20[i]! });
    if (sma50[i] != null) pack.push({ securityId: candles[i].securityId, ts, kind: "SMA", paramsHash: "SMA:50", value: sma50[i]! });
    if (sma200[i] != null) pack.push({ securityId: candles[i].securityId, ts, kind: "SMA", paramsHash: "SMA:200", value: sma200[i]! });
    if (ema12[i] != null) pack.push({ securityId: candles[i].securityId, ts, kind: "EMA", paramsHash: "EMA:12", value: ema12[i]! });
    if (ema26[i] != null) pack.push({ securityId: candles[i].securityId, ts, kind: "EMA", paramsHash: "EMA:26", value: ema26[i]! });
    if (rsi14[i] != null) pack.push({ securityId: candles[i].securityId, ts, kind: "RSI", paramsHash: "RSI:14", value: rsi14[i]! });
    if (macdData.macdLine[i] != null) pack.push({ securityId: candles[i].securityId, ts, kind: "MACD", paramsHash: "MACD:12,26", value: macdData.macdLine[i]! });
    if (macdData.signalLine[i] != null) pack.push({ securityId: candles[i].securityId, ts, kind: "MACD_SIGNAL", paramsHash: "MACD_SIGNAL:9", value: macdData.signalLine[i]! });
    if (macdData.hist[i] != null) pack.push({ securityId: candles[i].securityId, ts, kind: "MACD_HIST", paramsHash: "MACD_HIST:12,26,9", value: macdData.hist[i]! });
    if (stoch.k[i] != null) pack.push({ securityId: candles[i].securityId, ts, kind: "STOCH_K", paramsHash: "STOCH:14,3", value: stoch.k[i]! });
    if (stoch.d[i] != null) pack.push({ securityId: candles[i].securityId, ts, kind: "STOCH_D", paramsHash: "STOCH:14,3,3", value: stoch.d[i]! });
    if (atr14[i] != null) pack.push({ securityId: candles[i].securityId, ts, kind: "ATR", paramsHash: "ATR:14", value: atr14[i]! });
    if (adx14[i] != null) pack.push({ securityId: candles[i].securityId, ts, kind: "ADX", paramsHash: "ADX:14", value: adx14[i]! });
    if (boll.upper[i] != null) pack.push({ securityId: candles[i].securityId, ts, kind: "BOLL_UP", paramsHash: "BOLL:20,2", value: boll.upper[i]! });
    if (boll.mid[i] != null) pack.push({ securityId: candles[i].securityId, ts, kind: "BOLL_MID", paramsHash: "BOLL:20,2", value: boll.mid[i]! });
    if (boll.lower[i] != null) pack.push({ securityId: candles[i].securityId, ts, kind: "BOLL_LOW", paramsHash: "BOLL:20,2", value: boll.lower[i]! });
  }
  return pack;
}

export function detectSignals(candles: PriceCandle[], indicators: TechIndicatorPoint[]) {
  if (!candles.length) return new Set<string>();
  const latest = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const map = new Map<string, TechIndicatorPoint>();
  for (const point of indicators) {
    const key = `${point.kind}:${point.paramsHash}:${point.ts}`;
    map.set(key, point);
  }
  const lastTs = latest.ts;
  const find = (kind: string, paramsHash: string) => indicators
    .filter(x => x.kind === kind && x.paramsHash === paramsHash)
    .sort((a, b) => a.ts.localeCompare(b.ts))
    .at(-1)?.value ?? null;

  const signals = new Set<string>();
  const sma50 = find("SMA", "SMA:50");
  const sma200 = find("SMA", "SMA:200");
  if (sma50 !== null && sma200 !== null) {
    const prev50 = indicators
      .filter(x => x.kind === "SMA" && x.paramsHash === "SMA:50" && x.ts < lastTs)
      .sort((a, b) => a.ts.localeCompare(b.ts))
      .at(-1)?.value ?? null;
    const prev200 = indicators
      .filter(x => x.kind === "SMA" && x.paramsHash === "SMA:200" && x.ts < lastTs)
      .sort((a, b) => a.ts.localeCompare(b.ts))
      .at(-1)?.value ?? null;
    if (prev50 !== null && prev200 !== null) {
      if (prev50 <= prev200 && sma50 > sma200) signals.add("MA50_cross_up");
      if (prev50 >= prev200 && sma50 < sma200) signals.add("MA50_cross_down");
    }
  }

  const rsi14 = find("RSI", "RSI:14");
  if (rsi14 !== null) {
    if (rsi14 < 30) signals.add("RSI_Oversold");
    if (rsi14 > 70) signals.add("RSI_Overbought");
  }

  if (prev && latest.c > prev.c) {
    const high20 = Math.max(...candles.slice(-20).map(c => c.h));
    const low20 = Math.min(...candles.slice(-20).map(c => c.l));
    if (latest.c >= high20) signals.add("Breakout20High");
    if (latest.c <= low20) signals.add("Breakout20Low");
  }

  return signals;
}
