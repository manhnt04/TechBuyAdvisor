import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { executeCronCycle } from '../scripts/cron-worker';

test('executeCronCycle runs ingestion, updates catalog, and records audit log', async () => {
  const result = await executeCronCycle(10); // Fast 10ms delay for unit test
  assert.equal(result.ok, true);
  if (!result.ok || !result.report || !result.alertReport) return;

  assert.ok(result.report.totalProcessed > 0);
  assert.ok(typeof result.alertReport.checkedAlertsCount === 'number');

  // Verify cron_history.log exists and contains timestamped record
  const logPath = path.join(process.cwd(), 'data', 'cron_history.log');
  const logContent = await readFile(logPath, 'utf8');
  assert.ok(logContent.includes('SUCCESS - Processed'));
});
