export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  previewUrl?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'TechBuy Advisor <onboarding@resend.dev>';

  // If no API key is provided, log to console in dev mode
  if (!apiKey) {
    console.log(`\n================== [DEV EMAIL DISPATCH] ==================`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`----------------------------------------------------------`);
    console.log(html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300) + '...');
    console.log(`==========================================================\n`);
    return { success: true, messageId: `dev-mock-${Date.now()}` };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { success: false, error: data.message || `Resend HTTP error ${response.status}` };
    }

    return { success: true, messageId: data.id };
  } catch (err: any) {
    return { success: false, error: err.message || 'Lỗi mạng khi gửi email' };
  }
}

const formatVnd = (val: number) => new Intl.NumberFormat('vi-VN').format(val) + ' ₫';

export async function sendMagicLinkEmail(
  email: string,
  skuName: string,
  targetPriceVnd: number,
  verifyUrl: string
): Promise<EmailResult> {
  const subject = `[TechBuy Advisor] Xác nhận kích hoạt theo dõi giá cho ${skuName}`;
  const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 24px; line-height: 1.6; }
    .card { background-color: #ffffff; max-width: 560px; margin: 0 auto; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #059669, #047857); padding: 28px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
    .body { padding: 32px 28px; }
    .detail-box { background-color: #f1f5f9; border-radius: 12px; padding: 16px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
    .detail-row:last-child { margin-bottom: 0; }
    .detail-label { color: #64748b; }
    .detail-val { font-weight: 700; color: #0f172a; }
    .btn-wrap { text-align: center; margin: 28px 0 20px; }
    .btn { display: inline-block; background-color: #059669; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 14px; letter-spacing: 0.02em; }
    .notice { font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px; }
    .footer { font-size: 11px; color: #94a3b8; text-align: center; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>TechBuy Advisor</h1>
    </div>
    <div class="body">
      <h2 style="font-size: 18px; margin-top: 0;">Xác nhận đăng ký cảnh báo giá</h2>
      <p style="font-size: 14px; color: #334155;">
        Bạn vừa yêu cầu theo dõi biến động giá cho linh kiện <strong>${skuName}</strong> trên hệ thống TechBuy Advisor.
      </p>

      <div class="detail-box">
        <div class="detail-row">
          <span class="detail-label">Linh kiện:</span>
          <span class="detail-val">${skuName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Mức giá mục tiêu:</span>
          <span class="detail-val" style="color: #059669;">${formatVnd(targetPriceVnd)}</span>
        </div>
      </div>

      <div class="btn-wrap">
        <a href="${verifyUrl}" class="btn" target="_blank">Kích hoạt cảnh báo giá</a>
      </div>

      <p class="notice">
        ⚠️ <strong>Lưu ý bảo mật:</strong> Liên kết Magic Link này chỉ có hiệu lực trong vòng <strong>15 phút</strong>.<br>
        Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.
      </p>
    </div>
  </div>
  <div class="footer">
    © ${new Date().getFullYear()} TechBuy Advisor — Quyết định chọn PC gaming minh bạch và có cơ sở.
  </div>
</body>
</html>
  `.trim();

  return sendEmail({ to: email, subject, html });
}

export async function sendPriceDropAlertEmail(
  email: string,
  skuName: string,
  currentPriceVnd: number,
  retailerName: string,
  productUrl: string
): Promise<EmailResult> {
  const subject = `🔥 [TechBuy Alert] Giá ${skuName} đã giảm còn ${formatVnd(currentPriceVnd)}!`;
  const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 24px; line-height: 1.6; }
    .card { background-color: #ffffff; max-width: 560px; margin: 0 auto; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 28px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; }
    .body { padding: 32px 28px; }
    .price-box { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }
    .price-title { font-size: 13px; color: #065f46; font-weight: 600; text-transform: uppercase; }
    .price-big { font-size: 32px; font-weight: 800; color: #059669; margin: 6px 0; }
    .btn-wrap { text-align: center; margin: 28px 0; }
    .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 14px; }
    .footer { font-size: 11px; color: #94a3b8; text-align: center; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>TechBuy Price Alert</h1>
    </div>
    <div class="body">
      <h2 style="font-size: 18px; margin-top: 0; color: #1e3a8a;">🎉 Sản phẩm bạn theo dõi đã giảm giá!</h2>
      <p style="font-size: 14px; color: #334155;">
        Tin vui! Linh kiện <strong>${skuName}</strong> hiện đã có giá thấp hơn hoặc bằng mức giá mục tiêu bạn đã thiết lập.
      </p>

      <div class="price-box">
        <div class="price-title">Giá tốt nhất hiện tại tại ${retailerName}</div>
        <div class="price-big">${formatVnd(currentPriceVnd)}</div>
        <small style="color: #047857; font-size: 12px;">Đã kiểm tra còn hàng (In-stock)</small>
      </div>

      <div class="btn-wrap">
        <a href="${productUrl}" class="btn" target="_blank">Xem và Mua Ngay tại ${retailerName} →</a>
      </div>

      <p style="font-size: 12px; color: #64748b; text-align: center;">
        * Giá hiển thị tại thời điểm gửi email và chưa bao gồm phí vận chuyển hoặc voucher đặc biệt của cửa hàng.
      </p>
    </div>
  </div>
  <div class="footer">
    © ${new Date().getFullYear()} TechBuy Advisor — Quyết định chọn PC gaming minh bạch và có cơ sở.
  </div>
</body>
</html>
  `.trim();

  return sendEmail({ to: email, subject, html });
}
