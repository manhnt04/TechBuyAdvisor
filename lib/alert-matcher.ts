import { loadAlerts, saveAlerts, PriceAlertRecord } from './alert-store';
import { currentPrice } from './pricing';
import { sendPriceDropAlertEmail } from './email';
import type { Catalog } from './types';

export interface AlertDispatchReport {
  timestamp: string;
  checkedAlertsCount: number;
  triggeredAlertsCount: number;
  dispatched: {
    alertId: string;
    email: string;
    skuId: string;
    targetPrice: number;
    currentPrice: number;
    retailer: string;
  }[];
}

export async function checkAndDispatchAlerts(catalog: Catalog, now = new Date()): Promise<AlertDispatchReport> {
  const alerts = await loadAlerts();
  const verifiedAlerts = alerts.filter(a => a.verified && !a.notified);

  const report: AlertDispatchReport = {
    timestamp: now.toISOString(),
    checkedAlertsCount: verifiedAlerts.length,
    triggeredAlertsCount: 0,
    dispatched: [],
  };

  let hasUpdates = false;

  for (const alert of verifiedAlerts) {
    const sku = catalog.skus.find(s => s.id === alert.skuId && !s.disabled);
    if (!sku) continue;

    const listings = catalog.listings.filter(l => l.skuId === alert.skuId);
    const best = currentPrice(listings, now);

    if (best && best.priceVnd <= alert.targetPriceVnd) {
      // Trigger price drop alert email
      await sendPriceDropAlertEmail(
        alert.email,
        sku.name,
        best.priceVnd,
        best.retailer,
        best.url
      );

      alert.notified = true;
      hasUpdates = true;
      report.triggeredAlertsCount++;
      report.dispatched.push({
        alertId: alert.id,
        email: alert.email,
        skuId: alert.skuId,
        targetPrice: alert.targetPriceVnd,
        currentPrice: best.priceVnd,
        retailer: best.retailer,
      });
    }
  }

  if (hasUpdates) {
    await saveAlerts(alerts);
  }

  return report;
}
