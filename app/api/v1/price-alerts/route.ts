import { NextRequest, NextResponse } from 'next/server';
import { loadCatalog } from '@/lib/catalog';
import { createAlert } from '@/lib/alert-store';
import { sendMagicLinkEmail } from '@/lib/email';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ status: 'INVALID_INPUT', reason: 'Dữ liệu không hợp lệ.' }, { status: 400 });
    }

    const { email, sku_id, target_price_vnd } = body as Record<string, unknown>;

    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ status: 'INVALID_EMAIL', reason: 'Email không đúng định dạng.' }, { status: 400 });
    }

    if (typeof sku_id !== 'string' || !sku_id) {
      return NextResponse.json({ status: 'INVALID_SKU', reason: 'SKU không hợp lệ.' }, { status: 400 });
    }

    if (typeof target_price_vnd !== 'number' || target_price_vnd <= 0 || !Number.isFinite(target_price_vnd)) {
      return NextResponse.json({ status: 'INVALID_PRICE', reason: 'Mức giá mục tiêu không hợp lệ.' }, { status: 400 });
    }

    const catalog = await loadCatalog();
    const sku = catalog.skus.find(item => item.id === sku_id && !item.disabled);
    if (!sku) {
      return NextResponse.json({ status: 'SKU_NOT_FOUND', reason: 'Linh kiện không tồn tại hoặc đã ngừng kinh doanh.' }, { status: 404 });
    }

    const { alert, magicToken } = await createAlert(email, sku_id, target_price_vnd);

    // Build absolute URL for verify link
    const origin = request.nextUrl.origin || 'http://localhost:3000';
    const verifyUrl = `${origin}/api/v1/price-alerts/verify?token=${magicToken}&id=${alert.id}`;

    // Send the Magic Link email
    await sendMagicLinkEmail(email, sku.name, alert.targetPriceVnd, verifyUrl);

    return NextResponse.json({
      status: 'OK',
      alert_id: alert.id,
      message: `Đã gửi liên kết xác nhận tới ${email}. Vui lòng kiểm tra hộp thư (hiệu lực trong 15 phút).`,
      expires_in_minutes: 15,
      magic_verify_url: verifyUrl,
    });
  } catch {
    return NextResponse.json({ status: 'SERVICE_UNAVAILABLE' }, { status: 503 });
  }
}
