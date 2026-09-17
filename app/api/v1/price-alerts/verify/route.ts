import { NextRequest, NextResponse } from 'next/server';
import { verifyAlertToken } from '@/lib/alert-store';
import { loadCatalog } from '@/lib/catalog';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const id = searchParams.get('id');

  if (!token || !id) {
    return renderHtmlResponse({
      success: false,
      title: 'Yêu cầu không hợp lệ',
      message: 'Thiếu mã xác nhận hoặc thông tin cảnh báo.',
    });
  }

  const result = await verifyAlertToken(id, token);

  if (!result.success) {
    return renderHtmlResponse({
      success: false,
      title: 'Xác nhận không thành công',
      message: result.reason || 'Mã xác nhận không hợp lệ hoặc đã hết hạn.',
    });
  }

  const catalog = await loadCatalog().catch(() => null);
  const sku = catalog?.skus.find(s => s.id === result.alert?.skuId);
  const skuName = sku?.name || result.alert?.skuId || 'linh kiện';
  const targetPrice = result.alert?.targetPriceVnd
    ? new Intl.NumberFormat('vi-VN').format(result.alert.targetPriceVnd) + ' ₫'
    : '';

  return renderHtmlResponse({
    success: true,
    title: 'Kích hoạt cảnh báo giá thành công!',
    message: `Hệ thống đã ghi nhận theo dõi giá cho <strong>${skuName}</strong> ở mức giá <strong>${targetPrice}</strong>. Chúng tôi sẽ gửi email ngay khi giá chạm hoặc thấp hơn mức này.`,
  });
}

function renderHtmlResponse({
  success,
  title,
  message,
}: {
  success: boolean;
  title: string;
  message: string;
}) {
  const color = success ? '#059669' : '#dc2626';
  const icon = success ? '✓' : '✕';

  const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — TechBuy Advisor</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #0f172a; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
    .box { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; max-width: 480px; width: 100%; padding: 40px 32px; text-align: center; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08); }
    .icon { width: 64px; height: 64px; border-radius: 50%; background: ${success ? '#ecfdf5' : '#fef2f2'}; color: ${color}; font-size: 32px; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; }
    h1 { font-size: 20px; margin: 0 0 12px; color: #0f172a; font-weight: 700; }
    p { font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 28px; }
    .btn { display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; font-size: 13px; transition: opacity 0.2s; }
    .btn:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <div class="box">
    <div class="icon">${icon}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="/" class="btn">Quay lại trang chủ TechBuy Advisor</a>
  </div>
</body>
</html>
  `.trim();

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
