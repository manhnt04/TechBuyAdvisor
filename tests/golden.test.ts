import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recommend, compatibility } from '../lib/recommend';
import { rules } from '../lib/config';
import type { Catalog, Sku, RecommendInput } from '../lib/types';

const now = new Date('2026-09-17T10:00:00Z');
const skus: Sku[] = [
  { id: 'c', category: 'CPU', name: 'CPU', socket: 'AM5', maxTdpW: 65, stockCooler: true },
  { id: 'g', category: 'GPU', name: 'GPU', maxTdpW: 160, gpuLengthMm: 250, gpuConnector: '8PIN' },
  { id: 'm', category: 'MB', name: 'Mainboard', socket: 'AM5', ramType: 'DDR5', formFactor: 'mATX', supportedStorage: ['M.2'], biosCpuIds: ['c'] },
  { id: 'r', category: 'RAM', name: 'RAM', ramType: 'DDR5' },
  { id: 's', category: 'SSD', name: 'SSD', ssdInterface: 'M.2' },
  { id: 'p', category: 'PSU', name: 'PSU', formFactor: 'ATX', wattage: 550, psuConnectors: ['8PIN'] },
  { id: 'k', category: 'CASE', name: 'Case', supportedMb: ['mATX'], supportedPsu: ['ATX'], gpuClearanceMm: 300 },
];
const catalog: Catalog = {
  snapshotId: 'golden-v1', skus, history: [],
  listings: skus.map((sku, index) => ({ skuId: sku.id, retailer: 'KCCShop', url: `https://example.com/${sku.id}`, priceVnd: [3, 8, 2, 1.5, 1, 1.5, 1][index] * 1_000_000, stock: 'IN_STOCK', lastUpdated: now.toISOString() })),
  benchmarks: rules.games.flatMap(game => (['1080p', '1440p'] as const).map(resolution => ({ cpuId: 'c', gpuId: 'g', game, resolution, fps: resolution === '1080p' ? 120 : 80, sourceUrl: 'https://example.com/benchmark', updatedAt: now.toISOString() }))),
};

const budgets = [15, 20, 25, 30, 35];
const resolutions = ['1080p', '1440p'] as const;
const gameSets = [['Valorant'], ['Cyberpunk 2077'], ['Valorant', 'Cyberpunk 2077', 'Black Myth: Wukong']] as const;

test('30 golden input vectors return fixed outcome and component IDs', () => {
  let count = 0;
  for (const budget of budgets) for (const resolution of resolutions) for (const games of gameSets) {
    const input: RecommendInput = { budget_vnd: budget * 1_000_000, resolution, target_games: [...games], priority: 'FPS', client_timestamp: now.toISOString() };
    const result = recommend(input, catalog, now);
    assert.equal(result.status, budget === 15 ? 'NO_FEASIBLE_BUILD' : 'OK', JSON.stringify(input));
    if (result.status === 'OK') assert.deepEqual(result.build.components.map(part => part.sku.id), ['c', 'g', 'm', 'r', 's', 'p', 'k']);
    count++;
  }
  assert.equal(count, 30);
});

test('1,000 generated catalog mutations never return an incompatible build', () => {
  let seed = 91247;
  const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  const input: RecommendInput = { budget_vnd: 25_000_000, resolution: '1080p', target_games: ['Valorant'], priority: 'FPS', client_timestamp: now.toISOString() };
  for (let i = 0; i < 1000; i++) {
    const changed = structuredClone(catalog);
    if (random() < 0.5) changed.skus.find(sku => sku.id === 'm')!.socket = 'LGA1700';
    if (random() < 0.5) changed.skus.find(sku => sku.id === 'p')!.wattage = 300;
    if (random() < 0.5) changed.skus.find(sku => sku.id === 'k')!.gpuClearanceMm = 200;
    if (random() < 0.5) changed.skus.find(sku => sku.id === 'r')!.ramType = 'DDR4';
    const result = recommend(input, changed, now);
    if (result.status !== 'OK') continue;
    assert.equal(compatibility(Object.fromEntries(result.build.components.map(part => [part.sku.category, part.sku]))).length, 10);
  }
});
