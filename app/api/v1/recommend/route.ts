import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { rules } from '@/lib/config';
import type { RecommendInput } from '@/lib/types';
import { loadCatalog } from '@/lib/catalog';
import { recommend } from '@/lib/recommend';

export const runtime = 'nodejs';
const requests = new Map<string, number[]>();

function parseInput(value: unknown): RecommendInput | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  if (typeof v.budget_vnd !== 'number' || !Number.isInteger(v.budget_vnd) || v.budget_vnd < rules.budgetMin || v.budget_vnd > rules.budgetMax) return null;
  if (v.resolution !== '1080p' && v.resolution !== '1440p') return null;
  if (!Array.isArray(v.target_games) || v.target_games.length < 1 || v.target_games.length > 3 || new Set(v.target_games).size !== v.target_games.length || v.target_games.some(game => !rules.games.includes(game))) return null;
  if (!['FPS', 'Quiet', 'Compact', 'No-RGB'].includes(String(v.priority))) return null;
  if (typeof v.client_timestamp !== 'string' || !Number.isFinite(Date.parse(v.client_timestamp))) return null;
  return v as RecommendInput;
}

export async function POST(request: NextRequest) {
  const trace_id = randomUUID();
  let snapshot_id = 'unavailable';
  try {
    const catalog = await loadCatalog();
    snapshot_id = catalog.snapshotId;
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const now = Date.now();
    const recent = (requests.get(ip) ?? []).filter(time => now - time < 60_000);
    if (recent.length >= 15) return NextResponse.json({ status: 'RATE_LIMITED', trace_id, snapshot_id }, { status: 429 });
    requests.set(ip, [...recent, now]);
    const input = parseInput(await request.json().catch(() => null));
    if (!input) return NextResponse.json({ status: 'INVALID_INPUT', trace_id, snapshot_id }, { status: 400 });
    return NextResponse.json({ ...recommend(input, catalog), trace_id, snapshot_id, config_version: rules.version });
  } catch {
    return NextResponse.json({ status: 'SERVICE_UNAVAILABLE', trace_id, snapshot_id }, { status: 503 });
  }
}
