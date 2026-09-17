import { NextRequest, NextResponse } from 'next/server';
import { runIngestion } from '@/scripts/ingestion-worker';

export const runtime = 'nodejs';

const INGESTION_SECRET = process.env.TECHBUY_INGESTION_SECRET || 'techbuy-ingest-secret-2026';

export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get('authorization');
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;

    if (!token || token !== INGESTION_SECRET) {
      return NextResponse.json({ status: 'UNAUTHORIZED', reason: 'Yêu cầu Bearer token hợp lệ.' }, { status: 401 });
    }

    const { report, alertReport } = await runIngestion({ delayMs: 100 });

    return NextResponse.json({
      status: 'OK',
      message: 'Ingestion batch đã thực thi hoàn tất.',
      report,
      alertReport,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({
      status: 'INTERNAL_ERROR',
      error: err.message || 'Lỗi xử lý ingestion',
    }, { status: 500 });
  }
}
