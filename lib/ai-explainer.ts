import type { Build } from './recommend';
import type { Sku, Listing } from './types';

export interface ExplainContext {
  budget_vnd: number;
  resolution: '1080p' | '1440p';
  target_games: string[];
  priority: string;
}

export function sanitizeExplanation(text: string): string {
  return text
    .replace(/nghẽn cổ chai/gi, 'mức cân bằng tải')
    .replace(/nghen co chai/gi, 'muc can bang tai')
    .replace(/bottleneck/gi, 'sự cân đối hiệu năng')
    .replace(/\bnghẽn\b/gi, 'giới hạn tải');
}

export function buildSystemPrompt(build: Build, ctx: ExplainContext): string {
  const cpu = build.components.find((c: { sku: Sku; listing: Listing }) => c.sku.category === 'CPU')?.sku;
  const gpu = build.components.find((c: { sku: Sku; listing: Listing }) => c.sku.category === 'GPU')?.sku;
  const mobo = build.components.find((c: { sku: Sku; listing: Listing }) => c.sku.category === 'MB')?.sku;
  const ram = build.components.find((c: { sku: Sku; listing: Listing }) => c.sku.category === 'RAM')?.sku;
  const psu = build.components.find((c: { sku: Sku; listing: Listing }) => c.sku.category === 'PSU')?.sku;
  const ssd = build.components.find((c: { sku: Sku; listing: Listing }) => c.sku.category === 'SSD')?.sku;
  const pcCase = build.components.find((c: { sku: Sku; listing: Listing }) => c.sku.category === 'CASE')?.sku;

  return `Bạn là Cố Vấn Kỹ Thuật Phần Cứng Máy Tính của TechBuy Advisor (Việt Nam).
Nhiệm vụ: Giải thích chi tiết và khách quan lý do cấu hình máy tính này là tối ưu nhất cho người dùng dựa trên dữ liệu đã tính toán.

THÔNG TIN NGƯỜI DÙNG:
- Ngân sách: ${(ctx.budget_vnd / 1_000_000).toFixed(0)} triệu VNĐ
- Độ phân giải mục tiêu: ${ctx.resolution}
- Các game chọn chơi: ${ctx.target_games.join(', ')}
- Ưu tiên cá nhân: ${ctx.priority}

CẤU HÌNH ĐÃ CHỌN:
- Tổng chi phí: ${build.totalPriceVnd.toLocaleString('vi-VN')} VNĐ
- CPU: ${cpu?.name || 'N/A'} (Socket ${cpu?.socket}, TDP ${cpu?.maxTdpW}W)
- GPU: ${gpu?.name || 'N/A'} (TDP ${gpu?.maxTdpW}W, Dài ${gpu?.gpuLengthMm}mm)
- Mainboard: ${mobo?.name || 'N/A'} (Form factor ${mobo?.formFactor})
- RAM: ${ram?.name || 'N/A'}
- Nguồn (PSU): ${psu?.name || 'N/A'} (Công suất ${psu?.wattage}W)
- Ổ cứng SSD: ${ssd?.name || 'N/A'}
- Vỏ Case: ${pcCase?.name || 'N/A'}
- FPS dự kiến: ${build.fps.map((f: { game: string; fps: number }) => `${f.game}: ${f.fps} FPS`).join(' | ')}
- Điểm Value Score: ${build.valueScore.toFixed(1)}/100
- Đánh giá giá bán: ${build.price.status} (${build.price.explanation})

QUY TẮC BẮT BUỘC (STRICT GUARDRAILS):
1. TUYỆT ĐỐI KHÔNG sử dụng từ "bottleneck", "nghẽn cổ chai", hay "nghẽn". Thay vào đó hãy dùng các thuật ngữ chính xác: "khai thác tối đa hiệu năng GPU", "mức cân bằng tải giữa CPU và GPU", "độ mượt khung hình".
2. Bố cục trả lời gồm 3 phần rõ ràng:
   🎯 **Tối ưu ngân sách & Hiệu năng game**: Phân tích vì sao phân bổ tiền vào cặp CPU/GPU này mang lại FPS thực tế tối ưu nhất ở ${ctx.resolution}.
   ⚡ **Nhiệt độ & Nguồn điện**: Đánh giá công suất nguồn ${psu?.wattage}W so với tổng tiêu thụ thực tế, khả năng tản nhiệt và lưu thông khí của thùng máy.
   🚀 **Lộ trình nâng cấp 2 năm tới**: Khả năng nâng cấp RAM (khe cắm còn lại), SSD M.2, CPU trên socket ${cpu?.socket}, và dư địa công suất nguồn khi thay linh kiện sau này.
3. Độ dài vừa phải (khoảng 150-250 từ), súc tích, văn phong kỹ thuật tin cậy.`;
}

export function generateDeterministicExplanation(build: Build, ctx: ExplainContext): string {
  const cpu = build.components.find((c: { sku: Sku; listing: Listing }) => c.sku.category === 'CPU')?.sku;
  const gpu = build.components.find((c: { sku: Sku; listing: Listing }) => c.sku.category === 'GPU')?.sku;
  const mobo = build.components.find((c: { sku: Sku; listing: Listing }) => c.sku.category === 'MB')?.sku;
  const psu = build.components.find((c: { sku: Sku; listing: Listing }) => c.sku.category === 'PSU')?.sku;

  const totalEstWattage = (cpu?.maxTdpW || 65) + (gpu?.maxTdpW || 150) + 75;
  const psuWattage = psu?.wattage || 550;
  const headroomPct = Math.round(((psuWattage - totalEstWattage) / psuWattage) * 100);

  return sanitizeExplanation(`🎯 **Tối ưu ngân sách & Hiệu năng game**:
Cấu hình tập trung ngân sách chủ đạo vào **${gpu?.name}** kết hợp cùng **${cpu?.name}**, mang lại hiệu suất tối đa trên từng đồng chi phí (Value Score ${build.valueScore.toFixed(1)}/100). Với mức phân giải **${ctx.resolution}**, hệ thống đảm bảo duy trì độ ổn định khung hình từ ${build.fps[0]?.fps || 60} FPS trở lên trên các tựa game bạn đã chọn (${ctx.target_games.join(', ')}).

⚡ **Nhiệt độ & Điện năng dự phòng**:
Hệ thống tiêu thụ tối đa ước tính khoảng **${totalEstWattage}W** ở chế độ toàn tải. Nguồn **${psu?.name} (${psuWattage}W)** cung cấp khoảng dự phòng an toàn lên đến **${headroomPct}%**, giúp bộ nguồn luôn hoạt động trong dải hiệu suất tối ưu, giảm thiểu tỏa nhiệt và kéo dài tuổi thọ linh kiện.

🚀 **Lộ trình nâng cấp 2 năm tới**:
Nền tảng bo mạch chủ **${mobo?.name}** trên socket **${cpu?.socket}** cho phép bạn dễ dàng cắm thêm RAM DDR4/DDR5 hoặc bổ sung thêm ổ SSD M.2 NVMe tốc độ cao khi nhu cầu lưu trữ tăng. Nguồn điện hiện tại hoàn toàn đủ khả năng gánh các dòng card đồ họa thế hệ tiếp theo mà không cần phải thay thế toàn bộ hệ thống.`);
}

export async function* streamAIExplanation(
  build: Build,
  ctx: ExplainContext
): AsyncGenerator<string, void, unknown> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const prompt = buildSystemPrompt(build, ctx);

  if (geminiKey) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:streamGenerateContent?alt=sse&key=${geminiKey}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 800,
          },
        }),
      });

      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6).trim();
              if (!jsonStr || jsonStr === '[DONE]') continue;
              try {
                const parsed = JSON.parse(jsonStr);
                const chunkText = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                if (chunkText) {
                  yield sanitizeExplanation(chunkText);
                }
              } catch {
                // Ignore parse errors on partial frames
              }
            }
          }
        }
        return;
      }
    } catch (err) {
      console.warn('[AI EXPLAINER] Gemini streaming error, falling back to deterministic stream:', err);
    }
  }

  if (openaiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          stream: true,
          temperature: 0.3,
          max_tokens: 600,
        }),
      });

      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6).trim();
              if (jsonStr === '[DONE]') break;
              try {
                const parsed = JSON.parse(jsonStr);
                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) {
                  yield sanitizeExplanation(delta);
                }
              } catch {
                // Ignore partial frame parse errors
              }
            }
          }
        }
        return;
      }
    } catch (err) {
      console.warn('[AI EXPLAINER] OpenAI streaming error, falling back to deterministic stream:', err);
    }
  }

  // Fallback: Deterministic generator streamed in realistic chunks
  const fullText = generateDeterministicExplanation(build, ctx);
  const words = fullText.split(' ');
  for (let i = 0; i < words.length; i += 4) {
    const chunk = words.slice(i, i + 4).join(' ') + ' ';
    yield sanitizeExplanation(chunk);
    await new Promise(r => setTimeout(r, 45)); // Natural typing pace
  }
}
