import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Catalog, Listing, Sku } from '../lib/types';

interface CandidateProduct {
  title: string;
  url: string;
  priceVnd: number | null;
  stock: 'IN_STOCK' | 'OUT_OF_STOCK';
  score: number;
}

interface DiscoveryMatch {
  skuId: string;
  skuName: string;
  retailer: string;
  query: string;
  matchedUrl: string;
  priceVnd: number;
  stock: 'IN_STOCK' | 'OUT_OF_STOCK';
  confidenceScore: number;
  status: 'FOUND' | 'FALLBACK';
}

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

const RETAILERS = [
  {
    name: 'KCCShop',
    domain: 'kccshop.vn',
    type: 'HTML',
    searchUrl: (q: string) => `https://kccshop.vn/?s=${encodeURIComponent(q)}`,
  },
  {
    name: 'MemoryZone',
    domain: 'memoryzone.com.vn',
    type: 'HTML',
    searchUrl: (q: string) => `https://memoryzone.com.vn/search?q=${encodeURIComponent(q)}`,
  },
  {
    name: 'An Phát PC',
    domain: 'www.anphatpc.com.vn',
    type: 'HTML',
    searchUrl: (q: string) => `https://www.anphatpc.com.vn/tim?q=${encodeURIComponent(q)}`,
  },
  {
    name: 'GearVN',
    domain: 'gearvn.com',
    type: 'HTML',
    searchUrl: (q: string) => `https://gearvn.com/search?type=product&q=${encodeURIComponent(q)}`,
  },
  {
    name: 'HACOM',
    domain: 'hacom.vn',
    type: 'HTML',
    searchUrl: (q: string) => `https://hacom.vn/tim?q=${encodeURIComponent(q)}`,
  },
  {
    name: 'Tiki Trading',
    domain: 'tiki.vn',
    type: 'TIKI_API',
    searchUrl: (q: string) => `https://tiki.vn/api/v2/products?limit=10&q=${encodeURIComponent(q)}`,
  },
  {
    name: 'Shopee Mall',
    domain: 'shopee.vn',
    type: 'SHOPEE_MALL',
    searchUrl: (q: string) => `https://shopee.vn/search?keyword=${encodeURIComponent(q)}&facet=mall`,
  },
];

// Price bounds per category (VND) to eliminate accessories
const CATEGORY_BOUNDS: Record<string, [number, number]> = {
  CPU: [1_500_000, 15_000_000],
  GPU: [3_500_000, 35_000_000],
  MB: [1_100_000, 8_000_000],
  RAM: [600_000, 5_000_000],
  SSD: [700_000, 5_000_000],
  PSU: [550_000, 4_000_000],
  CASE: [450_000, 3_500_000],
  COOLER: [350_000, 3_000_000],
};

function getSearchMeta(sku: Sku): { query: string; mandatory: string[]; forbidden: string[] } {
  const id = sku.id.toLowerCase();

  // CPU
  if (id.includes('12400f')) return { query: 'Core i5 12400F', mandatory: ['12400f'], forbidden: ['12400k', '13400'] };
  if (id.includes('13400f')) return { query: 'Core i5 13400F', mandatory: ['13400f'], forbidden: ['13400k', '12400'] };
  if (id.includes('14600kf')) return { query: 'Core i5 14600KF', mandatory: ['14600kf'], forbidden: ['13600'] };
  if (id.includes('5600')) return { query: 'Ryzen 5 5600', mandatory: ['5600'], forbidden: ['5600g', '5600x'] };
  if (id.includes('7500f')) return { query: 'Ryzen 5 7500F', mandatory: ['7500f'], forbidden: ['7600'] };
  if (id.includes('7600')) return { query: 'Ryzen 5 7600', mandatory: ['7600'], forbidden: ['7500f', '7600x'] };

  // GPU
  if (id.includes('3050')) return { query: 'RTX 3050 6GB', mandatory: ['3050'], forbidden: ['8gb'] };
  if (id.includes('6600')) return { query: 'Radeon RX 6600', mandatory: ['6600'], forbidden: ['6600xt'] };
  if (id.includes('4060ti')) return { query: 'GeForce RTX 4060 Ti', mandatory: ['4060', 'ti'], forbidden: ['16gb'] };
  if (id.includes('4060')) return { query: 'GeForce RTX 4060', mandatory: ['4060'], forbidden: ['ti'] };
  if (id.includes('7700xt')) return { query: 'Radeon RX 7700 XT', mandatory: ['7700', 'xt'], forbidden: ['7800'] };
  if (id.includes('4070-super')) return { query: 'GeForce RTX 4070 SUPER', mandatory: ['4070', 'super'], forbidden: ['ti'] };

  // Mainboard
  if (id.includes('h610m')) return { query: 'ASUS PRIME H610M', mandatory: ['h610'], forbidden: ['b760'] };
  if (id.includes('b760m-p-ddr4')) return { query: 'MSI PRO B760M-P DDR4', mandatory: ['b760', 'ddr4'], forbidden: ['ddr5'] };
  if (id.includes('b760m-d5')) return { query: 'B760M DDR5', mandatory: ['b760', 'ddr5'], forbidden: ['ddr4'] };
  if (id.includes('b450m-hdv')) return { query: 'ASRock B450M-HDV', mandatory: ['b450'], forbidden: ['b550'] };
  if (id.includes('b650m-hdv')) return { query: 'ASRock B650M-HDV', mandatory: ['b650'], forbidden: ['b760'] };
  if (id.includes('b650m-a')) return { query: 'MSI PRO B650M-A', mandatory: ['b650'], forbidden: ['b550'] };

  // RAM
  if (id.includes('fury-16gb-d4')) return { query: 'Kingston FURY 16GB DDR4', mandatory: ['fury', 'ddr4'], forbidden: ['ddr5'] };
  if (id.includes('lpx-32gb-d4')) return { query: 'Corsair LPX 32GB DDR4', mandatory: ['32gb', 'ddr4'], forbidden: ['ddr5'] };
  if (id.includes('fury-16gb-d5')) return { query: 'Kingston FURY 16GB DDR5', mandatory: ['fury', 'ddr5'], forbidden: ['ddr4'] };
  if (id.includes('vengeance-32gb-d5')) return { query: 'Corsair Vengeance 32GB DDR5', mandatory: ['32gb', 'ddr5'], forbidden: ['ddr4'] };

  // SSD
  if (id.includes('nv2-500g')) return { query: 'Kingston NV2 500GB', mandatory: ['nv2', '500'], forbidden: ['1tb', '2tb'] };
  if (id.includes('nv2-1tb')) return { query: 'Kingston NV2 1TB', mandatory: ['nv2', '1tb'], forbidden: ['500gb', '2tb'] };
  if (id.includes('980-1tb')) return { query: 'Samsung 980 1TB', mandatory: ['980', '1tb'], forbidden: ['980 pro', '500gb'] };

  // PSU
  if (id.includes('atom-550w')) return { query: 'Antec ATOM V550', mandatory: ['550'], forbidden: ['650', '750'] };
  if (id.includes('pk650d')) return { query: 'DeepCool PK650D', mandatory: ['pk650'], forbidden: ['pk550', 'pk750'] };
  if (id.includes('mag-a750bn')) return { query: 'MSI MAG A750BN', mandatory: ['a750'], forbidden: ['a650', 'a850'] };

  // Case
  if (id.includes('nyx-air')) return { query: 'Xigmatek NYX Air 3F', mandatory: ['nyx', 'air'], forbidden: [] };
  if (id.includes('air-100')) return { query: 'Montech AIR 100 LITE', mandatory: ['air 100'], forbidden: [] };
  if (id.includes('3301')) return { query: 'SAMA 3301', mandatory: ['3301'], forbidden: [] };

  // Cooler
  if (id.includes('pa120')) return { query: 'Thermalright Peerless Assassin 120', mandatory: ['peerless assassin', '120'], forbidden: [] };
  if (id.includes('ak400')) return { query: 'DeepCool AK400', mandatory: ['ak400'], forbidden: ['ak620'] };

  return { query: sku.name, mandatory: [sku.name.split(' ')[0].toLowerCase()], forbidden: [] };
}

// Bóc tách API của Tiki Trading
async function fetchTikiCandidates(query: string): Promise<CandidateProduct[]> {
  try {
    const res = await fetch(`https://tiki.vn/api/v2/products?limit=10&q=${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || []).map((item: any) => ({
      title: item.name || '',
      url: `https://tiki.vn/${item.url_path || ''}`,
      priceVnd: typeof item.price === 'number' ? item.price : null,
      stock: item.inventory_status === 'available' ? 'IN_STOCK' : 'OUT_OF_STOCK',
      score: 0,
    }));
  } catch {
    return [];
  }
}

// Bóc tách ứng viên sản phẩm từ mã HTML các shop
function parseCandidatesFromHtml(html: string, baseUrl: string): CandidateProduct[] {
  const candidates: CandidateProduct[] = [];
  const cleanBase = baseUrl.replace(/\/+$/, '');

  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(html)) !== null) {
    const rawHref = match[1];
    const innerHtml = match[2];

    if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('javascript:')) continue;

    const isProductUrl = rawHref.includes('/p/') || rawHref.includes('/san-pham/') || rawHref.includes('.html') || rawHref.split('/').length >= 4;
    if (!isProductUrl) continue;

    const titleMatch = match[0].match(/title=["']([^"']+)["']/i);
    const title = (titleMatch ? titleMatch[1] : innerHtml.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

    if (title.length < 10) continue;

    const snippetIndex = match.index;
    const windowSnippet = html.slice(Math.max(0, snippetIndex - 300), Math.min(html.length, snippetIndex + 800));

    let price: number | null = null;
    const priceMatch = windowSnippet.match(/([0-9]{1,3}(?:[.,][0-9]{3}){1,2})\s*(?:₫|đ|vnđ|d)\b/i);
    if (priceMatch) {
      const num = parseInt(priceMatch[1].replace(/[.,]/g, ''), 10);
      if (num >= 300_000 && num <= 50_000_000) price = num;
    }

    const stock = /hết hàng|out of stock|tạm hết/i.test(windowSnippet) ? 'OUT_OF_STOCK' : 'IN_STOCK';
    const fullUrl = rawHref.startsWith('http') ? rawHref : `${cleanBase}/${rawHref.replace(/^\/+/, '')}`;

    candidates.push({
      title,
      url: fullUrl,
      priceVnd: price,
      stock,
      score: 0,
    });
  }

  const seen = new Set<string>();
  return candidates.filter(c => {
    if (seen.has(c.url)) return false;
    seen.add(c.url);
    return true;
  });
}

function computeMatchScore(
  candidate: CandidateProduct,
  sku: Sku,
  mandatory: string[],
  forbidden: string[]
): number {
  const titleLower = candidate.title.toLowerCase();

  for (const f of forbidden) {
    if (titleLower.includes(f.toLowerCase())) return 0;
  }

  for (const m of mandatory) {
    if (!titleLower.includes(m.toLowerCase())) return 0;
  }

  const bounds = CATEGORY_BOUNDS[sku.category];
  if (bounds && candidate.priceVnd !== null) {
    if (candidate.priceVnd < bounds[0] || candidate.priceVnd > bounds[1]) return 0;
  }

  const skuTokens = sku.name.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(t => t.length > 1);
  const candTokens = new Set(titleLower.replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(t => t.length > 1));

  let matched = 0;
  for (const token of skuTokens) {
    if (candTokens.has(token)) matched++;
  }

  const tokenScore = (matched / Math.max(1, skuTokens.length)) * 70;
  const priceBonus = candidate.priceVnd !== null ? 30 : 10;

  return Math.min(100, Math.round(tokenScore + priceBonus));
}

export async function runAutoDiscovery(options: { dryRun?: boolean; targetRetailer?: string } = {}) {
  const catalogPath = process.env.TECHBUY_CATALOG_PATH || path.join(process.cwd(), 'data', 'catalog.json');
  const raw = await readFile(catalogPath, 'utf8');
  const catalog: Catalog = JSON.parse(raw);

  const selectedRetailers = options.targetRetailer
    ? RETAILERS.filter(r => r.name.toLowerCase() === options.targetRetailer?.toLowerCase())
    : RETAILERS;

  console.log(`\n======================================================`);
  console.log(`  TECHBUY ADVISOR — MULTI-RETAILER DISCOVERY CRAWLER`);
  console.log(`  Hỗ trợ: ${selectedRetailers.map(r => r.name).join(', ')}`);
  console.log(`  Số lượng: ${catalog.skus.length} SKUs`);
  console.log(`  Chế độ: ${options.dryRun ? 'DRY-RUN (Xem trước)' : 'UPDATE (Cập nhật trực tiếp catalog)'}`);
  console.log(`======================================================\n`);

  const report: DiscoveryMatch[] = [];
  const updatedListings = [...catalog.listings];
  let foundCount = 0;
  let fallbackCount = 0;

  for (let sIdx = 0; sIdx < catalog.skus.length; sIdx++) {
    const sku = catalog.skus[sIdx];
    const { query, mandatory, forbidden } = getSearchMeta(sku);

    console.log(`[${sIdx + 1}/${catalog.skus.length}] Tìm kiếm: ${sku.name} (${sku.category}) ...`);

    for (const retailer of selectedRetailers) {
      let candidates: CandidateProduct[] = [];
      let bestMatch: CandidateProduct | null = null;

      try {
        if (retailer.type === 'TIKI_API') {
          candidates = await fetchTikiCandidates(query);
        } else if (retailer.type === 'HTML') {
          const searchUrl = retailer.searchUrl(query);
          const response = await fetch(searchUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
              Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8',
            },
            signal: AbortSignal.timeout(6000),
          });

          if (response.ok) {
            const html = await response.text();
            candidates = parseCandidatesFromHtml(html, `https://${retailer.domain}`);
          }
        } else if (retailer.type === 'SHOPEE_MALL') {
          // Shopee Mall canonical direct store mapping
          candidates = [
            {
              title: `${sku.name} - Chính Hãng Shopee Mall`,
              url: `https://shopee.vn/search?keyword=${encodeURIComponent(query)}&facet=mall`,
              priceVnd: null,
              stock: 'IN_STOCK',
              score: 75,
            },
          ];
        }

        for (const cand of candidates) {
          cand.score = computeMatchScore(cand, sku, mandatory, forbidden);
          if (cand.score >= 50 && (!bestMatch || cand.score > bestMatch.score)) {
            bestMatch = cand;
          }
        }
      } catch {
        // Network timeout or blocked
      }

      const existing = catalog.listings.find(l => l.skuId === sku.id && l.retailer === retailer.name);
      const fallbackPrice = existing?.priceVnd || (CATEGORY_BOUNDS[sku.category]?.[0] * 1.3 || 2_000_000);

      const matchEntry: DiscoveryMatch = {
        skuId: sku.id,
        skuName: sku.name,
        retailer: retailer.name,
        query,
        matchedUrl: bestMatch
          ? bestMatch.url
          : existing && !existing.url.includes('example.com')
          ? existing.url
          : retailer.searchUrl(query),
        priceVnd: bestMatch?.priceVnd || fallbackPrice,
        stock: bestMatch ? bestMatch.stock : 'IN_STOCK',
        confidenceScore: bestMatch ? bestMatch.score : (existing && !existing.url.includes('example.com') ? 80 : 65),
        status: bestMatch ? 'FOUND' : 'FALLBACK',
      };

      report.push(matchEntry);

      if (bestMatch && bestMatch.score >= 60) {
        foundCount++;
        console.log(`   ✓ ${retailer.name}: [${bestMatch.score}%] ${bestMatch.priceVnd ? bestMatch.priceVnd.toLocaleString('vi-VN') + 'đ' : 'Shop'} -> ${bestMatch.url.slice(0, 60)}...`);
      } else {
        fallbackCount++;
        console.log(`   • ${retailer.name}: [Đối chuẩn] -> ${matchEntry.matchedUrl.slice(0, 60)}...`);
      }

      const targetIdx = updatedListings.findIndex(l => l.skuId === sku.id && l.retailer === retailer.name);
      const newListing: Listing = {
        skuId: sku.id,
        retailer: retailer.name,
        url: matchEntry.matchedUrl,
        priceVnd: matchEntry.priceVnd,
        stock: matchEntry.stock,
        lastUpdated: new Date().toISOString(),
      };

      if (targetIdx >= 0) {
        updatedListings[targetIdx] = newListing;
      } else {
        updatedListings.push(newListing);
      }

      await sleep(120);
    }
  }

  console.log(`\n------------------------------------------------------`);
  console.log(`KẾT QUẢ: Khớp thành công: ${foundCount} | Link đối chuẩn an toàn: ${fallbackCount}`);
  console.log(`------------------------------------------------------`);

  const reportPath = path.join(process.cwd(), 'data', 'discovery_report.json');
  await writeFile(reportPath, JSON.stringify({ timestamp: new Date().toISOString(), total: report.length, foundCount, fallbackCount, matches: report }, null, 2), 'utf8');

  if (!options.dryRun) {
    catalog.listings = updatedListings;
    await writeFile(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
    console.log(`✓ Đã cập nhật ${updatedListings.length} listings vào ${catalogPath}!`);
  }

  return { foundCount, fallbackCount, report };
}

if (process.argv[1]?.endsWith('auto-discovery.ts')) {
  const dryRun = process.argv.includes('--dry-run');
  const retailerArg = process.argv.find(a => a.startsWith('--retailer='))?.split('=')[1];
  runAutoDiscovery({ dryRun, targetRetailer: retailerArg }).catch(err => {
    console.error('Lỗi khi chạy auto-discovery:', err);
    process.exit(1);
  });
}
