import dayjs from "dayjs";
import { PriceCandle } from "../types";

interface Props {
  data: PriceCandle[];
}

const WIDTH = 1000;
const HEIGHT = 360;
const PADDING = 24;

export function CandlestickChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-neutral-400">
        Inga prisuppgifter hittades för de senaste tre åren.
      </div>
    );
  }

  const highs = data.map(d => d.h);
  const lows = data.map(d => d.l);
  const max = Math.max(...highs);
  const min = Math.min(...lows);
  const range = Math.max(max - min, 1e-9);
  const step = data.length > 1 ? (WIDTH - PADDING * 2) / (data.length - 1) : WIDTH - PADDING * 2;

  const scaleY = (value: number) => {
    const normalized = (max - value) / range;
    return PADDING + normalized * (HEIGHT - PADDING * 2);
  };

  const majorTicks = buildTicks(data);

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="h-72 w-full"
      preserveAspectRatio="none"
    >
      <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="#0f1115" />
      {majorTicks.map(tick => (
        <g key={`grid-${tick.x}`}>
          <line
            x1={tick.x}
            x2={tick.x}
            y1={PADDING}
            y2={HEIGHT - PADDING}
            stroke="#1f2937"
            strokeWidth={0.5}
            strokeDasharray="4 4"
          />
          <text
            x={tick.x}
            y={HEIGHT - PADDING / 2}
            fill="#9ca3af"
            fontSize={12}
            textAnchor="middle"
          >
            {tick.label}
          </text>
        </g>
      ))}

      {Array.from({ length: 5 }, (_, i) => {
        const value = max - (range * i) / 4;
        const y = scaleY(value);
        return (
          <g key={`y-${i}`}>
            <line x1={PADDING} x2={WIDTH - PADDING} y1={y} y2={y} stroke="#1f2937" strokeWidth={0.5} />
            <text x={WIDTH - PADDING + 4} y={y + 4} fill="#9ca3af" fontSize={11}>
              {value.toFixed(2)}
            </text>
          </g>
        );
      })}

      {data.map((candle, index) => {
        const x = PADDING + index * step;
        const highY = scaleY(candle.h);
        const lowY = scaleY(candle.l);
        const openY = scaleY(candle.o);
        const closeY = scaleY(candle.c);
        const bodyTop = Math.min(openY, closeY);
        const bodyHeight = Math.max(Math.abs(closeY - openY), 1);
        const bodyWidth = Math.max(step * 0.55, 1.5);
        const color = candle.c >= candle.o ? "#4ade80" : "#f87171";

        return (
          <g key={candle.ts}>
            <line x1={x} x2={x} y1={highY} y2={lowY} stroke={color} strokeWidth={1} />
            <rect
              x={x - bodyWidth / 2}
              y={bodyTop}
              width={bodyWidth}
              height={bodyHeight}
              fill={color}
            />
          </g>
        );
      })}
    </svg>
  );
}

function buildTicks(data: PriceCandle[]) {
  if (data.length === 0) return [] as { x: number; label: string }[];
  const first = dayjs(data[0].ts);
  const last = dayjs(data[data.length - 1].ts);
  const months = last.diff(first, "month");
  const approxTickCount = Math.max(4, Math.min(12, Math.floor(months / 3)));
  const step = Math.max(1, Math.floor(data.length / approxTickCount));
  const ticks: { x: number; label: string }[] = [];
  const width = WIDTH - PADDING * 2;
  for (let index = 0; index < data.length; index += step) {
    const ratio = data.length > 1 ? index / (data.length - 1) : 0;
    const x = PADDING + ratio * width;
    ticks.push({ x, label: dayjs(data[index].ts).format("YYYY-MM") });
  }
  return ticks;
}
