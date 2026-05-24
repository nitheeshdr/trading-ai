export interface Tick {
  symbol: string;
  ltp: number;          // last traded price
  open: number;
  high: number;
  low: number;
  close: number;
  change: number;       // absolute change
  changePct: number;    // percentage change
  volume: number;
  timestamp: number;    // unix ms
}

export interface OHLCV {
  time: number;         // unix seconds (for lightweight-charts)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OptionData {
  strikePrice: number;
  callOI: number;
  callOIChange: number;
  callVolume: number;
  callIV: number;
  callLTP: number;
  callDelta: number;
  callGamma: number;
  callTheta: number;
  putOI: number;
  putOIChange: number;
  putVolume: number;
  putIV: number;
  putLTP: number;
  putDelta: number;
  putGamma: number;
  putTheta: number;
  isATM?: boolean;
}

export interface OptionChainData {
  symbol: string;
  expiry: string;
  spotPrice: number;
  chain: OptionData[];
  updatedAt: number;
}
