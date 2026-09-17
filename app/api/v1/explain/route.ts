import { NextRequest } from 'next/server';
import { streamAIExplanation, type ExplainContext } from '@/lib/ai-explainer';
import type { Build } from '@/lib/recommend';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.build) {
      return new Response(JSON.stringify({ error: 'Missing build payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const build: Build = body.build;
    const ctx: ExplainContext = {
      budget_vnd: Number(body.budget_vnd) || 25_000_000,
      resolution: body.resolution === '1440p' ? '1440p' : '1080p',
      target_games: Array.isArray(body.target_games) ? body.target_games : ['Cyberpunk 2077'],
      priority: typeof body.priority === 'string' ? body.priority : 'FPS',
    };

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamAIExplanation(build, ctx)) {
            const data = `data: ${JSON.stringify({ text: chunk })}\n\n`;
            controller.enqueue(encoder.encode(data));
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
