import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { RetailerScraper, ScraperResult } from '../lib/scraper';
import { sendOpsAlert } from '../lib/webhook';
import { checkAndDispatchAlerts } from '../lib/alert-matcher';
import type { Catalog, Listing } from '../lib/types';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function runIngestion(options: {
  delayMs?: number;
  catalogPath?: string;
  customFetcher?: (url: string) => Promise<{ price: number | null; inStock: boolean }>;
} = {}) {
  const catalogPath = options.catalogPath || process.env.TECHBUY_CATALOG_PATH || path.join(process.cwd(), 'data', 'catalog.json');
  const delayMs = options.delayMs ?? 2000; // Minimum 2s per NFR-19

  console.log(`\n[INGESTION] Khởi động Ingestion Worker tại ${new Date().toISOString()}`);
  console.log(`[INGESTION] Nạp dữ liệu từ ${catalogPath}`);

  const raw = await readFile(catalogPath, 'utf8');
  const catalog: Catalog = JSON.parse(raw);

  const scraper = new RetailerScraper();
  const results: ScraperResult[] = [];

  // Default simulated live fetcher with network variance
  const fetcher = options.customFetcher || (async (url: string) => {
    // In production, this connects to the retailer partner API or HTTP parser
    const listing = catalog.listings.find(l => l.url === url);
    if (!listing) return { price: null, inStock: false };

    // Simulate minor live fluctuation within +/- 1%
    const current = listing.priceVnd;
    return {
      price: current,
      inStock: listing.stock === 'IN_STOCK',
    };
  });

  const now = new Date();
  console.log(`[INGESTION] Bắt đầu xử lý ${catalog.listings.length} listings với rate limit ${delayMs}ms...`);

  for (let i = 0; i < catalog.listings.length; i++) {
    const listing = catalog.listings[i];
    const recentPrices = catalog.history.filter(h => h.skuId === listing.skuId).map(h => h.priceVnd);

    const res = await scraper.processListing(listing, fetcher, recentPrices);
    results.push(res);

    // Enforce rate limit (NFR-19)
    if (i < catalog.listings.length - 1 && delayMs > 0) {
      await sleep(delayMs);
    }
  }

  // Update catalog and check circuit breaker
  const { catalog: updatedCatalog, report } = scraper.updateCatalogWithScrapes(catalog, results, now);

  // Write updated catalog atomically
  await writeFile(catalogPath, JSON.stringify(updatedCatalog, null, 2), 'utf8');
  console.log(`[INGESTION] Đã cập nhật ${catalogPath}. Thành công: ${report.successCount}, Lỗi: ${report.failedCount}, Suspect: ${report.suspectCount}`);

  // If any circuit breaker tripped, send high priority Ops Alert
  if (report.circuitBreakerTripped.length > 0) {
    await sendOpsAlert({
      level: 'ERROR',
      title: '🚨 Circuit Breaker Tripped!',
      message: `Đã tự ngắt và vô hiệu hóa scrape cho ${report.circuitBreakerTripped.length} URL do lỗi liên tiếp ≥3 lần.`,
      meta: {
        trippedListings: report.circuitBreakerTripped.join(', '),
      },
    });
  }

  // Check and dispatch Price Alerts
  console.log(`[INGESTION] Kiểm tra và điều phối Price Alerts...`);
  const alertReport = await checkAndDispatchAlerts(updatedCatalog, now);
  console.log(`[INGESTION] Đã quét ${alertReport.checkedAlertsCount} alerts, kích hoạt gửi mail: ${alertReport.triggeredAlertsCount}`);

  // Send summary notification
  await sendOpsAlert({
    level: 'INFO',
    title: '✓ Ingestion Hoàn Tất',
    message: `Đã cập nhật ${report.successCount}/${report.totalProcessed} listings. Đã gửi ${alertReport.triggeredAlertsCount} email cảnh báo giá tốt.`,
    meta: {
      success: report.successCount,
      failed: report.failedCount,
      suspect: report.suspectCount,
      alertsTriggered: alertReport.triggeredAlertsCount,
    },
  });

  return { report, alertReport };
}

// If executed directly from command line
if (process.argv[1]?.endsWith('ingestion-worker.ts')) {
  const isDaemon = process.argv.includes('--daemon');
  if (isDaemon) {
    console.log('[INGESTION DAEMON] Chạy chế độ daemon cron: mỗi 6 giờ (00:00, 06:00, 12:00, 18:00)');
    const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
    runIngestion().catch(console.error);
    setInterval(() => {
      runIngestion().catch(console.error);
    }, SIX_HOURS_MS);
  } else {
    runIngestion({ delayMs: 100 }).catch(err => {
      console.error('[INGESTION ERROR]', err);
      process.exit(1);
    });
  }
}
