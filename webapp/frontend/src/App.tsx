import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FilterPanel } from "./components/FilterPanel";
import { ImportModal } from "./components/ImportModal";
import { NewsDrawer } from "./components/NewsDrawer";
import { ResultsTable } from "./components/ResultsTable";
import { TopBar } from "./components/TopBar";
import { CompanyDetail, DETAIL_TABS, DetailTab } from "./components/CompanyDetail";
import { useFilterStore } from "./state/filterStore";
import { Preset, ScreenerResponse, ScreenerRow } from "./types";

export default function App() {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<ScreenerRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [importOpen, setImportOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>("Översikt");
  const [newsRow, setNewsRow] = useState<ScreenerRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState<ScreenerRow | null>(null);
  const { descriptive, technical, news, sort, signal } = useFilterStore();

  async function runSearch(customQuery?: string) {
    setLoading(true);
    try {
      const { data } = await axios.post<ScreenerResponse>("/api/securities/search", {
        q: customQuery ?? query,
        page,
        pageSize: 50,
        filter: {
          descriptive,
          technical,
          news,
          sort,
          signal
        }
      });
      setRows(data.rows);
      setTotal(data.total);
      setSelectedRow(previous => {
        if (!data.rows.length) return null;
        if (!previous) return data.rows[0];
        const match = data.rows.find(item => item.security.id === previous.security.id);
        return match ?? data.rows[0];
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    runSearch().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sort, signal]);

  useEffect(() => {
    runSearch().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(descriptive), JSON.stringify(technical), JSON.stringify(news)]);

  function handlePresetLoaded(preset: Preset) {
    const { descriptive: d, technical: t, news: n, sort: s, signal: sig } = preset.filter;
    useFilterStore.setState(state => ({
      descriptive: d ?? state.descriptive,
      technical: t ?? state.technical,
      news: n ?? state.news,
      sort: s ?? state.sort,
      signal: sig ?? state.signal
    }));
    setTimeout(() => runSearch(query), 0);
  }

  const paginationInfo = useMemo(() => {
    const start = (page - 1) * 50 + 1;
    const end = Math.min(total, page * 50);
    return `${start}-${end} av ${total}`;
  }, [page, total]);

  return (
    <div className="flex min-h-screen flex-col bg-[#0f1115] text-neutral-100">
      <TopBar onSearch={value => runSearch(value)} query={query} setQuery={setQuery} onPresetLoaded={handlePresetLoaded} />
      <FilterPanel />

      <div className="flex flex-col gap-3 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2 text-xs uppercase text-neutral-400">
            {DETAIL_TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded px-3 py-2 ${activeTab === tab ? "bg-blue-600 text-white" : "bg-[#181b22] text-neutral-400"}`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setImportOpen(true)}
              className="rounded bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-500"
            >
              Importera marknad
            </button>
            <div className="text-xs text-neutral-400">{paginationInfo}</div>
          </div>
        </div>

        <div className="rounded-lg border border-neutral-800 bg-[#12161f] p-4 shadow-lg">
          {loading ? (
            <div className="flex h-64 items-center justify-center text-neutral-400">Laddar filterresultat…</div>
          ) : rows.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center text-neutral-400">
              <p className="text-lg font-semibold text-neutral-200">Inga träffar än</p>
              <p className="text-sm text-neutral-400">Importera en marknad eller justera filtren för att se bolag i listan.</p>
            </div>
          ) : (
            <ResultsTable
              rows={rows}
              onOpenNews={row => setNewsRow(row)}
              onSelectRow={row => setSelectedRow(row)}
              onOpenChart={row => {
                setSelectedRow(row);
                setActiveTab("Diagram");
              }}
              selectedRowId={selectedRow?.security.id ?? null}
            />
          )}
        </div>

        <div className="flex items-center justify-end gap-2 text-sm text-neutral-400">
          <button
            onClick={() => setPage(page => Math.max(1, page - 1))}
            disabled={page === 1}
            className="rounded border border-neutral-700 px-3 py-1 disabled:opacity-50"
          >
            Föregående
          </button>
          <span>Sida {page}</span>
          <button
            onClick={() => setPage(page => page + 1)}
            disabled={page * 50 >= total}
            className="rounded border border-neutral-700 px-3 py-1 disabled:opacity-50"
          >
            Nästa
          </button>
        </div>

        <CompanyDetail row={selectedRow} activeTab={activeTab} />
      </div>

      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} onImported={() => runSearch()} />
      <NewsDrawer row={newsRow} onClose={() => setNewsRow(null)} />
    </div>
  );
}
