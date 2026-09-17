import { loadCatalog } from './catalog';
import { requiredPower } from './recommend';
import type { Catalog, Sku } from './types';
import { median } from './pricing';

export interface QuotedItem {
  category: string;
  name: string;
  quotedPriceVnd: number;
  marketMedianVnd?: number;
  priceDiffVnd?: number;
  priceDiffPct?: number;
  status?: 'CHEAPER' | 'FAIR' | 'EXPENSIVE' | 'UNKNOWN';
}

export interface QuoteValidationResult {
  storeName: string;
  totalQuotedVnd: number;
  totalMarketVnd: number;
  differenceVnd: number;
  differencePct: number;
  verdict: 'GOOD_PRICE' | 'FAIR_PRICE' | 'OVERPRICED';
  verdictMessage: string;
  psuSafety: {
    quotedWattage: number;
    requiredWattage: number;
    status: 'SAFE' | 'WARNING_INSUFFICIENT' | 'UNKNOWN';
    message: string;
  };
  items: QuotedItem[];
  aiNotes: string;
}

export async function validateQuoteImage(
  base64Data: string,
  mimeType = 'image/jpeg'
): Promise<QuoteValidationResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  const catalog = await loadCatalog();

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY chưa được thiết lập');
  }

  const prompt = `Bạn là Chuyên viên Thẩm định Báo giá Máy tính của TechBuy Advisor (Việt Nam).
Nhiệm vụ: Đọc kỹ ảnh chụp bảng báo giá / hóa đơn linh kiện PC này và trích xuất dữ liệu thành định dạng JSON CHÍNH XÁC (không thêm markdown ngoài JSON).

CẤU TRÚC JSON YÊU CẦU:
{
  "storeName": "Tên cửa hàng (hoặc Không rõ nếu không thấy)",
  "items": [
    {
      "category": "CPU" | "GPU" | "MB" | "RAM" | "SSD" | "PSU" | "CASE" | "COOLER" | "OTHER",
      "name": "Tên đầy đủ của linh kiện",
      "quotedPriceVnd": 2500000
    }
  ],
  "totalQuotedPriceVnd": 24500000,
  "detectedNotes": "Ghi chú ngắn về các ưu đãi hoặc điều kiện bảo hành nếu có trong ảnh"
}

LƯU Ý QUAN TRỌNG:
- Giá tiền phải là số nguyên VNĐ (loại bỏ dấu chấm, phẩy, chữ đ). Ví dụ: 2.500.000 -> 2500000.
- Chỉ trả về duy nhất khối JSON chuẩn, bắt đầu bằng { và kết thúc bằng }.`;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1000,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini Vision API error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

  let parsed: any;
  try {
    parsed = JSON.parse(cleanJson);
  } catch {
    throw new Error('Không thể phân tích dữ liệu từ ảnh báo giá. Vui lòng chụp rõ nét hơn.');
  }

  return auditExtractedQuote(parsed, catalog);
}

export function auditExtractedQuote(parsed: any, catalog: Catalog): QuoteValidationResult {
  const storeName = parsed.storeName || 'Cửa hàng vi tính';
  const items: QuotedItem[] = [];

  let calculatedMarketTotal = 0;
  let totalQuoted = Number(parsed.totalQuotedPriceVnd) || 0;

  let detectedCpu: Sku | undefined;
  let detectedGpu: Sku | undefined;
  let detectedPsuWattage = 0;

  for (const rawItem of parsed.items || []) {
    const qPrice = Number(rawItem.quotedPriceVnd) || 0;
    const cat = String(rawItem.category).toUpperCase();
    const name = String(rawItem.name);

    // Best matching SKU in catalog by keyword overlap score
    let bestSku: Sku | undefined;
    let highestScore = 0;
    const lowerName = name.toLowerCase();

    for (const s of catalog.skus) {
      if (s.category !== cat && !lowerName.includes(s.category.toLowerCase())) continue;
      const sWords = s.name.toLowerCase().split(/[\s\-_/()]+/);
      let matchCount = 0;
      for (const w of sWords) {
        if (w.length >= 3 && lowerName.includes(w)) {
          // Extra weight for model identifiers with digits (e.g. 4070, 12400)
          matchCount += /\d/.test(w) ? 3 : 1;
        }
      }
      if (matchCount > highestScore) {
        highestScore = matchCount;
        bestSku = s;
      }
    }
    const matchedSku = highestScore >= 2 ? bestSku : undefined;

    let marketPrice = qPrice;
    if (matchedSku) {
      const historyPrices = catalog.history.filter(h => h.skuId === matchedSku.id).map(h => h.priceVnd);
      const med = median(historyPrices);
      if (med) marketPrice = med;

      if (matchedSku.category === 'CPU') detectedCpu = matchedSku;
      if (matchedSku.category === 'GPU') detectedGpu = matchedSku;
      if (matchedSku.category === 'PSU' && matchedSku.wattage) detectedPsuWattage = matchedSku.wattage;
    }

    if (!detectedPsuWattage && (cat === 'PSU' || name.toLowerCase().includes('nguồn') || name.toLowerCase().includes('w'))) {
      const wattMatch = name.match(/(\d{3,4})\s*w/i);
      if (wattMatch) detectedPsuWattage = parseInt(wattMatch[1], 10);
    }

    calculatedMarketTotal += marketPrice;

    const diffVnd = qPrice - marketPrice;
    const diffPct = marketPrice > 0 ? (diffVnd / marketPrice) * 100 : 0;

    let status: QuotedItem['status'] = 'FAIR';
    if (diffPct > 7) status = 'EXPENSIVE';
    else if (diffPct < -7) status = 'CHEAPER';

    items.push({
      category: cat,
      name,
      quotedPriceVnd: qPrice,
      marketMedianVnd: marketPrice,
      priceDiffVnd: diffVnd,
      priceDiffPct: Math.round(diffPct * 10) / 10,
      status,
    });
  }

  if (totalQuoted === 0) {
    totalQuoted = items.reduce((sum, i) => sum + i.quotedPriceVnd, 0);
  }

  const differenceVnd = totalQuoted - calculatedMarketTotal;
  const differencePct = calculatedMarketTotal > 0 ? Math.round(((differenceVnd / calculatedMarketTotal) * 100) * 10) / 10 : 0;

  let verdict: QuoteValidationResult['verdict'] = 'FAIR_PRICE';
  let verdictMessage = 'Mức giá báo từ cửa hàng tương đương mặt bằng chung thị trường.';

  if (differencePct >= 8) {
    verdict = 'OVERPRICED';
    verdictMessage = `Báo giá này đang cao hơn giá thị trường khoảng ${differencePct}% (chênh lệch ${differenceVnd.toLocaleString('vi-VN')} đ). Bạn nên thương lượng lại hoặc tham khảo thêm nơi khác!`;
  } else if (differencePct <= -6) {
    verdict = 'GOOD_PRICE';
    verdictMessage = `Báo giá rất tốt! Rẻ hơn khoảng ${Math.abs(differencePct)}% so with giá trung vị thị trường. Hãy kiểm tra kỹ điều kiện bảo hành chính hãng.`;
  }

  // PSU Safety Check
  let requiredWattage = 500;
  if (detectedCpu && detectedGpu) {
    requiredWattage = requiredPower(detectedCpu, detectedGpu);
  } else if (detectedGpu) {
    requiredWattage = Math.ceil(((detectedGpu.maxTdpW || 200) + 65 + 75) * 1.25 / 50) * 50;
  }

  // Real-world GPU transient spikes & manufacturer minimum recommendations:
  // RTX 4070 Super / RX 7700 XT and higher (TDP >= 200W) strictly require 650W+
  if (detectedGpu) {
    const gpuTdp = detectedGpu.maxTdpW ?? 0;
    if (gpuTdp >= 240) {
      requiredWattage = Math.max(requiredWattage, 700);
    } else if (gpuTdp >= 200) {
      requiredWattage = Math.max(requiredWattage, 650);
    } else if (gpuTdp >= 150) {
      requiredWattage = Math.max(requiredWattage, 550);
    }
  }

  let psuStatus: QuoteValidationResult['psuSafety']['status'] = 'SAFE';
  let psuMessage = `Nguồn ${detectedPsuWattage || 650}W an toàn cho hệ thống (yêu cầu tối thiểu ${requiredWattage}W).`;

  if (detectedPsuWattage > 0 && detectedPsuWattage < requiredWattage) {
    psuStatus = 'WARNING_INSUFFICIENT';
    psuMessage = `Cảnh báo: Bộ nguồn ${detectedPsuWattage}W có nguy cơ thiếu hụt công suất so với yêu cầu tối thiểu ${requiredWattage}W của cấu hình này!`;
  } else if (!detectedPsuWattage) {
    psuStatus = 'UNKNOWN';
    psuMessage = `Chưa xác định rõ công suất nguồn. Khuyến nghị dùng nguồn từ ${requiredWattage}W trở lên.`;
  }

  return {
    storeName,
    totalQuotedVnd: totalQuoted,
    totalMarketVnd: calculatedMarketTotal,
    differenceVnd,
    differencePct,
    verdict,
    verdictMessage,
    psuSafety: {
      quotedWattage: detectedPsuWattage,
      requiredWattage,
      status: psuStatus,
      message: psuMessage,
    },
    items,
    aiNotes: parsed.detectedNotes || 'Không có ghi chú thêm.',
  };
}
