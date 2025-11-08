import { useState } from "react";
import clsx from "clsx";
import { useFilterStore } from "../state/filterStore";

const tabs = ["Beskrivning", "Teknisk", "Nyheter"] as const;
type Tab = (typeof tabs)[number];

export function FilterPanel() {
  const [activeTab, setActiveTab] = useState<Tab>("Beskrivning");
  const { descriptive, technical, news, setDescriptive, setTechnical, setNews } = useFilterStore();

  return (
    <div className="border-b border-neutral-800 bg-[#141820] px-4 pb-3">
      <div className="flex gap-4 border-b border-neutral-800 text-xs uppercase text-neutral-400">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx("px-2 py-3", activeTab === tab && "border-b-2 border-blue-500 text-blue-300")}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-3 lg:grid-cols-4">
        {activeTab === "Beskrivning" && (
          <>
            <div>
              <label className="text-xs text-neutral-400">Sektor</label>
              <input
                value={descriptive.sector?.join(", ") ?? ""}
                onChange={event =>
                  setDescriptive({
                    sector: event.target.value ? event.target.value.split(/,\s*/).filter(Boolean) : undefined
                  })
                }
                placeholder="Teknik, Finans"
                className="mt-1 w-full rounded border border-neutral-700 bg-[#10131a] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-400">Land</label>
              <input
                value={descriptive.country?.join(", ") ?? ""}
                onChange={event =>
                  setDescriptive({
                    country: event.target.value ? event.target.value.split(/,\s*/).filter(Boolean) : undefined
                  })
                }
                placeholder="USA, Sverige"
                className="mt-1 w-full rounded border border-neutral-700 bg-[#10131a] px-3 py-2 text-sm"
              />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <span className="text-xs text-neutral-400">Börsvärde (miljoner)"</span>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={descriptive.marketCap?.min ?? ""}
                  onChange={event => setDescriptive({ marketCap: { ...descriptive.marketCap, min: Number(event.target.value) || undefined } })}
                  placeholder="Min"
                  className="w-full rounded border border-neutral-700 bg-[#10131a] px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  value={descriptive.marketCap?.max ?? ""}
                  onChange={event => setDescriptive({ marketCap: { ...descriptive.marketCap, max: Number(event.target.value) || undefined } })}
                  placeholder="Max"
                  className="w-full rounded border border-neutral-700 bg-[#10131a] px-3 py-2 text-sm"
                />
              </div>
            </div>
          </>
        )}

        {activeTab === "Teknisk" && (
          <>
            <div>
              <label className="text-xs text-neutral-400">RSI max</label>
              <input
                type="number"
                value={technical.rsi?.max ?? ""}
                onChange={event => setTechnical({ rsi: { ...technical.rsi, max: Number(event.target.value) || undefined } })}
                className="mt-1 w-full rounded border border-neutral-700 bg-[#10131a] px-3 py-2 text-sm"
                placeholder="30"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-400">Relativ volym min</label>
              <input
                type="number"
                value={technical.relVolume?.min ?? ""}
                onChange={event => setTechnical({ relVolume: { min: Number(event.target.value) || undefined } })}
                className="mt-1 w-full rounded border border-neutral-700 bg-[#10131a] px-3 py-2 text-sm"
                placeholder="1.5"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-400">Breakout</label>
              <select
                value={technical.breakout ?? ""}
                onChange={event => setTechnical({ breakout: (event.target.value || undefined) as any })}
                className="mt-1 w-full rounded border border-neutral-700 bg-[#10131a] px-3 py-2 text-sm"
              >
                <option value="">Alla</option>
                <option value="20d_high">Över 20-dagars högsta</option>
                <option value="55d_high">Över 55-dagars högsta</option>
                <option value="20d_low">Under 20-dagars lägsta</option>
                <option value="55d_low">Under 55-dagars lägsta</option>
              </select>
            </div>
          </>
        )}

        {activeTab === "Nyheter" && (
          <>
            <div>
              <label className="text-xs text-neutral-400">Nyheter senaste (timmar)</label>
              <input
                type="number"
                value={news.freshHours ?? ""}
                onChange={event => setNews({ freshHours: Number(event.target.value) || undefined })}
                className="mt-1 w-full rounded border border-neutral-700 bg-[#10131a] px-3 py-2 text-sm"
                placeholder="24"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-400">Minsta sentimentscore (-1..1)</label>
              <input
                type="number"
                step="0.1"
                value={news.minSentiment ?? ""}
                onChange={event => setNews({ minSentiment: Number(event.target.value) || undefined })}
                className="mt-1 w-full rounded border border-neutral-700 bg-[#10131a] px-3 py-2 text-sm"
                placeholder="0"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-neutral-400">Nyckelord</label>
              <input
                value={news.keywords?.join(", ") ?? ""}
                onChange={event => setNews({ keywords: event.target.value ? event.target.value.split(/,\s*/) : undefined })}
                placeholder="upgrade, contract, guidance"
                className="mt-1 w-full rounded border border-neutral-700 bg-[#10131a] px-3 py-2 text-sm"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
