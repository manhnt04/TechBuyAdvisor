import { NextResponse } from 'next/server';
import { loadCatalog } from '@/lib/catalog';
import { currentPrice, priceVerdict } from '@/lib/pricing';

export const runtime = 'nodejs';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const catalog = await loadCatalog();
    const sku = catalog.skus.find(item => item.id === id && !item.disabled);
    if (!sku) return NextResponse.json({ status: 'NOT_FOUND', snapshot_id: catalog.snapshotId }, { status: 404 });
    const listings = catalog.listings.filter(item => item.skuId === id);
    const history = catalog.history.filter(item => item.skuId === id).sort((a, b) => a.date.localeCompare(b.date));
    const current = currentPrice(listings);
    return NextResponse.json({ status: 'OK', snapshot_id: catalog.snapshotId, sku, current, verdict: priceVerdict(current?.priceVnd ?? null, history), listings, history, disclaimer: 'Giá chưa gồm phí vận chuyển và voucher.' });
  } catch {
    return NextResponse.json({ status: 'SERVICE_UNAVAILABLE', snapshot_id: 'unavailable' }, { status: 503 });
  }
}
