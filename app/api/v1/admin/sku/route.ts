import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import { loadCatalog } from '@/lib/catalog';

export const runtime = 'nodejs';

const ADMIN_SECRET = process.env.TECHBUY_ADMIN_SECRET || 'techbuy-admin-secret-key-v1';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token || token !== ADMIN_SECRET) {
      return NextResponse.json({ status: 'UNAUTHORIZED', reason: 'Không có quyền truy cập admin.' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ status: 'INVALID_INPUT' }, { status: 400 });
    }

    const { sku_id, disabled } = body as Record<string, unknown>;
    if (typeof sku_id !== 'string' || typeof disabled !== 'boolean') {
      return NextResponse.json({ status: 'INVALID_INPUT', reason: 'Yêu cầu sku_id (string) và disabled (boolean).' }, { status: 400 });
    }

    const catalogPath = process.env.TECHBUY_CATALOG_PATH || path.join(process.cwd(), 'data', 'catalog.json');
    const catalog = await loadCatalog();
    const targetSku = catalog.skus.find(item => item.id === sku_id);

    if (!targetSku) {
      return NextResponse.json({ status: 'SKU_NOT_FOUND', reason: `Không tìm thấy SKU ${sku_id}` }, { status: 404 });
    }

    targetSku.disabled = disabled;
    await writeFile(catalogPath, JSON.stringify(catalog, null, 2), 'utf-8');

    return NextResponse.json({
      status: 'OK',
      sku_id,
      disabled,
      message: `Đã ${disabled ? 'vô hiệu hóa (kill-switch)' : 'kích hoạt lại'} SKU ${sku_id} thành công. Hiệu lực ngay lập tức.`,
      updated_at: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ status: 'SERVICE_UNAVAILABLE' }, { status: 503 });
  }
}
