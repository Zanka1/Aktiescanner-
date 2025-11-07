import { FormEvent, useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { useFilterStore } from "../state/filterStore";
import { Preset } from "../types";

type TopBarProps = {
  onSearch: (query: string) => void;
  query: string;
  setQuery: (value: string) => void;
  onPresetLoaded: (preset: Preset) => void;
};

export function TopBar({ onSearch, query, setQuery, onPresetLoaded }: TopBarProps) {
  const { sort, setSort, signal, setSignal, toggleTheme, darkMode } = useFilterStore();
  const [presets, setPresets] = useState<Preset[]>([]);

  async function loadPresets() {
    const { data } = await axios.get<Preset[]>("/api/presets");
    setPresets(data);
  }

  useEffect(() => {
    loadPresets().catch(() => setPresets([]));
  }, []);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSearch(query);
  }

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-neutral-800 bg-[#181b22] px-4 py-3 shadow">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Sök ticker eller bolag"
          className="w-64 rounded border border-neutral-700 bg-[#10131a] px-3 py-2 text-sm focus:outline-none focus:ring"
        />
        <button type="submit" className="rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500">
          Sök
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-neutral-400">
        <label className="flex items-center gap-1">
          Sortera
          <select
            value={`${sort.by}:${sort.dir}`}
            onChange={event => {
              const [by, dir] = event.target.value.split(":") as [typeof sort.by, typeof sort.dir];
              setSort({ by, dir });
            }}
            className="rounded border border-neutral-700 bg-[#10131a] px-2 py-1 text-xs text-neutral-200"
          >
            <option value="Ticker:asc">Ticker A→Ö</option>
            <option value="Ticker:desc">Ticker Ö→A</option>
            <option value="Price:desc">Pris högst</option>
            <option value="Price:asc">Pris lägst</option>
            <option value="Change:desc">Störst uppgång</option>
            <option value="Change:asc">Störst nedgång</option>
            <option value="Volume:desc">Volym högst</option>
            <option value="Volume:asc">Volym lägst</option>
            <option value="MarketCap:desc">Störst bolag</option>
            <option value="MarketCap:asc">Minst bolag</option>
          </select>
        </label>

        <label className="flex items-center gap-1">
          Signal
          <select
            value={signal}
            onChange={event => setSignal(event.target.value as typeof signal)}
            className="rounded border border-neutral-700 bg-[#10131a] px-2 py-1 text-xs text-neutral-200"
          >
            <option value="None">Ingen</option>
            <option value="MA_CROSS">MA-korsning</option>
            <option value="RSI_OVERSOLD">RSI översåld</option>
            <option value="RSI_OVERBOUGHT">RSI överköpt</option>
            <option value="BREAKOUT">Breakout</option>
          </select>
        </label>

        <button
          onClick={toggleTheme}
          className="rounded border border-neutral-700 bg-[#10131a] px-3 py-2 text-xs font-semibold text-neutral-200 hover:bg-neutral-800"
        >
          {darkMode ? "🌙 Mörkt" : "☀️ Ljust"}
        </button>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="text-xs text-neutral-400">
          {presets.length ? `Mina sparade filter (${presets.length})` : "Inga sparade filter ännu"}
        </div>
        <select
          className="rounded border border-neutral-700 bg-[#10131a] px-2 py-2 text-xs text-neutral-200"
          onChange={event => {
            const preset = presets.find(p => p.id === event.target.value);
            if (preset) {
              onPresetLoaded(preset);
            }
          }}
        >
          <option value="">Ladda preset…</option>
          {presets.map(preset => (
            <option key={preset.id} value={preset.id}>
              {preset.name} – {dayjs(preset.createdAt).format("YYYY-MM-DD HH:mm")}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
