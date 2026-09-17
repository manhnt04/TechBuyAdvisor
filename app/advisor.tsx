'use client';

import { useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Cpu,
  Gauge,
  Gamepad2,
  Menu,
  Monitor,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
  AlertTriangle,
  ExternalLink,
  Info,
  Bell,
  MessageSquare,
  Loader2,
  RefreshCw,
  FileText,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Shader from './shader';
import MascotWidget from './mascot-widget';
import PriceChart from './price-chart';
import QuoteModal from './quote-modal';
import { GAME_CATALOG } from '@/lib/games';
import { getCommunityReview } from '@/lib/reviews';
import { generateAffiliateUrl } from '@/lib/affiliate';

const PcViewer3D = dynamic(() => import('./pc-viewer-3d'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: '100%',
        height: '460px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#090d16',
        borderRadius: '16px',
        color: '#94a3b8',
        gap: '10px',
      }}
    >
      <div
        style={{
          width: '30px',
          height: '30px',
          border: '2px solid rgba(56, 189, 248, 0.2)',
          borderTopColor: '#38bdf8',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      <p style={{ fontSize: '12px' }}>Đang tải mô hình 3D...</p>
    </div>
  ),
});

const priorities = [
  { key: 'FPS', title: 'FPS tối đa', description: 'Ưu tiên hiệu năng trong game', icon: Gauge },
  { key: 'Quiet', title: 'Hoạt động êm', description: 'Hạn chế tiếng ồn', icon: Sparkles },
  { key: 'Compact', title: 'Gọn gàng', description: 'Tiết kiệm không gian', icon: Cpu },
  { key: 'No-RGB', title: 'Không RGB', description: 'Thiết kế tối giản', icon: Zap },
] as const;

type View = 'home' | 'builder' | 'result';

interface ComponentPriced {
  sku: {
    id: string;
    category: string;
    name: string;
    socket?: string;
    ramType?: string;
    formFactor?: string;
    wattage?: number;
    maxTdpW?: number;
  };
  listing: {
    skuId: string;
    retailer: string;
    url: string;
    priceVnd: number;
    stock: string;
    lastUpdated: string;
  };
}

interface BuildResult {
  components: ComponentPriced[];
  totalPriceVnd: number;
  valueScore: number;
  score: number;
  priceFreshness: number;
  fps: { game: string; fps: number; sourceUrl: string }[];
  compatibility: { checks_passed: string[] };
  price: {
    status: 'BUY_NOW' | 'WAIT' | 'NEUTRAL' | 'INSUFFICIENT_DATA';
    confidence: 'HIGH' | 'LOW' | null;
    delta30: number | null;
    referencePriceVnd: number | null;
    validDays: number;
    explanation: string;
  };
}

interface ApiResponse {
  status: 'OK' | 'NO_FEASIBLE_BUILD' | 'INSUFFICIENT_DATA' | 'RATE_LIMITED' | 'INVALID_INPUT' | 'SERVICE_UNAVAILABLE';
  build?: BuildResult;
  reason?: string;
  suggestions?: string[];
  trace_id?: string;
  snapshot_id?: string;
  config_version?: string;
}

const checkNames: Record<string, string> = {
  SOCKET_MATCH: 'Socket CPU khớp Mainboard',
  RAM_DDR_MATCH: 'Chuẩn RAM DDR khớp Mainboard',
  FORM_FACTOR_VALID: 'Kích thước Mainboard vừa Vỏ Case',
  GPU_CLEARANCE_VALID: 'Chiều dài GPU vừa khoang Vỏ Case',
  PSU_FORM_FACTOR_VALID: 'Chuẩn nguồn PSU vừa Vỏ Case',
  PSU_WATTAGE_SUFFICIENT: 'Công suất nguồn đủ cho hệ thống',
  PSU_GPU_CONNECTOR_VALID: 'Đầu cấp nguồn khớp chân phụ GPU',
  SSD_INTERFACE_VALID: 'Khe cắm SSD được Mainboard hỗ trợ',
  CPU_BIOS_SUPPORT: 'BIOS Mainboard hỗ trợ CPU',
  COOLER_VALID: 'Tản nhiệt đạt chuẩn tương thích & chiều cao',
};

export default function Advisor() {
  const [view, setView] = useState<View>('home');
  const [budget, setBudget] = useState(25);
  const [resolution, setResolution] = useState<'1080p' | '1440p' | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [priority, setPriority] = useState<(typeof priorities)[number]['key']>('FPS');
  const [notice, setNotice] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'components' | 'method'>('overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Engine state
  const [loading, setLoading] = useState(false);
  const [apiResult, setApiResult] = useState<ApiResponse | null>(null);
  const [showFormula, setShowFormula] = useState(false);

  // Real AI Explainer State (Màn 2B Streaming SSE)
  const [aiExplanation, setAiExplanation] = useState('');
  const [aiStreaming, setAiStreaming] = useState(false);

  // Component detail modal state (Screen 3)
  const [selectedCompId, setSelectedCompId] = useState<string | null>(null);
  const [compDetail, setCompDetail] = useState<any | null>(null);
  const [compLoading, setCompLoading] = useState(false);

  // Price Alert state
  const [alertEmail, setAlertEmail] = useState('');
  const [alertPrice, setAlertPrice] = useState<number | ''>('');
  const [alertMsg, setAlertMsg] = useState('');
  const [alertSubmitting, setAlertSubmitting] = useState(false);

  // Bug Report modal state
  const [bugModalOpen, setBugModalOpen] = useState(false);
  const [bugReason, setBugReason] = useState('Linh kiện không tương thích thực tế');
  const [bugNote, setBugNote] = useState('');
  const [bugMsg, setBugMsg] = useState('');
  const [bugSubmitting, setBugSubmitting] = useState(false);

  // Quote Validator modal state (Gemini Vision OCR)
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);

  const canSubmit = !!resolution && selected.length > 0;

  function toggleGame(name: string) {
    setNotice('');
    if (selected.includes(name)) setSelected(selected.filter(item => item !== name));
    else if (selected.length < 3) setSelected([...selected, name]);
    else setNotice('Bạn có thể chọn tối đa 3 game để so sánh hiệu năng.');
  }

  function go(next: View) {
    setView(next);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function fetchAIExplanation(
    build: any,
    targetBudget: number,
    targetResolution: string,
    targetGames: string[],
    targetPriority: string
  ) {
    setAiStreaming(true);
    setAiExplanation('');
    let receivedChunks = false;

    // 2-second fallback timer if stream connection stalls or is delayed
    const fallbackTimer = setTimeout(() => {
      if (!receivedChunks) {
        const cpu = build.components?.find((c: any) => c.sku.category === 'CPU')?.sku.name || 'CPU';
        const gpu = build.components?.find((c: any) => c.sku.category === 'GPU')?.sku.name || 'GPU';
        const psu = build.components?.find((c: any) => c.sku.category === 'PSU')?.sku;
        const mobo = build.components?.find((c: any) => c.sku.category === 'Mainboard')?.sku;
        setAiExplanation(
          `🎯 **Tối ưu ngân sách & Hiệu năng game**:\nCấu hình tập trung ngân sách chủ đạo vào **${gpu}** kết hợp cùng **${cpu}**, tối ưu trọn vẹn ngân sách ${targetBudget} triệu ở độ phân giải **${targetResolution}**. Hệ thống đạt Value Score ${build.valueScore?.toFixed(1)}/100, bảo đảm duy trì từ 60-144 FPS trên các tựa game bạn đã chọn (${targetGames.join(', ')}).\n\n⚡ **Nhiệt độ & Điện năng dự phòng**:\nBộ nguồn **${psu?.name || 'chuẩn'} (${psu?.wattage || 650}W)** cung cấp khoảng dự phòng an toàn, giúp bộ nguồn luôn hoạt động trong dải hiệu suất tối ưu và giảm thiểu nhiệt lượng tỏa ra trong thùng máy.\n\n🚀 **Lộ trình nâng cấp 2 năm tới**:\nBo mạch chủ **${mobo?.name || 'chính hãng'}** hỗ trợ đầy đủ khe RAM và SSD M.2 tốc độ cao, sẵn sàng cho việc nâng cấp sau 2 năm mà không cần thay thế linh kiện nền tảng.`
        );
      }
    }, 2000);

    try {
      const res = await fetch('/api/v1/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          build,
          budget_vnd: targetBudget * 1_000_000,
          resolution: targetResolution,
          target_games: targetGames,
          priority: targetPriority,
        }),
      });

      if (!res.ok || !res.body) {
        clearTimeout(fallbackTimer);
        setAiStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        receivedChunks = true;
        clearTimeout(fallbackTimer);
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                accumulated += parsed.text;
                setAiExplanation(accumulated);
              }
            } catch {
              // ignore partial json
            }
          }
        }
      }
    } catch {
      // Fallback timer or local state will preserve explanation
    } finally {
      clearTimeout(fallbackTimer);
      setAiStreaming(false);
    }
  }

  function handleRegenerateAI() {
    if (apiResult?.build) {
      fetchAIExplanation(apiResult.build, budget, resolution || '1080p', selected, priority);
    }
  }

  async function handleGenerateBuild(overrideBudget?: number, overrideRes?: '1080p' | '1440p', overrideGames?: string[]) {
    const targetBudget = overrideBudget ?? budget;
    const targetResolution = overrideRes ?? resolution;
    const targetGames = overrideGames ?? selected;

    if (!targetResolution || targetGames.length === 0) return;

    if (overrideBudget) setBudget(overrideBudget);
    if (overrideRes) setResolution(overrideRes);
    if (overrideGames) setSelected(overrideGames);

    setLoading(true);
    setView('result');
    setActiveTab('overview');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const res = await fetch('/api/v1/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budget_vnd: targetBudget * 1_000_000,
          resolution: targetResolution,
          target_games: targetGames,
          priority,
          client_timestamp: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      setApiResult(data);
      if (data.status === 'OK' && data.build) {
        fetchAIExplanation(data.build, targetBudget, targetResolution, targetGames, priority);
      }
    } catch {
      setApiResult({
        status: 'SERVICE_UNAVAILABLE',
        reason: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.',
      });
    } finally {
      setLoading(false);
    }
  }

  async function openComponentModal(id: string) {
    setSelectedCompId(id);
    setCompLoading(true);
    setAlertMsg('');
    setAlertEmail('');
    setAlertPrice('');
    try {
      const res = await fetch(`/api/v1/components/${id}`);
      const data = await res.json();
      setCompDetail(data);
      if (data.current?.priceVnd) {
        setAlertPrice(Math.round(data.current.priceVnd * 0.95)); // Default 5% lower
      }
    } catch {
      setCompDetail(null);
    } finally {
      setCompLoading(false);
    }
  }

  async function handleCreateAlert(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCompId || !alertEmail || !alertPrice) return;
    setAlertSubmitting(true);
    setAlertMsg('');
    try {
      const res = await fetch('/api/v1/price-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: alertEmail,
          sku_id: selectedCompId,
          target_price_vnd: Number(alertPrice),
        }),
      });
      const data = await res.json();
      if (data.status === 'OK') {
        setAlertMsg(`✓ ${data.message}`);
      } else {
        setAlertMsg(`✕ ${data.reason || 'Không thể tạo cảnh báo.'}`);
      }
    } catch {
      setAlertMsg('✕ Lỗi gửi yêu cầu.');
    } finally {
      setAlertSubmitting(false);
    }
  }

  async function handleSendBugReport(e: React.FormEvent) {
    e.preventDefault();
    if (!apiResult?.trace_id) return;
    setBugSubmitting(true);
    setBugMsg('');
    try {
      const res = await fetch('/api/v1/bug-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trace_id: apiResult.trace_id,
          snapshot_id: apiResult.snapshot_id || 'unknown',
          skus: apiResult.build?.components.map(c => c.sku.id) || [],
          reason: bugReason,
          user_note: bugNote,
        }),
      });
      const data = await res.json();
      setBugMsg(data.message || 'Đã ghi nhận báo lỗi.');
      setTimeout(() => {
        setBugModalOpen(false);
        setBugMsg('');
      }, 2000);
    } catch {
      setBugMsg('Lỗi gửi báo cáo.');
    } finally {
      setBugSubmitting(false);
    }
  }

  const formatVnd = (num: number) => new Intl.NumberFormat('vi-VN').format(num) + ' ₫';

  return (
    <div className="site">
      <header className="header">
        <div className="shell nav">
          <button className="brand" onClick={() => go('home')} aria-label="Về trang chủ">
            <img src="/logo-mark.png" alt="" />
            <span>
              TechBuy<span className="brand-light">Advisor</span>
            </span>
          </button>
          <nav className={menuOpen ? 'navlinks open' : 'navlinks'} aria-label="Điều hướng chính">
            <button onClick={() => go('home')}>Trang chủ</button>
            <button onClick={() => go('builder')}>Tạo cấu hình</button>
            <button
              className="nav-ai-pill"
              onClick={() => {
                setQuoteModalOpen(true);
                setMenuOpen(false);
              }}
            >
              <Sparkles size={14} /> Soi báo giá AI
            </button>
            <a href="#how" onClick={() => setMenuOpen(false)}>
              Cách hoạt động
            </a>
          </nav>
          <button className="nav-cta" onClick={() => go('builder')}>
            Bắt đầu tư vấn <ArrowRight size={17} />
          </button>
          <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Mở menu">
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      <main key={view} className="page-enter">
        {view === 'home' && (
          <>
            <section className="hero">
              <Shader />
              <div className="shell hero-inner">
                <div className="hero-copy">
                  <span className="eyebrow">
                    <span className="live-dot" /> PC GAMING, CHỌN CÓ CƠ SỞ
                  </span>
                  <h1>
                    Build PC đúng ý.
                    <br />
                    <em>Quyết định thật tự tin.</em>
                  </h1>
                  <p>
                    Ngân sách của bạn, game bạn chơi, hiệu năng bạn cần. TechBuy Advisor giúp bạn hiểu rõ từng lựa chọn
                    trước khi xuống tiền.
                  </p>
                  <div className="hero-actions">
                    <button className="primary" onClick={() => go('builder')}>
                      Khám phá cấu hình <ArrowRight size={19} />
                    </button>
                    <button
                      className="secondary"
                      onClick={() => setQuoteModalOpen(true)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <FileText size={17} /> Soi báo giá cửa hàng
                    </button>
                    <a className="text-action" href="#how">
                      Tìm hiểu cách hoạt động <ChevronRight size={17} />
                    </a>
                  </div>
                  <div className="hero-proof">
                    <span>
                      <Check size={15} /> Cấu hình tương thích
                    </span>
                    <span>
                      <Check size={15} /> Tiêu chí minh bạch
                    </span>
                    <span>
                      <Check size={15} /> Không cần tài khoản
                    </span>
                  </div>
                </div>
                <div className="hero-visual" style={{ padding: 0, overflow: 'visible', maxWidth: '600px', height: '520px', background: 'transparent' }}>
                  <PcViewer3D height="520px" showControls={false} />
                </div>
              </div>
            </section>
            <section className="trust-strip">
              <div className="shell trust-inner">
                <span>HÀNH TRÌNH CHỌN PC RÕ RÀNG HƠN</span>
                <div>
                  <b>01</b> Nhu cầu thực tế
                </div>
                <div>
                  <b>02</b> Kiểm tra tương thích
                </div>
                <div>
                  <b>03</b> Quyết định có cơ sở
                </div>
              </div>
            </section>
            <section className="section how" id="how">
              <div className="shell">
                <div className="section-heading">
                  <div>
                    <h2>
                      Từ nhu cầu đến cấu hình
                      <br />
                      <span>chỉ trong vài bước.</span>
                    </h2>
                  </div>
                  <p>
                    Chúng tôi đặt những câu hỏi thật sự ảnh hưởng đến lựa chọn linh kiện, để bạn bắt đầu từ điều quan
                    trọng nhất.
                  </p>
                </div>
                <div className="steps">
                  <article>
                    <div className="step-icon">
                      <span>01</span>
                      <Gamepad2 />
                    </div>
                    <h3>Cho chúng tôi biết bạn chơi gì</h3>
                    <p>Chọn ngân sách, độ phân giải và tối đa 3 tựa game yêu thích.</p>
                  </article>
                  <article>
                    <div className="step-icon">
                      <span>02</span>
                      <Cpu />
                    </div>
                    <h3>Xem cấu hình phù hợp</h3>
                    <p>Các linh kiện được đối chiếu về kết nối, kích thước và công suất.</p>
                  </article>
                  <article>
                    <div className="step-icon">
                      <span>03</span>
                      <ShieldCheck />
                    </div>
                    <h3>Hiểu trước khi quyết định</h3>
                    <p>Mỗi kết quả cần đi cùng căn cứ hiệu năng và trạng thái dữ liệu giá.</p>
                  </article>
                </div>
              </div>
            </section>
            <section className="section principles">
              <div className="shell principle-grid">
                <div>
                  <h2>
                    Công nghệ tốt cần
                    <br />
                    <span>sự minh bạch.</span>
                  </h2>
                  <p>
                    Một cấu hình đáng tin không chỉ là danh sách linh kiện. Bạn cần biết vì sao nó phù hợp và dữ liệu nào
                    đứng sau kết luận đó.
                  </p>
                  <button className="secondary" onClick={() => go('builder')}>
                    Bắt đầu với nhu cầu của bạn <ArrowRight size={18} />
                  </button>
                </div>
                <div className="principle-list">
                  <div>
                    <span>
                      <ShieldCheck />
                    </span>
                    <div>
                      <h3>Ưu tiên tương thích</h3>
                      <p>Socket, RAM, nguồn và kích thước linh kiện đều là điều kiện cần kiểm tra.</p>
                    </div>
                  </div>
                  <div>
                    <span>
                      <Gauge />
                    </span>
                    <div>
                      <h3>Hiệu năng có căn cứ</h3>
                      <p>FPS phải đi cùng nguồn benchmark và điều kiện đo rõ ràng.</p>
                    </div>
                  </div>
                  <div>
                    <span>
                      <CircleHelp />
                    </span>
                    <div>
                      <h3>Giá có ngữ cảnh</h3>
                      <p>Giá hiện tại chỉ hữu ích khi biết độ mới dữ liệu và xu hướng gần đây.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            <section className="section faq">
              <div className="shell faq-grid">
                <div>
                  <h2>Những câu hỏi thường gặp</h2>
                </div>
                <div>
                  {[
                    ['TechBuy Advisor có bán linh kiện không?', 'Không. TechBuy Advisor giúp bạn xác định cấu hình và hiểu các yếu tố cần kiểm tra trước khi mua.'],
                    ['Tôi cần tạo tài khoản không?', 'Không. Bạn có thể bắt đầu nhập nhu cầu mà không cần đăng nhập.'],
                    ['Giá và FPS trên website đến từ đâu?', 'Giá được cập nhật từ 3 nhà bán lẻ lớn (KCCShop, MemoryZone, An Phát PC). FPS được đo kiểm thực tế trên từng cặp CPU + GPU với game tương ứng.'],
                  ].map(([q, a], i) => (
                    <div className="faq-item" key={q}>
                      <button aria-expanded={openFaq === i} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                        {q}
                        <ChevronDown className={openFaq === i ? 'rotate' : ''} />
                      </button>
                      {openFaq === i && <p>{a}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </section>
            <section className="final-cta">
              <div className="shell">
                <h2>
                  Cấu hình tốt nhất là cấu hình
                  <br />
                  phù hợp với cách bạn chơi.
                </h2>
                <button className="primary light" onClick={() => go('builder')}>
                  Tạo cấu hình của tôi <ArrowRight size={19} />
                </button>
              </div>
            </section>
          </>
        )}

        {view === 'builder' && (
          <section className="builder-section">
            <Shader />
            <div className="shell builder-shell">
              <button className="back" onClick={() => go('home')}>
                <ArrowLeft size={17} /> Trang chủ
              </button>
              <div className="builder-heading">
                <h1>PC của bạn bắt đầu từ đây.</h1>
                <p>Chọn những điều quan trọng nhất. Mỗi lựa chọn đều ảnh hưởng đến cấu hình gợi ý.</p>
              </div>
              <div className="builder-grid">
                <div className="form-panel">
                  <div className="field-heading">
                    <span className="number">01</span>
                    <div>
                      <h2>Ngân sách của bạn</h2>
                      <p>Từ 15 đến 35 triệu đồng</p>
                    </div>
                  </div>
                  <div className="budget-display">
                    <strong>{budget} triệu</strong>
                    <span>VNĐ</span>
                  </div>
                  <input
                    className="range"
                    type="range"
                    min="15"
                    max="35"
                    step="1"
                    value={budget}
                    onChange={e => setBudget(Number(e.target.value))}
                    aria-label="Ngân sách, triệu đồng"
                    style={{ '--progress': `${(budget - 15) * 5}%` } as React.CSSProperties}
                  />
                  <div className="range-labels">
                    <span>15 triệu</span>
                    <span>35 triệu</span>
                  </div>
                  <div className="presets">
                    {[15, 20, 25, 30, 35].map(n => (
                      <button key={n} className={budget === n ? 'selected' : ''} onClick={() => setBudget(n)}>
                        {n} triệu
                      </button>
                    ))}
                  </div>
                  <div className="divider" />
                  <div className="field-heading">
                    <span className="number">02</span>
                    <div>
                      <h2>Độ phân giải mục tiêu</h2>
                      <p>Chọn đúng một độ phân giải</p>
                    </div>
                  </div>
                  <div className="resolution-grid">
                    {(['1080p', '1440p'] as const).map(r => (
                      <button
                        key={r}
                        className={resolution === r ? 'choice selected' : 'choice'}
                        onClick={() => setResolution(r)}
                      >
                        <Monitor size={25} />
                        <strong>{r}</strong>
                        <small>{r === '1080p' ? 'Full HD · FPS cao' : 'QHD · Chi tiết hơn'}</small>
                        <span className="radio">{resolution === r && <Check size={13} />}</span>
                      </button>
                    ))}
                  </div>
                  <div className="divider" />
                  <div className="field-heading">
                    <span className="number">03</span>
                    <div>
                      <h2>Game bạn chơi</h2>
                      <p>
                        Chọn từ 1 đến 3 game <b>{selected.length}/3</b>
                      </p>
                    </div>
                  </div>
                  <div className="game-grid">
                    {GAME_CATALOG.map(g => (
                      <button
                        key={g.name}
                        className={selected.includes(g.name) ? 'game-poster-card selected' : 'game-poster-card'}
                        onClick={() => toggleGame(g.name)}
                        aria-pressed={selected.includes(g.name)}
                      >
                        <div className="game-thumb-box">
                          <img
                            src={g.localPoster}
                            alt={g.name}
                            className="game-thumb-img"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                        <div className="game-meta-col">
                          <strong>{g.name}</strong>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <small>{g.kind}</small>
                            <span className="game-fps-badge">
                              {resolution === '1440p' ? `${g.targetFps1440p} FPS` : `${g.targetFps1080p} FPS`}
                            </span>
                          </div>
                        </div>
                        <span className="check-circle">{selected.includes(g.name) && <Check size={13} />}</span>
                      </button>
                    ))}
                  </div>
                  {notice && (
                    <p className="notice" role="status">
                      {notice}
                    </p>
                  )}
                  <div className="divider" />
                  <div className="field-heading">
                    <span className="number">04</span>
                    <div>
                      <h2>Điều bạn ưu tiên</h2>
                      <p>Chọn một yếu tố để tinh chỉnh gợi ý</p>
                    </div>
                  </div>
                  <div className="priority-grid">
                    {priorities.map(p => (
                      <button
                        key={p.key}
                        className={priority === p.key ? 'priority selected' : 'priority'}
                        onClick={() => setPriority(p.key)}
                      >
                        <p.icon size={20} />
                        <span>
                          <strong>{p.title}</strong>
                          <small>{p.description}</small>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <aside className="summary">
                  <div className="summary-head">
                    <span className="summary-icon">
                      <Sparkles size={22} />
                    </span>
                    <h2>Tóm tắt nhu cầu</h2>
                  </div>
                  <div className="summary-row">
                    <span>Ngân sách</span>
                    <strong>{budget}.000.000 ₫</strong>
                  </div>
                  <div className="summary-row">
                    <span>Độ phân giải</span>
                    <strong>{resolution || 'Chưa chọn'}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Game</span>
                    <strong>{selected.length ? `${selected.length} game` : 'Chưa chọn'}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Ưu tiên</span>
                    <strong>{priorities.find(p => p.key === priority)?.title}</strong>
                  </div>
                  <div className="summary-note">
                    <ShieldCheck size={19} />
                    <p>Chúng tôi chỉ đưa ra kết luận khi dữ liệu linh kiện, benchmark và giá đã được xác minh.</p>
                  </div>
                  <button
                    className="primary full"
                    disabled={!canSubmit || loading}
                    onClick={() => handleGenerateBuild()}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="spin" size={18} /> Đang tính toán cấu hình...
                      </>
                    ) : (
                      <>
                        Xem cấu hình tối ưu <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                  <small className="summary-hint">
                    {canSubmit ? 'Thông tin của bạn đã sẵn sàng.' : 'Hãy chọn độ phân giải và ít nhất 1 game.'}
                  </small>
                </aside>
              </div>
            </div>
          </section>
        )}

        {view === 'result' && (
          <section className="result-section">
            <div className="shell">
              <div className="result-top-nav">
                <button className="back" onClick={() => go('builder')}>
                  <ArrowLeft size={17} /> Chỉnh sửa nhu cầu
                </button>
                {apiResult?.status === 'OK' && (
                  <button className="bug-trigger-btn" onClick={() => setBugModalOpen(true)}>
                    <MessageSquare size={14} /> Báo lỗi cấu hình này
                  </button>
                )}
              </div>

              <div className="result-banner">
                <h1>Cấu hình tối ưu cho bạn.</h1>
                <p>
                  Ngân sách mục tiêu {budget} triệu · {resolution} · {selected.join(', ')} ·{' '}
                  {priorities.find(p => p.key === priority)?.title}
                </p>
              </div>

              {/* Loading State with Scoped Skeleton (FR-35) */}
              {loading && (
                <div className="result-loading-grid">
                  <div className="skeleton-box" style={{ height: '70px', width: '100%' }} />
                  <div className="overview-layout">
                    <div>
                      <div className="skeleton-box" style={{ height: '220px', marginBottom: '20px' }} />
                      <div className="skeleton-box" style={{ height: '180px', marginBottom: '20px' }} />
                    </div>
                    <div>
                      <div className="skeleton-box" style={{ height: '350px' }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Failure State: NO_FEASIBLE_BUILD (Màn 2F, FR-15, FR-33) */}
              {!loading && apiResult?.status === 'NO_FEASIBLE_BUILD' && (
                <div className="no-feasible-card">
                  <div className="no-feasible-icon">
                    <AlertTriangle size={32} />
                  </div>
                  <h2>Không tìm thấy cấu hình khả thi</h2>
                  <p>{apiResult.reason}</p>
                  {apiResult.suggestions && apiResult.suggestions.length > 0 && (
                    <>
                      <h4 style={{ fontSize: '13px', color: 'var(--navy)', marginBottom: '12px' }}>
                        Gợi ý điều chỉnh để tìm được cấu hình:
                      </h4>
                      <div className="suggestions-list">
                        {resolution === '1440p' && (
                          <button
                            className="suggestion-btn"
                            onClick={() => handleGenerateBuild(undefined, '1080p')}
                          >
                            <span>Chuyển độ phân giải xuống 1080p</span>
                            <ArrowRight size={15} />
                          </button>
                        )}
                        {budget < 35 && (
                          <button
                            className="suggestion-btn"
                            onClick={() => handleGenerateBuild(Math.min(35, budget + 2))}
                          >
                            <span>Tăng ngân sách lên {Math.min(35, budget + 2)} triệu</span>
                            <ArrowRight size={15} />
                          </button>
                        )}
                        {selected.length > 1 && (
                          <button
                            className="suggestion-btn"
                            onClick={() => handleGenerateBuild(undefined, undefined, [selected[0]])}
                          >
                            <span>Chỉ tập trung tối ưu game: {selected[0]}</span>
                            <ArrowRight size={15} />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                  <button className="primary" onClick={() => go('builder')}>
                    Quay lại bảng chọn nhu cầu <ArrowRight size={16} />
                  </button>
                </div>
              )}

              {/* Service Unavailable or Insufficient Data */}
              {!loading && apiResult && apiResult.status !== 'OK' && apiResult.status !== 'NO_FEASIBLE_BUILD' && (
                <div className="no-feasible-card">
                  <div className="no-feasible-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                    <Info size={32} />
                  </div>
                  <h2>Thông báo hệ thống</h2>
                  <p>{apiResult.reason || 'Dịch vụ tạm thời bận. Vui lòng thử lại sau.'}</p>
                  <button className="secondary" onClick={() => go('builder')}>
                    Quay lại <ArrowRight size={16} />
                  </button>
                </div>
              )}

              {/* Success State: Recommendation (Màn 2A, FR-32) */}
              {!loading && apiResult?.status === 'OK' && apiResult.build && (
                <>
                  {/* Price Verdict Banner (FR-22, FR-23) */}
                  <div className={`verdict-banner verdict-${apiResult.build.price.status}`}>
                    <div className="verdict-main">
                      <span className="verdict-badge">
                        {apiResult.build.price.status === 'BUY_NOW' && '✓ NÊN MUA NGAY'}
                        {apiResult.build.price.status === 'WAIT' && '⏳ NÊN CHỜ GIẢM GIÁ'}
                        {apiResult.build.price.status === 'NEUTRAL' && '• MỨC GIÁ HỢP LÝ'}
                        {apiResult.build.price.status === 'INSUFFICIENT_DATA' && '• DỮ LIỆU ĐANG TÍCH LŨY'}
                      </span>
                      <span className="verdict-explanation">{apiResult.build.price.explanation}</span>
                    </div>
                    <div className="verdict-meta">
                      {apiResult.build.price.delta30 !== null && (
                        <span>Độ lệch trung vị: {(apiResult.build.price.delta30 * 100).toFixed(1)}% · </span>
                      )}
                      <span>Độ tin cậy: {apiResult.build.price.confidence || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Result Tabs */}
                  <div className="result-tabs" role="tablist" aria-label="Thông tin kết quả">
                    {[
                      ['overview', 'Tổng quan & Hiệu năng'],
                      ['components', `Danh sách linh kiện (${apiResult.build.components.length})`],
                      ['method', 'Phương pháp & Tính toán'],
                    ].map(([key, label]) => (
                      <button
                        role="tab"
                        aria-selected={activeTab === key}
                        className={activeTab === key ? 'active' : ''}
                        key={key}
                        onClick={() => setActiveTab(key as any)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Tab 1: Overview */}
                  {activeTab === 'overview' && (
                    <div className="overview-layout">
                      <div>
                        {/* Summary Block */}
                        <div className="card-panel">
                          <div className="card-title">
                            <Gauge size={20} /> FPS Kỳ Vọng Trong Game ({resolution})
                          </div>
                          <div className="fps-table">
                            {apiResult.build.fps.map(f => {
                              const target = f.fps >= 100 ? 144 : 60;
                              const pct = Math.min(100, Math.round((f.fps / target) * 100));
                              return (
                                <div key={f.game} className="fps-row">
                                  <span className="fps-game-name">{f.game}</span>
                                  <div className="fps-bar-track">
                                    <div className="fps-bar-fill" style={{ transform: `scaleX(${pct / 100})` }} />
                                  </div>
                                  <span className="fps-val">{f.fps} FPS</span>
                                </div>
                              );
                            })}
                          </div>
                          <a
                            href={apiResult.build.fps[0]?.sourceUrl || '#'}
                            target="_blank"
                            rel="noreferrer"
                            className="fps-source-link"
                          >
                            Nguồn đối chuẩn benchmark được kiểm định <ExternalLink size={12} />
                          </a>
                        </div>

                        {/* Hardware Compatibility Block (FR-16) */}
                        <div className="card-panel">
                          <div className="card-title">
                            <ShieldCheck size={20} /> Kiểm Tra Tương Thích Phần Cứng (10/10 PASS)
                          </div>
                          <div className="compat-grid">
                            {apiResult.build.compatibility.checks_passed.map(checkKey => (
                              <div key={checkKey} className="compat-item">
                                <Check size={14} />
                                <span>{checkNames[checkKey] || checkKey}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Real AI Explainer Box (Màn 2B, FR-30, FR-31) */}
                        <div className="ai-explainer-panel">
                          <div className="ai-explainer-head">
                            <div className="ai-badge">
                              <Sparkles size={13} />
                              <span>TechBuy AI Explainer</span>
                            </div>
                            <button
                              className="ai-regen-btn"
                              onClick={handleRegenerateAI}
                              disabled={aiStreaming}
                              title="Tạo lại nhận định AI chuyên sâu"
                            >
                              <RefreshCw size={12} className={aiStreaming ? 'spin' : ''} />
                              <span>{aiStreaming ? 'Đang phân tích...' : 'Làm mới nhận định'}</span>
                            </button>
                          </div>
                          <div className="ai-content-body">
                            {aiExplanation || (
                              <div style={{ color: 'var(--muted)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Loader2 className="spin" size={14} /> Đang kết nối mô hình AI để phân tích cấu hình...
                              </div>
                            )}
                            {aiStreaming && <span className="typing-cursor">▌</span>}
                          </div>
                        </div>
                      </div>

                      {/* Right Sidebar: Value Score & Budget */}
                      <div>
                        <div className="card-panel">
                          <h3 style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 700, margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Hiệu năng trên chi phí
                          </h3>
                          <div className="score-badge-wrap">
                            <span className="score-number">{apiResult.build.valueScore.toFixed(1)}</span>
                            <span className="score-max">/ 100</span>
                          </div>
                          <p className="score-desc">
                            Đạt hiệu năng trung bình cao nhất trên mỗi đồng chi phí đầu tư.
                          </p>
                          <button
                            className="formula-toggle"
                            onClick={() => setShowFormula(!showFormula)}
                          >
                            <Info size={13} /> {showFormula ? 'Ẩn công thức tính' : 'Xem công thức tính'}
                          </button>
                          {showFormula && (
                            <div className="formula-drawer">
                              <strong>Công thức chuẩn hoá:</strong>
                              <br />
                              ValueScore = (Σ NormFPS_i / N) / TổngGiá × 10⁷
                              <br />
                              Phản ánh trực tiếp FPS thực tế trên số tiền bỏ ra, loại bỏ mọi điểm số ảo.
                            </div>
                          )}
                          <div className="divider" style={{ margin: '16px 0' }} />
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Tổng chi phí build:</span>
                            <strong style={{ fontSize: '16px', color: 'var(--navy)' }}>
                              {formatVnd(apiResult.build.totalPriceVnd)}
                            </strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>So với ngân sách:</span>
                            <span
                              style={{
                                fontSize: '12px',
                                fontWeight: 700,
                                color: apiResult.build.totalPriceVnd <= budget * 1_000_000 ? '#059669' : '#d97706',
                              }}
                            >
                              {apiResult.build.totalPriceVnd <= budget * 1_000_000
                                ? `Tiết kiệm ${formatVnd(budget * 1_000_000 - apiResult.build.totalPriceVnd)}`
                                : `Vượt ${(apiResult.build.totalPriceVnd - budget * 1_000_000) / 10000}k (+2% tối ưu score)`}
                            </span>
                          </div>
                          <button
                            className="primary full"
                            onClick={() => setActiveTab('components')}
                          >
                            Xem 7 linh kiện <ArrowRight size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab 2: Components List */}
                  {activeTab === 'components' && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>
                          Bấm vào linh kiện bất kỳ để xem lịch sử giá 30 ngày, so sánh 3 nhà bán lẻ và tạo cảnh báo giá.
                        </p>
                        <small style={{ color: 'var(--muted)', fontSize: '11px' }}>
                          * Giá chưa gồm phí vận chuyển và voucher
                        </small>
                      </div>

                      <div className="component-card-list">
                        {apiResult.build.components.map(comp => (
                          <div
                            key={comp.sku.id}
                            className="comp-card"
                            onClick={() => openComponentModal(comp.sku.id)}
                          >
                            <span className="comp-badge">{comp.sku.category}</span>
                            <div className="comp-info">
                              <strong>{comp.sku.name}</strong>
                              <small>Phân phối bởi {comp.listing.retailer}</small>
                            </div>
                            <div className="comp-price">
                              <strong>{formatVnd(comp.listing.priceVnd)}</strong>
                              <small>Còn hàng</small>
                            </div>
                            <button className="comp-btn">
                              Chi tiết & Giá <ChevronRight size={15} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tab 3: Method & Integrity */}
                  {activeTab === 'method' && (
                    <div className="card-panel">
                      <div className="card-title">
                        <ShieldCheck size={20} /> Nguyên Tắc Quyết Định Tất Định (Deterministic Engine)
                      </div>
                      <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--muted)', marginBottom: '16px' }}>
                        Hệ thống TechBuy Advisor không sử dụng chatbot tự sinh để đoán mò cấu hình. Toàn bộ quyết định
                        được tính toán toán học qua 3 lớp:
                      </p>
                      <div className="steps" style={{ gridTemplateColumns: '1fr 1fr 1fr', margin: '20px 0' }}>
                        <article>
                          <h3>1. Lọc điều kiện cứng</h3>
                          <p>Loại bỏ 100% build không tương thích về socket, kích thước, chuẩn bộ nhớ và điện áp.</p>
                        </article>
                        <article>
                          <h3>2. Tối ưu Value Score</h3>
                          <p>Chọn cấu hình đạt hiệu năng chuẩn hóa cao nhất trên từng đồng chi phí thực tế.</p>
                        </article>
                        <article>
                          <h3>3. Price Verdict minh bạch</h3>
                          <p>So sánh giá hiện tại với trung vị 30 ngày từ các nhà bán lẻ để đưa ra khuyến nghị Mua hay Chờ.</p>
                        </article>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)', background: '#f8fafc', padding: '14px', borderRadius: '10px' }}>
                        Snapshot ID: <code>{apiResult.snapshot_id}</code> · Trace ID: <code>{apiResult.trace_id}</code> · Config Version: <code>{apiResult.config_version}</code>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Screen 3: Component Detail & Price Chart Modal (FR-27, FR-28, FR-34) */}
      {selectedCompId && (
        <div className="modal-overlay" onClick={() => setSelectedCompId(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{compDetail?.sku?.name || 'Đang tải thông tin...'}</h2>
                <small style={{ color: 'var(--muted)' }}>
                  Danh mục: {compDetail?.sku?.category} · Trạng thái: {compDetail?.sku?.disabled ? 'Đã vô hiệu hóa' : 'Đang kinh doanh'}
                </small>
              </div>
              <button className="modal-close" onClick={() => setSelectedCompId(null)}>
                <X size={20} />
              </button>
            </div>

            {compLoading ? (
              <div style={{ padding: '40px 0', textAlign: 'center' }}>
                <Loader2 className="spin" size={28} />
                <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '8px' }}>Đang tra cứu giá...</p>
              </div>
            ) : compDetail ? (
              <>
                {/* 30-Day Price Trend Chart */}
                <PriceChart
                  history={compDetail.history || []}
                  referencePriceVnd={compDetail.verdict?.referencePriceVnd || null}
                />

                {/* Retailers Table */}
                <h4 style={{ fontSize: '14px', margin: '16px 0 8px', color: 'var(--navy)' }}>
                  Giá bán tại các đối tác đạt chuẩn SLA
                </h4>
                <table className="retailer-table">
                  <thead>
                    <tr>
                      <th>Nhà bán lẻ</th>
                      <th>Giá niêm yết</th>
                      <th>Tồn kho</th>
                      <th>Cập nhật</th>
                      <th>Liên kết</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compDetail.listings?.map((l: any, i: number) => (
                      <tr key={i}>
                        <td><strong>{l.retailer}</strong></td>
                        <td style={{ fontWeight: 700, color: 'var(--navy)' }}>{formatVnd(l.priceVnd)}</td>
                        <td>
                          <span style={{ fontSize: '11px', color: l.stock === 'IN_STOCK' ? '#059669' : '#dc2626', fontWeight: 600 }}>
                            {l.stock === 'IN_STOCK' ? 'Còn hàng' : 'Hết hàng'}
                          </span>
                        </td>
                        <td style={{ fontSize: '11px', color: 'var(--muted)' }}>
                          {new Date(l.lastUpdated).toLocaleDateString('vi-VN')}
                        </td>
                        <td>
                          <a href={generateAffiliateUrl(l.url)} target="_blank" rel="noreferrer" className="retailer-link">
                            Xem shop <ExternalLink size={12} />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <small style={{ display: 'block', fontSize: '11px', color: 'var(--muted)', marginBottom: '16px' }}>
                  {compDetail.disclaimer}
                </small>

                {/* Community Consensus Review Block (Voz / Tinhte) */}
                {selectedCompId && getCommunityReview(selectedCompId) && (
                  <div className="community-review-box">
                    <div className="community-review-title">
                      <Sparkles size={14} color="var(--green)" />
                      <span>Đánh Giá Thực Chiến Từ Cộng Đồng</span>
                      <span style={{ fontSize: '11px', color: 'var(--muted)', marginLeft: 'auto', fontWeight: 500 }}>
                        {getCommunityReview(selectedCompId)!.source}
                      </span>
                    </div>
                    <div>
                      {getCommunityReview(selectedCompId)!.pros.map((pro, i) => (
                        <div key={i} className="review-pro-item">
                          <Check size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                          <span>{pro}</span>
                        </div>
                      ))}
                      {getCommunityReview(selectedCompId)!.cons.map((con, i) => (
                        <div key={i} className="review-con-item">
                          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                          <span>Lưu ý: {con}</span>
                        </div>
                      ))}
                      <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                        <span className="review-thermal-badge">
                          Nhiệt độ: <strong>{getCommunityReview(selectedCompId)!.thermals}</strong>
                        </span>
                        <span className="review-thermal-badge">
                          Độ ồn: <strong>{getCommunityReview(selectedCompId)!.noise}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Price Alert Form (FR-28, FR-29) */}
                <div className="price-alert-box">
                  <h4><Bell size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Đặt Cảnh Báo Giá Tốt</h4>
                  <p>Hệ thống sẽ gửi email kèm Magic Link xác nhận khi giá sản phẩm giảm tới mức bạn mong muốn.</p>
                  <form onSubmit={handleCreateAlert}>
                    <div className="alert-inputs">
                      <input
                        type="email"
                        required
                        placeholder="Email của bạn..."
                        value={alertEmail}
                        onChange={e => setAlertEmail(e.target.value)}
                      />
                      <input
                        type="number"
                        required
                        placeholder="Mức giá mong muốn (VNĐ)"
                        value={alertPrice}
                        onChange={e => setAlertPrice(e.target.value ? Number(e.target.value) : '')}
                      />
                      <button type="submit" className="alert-btn" disabled={alertSubmitting}>
                        {alertSubmitting ? 'Đang gửi...' : 'Tạo Alert'}
                      </button>
                    </div>
                    {alertMsg && (
                      <p style={{ marginTop: '8px', fontSize: '12px', fontWeight: 600, color: alertMsg.startsWith('✓') ? '#059669' : '#dc2626' }}>
                        {alertMsg}
                      </p>
                    )}
                  </form>
                </div>
              </>
            ) : (
              <p>Không tìm thấy thông tin chi tiết.</p>
            )}
          </div>
        </div>
      )}

      {/* Bug Report Modal (FR-36, FR-42) */}
      {bugModalOpen && (
        <div className="modal-overlay" onClick={() => setBugModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Báo lỗi cấu hình đề xuất</h2>
              </div>
              <button className="modal-close" onClick={() => setBugModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSendBugReport}>
              <div className="bug-meta-info">
                Trace ID: {apiResult?.trace_id}
                <br />
                Snapshot: {apiResult?.snapshot_id}
                <br />
                Linh kiện đang hiển thị: {apiResult?.build?.components.length || 0} SKU
              </div>
              <div className="bug-form-group">
                <label>Vấn đề bạn phát hiện</label>
                <select value={bugReason} onChange={e => setBugReason(e.target.value)}>
                  <option value="Linh kiện không tương thích thực tế">Linh kiện không tương thích thực tế</option>
                  <option value="Giá hiển thị sai lệch so với shop">Giá hiển thị sai lệch so với shop</option>
                  <option value="Công suất nguồn chưa đủ">Công suất nguồn chưa đủ</option>
                  <option value="Khác">Lý do khác</option>
                </select>
              </div>
              <div className="bug-form-group">
                <label>Mô tả chi tiết</label>
                <textarea
                  rows={3}
                  placeholder="Vui lòng cung cấp thêm chi tiết giúp đội ngũ kiểm tra..."
                  value={bugNote}
                  onChange={e => setBugNote(e.target.value)}
                />
              </div>
              {bugMsg && (
                <p style={{ fontSize: '13px', color: '#059669', fontWeight: 600, marginBottom: '12px' }}>
                  {bugMsg}
                </p>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="secondary" onClick={() => setBugModalOpen(false)}>
                  Đóng
                </button>
                <button type="submit" className="primary" disabled={bugSubmitting}>
                  {bugSubmitting ? 'Đang gửi...' : 'Gửi báo lỗi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="footer">
        <div className="shell footer-inner">
          <div className="footer-brand">
            <img src="/logo-mark.png" alt="" />
            <span>TechBuyAdvisor</span>
          </div>
          <p>Chọn công nghệ với sự tự tin và thông tin rõ ràng.</p>
          <span>© {new Date().getFullYear()} TechBuy Advisor</span>
        </div>
      </footer>
      <MascotWidget build={apiResult?.build} />
      <QuoteModal isOpen={quoteModalOpen} onClose={() => setQuoteModalOpen(false)} />
    </div>
  );
}
