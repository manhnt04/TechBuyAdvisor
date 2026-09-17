import { rules } from './config';
import type { Listing, PricePoint, Verdict } from './types';

export function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function isSuspect(price: number, lastSeven: number[]): boolean {
  if (!Number.isFinite(price) || price <= 0) return true;
  const baseline = median(lastSeven.filter(value => value > 0));
  return baseline !== null && (price < baseline * rules.suspectLow || price > baseline * rules.suspectHigh);
}

export function validListings(listings: Listing[], now = new Date()): Listing[] {
  return listings.filter(item => !item.suspect && item.stock === 'IN_STOCK' && item.priceVnd > 0 && Number.isFinite(item.priceVnd) && Number.isFinite(Date.parse(item.lastUpdated)) && now.getTime() - Date.parse(item.lastUpdated) <= rules.priceMaxAgeHours * 3_600_000 && Date.parse(item.lastUpdated) <= now.getTime());
}

export function currentPrice(listings: Listing[], now = new Date()): Listing | null {
  return validListings(listings, now).sort((a, b) => a.priceVnd - b.priceVnd || a.retailer.localeCompare(b.retailer))[0] ?? null;
}

export function priceVerdict(current: number | null, points: PricePoint[], now = new Date()): Verdict {
  const daily = new Map<string, number[]>();
  for (const point of points) {
    if (point.suspect || !Number.isFinite(point.priceVnd) || point.priceVnd <= 0) continue;
    const date = point.date.slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    const time = Date.parse(`${date}T00:00:00Z`);
    if (!Number.isFinite(time) || time > now.getTime() || now.getTime() - time >= 30 * 86_400_000) continue;
    daily.set(date, [...(daily.get(date) ?? []), point.priceVnd]);
  }
  const references = [...daily.entries()].sort(([a], [b]) => b.localeCompare(a)).slice(0, 30).map(([, prices]) => median(prices)!);
  const validDays = references.length;
  if (current === null || current <= 0 || validDays < 7) return { status: 'INSUFFICIENT_DATA', confidence: null, delta30: null, referencePriceVnd: null, validDays, explanation: 'Chưa đủ dữ liệu giá hợp lệ để kết luận.' };
  const high = validDays >= 14;
  const referencePriceVnd = median(high ? references : references.slice(0, 7))!;
  const delta30 = (current - referencePriceVnd) / referencePriceVnd;
  const status = delta30 <= -rules.verdictThreshold ? 'BUY_NOW' : delta30 >= rules.verdictThreshold ? 'WAIT' : 'NEUTRAL';
  const period = high ? '30 ngày' : '7 ngày';
  const direction = delta30 < 0 ? 'thấp hơn' : 'cao hơn';
  return { status, confidence: high ? 'HIGH' : 'LOW', delta30, referencePriceVnd, validDays, explanation: `Giá tốt nhất hiện tại ${direction} mức trung vị ${period} ${Math.round(Math.abs(delta30) * 100)}%.` };
}
