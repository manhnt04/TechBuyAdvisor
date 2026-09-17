import { rules } from './config';
import type { Catalog, Category, RecommendInput, Sku, Listing, Benchmark } from './types';
import { currentPrice, median, priceVerdict } from './pricing';

const required: Category[] = ['CPU', 'GPU', 'MB', 'RAM', 'SSD', 'PSU', 'CASE'];
const checks = ['SOCKET_MATCH', 'RAM_DDR_MATCH', 'FORM_FACTOR_VALID', 'GPU_CLEARANCE_VALID', 'PSU_FORM_FACTOR_VALID', 'PSU_WATTAGE_SUFFICIENT', 'PSU_GPU_CONNECTOR_VALID', 'SSD_INTERFACE_VALID', 'CPU_BIOS_SUPPORT', 'COOLER_VALID'];
type PricedSku = { sku: Sku; listing: Listing };
export type Build = { components: PricedSku[]; totalPriceVnd: number; valueScore: number; score: number; priceFreshness: number; fps: { game: string; fps: number; sourceUrl: string }[]; compatibility: { checks_passed: string[] }; price: ReturnType<typeof priceVerdict> };
export type EngineResult = { status: 'OK'; build: Build } | { status: 'NO_FEASIBLE_BUILD' | 'INSUFFICIENT_DATA'; reason: string; suggestions: string[] };

export function requiredPower(cpu: Sku, gpu: Sku) {
  return Math.ceil(((cpu.maxTdpW ?? Infinity) + (gpu.maxTdpW ?? Infinity) + rules.otherSystemPower) * rules.headroomFactor / 50) * 50;
}

export function compatibility(parts: Partial<Record<Category, Sku>>): string[] {
  const { CPU: cpu, GPU: gpu, MB: mb, RAM: ram, SSD: ssd, PSU: psu, CASE: pcCase, COOLER: cooler } = parts;
  if (!cpu || !gpu || !mb || !ram || !ssd || !psu || !pcCase) return [];
  const passed: string[] = [];
  if (cpu.socket && cpu.socket === mb.socket) passed.push(checks[0]);
  if (mb.ramType && mb.ramType === ram.ramType) passed.push(checks[1]);
  if (mb.formFactor && pcCase.supportedMb?.includes(mb.formFactor)) passed.push(checks[2]);
  if (Number.isFinite(gpu.gpuLengthMm) && Number.isFinite(pcCase.gpuClearanceMm) && gpu.gpuLengthMm! <= pcCase.gpuClearanceMm!) passed.push(checks[3]);
  if (psu.formFactor && pcCase.supportedPsu?.includes(psu.formFactor)) passed.push(checks[4]);
  if (Number.isFinite(psu.wattage) && psu.wattage! >= requiredPower(cpu, gpu)) passed.push(checks[5]);
  if (gpu.gpuConnector && psu.psuConnectors?.includes(gpu.gpuConnector)) passed.push(checks[6]);
  if (ssd.ssdInterface && mb.supportedStorage?.includes(ssd.ssdInterface)) passed.push(checks[7]);
  if (mb.biosCpuIds?.includes(cpu.id)) passed.push(checks[8]);
  if (cpu.maxTdpW !== undefined && (cpu.maxTdpW <= 65 ? cpu.stockCooler === true && !cooler : !!cooler && !!cpu.socket && !!cooler.coolerSockets?.includes(cpu.socket) && Number.isFinite(cooler.coolerHeightMm) && Number.isFinite(pcCase.coolerClearanceMm) && cooler.coolerHeightMm! <= pcCase.coolerClearanceMm!)) passed.push(checks[9]);
  return passed;
}

function preferenceBonus(parts: Sku[], priority: RecommendInput['priority'], freshness: number) {
  const quiet = parts.reduce((sum, part) => sum + (part.noiseRank ?? 0), 0);
  const compact = parts.find(part => part.category === 'CASE')?.volumeLiters ?? 100;
  const noRgb = parts.every(part => !part.rgb);
  const priorityBonus = priority === 'Quiet' ? Math.max(0, 3 - quiet * 0.2) : priority === 'Compact' ? Math.max(0, 3 - compact * 0.1) : priority === 'No-RGB' ? (noRgb ? 3 : 0) : 0;
  return priorityBonus + freshness;
}

export function recommend(input: RecommendInput, catalog: Catalog, now = new Date()): EngineResult {
  if (!catalog.skus.length || !catalog.listings.length || !catalog.benchmarks.length) return { status: 'INSUFFICIENT_DATA', reason: 'Danh mục linh kiện, benchmark hoặc giá hiện chưa có dữ liệu được kiểm định.', suggestions: ['Thử lại khi dữ liệu được cập nhật.'] };
  const groups = Object.fromEntries([...required, 'COOLER'].map(category => [category, [] as PricedSku[]])) as Record<Category, PricedSku[]>;
  for (const sku of catalog.skus) {
    if (sku.disabled) continue;
    const listing = currentPrice(catalog.listings.filter(item => item.skuId === sku.id), now);
    if (listing) groups[sku.category].push({ sku, listing });
  }
  if (required.some(category => !groups[category].length)) return { status: 'INSUFFICIENT_DATA', reason: 'Chưa có đủ linh kiện còn hàng với giá được cập nhật trong 48 giờ.', suggestions: ['Thử lại khi dữ liệu giá được cập nhật.'] };
  const benchmark = new Map<string, Benchmark>();
  for (const item of catalog.benchmarks) if (item.fps > 0 && item.sourceUrl) benchmark.set(`${item.cpuId}|${item.gpuId}|${item.game}|${item.resolution}`, item);
  if (!groups.CPU.some(cpu => groups.GPU.some(gpu => input.target_games.every(game => benchmark.has(`${cpu.sku.id}|${gpu.sku.id}|${game}|${input.resolution}`))))) return { status: 'INSUFFICIENT_DATA', reason: 'Chưa có benchmark đủ nguồn cho game và độ phân giải bạn đã chọn.', suggestions: ['Thử game hoặc độ phân giải khác.'] };
  let bestUnder: Build | null = null, bestOver: Build | null = null;
  const hardestFps = (build: Build) => build.fps.reduce((worst, item) => item.fps / rules.targetFps[item.game as keyof typeof rules.targetFps] < worst.fps / rules.targetFps[worst.game as keyof typeof rules.targetFps] ? item : worst).fps;
  const better = (a: Build, b: Build | null) => {
    if (!b) return true;
    if (Math.abs(a.score - b.score) >= rules.scoreTieThreshold) return a.score > b.score;
    if (a.valueScore !== b.valueScore) return a.valueScore > b.valueScore;
    if (hardestFps(a) !== hardestFps(b)) return hardestFps(a) > hardestFps(b);
    if (a.totalPriceVnd !== b.totalPriceVnd) return a.totalPriceVnd < b.totalPriceVnd;
    if (a.priceFreshness !== b.priceFreshness) return a.priceFreshness > b.priceFreshness;
    return a.components[0].sku.id.localeCompare(b.components[0].sku.id) < 0;
  };
  // ponytail: enumerate curated V1 combinations; add branch-and-bound only if measured p99 exceeds 50 ms.
  for (const cpu of groups.CPU) for (const gpu of groups.GPU) {
    const fps = input.target_games.map(game => benchmark.get(`${cpu.sku.id}|${gpu.sku.id}|${game}|${input.resolution}`));
    if (fps.some(item => !item)) continue;
    const normalized = fps.reduce((sum, item, index) => sum + Math.min(100, item!.fps / rules.targetFps[input.target_games[index]] * 100), 0) / fps.length;
    for (const mb of groups.MB) {
      if (cpu.sku.socket !== mb.sku.socket || !mb.sku.biosCpuIds?.includes(cpu.sku.id)) continue;
      for (const ram of groups.RAM) {
        if (mb.sku.ramType !== ram.sku.ramType) continue;
        for (const ssd of groups.SSD) {
          if (!mb.sku.supportedStorage?.includes(ssd.sku.ssdInterface ?? '')) continue;
          for (const psu of groups.PSU) {
            if ((psu.sku.wattage ?? 0) < requiredPower(cpu.sku, gpu.sku) || !psu.sku.psuConnectors?.includes(gpu.sku.gpuConnector ?? '')) continue;
            for (const pcCase of groups.CASE) {
              if (!pcCase.sku.supportedMb?.includes(mb.sku.formFactor ?? '') || !pcCase.sku.supportedPsu?.includes(psu.sku.formFactor ?? '') || (pcCase.sku.gpuClearanceMm ?? 0) < (gpu.sku.gpuLengthMm ?? Infinity)) continue;
              const coolers = (cpu.sku.maxTdpW ?? Infinity) <= 65 ? [null] : groups.COOLER;
              for (const cooler of coolers) {
                const components = [cpu, gpu, mb, ram, ssd, psu, pcCase, ...(cooler ? [cooler] : [])];
                const passed = compatibility(Object.fromEntries(components.map(part => [part.sku.category, part.sku])));
                if (passed.length !== checks.length) continue;
                const totalPriceVnd = components.reduce((sum, part) => sum + part.listing.priceVnd, 0);
                if (totalPriceVnd > input.budget_vnd * (1 + rules.budgetOverrun)) continue;
                const valueScore = normalized / totalPriceVnd * 10_000_000;
                const freshness = components.reduce((sum, part) => sum + Math.max(0, 1 - (now.getTime() - Date.parse(part.listing.lastUpdated)) / (rules.priceMaxAgeHours * 3_600_000)), 0) / components.length;
                const score = valueScore + preferenceBonus(components.map(part => part.sku), input.priority, freshness);
                const build: Build = { components, totalPriceVnd, valueScore, score, priceFreshness: freshness, fps: fps.map((item, index) => ({ game: input.target_games[index], fps: item!.fps, sourceUrl: item!.sourceUrl })), compatibility: { checks_passed: passed }, price: priceVerdict(null, [], now) };
                if (totalPriceVnd <= input.budget_vnd) { if (better(build, bestUnder)) bestUnder = build; }
                else if (better(build, bestOver)) bestOver = build;
              }
            }
          }
        }
      }
    }
  }
  const chosen = bestOver && bestUnder && bestOver.score >= bestUnder.score + rules.overrunMinScoreGain ? bestOver : bestUnder;
  if (chosen) {
    const dates = [...new Set(catalog.history.map(point => point.date.slice(0, 10)))];
    const history = dates.flatMap(date => {
      const prices = chosen.components.map(part => median(catalog.history.filter(point => point.skuId === part.sku.id && point.date.startsWith(date) && !point.suspect).map(point => point.priceVnd).filter(price => price > 0)));
      return prices.every(price => price !== null) ? [{ skuId: 'BUILD', date, priceVnd: prices.reduce<number>((sum, price) => sum + price!, 0) }] : [];
    });
    chosen.price = priceVerdict(chosen.totalPriceVnd, history, now);
    return { status: 'OK', build: chosen };
  }
  return { status: 'NO_FEASIBLE_BUILD', reason: 'Không tìm thấy cấu hình đáp ứng đồng thời ngân sách, game, độ phân giải và các điều kiện phần cứng.', suggestions: [...(input.resolution === '1440p' ? ['Chuyển xuống 1080p.'] : []), ...(input.budget_vnd < rules.budgetMax ? ['Tăng ngân sách trong khoảng hỗ trợ.'] : []), ...(input.target_games.length > 1 ? ['Giảm số game cần tối ưu.'] : [])].slice(0, 2) };
}
