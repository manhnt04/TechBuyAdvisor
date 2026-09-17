import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { runIngestion } from './ingestion-worker';

export interface CronRunOptions {
  intervalHours?: number;
  delayMs?: number;
  runOnce?: boolean;
}

async function logCronExecution(message: string) {
  const logDir = path.join(process.cwd(), 'data');
  await mkdir(logDir, { recursive: true });
  const logFile = path.join(logDir, 'cron_history.log');
  const line = `[${new Date().toISOString()}] ${message}\n`;
  await appendFile(logFile, line, 'utf8');
}

export async function executeCronCycle(delayMs = 2000) {
  console.log(`\n======================================================`);
  console.log(`[CRON CYCLE START] ${new Date().toLocaleString('vi-VN')}`);
  console.log(`======================================================`);

  try {
    const { report, alertReport } = await runIngestion({ delayMs });
    const logMsg = `SUCCESS - Processed ${report.totalProcessed} listings (${report.successCount} ok, ${report.failedCount} err, ${report.suspectCount} suspect). Price alerts triggered: ${alertReport.triggeredAlertsCount}.`;
    console.log(`[CRON CYCLE FINISHED] ${logMsg}`);
    await logCronExecution(logMsg);
    return { ok: true, report, alertReport };
  } catch (err: any) {
    const errorMsg = `ERROR - Cron cycle failed: ${err?.message || String(err)}`;
    console.error(`[CRON CYCLE ERROR] ${errorMsg}`);
    await logCronExecution(errorMsg);
    return { ok: false, error: errorMsg };
  }
}

export async function startCronWorker(options: CronRunOptions = {}) {
  const intervalHours = options.intervalHours || 24;
  const intervalMs = intervalHours * 60 * 60 * 1000;
  const delayMs = options.delayMs ?? 2000;

  console.log(`[CRON WORKER] Khởi động dịch vụ tự động hóa Ingestion & Price Alerts`);
  console.log(`[CRON WORKER] Chu kỳ kiểm tra giá: Mỗi ${intervalHours} giờ một lần`);

  // Run immediate first cycle
  await executeCronCycle(delayMs);

  if (options.runOnce) {
    console.log('[CRON WORKER] Chế độ --now / runOnce hoàn tất.');
    return;
  }

  // Set recurring interval
  console.log(`[CRON WORKER] Chu kỳ tiếp theo sau ${intervalHours} giờ...`);
  setInterval(async () => {
    await executeCronCycle(delayMs);
  }, intervalMs);
}

// CLI execution
if (process.argv[1]?.endsWith('cron-worker.ts')) {
  const runOnce = process.argv.includes('--now') || process.argv.includes('--once');
  const delayMs = process.argv.includes('--fast') ? 100 : 2000;
  startCronWorker({ runOnce, delayMs }).catch(console.error);
}
