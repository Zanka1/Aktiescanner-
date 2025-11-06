import { create } from "zustand";

export type SortOption = "Ticker" | "Price" | "Change" | "Volume" | "MarketCap";
export type SignalOption = "None" | "MA_CROSS" | "RSI_OVERSOLD" | "RSI_OVERBOUGHT" | "BREAKOUT";

export interface TechnicalFilter {
  rsi?: { min?: number; max?: number };
  relVolume?: { min?: number };
  breakout?: "20d_high" | "55d_high" | "20d_low" | "55d_low";
}

export interface DescriptiveFilter {
  sector?: string[];
  country?: string[];
  marketCap?: { min?: number; max?: number };
}

export interface NewsFilter {
  freshHours?: number;
  minSentiment?: number;
  keywords?: string[];
}

export interface ScreenerFilterState {
  descriptive: DescriptiveFilter;
  technical: TechnicalFilter;
  news: NewsFilter;
  sort: { by: SortOption; dir: "asc" | "desc" };
  signal: SignalOption;
  toggleTheme: () => void;
  darkMode: boolean;
  setDescriptive: (update: Partial<DescriptiveFilter>) => void;
  setTechnical: (update: Partial<TechnicalFilter>) => void;
  setNews: (update: Partial<NewsFilter>) => void;
  setSort: (sort: { by: SortOption; dir: "asc" | "desc" }) => void;
  setSignal: (signal: SignalOption) => void;
}

export const useFilterStore = create<ScreenerFilterState>((set, get) => ({
  descriptive: {},
  technical: {},
  news: {},
  sort: { by: "Ticker", dir: "asc" },
  signal: "None",
  darkMode: true,
  toggleTheme: () => {
    const next = !get().darkMode;
    document.documentElement.classList.toggle("dark", next);
    document.body.classList.toggle("bg-surface-dark", next);
    set({ darkMode: next });
  },
  setDescriptive: update => set(state => ({ descriptive: { ...state.descriptive, ...update } })),
  setTechnical: update => set(state => ({ technical: { ...state.technical, ...update } })),
  setNews: update => set(state => ({ news: { ...state.news, ...update } })),
  setSort: sort => set({ sort }),
  setSignal: signal => set({ signal })
}));
