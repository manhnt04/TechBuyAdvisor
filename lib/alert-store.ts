import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export interface PriceAlertRecord {
  id: string;
  email: string;
  skuId: string;
  targetPriceVnd: number;
  magicToken: string;
  expiresAt: number; // Unix timestamp in ms
  verified: boolean;
  notified: boolean;
  createdAt: string;
}

const getStorePath = () => process.env.TECHBUY_ALERTS_PATH || path.join(process.cwd(), 'data', 'price_alerts.json');

export async function loadAlerts(): Promise<PriceAlertRecord[]> {
  try {
    const raw = await readFile(getStorePath(), 'utf8');
    return JSON.parse(raw) as PriceAlertRecord[];
  } catch {
    return [];
  }
}

export async function saveAlerts(alerts: PriceAlertRecord[]): Promise<void> {
  await writeFile(getStorePath(), JSON.stringify(alerts, null, 2), 'utf8');
}

export async function createAlert(email: string, skuId: string, targetPriceVnd: number): Promise<{ alert: PriceAlertRecord; magicToken: string }> {
  const alerts = await loadAlerts();
  const alertId = randomUUID();
  const magicToken = randomUUID();
  const now = Date.now();
  const expiresAt = now + 15 * 60 * 1000; // 15 minutes per NFR-15

  const newAlert: PriceAlertRecord = {
    id: alertId,
    email,
    skuId,
    targetPriceVnd: Math.round(targetPriceVnd),
    magicToken,
    expiresAt,
    verified: false,
    notified: false,
    createdAt: new Date(now).toISOString(),
  };

  alerts.push(newAlert);
  await saveAlerts(alerts);
  return { alert: newAlert, magicToken };
}

export async function verifyAlertToken(alertId: string, token: string): Promise<{ success: boolean; reason?: string; alert?: PriceAlertRecord }> {
  const alerts = await loadAlerts();
  const alert = alerts.find(a => a.id === alertId);

  if (!alert) {
    return { success: false, reason: 'Không tìm thấy yêu cầu cảnh báo giá.' };
  }

  if (alert.verified) {
    return { success: true, alert, reason: 'Cảnh báo giá này đã được kích hoạt từ trước.' };
  }

  if (alert.magicToken !== token) {
    return { success: false, reason: 'Mã xác nhận không chính xác.' };
  }

  if (Date.now() > alert.expiresAt) {
    return { success: false, reason: 'Mã xác nhận đã hết hạn (quá 15 phút). Vui lòng tạo lại cảnh báo giá mới.' };
  }

  alert.verified = true;
  await saveAlerts(alerts);
  return { success: true, alert };
}
