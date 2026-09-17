import type { Game, Priority, Resolution } from './config';

export type Category = 'CPU' | 'GPU' | 'MB' | 'RAM' | 'SSD' | 'PSU' | 'CASE' | 'COOLER';
export type Stock = 'IN_STOCK' | 'OUT_OF_STOCK' | 'SCRAPE_FAILED';
export type Sku = {
  id: string; category: Category; name: string; disabled?: boolean;
  socket?: string; ramType?: string; formFactor?: string; supportedMb?: string[];
  gpuLengthMm?: number; gpuClearanceMm?: number; coolerHeightMm?: number; coolerClearanceMm?: number;
  supportedPsu?: string[]; wattage?: number; gpuConnector?: string; psuConnectors?: string[];
  ssdInterface?: string; supportedStorage?: string[]; biosCpuIds?: string[];
  maxTdpW?: number; stockCooler?: boolean; coolerSockets?: string[];
  noiseRank?: number; rgb?: boolean; volumeLiters?: number;
};
export type Listing = { skuId: string; retailer: string; url: string; priceVnd: number; stock: Stock; lastUpdated: string; suspect?: boolean };
export type PricePoint = { skuId: string; date: string; priceVnd: number; suspect?: boolean };
export type Benchmark = { cpuId: string; gpuId: string; game: Game; resolution: Resolution; fps: number; sourceUrl: string; updatedAt: string };
export type Catalog = { snapshotId: string; skus: Sku[]; listings: Listing[]; history: PricePoint[]; benchmarks: Benchmark[] };
export type RecommendInput = { budget_vnd: number; resolution: Resolution; target_games: Game[]; priority: Priority; client_timestamp: string };
export type Verdict = { status: 'BUY_NOW' | 'WAIT' | 'NEUTRAL' | 'INSUFFICIENT_DATA'; confidence: 'HIGH' | 'LOW' | null; delta30: number | null; referencePriceVnd: number | null; validDays: number; explanation: string };
