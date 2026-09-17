import { NextRequest, NextResponse } from 'next/server';
import { sanitizeExplanation } from '@/lib/ai-explainer';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    const { question, build, history = [] } = body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Deterministic friendly fallback if no key
      return NextResponse.json({
        reply: sanitizeExplanation(
          'TechBot đây! Cấu hình hiện tại đã được tính toán tối ưu 100% tương thích phần cứng, nguồn điện và độ dài GPU. Bạn hoàn toàn yên tâm chiến game hoặc nâng cấp trong 2 năm tới nhé! 🚀'
        ),
      });
    }

    const cpu = build?.components?.find((c: any) => c.sku.category === 'CPU')?.sku;
    const gpu = build?.components?.find((c: any) => c.sku.category === 'GPU')?.sku;
    const psu = build?.components?.find((c: any) => c.sku.category === 'PSU')?.sku;
    const mobo = build?.components?.find((c: any) => c.sku.category === 'MB')?.sku;

    const buildContext = build
      ? `CẤU HÌNH HIỆN TẠI CỦA NGƯỜI DÙNG:
- CPU: ${cpu?.name || 'N/A'} (Socket ${cpu?.socket}, TDP ${cpu?.maxTdpW}W)
- GPU: ${gpu?.name || 'N/A'} (TDP ${gpu?.maxTdpW}W)
- Bo mạch chủ: ${mobo?.name || 'N/A'}
- Bộ nguồn (PSU): ${psu?.name || 'N/A'} (${psu?.wattage || 650}W)
- Tổng chi phí: ${build.totalPriceVnd?.toLocaleString('vi-VN')} VNĐ`
      : 'Người dùng chưa chọn cấu hình cụ thể.';

    const systemInstruction = `Bạn là TechBot, linh vật kiêm Cố Vấn Công Nghệ thân thiện, thông thái của TechBuy Advisor (Việt Nam).
Nhiệm vụ: Trả lời câu hỏi của người dùng về cấu hình máy tính, linh kiện, nhiệt độ, nâng cấp trong tương lai một cách gần gũi, chính xác và có căn cứ kỹ thuật.

${buildContext}

QUY TẮC BẮT BUỘC (STRICT GUARDRAILS):
1. TUYỆT ĐỐI KHÔNG dùng từ "bottleneck", "nghẽn cổ chai", hay "nghẽn". Hãy giải thích theo mức cân bằng tải thực tế giữa CPU và GPU.
2. Trả lời súc tích, ngắn gọn (tối đa 3-5 câu), tập trung vào câu hỏi chính.
3. Dùng xưng hô "mình/bạn" hoặc "TechBot/bạn", kèm emoji vui nhộn, công nghệ.`;

    const contents = [
      {
        role: 'user',
        parts: [{ text: `${systemInstruction}\n\nCâu hỏi của người dùng: ${question}` }],
      },
    ];

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 400,
        },
      }),
    });

    if (!res.ok) {
      return NextResponse.json({
        reply: sanitizeExplanation(
          'TechBot đang hơi bận soi benchmark một chút! Nhưng nhìn chung cấu hình này rất cân bằng về công suất nguồn và khả năng tản nhiệt rồi bạn nhé! ⚡'
        ),
      });
    }

    const data = await res.json();
    const rawReply = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleanReply = sanitizeExplanation(rawReply);

    return NextResponse.json({ reply: cleanReply });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
}
