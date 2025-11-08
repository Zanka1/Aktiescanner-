import dayjs from "dayjs";
import { ScreenerRow } from "../types";

interface Props {
  row: ScreenerRow | null;
  onClose: () => void;
}

export function NewsDrawer({ row, onClose }: Props) {
  if (!row) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-end bg-black/60">
      <div className="h-full w-full max-w-xl overflow-y-auto border-l border-neutral-800 bg-[#10131a] p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">{row.security.ticker}</h2>
            <p className="text-sm text-neutral-400">Senaste nyheter</p>
          </div>
          <button onClick={onClose} className="rounded bg-neutral-800 px-3 py-1 text-sm text-neutral-200 hover:bg-neutral-700">
            Stäng
          </button>
        </div>
        {row.latestHeadline ? (
          <article className="space-y-4">
            <a href={row.latestHeadline.url} target="_blank" rel="noreferrer" className="block rounded border border-neutral-800 bg-[#141820] p-4 hover:border-blue-500">
              <h3 className="text-base font-semibold text-blue-300">{row.latestHeadline.headline}</h3>
              <p className="text-sm text-neutral-400">
                {dayjs(row.latestHeadline.publishedAt).format("YYYY-MM-DD HH:mm")} · {row.latestHeadline.source}
              </p>
            </a>
            <p className="text-xs text-neutral-500">(Fler nyheter visas när backend har laddat fler rubriker för bolaget.)</p>
          </article>
        ) : (
          <p className="text-sm text-neutral-400">Inga färska nyheter hittades för den här tickern.</p>
        )}
      </div>
    </div>
  );
}
