import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

type BugReport = {
  id: string;
  traceId: string;
  snapshotId: string;
  skus: string[];
  reason: string;
  userNote?: string;
  createdAt: string;
};

const bugReports: BugReport[] = [];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ status: 'INVALID_INPUT' }, { status: 400 });
    }

    const { trace_id, snapshot_id, skus, reason, user_note } = body as Record<string, unknown>;

    if (typeof trace_id !== 'string' || typeof snapshot_id !== 'string' || typeof reason !== 'string') {
      return NextResponse.json({ status: 'INVALID_INPUT', reason: 'Thiếu thông tin bắt buộc (trace_id, snapshot_id, reason).' }, { status: 400 });
    }

    const report: BugReport = {
      id: randomUUID(),
      traceId: trace_id,
      snapshotId: snapshot_id,
      skus: Array.isArray(skus) ? skus.map(String) : [],
      reason,
      userNote: typeof user_note === 'string' ? user_note : undefined,
      createdAt: new Date().toISOString(),
    };

    bugReports.push(report);

    return NextResponse.json({
      status: 'OK',
      report_id: report.id,
      message: 'Cảm ơn bạn đã báo lỗi. Đội ngũ kỹ thuật sẽ xem xét và đối soát với snapshot tương ứng.',
    });
  } catch {
    return NextResponse.json({ status: 'SERVICE_UNAVAILABLE' }, { status: 503 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'OK', total: bugReports.length, reports: bugReports });
}
