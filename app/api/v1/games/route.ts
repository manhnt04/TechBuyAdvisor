import { NextResponse } from 'next/server';
import { GAME_CATALOG } from '@/lib/games';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({
    status: 'OK',
    games: GAME_CATALOG,
  });
}
