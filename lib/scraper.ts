import { isSuspect } from './pricing';
import type { Catalog, Listing, PricePoint } from './types';

export interface ScraperResult {
  skuId: string;
  retailer: string;
  url: string;
  priceVnd: number | null;
  stock: 'IN_STOCK' | 'OUT_OF_STOCK' | 'SCRAPE_FAILED';
  lastUpdated: string;
  errorCount: number;
}

export interface ScrapeReport {
  timestamp: string;
  totalProcessed: number;
  successCount: number;
  suspectCount: number;
  failedCount: number;
  circuitBreakerTripped: string[];
}

export class RetailerScraper {
  private errorTracker = new Map<string, number>();

  async processListing(
    listing: Listing,
    fetcher: (url: string) => Promise<{ price: number | null; inStock: boolean }>,
    recentPrices: number[]
  ): Promise<ScraperResult> {
    const key = `${listing.retailer}|${listing.skuId}`;
    const currentErrors = this.errorTracker.get(key) ?? 0;

    try {
      const data = await fetcher(listing.url);

      if (data.price === null || data.price <= 0) {
        throw new Error('Invalid price extracted');
      }

      // Reset error tracker on success
      this.errorTracker.set(key, 0);

      const suspect = isSuspect(data.price, recentPrices);

      return {
        skuId: listing.skuId,
        retailer: listing.retailer,
        url: listing.url,
        priceVnd: data.price,
        stock: data.inStock ? 'IN_STOCK' : 'OUT_OF_STOCK',
        lastUpdated: new Date().toISOString(),
        errorCount: 0,
      };
    } catch {
      const newErrors = currentErrors + 1;
      this.errorTracker.set(key, newErrors);

      return {
        skuId: listing.skuId,
        retailer: listing.retailer,
        url: listing.url,
        priceVnd: null,
        stock: newErrors >= 3 ? 'SCRAPE_FAILED' : listing.stock,
        lastUpdated: new Date().toISOString(),
        errorCount: newErrors,
      };
    }
  }

  updateCatalogWithScrapes(
    catalog: Catalog,
    results: ScraperResult[],
    now = new Date()
  ): { catalog: Catalog; report: ScrapeReport } {
    let successCount = 0;
    let suspectCount = 0;
    let failedCount = 0;
    const tripped: string[] = [];
    const dateStr = now.toISOString().slice(0, 10);

    const updatedListings = [...catalog.listings];
    const newHistoryPoints: PricePoint[] = [];

    for (const res of results) {
      const idx = updatedListings.findIndex(l => l.skuId === res.skuId && l.retailer === res.retailer);

      if (res.stock === 'SCRAPE_FAILED') {
        failedCount++;
        tripped.push(`${res.retailer}:${res.skuId}`);
        if (idx >= 0) {
          updatedListings[idx] = { ...updatedListings[idx], stock: 'OUT_OF_STOCK' };
        }
        continue;
      }

      if (res.priceVnd !== null && res.priceVnd > 0) {
        successCount++;
        const skuHistory = catalog.history.filter(h => h.skuId === res.skuId).map(h => h.priceVnd);
        const suspect = isSuspect(res.priceVnd, skuHistory.slice(-7));
        if (suspect) suspectCount++;

        const listingItem: Listing = {
          skuId: res.skuId,
          retailer: res.retailer,
          url: res.url,
          priceVnd: res.priceVnd,
          stock: res.stock === 'IN_STOCK' ? 'IN_STOCK' : 'OUT_OF_STOCK',
          lastUpdated: res.lastUpdated,
          suspect,
        };

        if (idx >= 0) {
          updatedListings[idx] = listingItem;
        } else {
          updatedListings.push(listingItem);
        }

        if (!suspect) {
          newHistoryPoints.push({
            skuId: res.skuId,
            date: dateStr,
            priceVnd: res.priceVnd,
            suspect: false,
          });
        }
      }
    }

    const updatedCatalog: Catalog = {
      ...catalog,
      listings: updatedListings,
      history: [...catalog.history, ...newHistoryPoints],
    };

    return {
      catalog: updatedCatalog,
      report: {
        timestamp: now.toISOString(),
        totalProcessed: results.length,
        successCount,
        suspectCount,
        failedCount,
        circuitBreakerTripped: tripped,
      },
    };
  }
}
