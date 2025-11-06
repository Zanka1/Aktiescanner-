import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { CandlestickChart } from "./CandlestickChart";
import { IndicatorPoint, NewsItem, PriceCandle, ScreenerRow } from "../types";

interface Props {
  row: ScreenerRow | null;
  activeTab: DetailTab;
}

export type DetailTab =
  | "Översikt"
  | "Värdering"
  | "Finansiellt"
  | "Ägarbild"
  | "Prestanda"
  | "Eget"
  | "Diagram"
  | "Nyheter"
  | "Snapshot"
  | "Kartor"
  | "Statistik";

interface ChartPayload {
  prices: PriceCandle[];
  intraday: PriceCandle[];
  indicators: IndicatorPoint[];
  profile: ScreenerRow | null;
}

export function CompanyDetail({ row, activeTab }: Props) {
  const [chartData, setChartData] = useState<ChartPayload | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loadingChart, setLoadingChart] = useState(false);
  const [loadingNews, setLoadingNews] = useState(false);

  useEffect(() => {
    if (!row) {
      setChartData(null);
      setNews([]);
      return;
    }
    setLoadingChart(true);
    axios
      .get<ChartPayload>(`/api/data/${row.security.marketId}/${row.security.ticker}`)
      .then(({ data }) => {
        setChartData(data);
      })
      .catch(() => setChartData(null))
      .finally(() => setLoadingChart(false));
  }, [row?.security.id]);

  useEffect(() => {
    if (!row || activeTab !== "Nyheter") return;
    setLoadingNews(true);
    axios
      .get<NewsItem[]>(`/api/news/${row.security.ticker}`)
      .then(({ data }) => setNews(data))
      .catch(() => setNews([]))
      .finally(() => setLoadingNews(false));
  }, [row?.security.id, activeTab]);

  const latestIndicators = useMemo(() => {
    if (!chartData) return {} as Record<string, IndicatorPoint>;
    const sorted = [...chartData.indicators].sort((a, b) => a.ts.localeCompare(b.ts));
    const map = new Map<string, IndicatorPoint>();
    for (const point of sorted) {
      map.set(`${point.kind}:${point.paramsHash}`, point);
    }
    return Object.fromEntries(map.entries());
  }, [chartData]);

  if (!row) {
    return (
      <div className="rounded border border-neutral-800 bg-[#11151d] p-6 text-neutral-400">
        Markera ett bolag i tabellen för att se detaljer här.
      </div>
    );
  }

  return (
    <div className="rounded border border-neutral-800 bg-[#11151d] p-6 text-sm text-neutral-200">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold text-white">{row.security.companyName}</h2>
          <p className="text-neutral-400">
            {row.security.ticker} · {row.security.primaryExchange ?? row.security.marketId} · {row.security.country ?? "-"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-blue-300">
            {row.lastPrice != null ? row.lastPrice.toFixed(2) : "-"}
            <span className="ml-1 text-sm text-neutral-400">{row.security.marketId}</span>
          </p>
          <p className={row.changePct && row.changePct >= 0 ? "text-emerald-400" : "text-rose-400"}>
            {row.changePct != null ? `${row.changePct.toFixed(2)}% senaste handelsdag` : ""}
          </p>
        </div>
      </header>

      {activeTab === "Översikt" && <OverviewSection row={row} chartData={chartData} loading={loadingChart} />}
      {activeTab === "Värdering" && <ValuationSection row={row} valuation={chartData?.profile?.valuation ?? row.valuation} />}
      {activeTab === "Finansiellt" && <FinancialSection row={row} chartData={chartData} />}
      {activeTab === "Ägarbild" && <OwnershipSection row={row} />}
      {activeTab === "Prestanda" && <PerformanceSection row={row} />}
      {activeTab === "Eget" && <CustomSection />}
      {activeTab === "Diagram" && (
        <ChartSection
          loading={loadingChart}
          prices={chartData?.prices ?? []}
          indicators={latestIndicators}
          ticker={row.security.ticker}
        />
      )}
      {activeTab === "Nyheter" && <NewsSection news={news} loading={loadingNews} ticker={row.security.ticker} />}
      {activeTab === "Snapshot" && <SnapshotSection row={row} />}
      {activeTab === "Kartor" && <MapsSection />}
      {activeTab === "Statistik" && <StatsSection row={row} indicators={latestIndicators} />}
    </div>
  );
}

export const DETAIL_TABS: DetailTab[] = [
  "Översikt",
  "Värdering",
  "Finansiellt",
  "Ägarbild",
  "Prestanda",
  "Eget",
  "Diagram",
  "Nyheter",
  "Snapshot",
  "Kartor",
  "Statistik"
];

function OverviewSection({
  row,
  chartData,
  loading
}: {
  row: ScreenerRow;
  chartData: ChartPayload | null;
  loading: boolean;
}) {
  return (
    <section className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard title="Senaste pris" value={formatNumber(row.lastPrice)} subtitle="kr" />
        <InfoCard title="Förändring" value={row.changePct != null ? `${row.changePct.toFixed(2)}%` : "-"} />
        <InfoCard title="Börsvärde" value={formatLarge(row.marketCap ?? row.security.marketCap)} subtitle="kr" />
        <InfoCard title="Relativ volym" value={row.relVolume != null ? row.relVolume.toFixed(2) : "-"} />
      </div>
      <div className="rounded border border-neutral-800 bg-[#0f131b] p-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
          Uppdateringar de senaste 72 timmarna
        </h3>
        {loading ? (
          <p className="text-sm text-neutral-400">Laddar prisdata…</p>
        ) : chartData?.prices?.length ? (
          <p className="text-sm text-neutral-300">
            Senaste stängning {dayjs(chartData.prices.at(-1)?.ts).format("YYYY-MM-DD")}. Totalt {chartData.prices.length} handelsdagar lagrade (3 år bakåt).
          </p>
        ) : (
          <p className="text-sm text-neutral-400">Prisuppgifter saknas. Kontrollera att API-nycklarna är konfigurerade.</p>
        )}
      </div>
    </section>
  );
}

function ValuationSection({ row, valuation }: { row: ScreenerRow; valuation?: ScreenerRow["valuation"] }) {
  const data = valuation ?? row.valuation;
  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <InfoCard title="P/E" value={data?.peRatio != null ? data.peRatio.toFixed(2) : "-"} />
      <InfoCard title="P/B" value={data?.pbRatio != null ? data.pbRatio.toFixed(2) : "-"} />
      <InfoCard
        title="Buffett DCF (kr/aktie)"
        value={data?.buffettIntrinsic != null ? data.buffettIntrinsic.toFixed(2) : "-"}
      />
      <InfoCard
        title="Buffett undervärdering"
        value={data?.buffettMargin != null ? `${(data.buffettMargin * 100).toFixed(1)}%` : "-"}
      />
      <InfoCard
        title="Magic Formula-rank"
        value={data?.magicFormulaRank != null ? `#${data.magicFormulaRank}` : "-"}
      />
      <InfoCard
        title="Avkastning på kapital"
        value={data?.roc != null ? `${(data.roc * 100).toFixed(1)}%` : "-"}
      />
      <p className="sm:col-span-2 text-xs text-neutral-400">
        Värdena hämtas från det dagliga Python-flödet. Om siffrorna saknas behöver CSV-rapporten först skapas via
        kommandotolken.
      </p>
    </section>
  );
}

function FinancialSection({ row, chartData }: { row: ScreenerRow; chartData: ChartPayload | null }) {
  const turnover = chartData?.profile?.volume;
  return (
    <section className="space-y-3">
      <InfoCard
        title="Omsättning senaste dag"
        value={turnover != null ? formatLarge(turnover) : "-"}
        subtitle="aktier"
      />
      <p className="text-xs text-neutral-400">
        Den här panelen visar översiktlig data från importfilen (börsvärde, aktier i free float) och dagsfärska volymer.
        Fyll på fler kolumner i din Yahoo-export för att visa ytterligare fält här.
      </p>
    </section>
  );
}

function OwnershipSection({ row }: { row: ScreenerRow }) {
  return (
    <section className="space-y-2">
      <p className="text-sm text-neutral-300">
        Antal aktier i free float: {row.security.floatShares ? formatLarge(row.security.floatShares) : "-"}
      </p>
      <p className="text-xs text-neutral-400">
        För detaljerad ägarbild (insynsposter, institutioner) lägg till kolumner i importfilen eller koppla en extern
        datakälla.
      </p>
    </section>
  );
}

function PerformanceSection({ row }: { row: ScreenerRow }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <InfoCard title="RSI14" value={row.rsi14 != null ? row.rsi14.toFixed(1) : "-"} />
      <InfoCard title="SMA20" value={row.sma20 != null ? row.sma20.toFixed(2) : "-"} />
      <InfoCard title="SMA50" value={row.sma50 != null ? row.sma50.toFixed(2) : "-"} />
      <InfoCard title="SMA200" value={row.sma200 != null ? row.sma200.toFixed(2) : "-"} />
      <InfoCard title="Signaler" value={row.signals.length ? row.signals.join(", ") : "Inga"} />
      <p className="text-xs text-neutral-400">
        Signalerna byggs från de tekniska indikatorerna: MA-korsningar, RSI-zoner och breakoutnivåer.
      </p>
    </section>
  );
}

function CustomSection() {
  return (
    <section className="space-y-2 text-sm text-neutral-300">
      <p>
        Använd den här fliken för egna anteckningar. Lägg till fler fält i JSON-schemat om du vill spara text eller etiketter
        per bolag.
      </p>
    </section>
  );
}

function ChartSection({
  loading,
  prices,
  indicators,
  ticker
}: {
  loading: boolean;
  prices: PriceCandle[];
  indicators: Record<string, IndicatorPoint>;
  ticker: string;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
          Dagliga candlesticks (3 år)
        </h3>
        <div className="text-xs text-neutral-400">
          Senaste värden · RSI14: {indicators["RSI:RSI:14"]?.value?.toFixed(1) ?? "-"} · SMA200:
          {" "}
          {indicators["SMA:SMA:200"]?.value?.toFixed(2) ?? "-"}
        </div>
      </div>
      {loading ? <p className="text-sm text-neutral-400">Laddar diagram…</p> : <CandlestickChart data={prices} />}
      <p className="text-xs text-neutral-500">
        Diagrammet använder Alpha Vantages gratis-API. Uppdateringar sker var sjätte timme enligt schemaläggaren.
      </p>
      <a
        className="inline-flex items-center gap-2 rounded border border-neutral-700 px-3 py-2 text-xs text-neutral-200 hover:border-blue-500"
        href={`https://finance.yahoo.com/quote/${ticker}`}
        target="_blank"
        rel="noreferrer"
      >
        Öppna tickern på Yahoo Finance
      </a>
    </section>
  );
}

function NewsSection({ news, loading, ticker }: { news: NewsItem[]; loading: boolean; ticker: string }) {
  if (loading) return <p className="text-sm text-neutral-400">Laddar nyheter…</p>;
  if (!news.length) {
    return (
      <p className="text-sm text-neutral-400">
        Inga nyheter hittades. Säkerställ att NEWSAPI_KEY är satt eller lägg till egna källor.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      {news.map(item => (
        <article key={item.id} className="rounded border border-neutral-800 bg-[#151922] p-4">
          <header className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-blue-300">{item.headline}</h3>
            <span className="text-xs text-neutral-500">{dayjs(item.publishedAt).format("YYYY-MM-DD HH:mm")}</span>
          </header>
          <p className="mt-2 text-sm text-neutral-300">{item.summary ?? ""}</p>
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex text-xs text-blue-400 hover:underline"
          >
            Läs mer
          </a>
        </article>
      ))}
      <p className="text-xs text-neutral-500">
        Nyhetsflödet filtreras automatiskt till de senaste sju dagarna för {ticker}.
      </p>
    </div>
  );
}

function SnapshotSection({ row }: { row: ScreenerRow }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <InfoCard title="Land" value={row.security.country ?? "-"} />
      <InfoCard title="Sektor" value={row.security.sector ?? "-"} />
      <InfoCard title="Industri" value={row.security.industry ?? "-"} />
      <InfoCard title="Börs" value={row.security.primaryExchange ?? "-"} />
      <InfoCard title="Free float" value={row.security.floatShares ? formatLarge(row.security.floatShares) : "-"} />
      <InfoCard title="Optioner" value={row.security.optionable != null ? (row.security.optionable ? "Ja" : "Nej") : "-"} />
    </section>
  );
}

function MapsSection() {
  return (
    <section className="space-y-2 text-sm text-neutral-300">
      <p>
        Värmekartan visas här när du kopplar en datakälla (t.ex. egen aggregering eller Finviz-export). Under tiden kan du
        exportera nuvarande filtrering via knappen "Importera marknad" och analysera datan i Excel.
      </p>
    </section>
  );
}

function StatsSection({
  row,
  indicators
}: {
  row: ScreenerRow;
  indicators: Record<string, IndicatorPoint>;
}) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <InfoCard title="Genomsnittlig volym 20d" value={formatLarge(row.avgVolume20)} subtitle="aktier" />
      <InfoCard title="ATR14" value={indicators["ATR:ATR:14"]?.value?.toFixed(2) ?? "-"} />
      <InfoCard title="ADX14" value={indicators["ADX:ADX:14"]?.value?.toFixed(2) ?? "-"} />
      <InfoCard title="Bollingerband (övre)" value={indicators["BOLL_UP:BOLL:20,2"]?.value?.toFixed(2) ?? "-"} />
      <InfoCard title="Bollingerband (nedre)" value={indicators["BOLL_LOW:BOLL:20,2"]?.value?.toFixed(2) ?? "-"} />
      <InfoCard title="Stochastic K" value={indicators["STOCH_K:STOCH:14,3"]?.value?.toFixed(1) ?? "-"} />
    </section>
  );
}

function InfoCard({
  title,
  value,
  subtitle
}: {
  title: string;
  value: string | number | undefined;
  subtitle?: string;
}) {
  return (
    <div className="rounded border border-neutral-800 bg-[#151922] p-4">
      <h4 className="text-xs uppercase tracking-wide text-neutral-400">{title}</h4>
      <p className="mt-2 text-lg font-semibold text-white">
        {value ?? "-"}
        {subtitle ? <span className="ml-1 text-xs font-normal text-neutral-400">{subtitle}</span> : null}
      </p>
    </div>
  );
}

function formatNumber(value?: number) {
  if (value == null) return "-";
  return value.toLocaleString("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatLarge(value?: number) {
  if (value == null) return "-";
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)} mdr`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)} M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)} k`;
  return value.toFixed(0);
}
