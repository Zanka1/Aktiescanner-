import { FormEvent, useState } from "react";
import axios from "axios";

interface Props {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

export function ImportModal({ open, onClose, onImported }: Props) {
  const [marketId, setMarketId] = useState("USA");
  const [name, setName] = useState("USA");
  const [currency, setCurrency] = useState("USD");
  const [timezone, setTimezone] = useState("America/New_York");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function ensureMarket() {
    await axios.post("/api/markets", { id: marketId, name, currency, timezone, sourceTag: "manual-import" }).catch(() => {
      /* marknad finns redan */
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!file) {
      setStatus("Välj en fil först (CSV eller XLSX).");
      return;
    }
    setLoading(true);
    setStatus("Importerar…");
    try {
      await ensureMarket();
      const formData = new FormData();
      formData.append("file", file);
      await axios.post(`/api/import/${marketId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setStatus("Import klar! Uppdaterar tabellen…");
      onImported();
      setTimeout(() => {
        setStatus("");
        onClose();
      }, 800);
    } catch (error: any) {
      setStatus(error?.response?.data?.error ?? "Importen misslyckades");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-xl space-y-4 rounded-lg border border-neutral-800 bg-[#0f131b] p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-white">Importera ny marknad</h2>
        <p className="text-sm text-neutral-400">
          Exportera en lista från Yahoo Finance (CSV eller Excel), välj filen här och klicka på Importera. Programmet läser automatiskt kolumner som Symbol, Name, Sector, Industry, Country och Market Cap.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm text-neutral-300">
            Marknads-ID
            <input
              value={marketId}
              onChange={event => setMarketId(event.target.value.toUpperCase())}
              className="mt-1 w-full rounded border border-neutral-700 bg-[#10131a] px-3 py-2 text-sm"
              required
            />
          </label>
          <label className="text-sm text-neutral-300">
            Namn
            <input
              value={name}
              onChange={event => setName(event.target.value)}
              className="mt-1 w-full rounded border border-neutral-700 bg-[#10131a] px-3 py-2 text-sm"
              required
            />
          </label>
          <label className="text-sm text-neutral-300">
            Valuta
            <input
              value={currency}
              onChange={event => setCurrency(event.target.value.toUpperCase())}
              className="mt-1 w-full rounded border border-neutral-700 bg-[#10131a] px-3 py-2 text-sm"
              required
            />
          </label>
          <label className="text-sm text-neutral-300">
            Tidszon
            <input
              value={timezone}
              onChange={event => setTimezone(event.target.value)}
              className="mt-1 w-full rounded border border-neutral-700 bg-[#10131a] px-3 py-2 text-sm"
              required
            />
          </label>
        </div>
        <label className="block text-sm text-neutral-300">
          Välj fil
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={event => setFile(event.target.files?.[0] ?? null)}
            className="mt-1 w-full text-sm text-neutral-300"
          />
        </label>
        {status && <div className="text-sm text-blue-300">{status}</div>}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded border border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800">
            Avbryt
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50"
          >
            {loading ? "Importerar…" : "Importera"}
          </button>
        </div>
      </form>
    </div>
  );
}
