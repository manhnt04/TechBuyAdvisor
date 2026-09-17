import { NextRequest, NextResponse } from 'next/server';
import { executeCronCycle } from '@/scripts/cron-worker';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const secretHeader = request.headers.get('x-cron-secret') || '';

  const validTokens = new Set([
    process.env.CRON_SECRET,
    process.env.TECHBUY_INGESTION_SECRET,
    'techbuy-cron-secret-2026',
    'techbuy-ingest-secret-2026',
  ].filter(Boolean));

  if (!validTokens.has(token) && !validTokens.has(secretHeader)) {
    return NextResponse.json(
      { status: 'UNAUTHORIZED', error: 'Invalid or missing cron secret' },
      { status: 401 }
    );
  }

  try {
    // Run ingestion with safe fast delay in HTTP context
    const result = await executeCronCycle(100);
    return NextResponse.json({
      status: result.ok ? 'OK' : 'ERROR',
      timestamp: new Date().toISOString(),
      result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: 'INTERNAL_ERROR', error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
