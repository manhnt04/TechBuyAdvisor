import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compatibility, recommend, requiredPower } from '../lib/recommend';
import { currentPrice, isSuspect, priceVerdict } from '../lib/pricing';
import type { Catalog, RecommendInput, Sku } from '../lib/types';

const now = new Date('2026-09-17T10:00:00Z');
const skus: Sku[] = [
  { id: 'cpu', category: 'CPU', name: 'CPU test', socket: 'AM5', maxTdpW: 65, stockCooler: true },
  { id: 'gpu', category: 'GPU', name: 'GPU test', maxTdpW: 160, gpuLengthMm: 260, gpuConnector: '8PIN' },
  { id: 'mb', category: 'MB', name: 'MB test', socket: 'AM5', ramType: 'DDR5', formFactor: 'mATX', supportedStorage: ['M.2'], biosCpuIds: ['cpu'] },
  { id: 'ram', category: 'RAM', name: 'RAM test', ramType: 'DDR5' },
  { id: 'ssd', category: 'SSD', name: 'SSD test', ssdInterface: 'M.2' },
  { id: 'psu', category: 'PSU', name: 'PSU test', wattage: 550, formFactor: 'ATX', psuConnectors: ['8PIN'] },
  { id: 'case', category: 'CASE', name: 'Case test', supportedMb: ['mATX'], supportedPsu: ['ATX'], gpuClearanceMm: 300 },
];
const prices: Record<string, number> = { cpu: 3_000_000, gpu: 8_000_000, mb: 2_000_000, ram: 1_500_000, ssd: 1_000_000, psu: 1_500_000, case: 1_000_000 };
const catalog: Catalog = { snapshotId: 'test', skus, listings: skus.map(sku => ({ skuId: sku.id, retailer: 'Test', url: `https://example.com/${sku.id}`, priceVnd: prices[sku.id], stock: 'IN_STOCK', lastUpdated: now.toISOString() })), history: [], benchmarks: [{ cpuId: 'cpu', gpuId: 'gpu', game: 'Valorant', resolution: '1080p', fps: 200, sourceUrl: 'https://example.com/benchmark', updatedAt: now.toISOString() }] };
const input: RecommendInput = { budget_vnd: 20_000_000, resolution: '1080p', target_games: ['Valorant'], priority: 'FPS', client_timestamp: now.toISOString() };

test('power rounds upward to 50 W', () => assert.equal(requiredPower({ maxTdpW: 88 } as Sku, { maxTdpW: 160 } as Sku), 450));
test('recommendation is deterministic and passes all hard constraints', () => {
  const first = recommend(input, catalog, now);
  assert.equal(first.status, 'OK');
  if (first.status !== 'OK') return;
  assert.equal(first.build.compatibility.checks_passed.length, 10);
  assert.equal(compatibility(Object.fromEntries(first.build.components.map(part => [part.sku.category, part.sku]))).length, 10);
  for (let i = 0; i < 10; i++) assert.deepEqual(recommend(input, catalog, now), first);
});
test('incompatible parts are never returned', () => {
  const changed = structuredClone(catalog);
  changed.skus.find(sku => sku.id === 'mb')!.socket = 'LGA1700';
  const result = recommend(input, changed, now);
  assert.equal(result.status, 'NO_FEASIBLE_BUILD');
  assert.equal('build' in result, false);
});
test('stale and out of stock listings are excluded', () => {
  assert.equal(currentPrice([{ ...catalog.listings[0], lastUpdated: '2026-09-14T00:00:00Z' }], now), null);
  assert.equal(currentPrice([{ ...catalog.listings[0], stock: 'OUT_OF_STOCK' }], now), null);
});
test('outliers and sparse history cannot produce a false verdict', () => {
  assert.equal(isSuspect(60, [100, 100, 100, 100, 100, 100, 100]), true);
  const points = Array.from({ length: 6 }, (_, day) => ({ skuId: 'gpu', date: `2026-09-${String(day + 1).padStart(2, '0')}`, priceVnd: 100 }));
  assert.equal(priceVerdict(90, points, now).status, 'INSUFFICIENT_DATA');
  points.push({ skuId: 'gpu', date: '2026-09-07', priceVnd: 100 });
  assert.equal(priceVerdict(90, points, now).confidence, 'LOW');
  assert.equal(priceVerdict(90, points, now).status, 'BUY_NOW');
});
