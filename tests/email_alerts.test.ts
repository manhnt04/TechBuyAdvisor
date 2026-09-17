import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAlert, verifyAlertToken, loadAlerts, saveAlerts } from '../lib/alert-store';
import { checkAndDispatchAlerts } from '../lib/alert-matcher';
import { sendEmail } from '../lib/email';
import type { Catalog } from '../lib/types';

test('createAlert generates magic token with 15-minute expiration', async () => {
  const { alert, magicToken } = await createAlert('tester@example.com', 'cpu-i5-12400f', 2_200_000);

  assert.ok(alert.id);
  assert.equal(alert.email, 'tester@example.com');
  assert.equal(alert.targetPriceVnd, 2_200_000);
  assert.equal(alert.verified, false);
  assert.equal(alert.notified, false);
  assert.ok(magicToken.length > 10);
  assert.ok(alert.expiresAt > Date.now() + 14 * 60 * 1000);
});

test('verifyAlertToken verifies valid token and rejects invalid/expired token', async () => {
  const { alert, magicToken } = await createAlert('verify-test@example.com', 'gpu-rtx-4060-8g', 7_000_000);

  // 1. Wrong token -> fails
  const wrong = await verifyAlertToken(alert.id, 'wrong-token-xyz');
  assert.equal(wrong.success, false);

  // 2. Correct token -> passes
  const correct = await verifyAlertToken(alert.id, magicToken);
  assert.equal(correct.success, true);
  assert.equal(correct.alert?.verified, true);

  // 3. Expired token simulation
  const expiredId = `expired-${Date.now()}`;
  const expiredAlert = {
    ...alert,
    id: expiredId,
    verified: false,
    expiresAt: Date.now() - 1000, // already expired
  };
  const currentAlerts = await loadAlerts();
  currentAlerts.push(expiredAlert);
  await saveAlerts(currentAlerts);

  const expiredRes = await verifyAlertToken(expiredId, magicToken);
  assert.equal(expiredRes.success, false);
  assert.ok(expiredRes.reason?.includes('hết hạn'));
});

test('email dispatcher formats correctly in dev fallback', async () => {
  const res = await sendEmail({
    to: 'dev-user@example.com',
    subject: 'Test Subject',
    html: '<p>Hello World</p>',
  });

  assert.equal(res.success, true);
  assert.ok(res.messageId?.startsWith('dev-mock-'));
});

test('checkAndDispatchAlerts triggers price-drop notification when price meets target', async () => {
  // Set up an alert waiting for RTX 4060 at 8.000.000đ
  const { alert, magicToken } = await createAlert('gamer@example.com', 'gpu-test-alert', 8_000_000);
  await verifyAlertToken(alert.id, magicToken);

  const mockCatalog: Catalog = {
    snapshotId: 'test-matcher-v1',
    skus: [{ id: 'gpu-test-alert', category: 'GPU', name: 'RTX 4060 Test' }],
    listings: [
      {
        skuId: 'gpu-test-alert',
        retailer: 'KCCShop',
        url: 'https://kccshop.vn/rtx-4060',
        priceVnd: 7_500_000, // Price dropped below 8M!
        stock: 'IN_STOCK',
        lastUpdated: new Date().toISOString(),
      },
    ],
    history: [],
    benchmarks: [],
  };

  const report = await checkAndDispatchAlerts(mockCatalog);
  assert.equal(report.triggeredAlertsCount, 1);
  assert.equal(report.dispatched[0].email, 'gamer@example.com');
  assert.equal(report.dispatched[0].currentPrice, 7_500_000);

  // Subsequent check should not re-trigger (avoid spamming)
  const report2 = await checkAndDispatchAlerts(mockCatalog);
  assert.equal(report2.triggeredAlertsCount, 0);
});
