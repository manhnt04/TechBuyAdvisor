'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { X, Sparkles, Cpu, Layers, Gauge } from 'lucide-react';

const PcViewer3D = dynamic(() => import('./pc-viewer-3d'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: '100%',
        height: '560px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#090d16',
        color: '#94a3b8',
        gap: '12px',
        borderRadius: '16px',
      }}
    >
      <div
        style={{
          width: '36px',
          height: '36px',
          border: '3px solid rgba(56, 189, 248, 0.2)',
          borderTopColor: '#38bdf8',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      <p style={{ fontSize: '13px', fontWeight: 600 }}>Đang khởi tạo showroom 3D WebGL...</p>
    </div>
  ),
});

interface PcModal3DProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PcModal3D({ isOpen, onClose }: PcModal3DProps) {
  const [activeTab, setActiveTab] = useState<'3d' | 'specs' | 'compare'>('3d');

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'rgba(5, 10, 20, 0.85)',
        backdropFilter: 'blur(10px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '1020px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(10, 15, 28, 0.8)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fbbf24',
              }}
            >
              <Cpu size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                  Flagship White Gaming PC • 3D Showroom
                </h3>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                  }}
                >
                  Three.js Model
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0' }}>
                Tái tạo thủ tục theo chuẩn ảnh chụp thực tế (Panoramic Bể cá • Tản AIO LCD • RTX 4080 iGame)
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* View Switcher Tabs */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(30, 41, 59, 0.8)',
                padding: '3px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <button
                onClick={() => setActiveTab('3d')}
                style={{
                  padding: '5px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  background: activeTab === '3d' ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
                  color: activeTab === '3d' ? '#38bdf8' : '#94a3b8',
                }}
              >
                Mô hình 3D
              </button>
              <button
                onClick={() => setActiveTab('specs')}
                style={{
                  padding: '5px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  background: activeTab === 'specs' ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
                  color: activeTab === 'specs' ? '#38bdf8' : '#94a3b8',
                }}
              >
                Linh kiện chi tiết
              </button>
              <button
                onClick={() => setActiveTab('compare')}
                style={{
                  padding: '5px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  background: activeTab === 'compare' ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
                  color: activeTab === 'compare' ? '#38bdf8' : '#94a3b8',
                }}
              >
                Đối chiếu ảnh gốc
              </button>
            </div>

            <button
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'rgba(30, 41, 59, 0.8)',
                color: '#cbd5e1',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                cursor: 'pointer',
              }}
              aria-label="Đóng"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '18px 22px',
            background: 'linear-gradient(180deg, #0b1120 0%, #030712 100%)',
          }}
        >
          {activeTab === '3d' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <PcViewer3D height="540px" showControls={true} />

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: 'rgba(15, 23, 42, 0.75)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}
                >
                  <span
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      background: 'rgba(245, 158, 11, 0.15)',
                      color: '#fbbf24',
                    }}
                  >
                    <Sparkles size={16} />
                  </span>
                  <div>
                    <h5 style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', margin: '0 0 2px 0' }}>
                      Hiệu ứng Ánh sáng ARGB
                    </h5>
                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                      Đổi ngay các profile Sunset Amber, Glacier Ice, Cyberpunk Neon và Rainbow trên thanh điều khiển.
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: 'rgba(15, 23, 42, 0.75)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}
                >
                  <span
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      background: 'rgba(56, 189, 248, 0.15)',
                      color: '#38bdf8',
                    }}
                  >
                    <Layers size={16} />
                  </span>
                  <div>
                    <h5 style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', margin: '0 0 2px 0' }}>
                      Tháo/Lắp Kính Cường Lực
                    </h5>
                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                      Bật/tắt mặt kính trong suốt truyền sáng 92% để chiêm ngưỡng trọn vẹn buồng máy bên trong.
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: 'rgba(15, 23, 42, 0.75)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}
                >
                  <span
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#34d399',
                    }}
                  >
                    <Gauge size={16} />
                  </span>
                  <div>
                    <h5 style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', margin: '0 0 2px 0' }}>
                      Điều Tốc Quạt & Màn Hình AIO
                    </h5>
                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                      10 quạt cánh lốc xoáy hoạt họa đồng bộ cùng màn hình LCD hiển thị nhiệt độ tuyết rơi thời gian thực.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'specs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#38bdf8',
                  margin: 0,
                }}
              >
                Bảng Cấu Hình Dàn Máy Trưng Bày
              </h4>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                  gap: '12px',
                }}
              >
                {[
                  {
                    part: 'VGA / Card đồ họa',
                    model: 'iGame GeForce RTX 4080 Super Ultra W OC 16GB',
                    desc: 'Dựng đứng bằng cáp Riser PCIe 4.0 trắng. Mặt nạ hologram đổi sắc rực rỡ dưới ánh sáng ARGB.',
                  },
                  {
                    part: 'Tản nhiệt CPU (AIO)',
                    model: 'Custom AIO Liquid Cooler 360mm White với LCD Telemetry',
                    desc: 'Màn hình LCD tròn hiển thị nhiệt độ & hoạt họa tuyết rơi số. Ống nước bọc dù trắng uốn cong mềm.',
                  },
                  {
                    part: 'Bo mạch chủ (Mainboard)',
                    model: 'MSI MAG B760M Mortar Max WiFi White',
                    desc: 'Dàn giáp tản nhiệt nhôm phay xước trắng in logo Rồng MSI đặc trưng và mạch điện cao cấp.',
                  },
                  {
                    part: 'Bộ nhớ RAM',
                    model: 'Corsair Dominator Titanium RGB DDR5 32GB (2x16GB) 6000MHz',
                    desc: 'Thanh nhôm đúc trắng phủ giáp, dải tản sáng LED đổi màu phía trên đỉnh.',
                  },
                  {
                    part: 'Vỏ Case máy tính',
                    model: 'Panoramic Fishtank Dual-Chamber Chassis White',
                    desc: 'Kính cong góc liền mạch không cột chắn, buồng nguồn tách biệt, chân đế vát khối kim cương tích hợp I/O.',
                  },
                  {
                    part: 'Hệ thống quạt làm mát',
                    model: '10x Quạt ARGB 120mm Reverse Blade & Forward Blade',
                    desc: '3 quạt hông hút gió, 3 quạt nóc đẩy tản, 1 quạt sau, 3 quạt đáy tạo luồng gió đối lưu mát lạnh.',
                  },
                  {
                    part: 'Dây cấp nguồn ARGB',
                    model: 'Lian Li Strimer Plus V2 24-Pin ARGB Cable',
                    desc: 'Dải sợi quang học uốn cong phát sáng neon rực rỡ từ đáy case lên mainboard.',
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '12px',
                      background: 'rgba(15, 23, 42, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: '#f59e0b',
                      }}
                    >
                      {item.part}
                    </span>
                    <h5 style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', margin: '4px 0 2px 0' }}>
                      {item.model}
                    </h5>
                    <p style={{ fontSize: '11px', color: '#cbd5e1', margin: 0, lineHeight: 1.45 }}>
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'compare' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                gap: '20px',
                alignItems: 'center',
              }}
            >
              <div>
                <h4
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: '#f59e0b',
                    margin: '0 0 8px 0',
                  }}
                >
                  Ảnh Chụp Mẫu Thực Tế (Reference)
                </h4>
                <div
                  style={{
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: '#000000',
                    boxShadow: '0 15px 30px rgba(0, 0, 0, 0.5)',
                  }}
                >
                  <img
                    src="/pc-reference.png"
                    alt="Original PC Reference"
                    style={{
                      width: '100%',
                      height: 'auto',
                      maxHeight: '440px',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                </div>
              </div>

              <div>
                <h4
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: '#38bdf8',
                    margin: '0 0 8px 0',
                  }}
                >
                  Mô Hình 3D Procedural (Three.js WebGL)
                </h4>
                <div
                  style={{
                    height: '440px',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                  }}
                >
                  <PcViewer3D height="100%" showControls={false} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
