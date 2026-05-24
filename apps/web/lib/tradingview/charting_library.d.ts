/**
 * Minimal TradingView Charting Library type declarations.
 * Full types ship with the library at public/charting_library/charting_library.d.ts
 * These stubs let TypeScript compile before the library files are copied.
 */

export type ResolutionString = string;
export type EntityId = string;
export type Timezone = string;

export interface Bar {
  time: number;     // milliseconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface HistoryMetadata {
  noData?: boolean;
  nextTime?: number;
}

export type HistoryCallback = (bars: Bar[], meta: HistoryMetadata) => void;
export type ErrorCallback = (reason: string) => void;
export type SubscribeBarsCallback = (bar: Bar) => void;
export type OnReadyCallback = (config: DatafeedConfiguration) => void;
export type SearchSymbolsCallback = (symbols: SearchSymbolResult[]) => void;
export type ResolveCallback = (symbolInfo: LibrarySymbolInfo) => void;
export type GetMarksCallback<T> = (marks: T[]) => void;

export interface DatafeedConfiguration {
  supported_resolutions?: ResolutionString[];
  exchanges?: { value: string; name: string; desc: string }[];
  symbols_types?: { name: string; value: string }[];
  supports_marks?: boolean;
  supports_time?: boolean;
  supports_timescale_marks?: boolean;
}

export interface SearchSymbolResult {
  symbol: string;
  full_name: string;
  description: string;
  exchange: string;
  type: string;
}

export interface LibrarySymbolInfo {
  name: string;
  full_name: string;
  description: string;
  type: string;
  session: string;
  timezone: Timezone;
  exchange: string;
  minmov: number;
  pricescale: number;
  has_intraday: boolean;
  has_daily?: boolean;
  has_weekly_and_monthly?: boolean;
  supported_resolutions: ResolutionString[];
  volume_precision?: number;
  data_status?: string;
  currency_code?: string;
  original_currency_code?: string;
}

export interface IBasicDataFeed {
  onReady(callback: OnReadyCallback): void;
  searchSymbols(
    userInput: string,
    exchange: string,
    symbolType: string,
    onResult: SearchSymbolsCallback
  ): void;
  resolveSymbol(
    symbolName: string,
    onResolve: ResolveCallback,
    onError: ErrorCallback,
    extension?: object
  ): void;
  getBars(
    symbolInfo: LibrarySymbolInfo,
    resolution: ResolutionString,
    periodParams: { from: number; to: number; firstDataRequest: boolean; countBack?: number },
    onResult: HistoryCallback,
    onError: ErrorCallback
  ): void;
  subscribeBars(
    symbolInfo: LibrarySymbolInfo,
    resolution: ResolutionString,
    onTick: SubscribeBarsCallback,
    listenerGuid: string,
    onResetCacheNeededCallback: () => void
  ): void;
  unsubscribeBars(listenerGuid: string): void;
  getTimescaleMarks?(
    symbolInfo: LibrarySymbolInfo,
    from: number,
    to: number,
    onDataCallback: GetMarksCallback<TimescaleMark>,
    resolution: ResolutionString
  ): void;
}

export interface TimescaleMark {
  id: string;
  time: number;
  color: "red" | "green" | "blue" | "yellow";
  label: string;
  tooltip: string[];
}

export type ThemeName = "light" | "dark";

export interface ChartingLibraryWidgetOptions {
  symbol: string;
  datafeed: IBasicDataFeed;
  interval: ResolutionString;
  container: string | HTMLElement;
  library_path: string;
  locale: string;
  disabled_features?: string[];
  enabled_features?: string[];
  charts_storage_url?: string;
  charts_storage_api_version?: string;
  client_id?: string;
  user_id?: string;
  fullscreen?: boolean;
  autosize?: boolean;
  theme?: ThemeName;
  overrides?: Record<string, string | number | boolean>;
  studies_overrides?: Record<string, string | number | boolean>;
  timezone?: Timezone;
  custom_css_url?: string;
  loading_screen?: { backgroundColor?: string; foregroundColor?: string };
  time_frames?: Array<{ text: string; resolution: ResolutionString; description: string }>;
}

export interface IChartingLibraryWidget {
  remove(): void;
  onChartReady(cb: () => void): void;
  activeChart(): IChartWidgetApi;
  applyOverrides(overrides: Record<string, string | number | boolean>): void;
}

export interface IChartWidgetApi {
  createStudy(
    name: string,
    forceOverlay: boolean,
    lock: boolean,
    inputs?: unknown[],
    overrides?: Record<string, unknown>
  ): Promise<EntityId>;
  createShape(
    point: { time: number; price?: number },
    options: {
      shape: string;
      text?: string;
      overrides?: Record<string, unknown>;
      lock?: boolean;
    }
  ): EntityId | null;
  removeEntity(entityId: EntityId): void;
  setSymbol(symbol: string, interval: ResolutionString, callback: () => void): void;
  setResolution(resolution: ResolutionString, callback: () => void): void;
  executeActionById(action: string): void;
  getAllStudies(): Array<{ id: EntityId; name: string }>;
  getTimezoneApi(): { getTimezone(): Timezone };
}

export declare class widget implements IChartingLibraryWidget {
  constructor(options: ChartingLibraryWidgetOptions);
  remove(): void;
  onChartReady(cb: () => void): void;
  activeChart(): IChartWidgetApi;
  applyOverrides(overrides: Record<string, string | number | boolean>): void;
}
