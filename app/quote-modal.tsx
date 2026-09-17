'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Upload,
  X,
  Check,
  AlertTriangle,
  FileText,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Copy,
  RotateCcw,
  Building2,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
} from 'lucide-react';
import type { QuoteValidationResult } from '@/lib/quote-validator';

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SAMPLE_OVERPRICED_QUOTE: QuoteValidationResult = {
  storeName: 'Cửa hàng Vi Tính X (Báo giá tham khảo)',
  totalQuotedVnd: 24850000,
  totalMarketVnd: 22920000,
  differenceVnd: 1930000,
  differencePct: 8.4,
  verdict: 'OVERPRICED',
  verdictMessage:
    'Báo giá này đang cao hơn mặt bằng thị trường khoảng 8.4% (chênh lệch +1.930.000 ₫), chủ yếu do VGA và Mainboard bị đội giá. Bạn nên đàm phán giảm trực tiếp hoặc tham khảo thêm đại lý khác.',
  psuSafety: {
    quotedWattage: 650,
    requiredWattage: 550,
    status: 'SAFE',
    message:
      'Nguồn 650W đạt chuẩn an toàn, đủ cấp điện ổn định cho Core i5 13400F & RTX 4060 với biên độ dự phòng an toàn 100W.',
  },
  items: [
    {
      category: 'CPU',
      name: 'Intel Core i5-13400F Box Chính Hãng (10 Nhân 16 Luồng)',
      quotedPriceVnd: 4650000,
      marketMedianVnd: 4490000,
      priceDiffVnd: 160000,
      priceDiffPct: 3.6,
      status: 'FAIR',
    },
    {
      category: 'MB',
      name: 'Mainboard ASUS TUF GAMING B760M-PLUS WIFI D4',
      quotedPriceVnd: 3890000,
      marketMedianVnd: 3450000,
      priceDiffVnd: 440000,
      priceDiffPct: 12.8,
      status: 'EXPENSIVE',
    },
    {
      category: 'RAM',
      name: 'RAM Kingston Fury Beast 16GB (2x8GB) DDR4 3200MHz',
      quotedPriceVnd: 1150000,
      marketMedianVnd: 1050000,
      priceDiffVnd: 100000,
      priceDiffPct: 9.5,
      status: 'EXPENSIVE',
    },
    {
      category: 'GPU',
      name: 'VGA MSI GeForce RTX 4060 VENTUS 2X BLACK 8G OC',
      quotedPriceVnd: 8990000,
      marketMedianVnd: 7990000,
      priceDiffVnd: 1000000,
      priceDiffPct: 12.5,
      status: 'EXPENSIVE',
    },
    {
      category: 'SSD',
      name: 'SSD Kingston NV2 1TB PCIe 4.0 NVMe M.2',
      quotedPriceVnd: 1650000,
      marketMedianVnd: 1620000,
      priceDiffVnd: 30000,
      priceDiffPct: 1.9,
      status: 'FAIR',
    },
    {
      category: 'PSU',
      name: 'Nguồn MSI MAG A650BN 650W 80 Plus Bronze',
      quotedPriceVnd: 1390000,
      marketMedianVnd: 1320000,
      priceDiffVnd: 70000,
      priceDiffPct: 5.3,
      status: 'FAIR',
    },
    {
      category: 'CASE',
      name: 'Vỏ Case Montech AIR 100 ARGB Black (Kèm 4 Fan)',
      quotedPriceVnd: 1190000,
      marketMedianVnd: 1150000,
      priceDiffVnd: 40000,
      priceDiffPct: 3.5,
      status: 'FAIR',
    },
    {
      category: 'COOLER',
      name: 'Tản nhiệt khí Thermalright Assassin X 120 Refined SE ARGB',
      quotedPriceVnd: 490000,
      marketMedianVnd: 480000,
      priceDiffVnd: 10000,
      priceDiffPct: 2.1,
      status: 'FAIR',
    },
    {
      category: 'OTHER',
      name: 'Công lắp ráp máy, tối ưu BIOS & cài đặt phần mềm cơ bản',
      quotedPriceVnd: 0,
      marketMedianVnd: 0,
      priceDiffVnd: 0,
      priceDiffPct: 0,
      status: 'FAIR',
    },
  ],
  aiNotes:
    'Linh kiện tương thích tốt. Tuy nhiên VGA RTX 4060 đang bị kê cao ~1.000.000 ₫ và Main B760 chênh ~440.000 ₫ so với mặt bằng phân phối chính hãng. Bạn nên yêu cầu tiệm cân đối giảm ít nhất 1.200.000 ₫ hoặc đổi sang model VGA tương đương từ Galax/ZOTAC.',
};

const SAMPLE_GOOD_QUOTE: QuoteValidationResult = {
  storeName: 'Đại lý Công Nghệ S (Khuyến mãi Mùa Tựu Trường)',
  totalQuotedVnd: 38200000,
  totalMarketVnd: 41100000,
  differenceVnd: -2900000,
  differencePct: -7.1,
  verdict: 'GOOD_PRICE',
  verdictMessage:
    'Báo giá rất ưu đãi! Tổng bộ máy thấp hơn thị trường khoảng 7.1% (-2.900.000 ₫). Cửa hàng áp dụng combo chiết khấu tốt cho cấu hình Core i7 + RTX 4070 Super.',
  psuSafety: {
    quotedWattage: 750,
    requiredWattage: 650,
    status: 'SAFE',
    message:
      'Nguồn 750W 80 Plus Gold đảm bảo an toàn tuyệt đối cho Core i7 và card đồ họa RTX 4070 Super khi chịu tải đồ họa/gaming nặng.',
  },
  items: [
    {
      category: 'CPU',
      name: 'Intel Core i7-14700F Box Chính Hãng (20 Nhân 28 Luồng)',
      quotedPriceVnd: 8900000,
      marketMedianVnd: 9450000,
      priceDiffVnd: -550000,
      priceDiffPct: -5.8,
      status: 'CHEAPER',
    },
    {
      category: 'MB',
      name: 'Mainboard MSI B760 GAMING PLUS WIFI DDR5',
      quotedPriceVnd: 3950000,
      marketMedianVnd: 4200000,
      priceDiffVnd: -250000,
      priceDiffPct: -6.0,
      status: 'FAIR',
    },
    {
      category: 'RAM',
      name: 'RAM Corsair Vengeance RGB 32GB (2x16GB) DDR5 6000MHz',
      quotedPriceVnd: 2850000,
      marketMedianVnd: 3050000,
      priceDiffVnd: -200000,
      priceDiffPct: -6.6,
      status: 'FAIR',
    },
    {
      category: 'GPU',
      name: 'VGA ASUS Dual GeForce RTX 4070 Super EVO 12GB',
      quotedPriceVnd: 16800000,
      marketMedianVnd: 18450000,
      priceDiffVnd: -1650000,
      priceDiffPct: -8.9,
      status: 'CHEAPER',
    },
    {
      category: 'SSD',
      name: 'SSD Samsung 990 EVO 1TB PCIe 5.0 x2 / NVMe M.2',
      quotedPriceVnd: 2150000,
      marketMedianVnd: 2350000,
      priceDiffVnd: -200000,
      priceDiffPct: -8.5,
      status: 'CHEAPER',
    },
    {
      category: 'PSU',
      name: 'Nguồn Corsair RM750e 750W 80 Plus Gold ATX 3.0',
      quotedPriceVnd: 2450000,
      marketMedianVnd: 2550000,
      priceDiffVnd: -100000,
      priceDiffPct: -3.9,
      status: 'FAIR',
    },
    {
      category: 'COOLER',
      name: 'Tản nhiệt nước Thermalright Frozen Warframe 360 ARGB',
      quotedPriceVnd: 1850000,
      marketMedianVnd: 1950000,
      priceDiffVnd: -100000,
      priceDiffPct: -5.1,
      status: 'FAIR',
    },
    {
      category: 'CASE',
      name: 'Vỏ Case Lian Li Lancool 216 RGB Black',
      quotedPriceVnd: 1950000,
      marketMedianVnd: 2100000,
      priceDiffVnd: -150000,
      priceDiffPct: -7.1,
      status: 'CHEAPER',
    },
  ],
  aiNotes:
    'Cấu hình đồng đều và thương hiệu cao cấp. Bạn nên kiểm tra kỹ tem bảo hành chính hãng và bảo hành tối thiểu 36 tháng của đại lý trước khi ký nhận.',
};

export default function QuoteModal({ isOpen, onClose }: QuoteModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanStep, setScanStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QuoteValidationResult | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lock body scroll and handle Escape key while modal is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Cycle scan steps during analysis for realistic feedback
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setScanStep(1);
      interval = setInterval(() => {
        setScanStep((prev) => (prev < 3 ? prev + 1 : 1));
      }, 1400);
    }
    return () => clearInterval(interval);
  }, [loading]);

  if (!isOpen) return null;

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) {
      processFile(selected);
    }
  }

  function processFile(selected: File) {
    if (!selected.type.startsWith('image/')) {
      setError('Vui lòng chọn tệp ảnh hợp lệ (PNG, JPG, WebP).');
      return;
    }
    if (selected.size > 12 * 1024 * 1024) {
      setError('Dung lượng tệp vượt quá 12MB. Vui lòng nén hoặc chụp lại ảnh.');
      return;
    }
    setFile(selected);
    setError(null);
    setResult(null);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(selected);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }

  async function handleAnalyze() {
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/v1/quote-validator', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.status === 'OK' && data.result) {
        setResult(data.result);
      } else {
        setError(data.message || 'Không thể nhận diện báo giá. Vui lòng thử lại với ảnh chụp rõ nét hơn.');
      }
    } catch {
      setError('Lỗi kết nối máy chủ khi xử lý báo giá. Vui lòng kiểm tra lại mạng.');
    } finally {
      setLoading(false);
    }
  }

  function handleLoadSample(sample: QuoteValidationResult) {
    setResult(sample);
    setFile(null);
    setPreview(null);
    setError(null);
  }

  function handleCopySummary() {
    if (!result) return;
    const diffSign = result.differenceVnd > 0 ? '+' : '';
    const lines = [
      `📋 BÁO CÁO THẨM ĐỊNH BÁO GIÁ PC - TECHBUY AI`,
      `• Cửa hàng / Nguồn: ${result.storeName}`,
      `• Tổng giá tiệm báo: ${result.totalQuotedVnd.toLocaleString('vi-VN')} ₫`,
      `• Giá thị trường tham chiếu: ${result.totalMarketVnd.toLocaleString('vi-VN')} ₫`,
      `• Mức chênh lệch: ${diffSign}${result.differenceVnd.toLocaleString('vi-VN')} ₫ (${diffSign}${result.differencePct}%)`,
      `• Đánh giá: ${result.verdict === 'GOOD_PRICE' ? 'GIÁ TỐT' : result.verdict === 'OVERPRICED' ? 'BỊ KÊNH GIÁ' : 'GIÁ HỢP LÝ'}`,
      `• An toàn nguồn PSU: ${result.psuSafety.message}`,
      ``,
      `CHI TIẾT LINH KIỆN:`,
      ...result.items.map(
        (it) =>
          `- [${it.category}] ${it.name}: ${it.quotedPriceVnd.toLocaleString('vi-VN')} ₫ (TT: ${
            it.marketMedianVnd ? it.marketMedianVnd.toLocaleString('vi-VN') + ' ₫' : 'N/A'
          }) -> ${it.priceDiffPct ? (it.priceDiffPct > 0 ? `+${it.priceDiffPct}%` : `${it.priceDiffPct}%`) : 'Chuẩn'}`
      ),
      ``,
      `💡 LỜI KHUYÊN ĐÀM PHÁN:`,
      result.aiNotes,
    ];

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    });
  }

  function resetState() {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  }

  return (
    <div className="quote-modal-overlay" onClick={onClose}>
      <div className="quote-modal-shell" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="quote-modal-topbar">
          <div className="quote-modal-header-info">
            <div className="quote-modal-chip">
              <span className="quote-modal-pulse-dot" />
              <span>AI VISION INSPECTION</span>
            </div>
            <h2 className="quote-modal-heading">Thẩm Định Báo Giá Máy Tính AI</h2>
            <p className="quote-modal-subheading">
              Đối soát giá thị trường từ 50+ nhà phân phối & kiểm tra độ an toàn linh kiện
            </p>
          </div>
          <button className="quote-modal-exit-btn" onClick={onClose} aria-label="Đóng cửa sổ">
            <X size={18} />
          </button>
        </div>

        {/* Body Content */}
        <div className="quote-modal-content-scroll">
          {loading ? (
            /* Scanning / Loading Phase */
            <div className="quote-scan-state">
              <div className="quote-scan-radar-box">
                <div className="quote-scan-radar-glow" />
                <div className="quote-scan-radar-beam" />
                {preview ? (
                  <img src={preview} alt="Scanning" className="quote-scan-preview-thumb" />
                ) : (
                  <FileText size={48} className="quote-scan-doc-icon" />
                )}
              </div>

              <div className="quote-scan-status-info">
                <h3 className="quote-scan-heading">AI đang bóc tách linh kiện & soi giá...</h3>
                <p className="quote-scan-desc">
                  Quá trình đối soát mất từ 3 - 6 giây dựa trên cơ sở dữ liệu bán lẻ thời gian thực.
                </p>

                <div className="quote-scan-steps-progress">
                  <div className={`quote-step-item ${scanStep >= 1 ? 'active' : ''} ${scanStep > 1 ? 'done' : ''}`}>
                    <div className="quote-step-bullet">{scanStep > 1 ? <Check size={12} /> : 1}</div>
                    <span>Nhận diện chữ & bảng linh kiện (Gemini Vision OCR)</span>
                  </div>
                  <div className={`quote-step-item ${scanStep >= 2 ? 'active' : ''} ${scanStep > 2 ? 'done' : ''}`}>
                    <div className="quote-step-bullet">{scanStep > 2 ? <Check size={12} /> : 2}</div>
                    <span>Đối soát giá trung vị 50+ đại lý vi tính Việt Nam</span>
                  </div>
                  <div className={`quote-step-item ${scanStep >= 3 ? 'active' : ''}`}>
                    <div className="quote-step-bullet">3</div>
                    <span>Thẩm định công suất nguồn (PSU) & độ tương thích</span>
                  </div>
                </div>
              </div>
            </div>
          ) : !result ? (
            /* Input / Dropzone Phase */
            <div className="quote-upload-phase">
              <div
                className={`quote-dropzone ${isDragOver ? 'drag-over' : ''} ${preview ? 'has-preview' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                />

                {preview ? (
                  <div className="quote-preview-container">
                    <img src={preview} alt="Báo giá đã chọn" className="quote-preview-image" />
                    <div className="quote-preview-meta">
                      <span className="quote-preview-filename">{file?.name}</span>
                      <span className="quote-preview-filesize">
                        {file ? `${(file.size / 1024).toFixed(0)} KB` : ''}
                      </span>
                    </div>
                    <span className="quote-preview-repick">Nhấp vào đây để chọn ảnh khác</span>
                  </div>
                ) : (
                  <div className="quote-dropzone-cta">
                    <div className="quote-dropzone-icon-ring">
                      <Upload size={24} />
                    </div>
                    <strong className="quote-dropzone-title">Kéo thả ảnh báo giá hoặc bấm vào đây để chọn tệp</strong>
                    <p className="quote-dropzone-hint">
                      Hỗ trợ ảnh chụp màn hình Zalo/Facebook, phiếu tính tiền, báo giá PDF xuất ảnh (JPG, PNG, WebP)
                    </p>
                    <div className="quote-privacy-pill">
                      <ShieldCheck size={13} />
                      <span>Bảo mật 100%: Ảnh được xử lý tạm thời và không lưu trữ trên máy chủ</span>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="quote-error-banner">
                  <AlertTriangle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {/* Primary Action Button */}
              <button
                className="quote-primary-submit-btn"
                onClick={handleAnalyze}
                disabled={!file}
              >
                <Sparkles size={16} />
                <span>Thẩm Định Báo Giá Ngay</span>
              </button>

              {/* Quick Sample Selector */}
              <div className="quote-sample-section">
                <div className="quote-sample-header">
                  <span className="quote-sample-line" />
                  <span className="quote-sample-label">Hoặc xem thử kết quả với báo giá thực tế</span>
                  <span className="quote-sample-line" />
                </div>

                <div className="quote-sample-cards">
                  <button
                    type="button"
                    className="quote-sample-card overpriced"
                    onClick={() => handleLoadSample(SAMPLE_OVERPRICED_QUOTE)}
                  >
                    <div className="quote-sample-card-head">
                      <span className="quote-sample-tag red">Bị kênh giá +8.4%</span>
                      <span className="quote-sample-price">24.850.000 ₫</span>
                    </div>
                    <div className="quote-sample-card-desc">
                      Dàn PC Gaming Core i5-13400F + RTX 4060 (Kênh giá VGA & Mainboard)
                    </div>
                  </button>

                  <button
                    type="button"
                    className="quote-sample-card good"
                    onClick={() => handleLoadSample(SAMPLE_GOOD_QUOTE)}
                  >
                    <div className="quote-sample-card-head">
                      <span className="quote-sample-tag green">Giá hời -7.1%</span>
                      <span className="quote-sample-price">38.200.000 ₫</span>
                    </div>
                    <div className="quote-sample-card-desc">
                      Dàn Đồ Họa Core i7-14700F + RTX 4070 Super (Combo khuyến mãi tốt)
                    </div>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Results & Inspection Phase */
            <div className="quote-result-phase">
              {/* Verdict Banner */}
              <div
                className={`quote-verdict-card ${
                  result.verdict === 'GOOD_PRICE'
                    ? 'good'
                    : result.verdict === 'OVERPRICED'
                    ? 'overpriced'
                    : 'fair'
                }`}
              >
                <div className="quote-verdict-top">
                  <div className="quote-verdict-badge">
                    {result.verdict === 'GOOD_PRICE' ? (
                      <>
                        <CheckCircle2 size={16} />
                        <span>BÁO GIÁ RẤT TỐT · NÊN MUA</span>
                      </>
                    ) : result.verdict === 'OVERPRICED' ? (
                      <>
                        <AlertTriangle size={16} />
                        <span>CẢNH BÁO · BÁO GIÁ BỊ KÊNH</span>
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        <span>BÁO GIÁ HỢP LÝ · ĐÚNG MẶT BẰNG</span>
                      </>
                    )}
                  </div>
                  <div className="quote-store-origin">
                    <Building2 size={13} />
                    <span>{result.storeName}</span>
                  </div>
                </div>

                <p className="quote-verdict-summary">{result.verdictMessage}</p>
              </div>

              {/* Master Metric Bento */}
              <div className="quote-bento-metrics">
                <div className="quote-metric-item">
                  <span className="quote-metric-caption">Tổng giá tiệm báo</span>
                  <div className="quote-metric-number">
                    {result.totalQuotedVnd.toLocaleString('vi-VN')}
                    <span className="quote-currency">₫</span>
                  </div>
                </div>

                <div className="quote-metric-item">
                  <span className="quote-metric-caption">Giá thị trường chuẩn</span>
                  <div className="quote-metric-number market">
                    {result.totalMarketVnd.toLocaleString('vi-VN')}
                    <span className="quote-currency">₫</span>
                  </div>
                </div>

                <div className={`quote-metric-item delta ${result.differenceVnd > 0 ? 'higher' : 'lower'}`}>
                  <span className="quote-metric-caption">Mức chênh lệch</span>
                  <div className="quote-metric-delta-row">
                    {result.differenceVnd > 0 ? (
                      <>
                        <TrendingUp size={16} />
                        <span>+{result.differenceVnd.toLocaleString('vi-VN')} ₫</span>
                      </>
                    ) : (
                      <>
                        <TrendingDown size={16} />
                        <span>{result.differenceVnd.toLocaleString('vi-VN')} ₫</span>
                      </>
                    )}
                  </div>
                  <span className="quote-metric-pct-tag">
                    {result.differencePct > 0 ? `+${result.differencePct}%` : `${result.differencePct}%`}
                  </span>
                </div>
              </div>

              {/* Hardware & PSU Safety Bar */}
              <div
                className={`quote-safety-box ${
                  result.psuSafety.status === 'SAFE' ? 'safe' : 'warning'
                }`}
              >
                <div className="quote-safety-icon-wrap">
                  {result.psuSafety.status === 'SAFE' ? (
                    <ShieldCheck size={20} />
                  ) : (
                    <ShieldAlert size={20} />
                  )}
                </div>
                <div className="quote-safety-body">
                  <div className="quote-safety-header">
                    <strong>Thẩm định công suất nguồn (PSU)</strong>
                    <span className="quote-safety-status-pill">
                      {result.psuSafety.status === 'SAFE' ? 'Đạt an toàn' : 'Cảnh báo non công suất'}
                    </span>
                  </div>
                  <p className="quote-safety-detail">{result.psuSafety.message}</p>
                </div>
              </div>

              {/* Line-by-line Component Table */}
              <div className="quote-breakdown-card">
                <div className="quote-breakdown-header">
                  <div className="quote-breakdown-title">
                    <FileText size={15} />
                    <span>Bóc tách đối soát từng linh kiện ({result.items.length})</span>
                  </div>
                  <span className="quote-breakdown-note">So với giá trung vị đại lý chính hãng</span>
                </div>

                <div className="quote-table-container">
                  <table className="quote-modern-table">
                    <thead>
                      <tr>
                        <th>Linh kiện & Mã SKU</th>
                        <th className="cell-right">Tiệm báo</th>
                        <th className="cell-right">Thị trường</th>
                        <th className="cell-center">Đánh giá</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.items.map((it, idx) => (
                        <tr key={idx}>
                          <td>
                            <div className="quote-item-col">
                              <span className="quote-item-cat-badge">{it.category}</span>
                              <span className="quote-item-name">{it.name}</span>
                            </div>
                          </td>
                          <td className="cell-right font-tabular bold">
                            {it.quotedPriceVnd.toLocaleString('vi-VN')} ₫
                          </td>
                          <td className="cell-right font-tabular text-muted">
                            {it.marketMedianVnd ? `${it.marketMedianVnd.toLocaleString('vi-VN')} ₫` : '—'}
                          </td>
                          <td className="cell-center">
                            {it.status === 'EXPENSIVE' && (
                              <span className="quote-status-badge red">
                                +{it.priceDiffPct}%
                              </span>
                            )}
                            {it.status === 'CHEAPER' && (
                              <span className="quote-status-badge green">
                                {it.priceDiffPct}%
                              </span>
                            )}
                            {it.status === 'FAIR' && (
                              <span className="quote-status-badge slate">Chuẩn</span>
                            )}
                            {it.status === 'UNKNOWN' && (
                              <span className="quote-status-badge gray">Tham khảo</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Negotiation Advice & AI Notes */}
              {result.aiNotes && (
                <div className="quote-ai-advice-box">
                  <div className="quote-ai-advice-header">
                    <Sparkles size={15} />
                    <span>Lời khuyên thương lượng từ TechBuy AI</span>
                  </div>
                  <p className="quote-ai-advice-text">{result.aiNotes}</p>
                </div>
              )}

              {/* Footer Toolbar */}
              <div className="quote-result-footer">
                <button
                  type="button"
                  className="quote-footer-btn secondary"
                  onClick={resetState}
                >
                  <RotateCcw size={15} />
                  <span>Soi báo giá khác</span>
                </button>

                <button
                  type="button"
                  className={`quote-footer-btn copy ${copied ? 'copied' : ''}`}
                  onClick={handleCopySummary}
                >
                  {copied ? (
                    <>
                      <Check size={15} />
                      <span>Đã sao chép tóm tắt!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={15} />
                      <span>Sao chép tóm tắt đàm phán</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="quote-footer-btn primary"
                  onClick={onClose}
                >
                  Hoàn tất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
