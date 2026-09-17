'use client';

interface PricePoint {
  date: string;
  priceVnd: number;
  suspect?: boolean;
}

interface PriceChartProps {
  history: PricePoint[];
  referencePriceVnd: number | null;
}

export default function PriceChart({ history, referencePriceVnd }: PriceChartProps) {
  if (!history || history.length === 0) {
    return <div className="chart-empty">Chưa có dữ liệu lịch sử giá.</div>;
  }

  // Sort by date ascending
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  const prices = sorted.map(p => p.priceVnd);
  const minPrice = Math.min(...prices, referencePriceVnd ?? Infinity);
  const maxPrice = Math.max(...prices, referencePriceVnd ?? 0);
  const padding = (maxPrice - minPrice) * 0.15 || 50000;
  const yMin = Math.max(0, minPrice - padding);
  const yMax = maxPrice + padding;

  const width = 500;
  const height = 180;
  const padLeft = 60;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 30;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const getX = (index: number) => padLeft + (index / Math.max(1, sorted.length - 1)) * plotW;
  const getY = (val: number) => padTop + plotH - ((val - yMin) / (yMax - yMin || 1)) * plotH;

  const pointsSvg = sorted.map((p, idx) => `${getX(idx)},${getY(p.priceVnd)}`).join(' ');

  const formatVndCompact = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}Tr`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
    return `${val}đ`;
  };

  const refY = referencePriceVnd ? getY(referencePriceVnd) : null;

  return (
    <div className="price-chart-wrap">
      <div className="chart-header">
        <span className="chart-title">Lịch sử giá 30 ngày (VNĐ)</span>
        {referencePriceVnd && (
          <span className="chart-ref-legend">
            <span className="ref-line-sample" /> Trung vị 30 ngày ({formatVndCompact(referencePriceVnd)})
          </span>
        )}
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="price-chart-svg" preserveAspectRatio="none">
        {/* Grid lines */}
        {[0, 0.5, 1].map((pct, idx) => {
          const val = yMin + (yMax - yMin) * pct;
          const y = getY(val);
          return (
            <g key={idx}>
              <line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
              <text x={padLeft - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#64748b">
                {formatVndCompact(val)}
              </text>
            </g>
          );
        })}

        {/* Reference median line */}
        {refY !== null && (
          <line
            x1={padLeft}
            y1={refY}
            x2={width - padRight}
            y2={refY}
            stroke="#10b981"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
        )}

        {/* Price path area */}
        <path
          d={`M ${getX(0)},${getY(sorted[0].priceVnd)} ${sorted.map((p, idx) => `L ${getX(idx)},${getY(p.priceVnd)}`).join(' ')} L ${getX(sorted.length - 1)},${height - padBottom} L ${padLeft},${height - padBottom} Z`}
          fill="rgba(59, 130, 246, 0.08)"
        />

        {/* Main trend line */}
        <polyline
          fill="none"
          stroke="#2563eb"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={pointsSvg}
        />

        {/* Data points */}
        {sorted.map((p, idx) => {
          const cx = getX(idx);
          const cy = getY(p.priceVnd);
          const isSuspect = p.suspect;
          return (
            <g key={idx}>
              <circle
                cx={cx}
                cy={cy}
                r={isSuspect ? 5 : 3.5}
                fill={isSuspect ? '#ef4444' : '#2563eb'}
                opacity={isSuspect ? 0.35 : 1}
                stroke="#ffffff"
                strokeWidth="1.5"
              />
            </g>
          );
        })}

        {/* X-axis labels */}
        {sorted.length > 1 && (
          <>
            <text x={padLeft} y={height - 8} fontSize="9" fill="#94a3b8" textAnchor="start">
              {sorted[0].date.slice(5)}
            </text>
            <text x={padLeft + plotW / 2} y={height - 8} fontSize="9" fill="#94a3b8" textAnchor="middle">
              {sorted[Math.floor(sorted.length / 2)].date.slice(5)}
            </text>
            <text x={width - padRight} y={height - 8} fontSize="9" fill="#94a3b8" textAnchor="end">
              {sorted[sorted.length - 1].date.slice(5)}
            </text>
          </>
        )}
      </svg>
    </div>
  );
}
