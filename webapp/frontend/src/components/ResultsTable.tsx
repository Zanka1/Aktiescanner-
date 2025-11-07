import { useMemo } from "react";
import { ColumnDef, createColumnHelper, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import clsx from "clsx";
import { ScreenerRow } from "../types";

interface Props {
  rows: ScreenerRow[];
  onOpenNews: (row: ScreenerRow) => void;
  onSelectRow: (row: ScreenerRow) => void;
  onOpenChart: (row: ScreenerRow) => void;
  selectedRowId: string | null;
}

const columnHelper = createColumnHelper<ScreenerRow>();

export function ResultsTable({ rows, onOpenNews, onSelectRow, onOpenChart, selectedRowId }: Props) {
  const columns = useMemo<ColumnDef<ScreenerRow>[]>(
    () => [
      columnHelper.display({
        header: "Nr.",
        cell: info => info.row.index + 1,
        meta: { width: "3rem" }
      }),
      columnHelper.accessor(row => row.security.ticker, {
        id: "ticker",
        header: "Ticker",
        cell: info => (
          <button
            onClick={event => {
              event.stopPropagation();
              onOpenChart(info.row.original);
            }}
            className="font-semibold text-blue-400 hover:underline"
          >
            {info.getValue()}
          </button>
        )
      }),
      columnHelper.accessor(row => row.security.companyName, {
        id: "company",
        header: "Bolag"
      }),
      columnHelper.accessor(row => row.security.sector ?? "-", {
        id: "sector",
        header: "Sektor"
      }),
      columnHelper.accessor(row => row.security.industry ?? "-", {
        id: "industry",
        header: "Industri"
      }),
      columnHelper.accessor(row => row.security.country ?? "-", {
        id: "country",
        header: "Land"
      }),
      columnHelper.accessor(row => row.marketCap ?? row.security.marketCap ?? null, {
        id: "marketCap",
        header: "Börsvärde",
        cell: info => (info.getValue() != null ? formatNumber(info.getValue() as number) : "-"),
        meta: { align: "right" }
      }),
      columnHelper.accessor(row => row.lastPrice ?? null, {
        id: "price",
        header: "Pris",
        cell: info => (info.getValue() != null ? (info.getValue() as number).toFixed(2) : "-"),
        meta: { align: "right" }
      }),
      columnHelper.accessor(row => row.changePct ?? null, {
        id: "change",
        header: "%",
        cell: info => (info.getValue() != null ? `${(info.getValue() as number).toFixed(2)}%` : "-"),
        meta: { align: "right" }
      }),
      columnHelper.accessor(row => row.volume ?? null, {
        id: "volume",
        header: "Volym",
        cell: info => (info.getValue() != null ? formatNumber(info.getValue() as number) : "-"),
        meta: { align: "right" }
      }),
      columnHelper.display({
        id: "signals",
        header: "Signaler",
        cell: info => (
          <div className="flex flex-wrap gap-1">
            {info.row.original.signals.map(signal => (
              <span key={signal} className="rounded bg-blue-500/20 px-2 py-1 text-[10px] uppercase tracking-wide text-blue-200">
                {signal}
              </span>
            ))}
          </div>
        )
      }),
      columnHelper.display({
        id: "news",
        header: "Nyheter",
        cell: info => (
          <button
            onClick={event => {
              event.stopPropagation();
              onOpenNews(info.row.original);
            }}
            className={clsx(
              "rounded border border-neutral-700 px-2 py-1 text-xs",
              info.row.original.latestHeadline ? "text-green-300" : "text-neutral-400"
            )}
          >
            {info.row.original.latestHeadline ? "Visa" : "-"}
          </button>
        )
      })
    ],
    [onOpenNews]
  );

  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] border-collapse text-sm">
        <thead className="bg-[#1b2029] text-xs uppercase text-neutral-400">
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th
                  key={header.id}
                  className={clsx("border-b border-neutral-800 px-3 py-3 text-left", (header.column.columnDef.meta as any)?.align === "right" && "text-right")}
                  style={{ width: (header.column.columnDef.meta as any)?.width }}
                >
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr
              key={row.id}
              onClick={() => onSelectRow(row.original)}
              className={clsx(
                "cursor-pointer border-b border-neutral-900 hover:bg-[#1f2430]",
                row.original.security.id === selectedRowId && "bg-blue-900/40"
              )}
            >
              {row.getVisibleCells().map(cell => (
                <td
                  key={cell.id}
                  className={clsx("px-3 py-3", (cell.column.columnDef.meta as any)?.align === "right" && "text-right")}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatNumber(value: number) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)} mdr`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)} k`;
  return value.toLocaleString("sv-SE");
}
