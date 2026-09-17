import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { RetailerScraper } from '../lib/scraper';
import { loadCatalog } from '../lib/catalog';
import { recommend } from '../lib/recommend';
import type { Listing } from '../lib/types';

test('scraper extracts valid prices and detects anomaly', async () => {
  const scraper = new RetailerScraper();
  const listing: Listing = {
    skuId: 'cpu-test',
    retailer: 'KCCShop',
    url: 'https://example.com/item',
    priceVnd: 2_000_000,
    stock: 'IN_STOCK',
    lastUpdated: new Date().toISOString(),
  };

  const res = await scraper.processListing(
    listing,
    async () => ({ price: 2_100_000, inStock: true }),
    [2_000_000, 2_050_000, 2_000_000, 2_100_000, 2_000_000, 2_050_000, 2_000_000]
  );

  assert.equal(res.stock, 'IN_STOCK');
  assert.equal(res.priceVnd, 2_100_000);
  assert.equal(res.errorCount, 0);
});

test('circuit breaker trips after 3 consecutive failures', async () => {
  const scraper = new RetailerScraper();
  const listing: Listing = {
    skuId: 'cpu-broken',
    retailer: 'An Phát PC',
    url: 'https://example.com/broken',
    priceVnd: 2_000_000,
    stock: 'IN_STOCK',
    lastUpdated: new Date().toISOString(),
  };

  const failFetcher = async () => {
    throw new Error('500 Gateway Error');
  };

  const r1 = await scraper.processListing(listing, failFetcher, []);
  assert.equal(r1.errorCount, 1);
  assert.equal(r1.stock, 'IN_STOCK');

  const r2 = await scraper.processListing(listing, failFetcher, []);
  assert.equal(r2.errorCount, 2);

  const r3 = await scraper.processListing(listing, failFetcher, []);
  assert.equal(r3.errorCount, 3);
  assert.equal(r3.stock, 'SCRAPE_FAILED');
});

test('AC-12: no prohibited terms ("bottleneck", "không nghẽn cổ chai") exist in copy', async () => {
  const filesToScan = [
    'app/advisor.tsx',
    'app/layout.tsx',
    'app/page.tsx',
    'lib/recommend.ts',
    'lib/pricing.ts',
    'lib/config.ts',
  ];

  const prohibited = [
    /\bbottleneck\b/i,
    /nghẽn cổ chai/i,
    /không nghẽn/i,
  ];

  for (const relativePath of filesToScan) {
    const fullPath = path.join(process.cwd(), relativePath);
    const content = await readFile(fullPath, 'utf8');

    for (const pattern of prohibited) {
      const match = pattern.exec(content);
      assert.equal(
        match,
        null,
        `Prohibited term found in ${relativePath}: "${match?.[0]}"`
      );
    }
  }
});

test('real catalog recommendation produces valid 10-check builds across all budgets', async () => {
  const catalog = await loadCatalog();
  const budgets = [15, 20, 25, 30, 35];
  const now = new Date('2026-09-17T12:00:00Z');

  for (const b of budgets) {
    const res = recommend(
      {
        budget_vnd: b * 1_000_000,
        resolution: '1080p',
        target_games: ['Valorant', 'Cyberpunk 2077'],
        priority: 'FPS',
        client_timestamp: now.toISOString(),
      },
      catalog,
      now
    );

    assert.equal(res.status, 'OK', `Budget ${b}M should find a feasible build`);
    if (res.status === 'OK') {
      assert.equal(res.build.compatibility.checks_passed.length, 10);
      assert.ok(res.build.totalPriceVnd <= b * 1_000_000 * 1.02);
      assert.ok(res.build.valueScore > 0);
      assert.ok(['BUY_NOW', 'WAIT', 'NEUTRAL'].includes(res.build.price.status));
    }
  }
});
