import test from 'node:test';
import assert from 'node:assert/strict';
import { auditExtractedQuote } from '../lib/quote-validator';
import { loadCatalog } from '../lib/catalog';

test('auditExtractedQuote correctly audits store quote and warns if overpriced', async () => {
  const catalog = await loadCatalog();

  const mockParsedQuote = {
    storeName: 'Vi Tính Hưng Thịnh',
    items: [
      { category: 'CPU', name: 'Intel Core i5-12400F', quotedPriceVnd: 2900000 },
      { category: 'GPU', name: 'ASUS Dual RTX 4070 SUPER EVO', quotedPriceVnd: 18500000 },
      { category: 'PSU', name: 'Nguồn Xigmatek 450W', quotedPriceVnd: 600000 },
    ],
    totalQuotedPriceVnd: 22000000,
    detectedNotes: 'Tặng lót chuột',
  };

  const audit = auditExtractedQuote(mockParsedQuote, catalog);

  assert.equal(audit.storeName, 'Vi Tính Hưng Thịnh');
  assert.ok(audit.items.length === 3);
  assert.equal(audit.totalQuotedVnd, 22000000);

  // PSU safety check should warn about 450W for an RTX 4070 Super
  assert.equal(audit.psuSafety.status, 'WARNING_INSUFFICIENT');
  assert.ok(audit.psuSafety.message.includes('Cảnh báo: Bộ nguồn'));
});

test('auditExtractedQuote validates safe PSU and fair market prices', async () => {
  const catalog = await loadCatalog();

  const mockFairQuote = {
    storeName: 'PC Master Store',
    items: [
      { category: 'CPU', name: 'AMD Ryzen 5 5600', quotedPriceVnd: 2300000 },
      { category: 'GPU', name: 'ASUS Dual GeForce RTX 4060', quotedPriceVnd: 7800000 },
      { category: 'PSU', name: 'MSI MAG A650BN 650W', quotedPriceVnd: 1300000 },
    ],
    totalQuotedPriceVnd: 11400000,
  };

  const audit = auditExtractedQuote(mockFairQuote, catalog);
  assert.ok(audit.items.length === 3);
  assert.equal(audit.psuSafety.status, 'SAFE');
});
