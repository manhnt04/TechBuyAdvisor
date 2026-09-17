import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Catalog } from './types';
import { rules } from './config';

export function validateCatalog(raw: Catalog): Catalog {
  if (!raw.snapshotId || !Array.isArray(raw.skus) || !Array.isArray(raw.listings) || !Array.isArray(raw.history) || !Array.isArray(raw.benchmarks)) throw new Error('Invalid catalog snapshot');
  const ids = new Set<string>();
  for (const sku of raw.skus) {
    if (!sku.id || ids.has(sku.id) || !['CPU', 'GPU', 'MB', 'RAM', 'SSD', 'PSU', 'CASE', 'COOLER'].includes(sku.category)) throw new Error('Invalid SKU');
    ids.add(sku.id);
  }
  for (const listing of raw.listings) {
    if (!ids.has(listing.skuId) || !rules.retailers.some(name => name === listing.retailer) || !Number.isFinite(listing.priceVnd) || listing.priceVnd <= 0 || !Number.isFinite(Date.parse(listing.lastUpdated))) throw new Error('Invalid listing');
    const url = new URL(listing.url);
    if (url.protocol !== 'https:') throw new Error('Invalid listing URL');
  }
  for (const item of raw.benchmarks) {
    if (!ids.has(item.cpuId) || !ids.has(item.gpuId) || !rules.games.includes(item.game) || !['1080p', '1440p'].includes(item.resolution) || item.fps <= 0 || new URL(item.sourceUrl).protocol !== 'https:') throw new Error('Invalid benchmark');
  }
  for (const point of raw.history) if (!ids.has(point.skuId) || !Number.isFinite(point.priceVnd) || point.priceVnd <= 0 || !Number.isFinite(Date.parse(point.date))) throw new Error('Invalid price history');
  return raw;
}

export async function loadCatalog(): Promise<Catalog> {
  const file = process.env.TECHBUY_CATALOG_PATH || path.join(process.cwd(), 'data', 'catalog.json');
  const raw = JSON.parse(await readFile(file, 'utf8')) as Catalog;
  return validateCatalog(raw);
}
