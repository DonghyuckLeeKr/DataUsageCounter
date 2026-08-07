import React from 'react';
import { Wifi, Edit3, Settings, Monitor, Palette } from 'lucide-react';

export default function Header({
  config,
  onOpenCalibration,
  onOpenSettings,
  onToggleMiniGadget,
  onSelectTheme,
  telemetry
}) {
  return (
    <header className="glass-panel" style={{ padding: '16px 24px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Left Branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '14px',
            background: 'var(--brand-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'
          }}>
            <Wifi size={22} color="#fff" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: '700', letterSpacing: '-0.3px', margin: 0 }}>
                Data Usage Counter
              </h1>
              <span className="lguplus-badge">{config.carrierName || 'LG U+ 80GB'}</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="pulse-dot"></span>
              {config.selectedInterface || 'ALL 인터페이스'} · 실시간 모니터링 중
            </p>
          </div>
        </div>

        {/* Right Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          
          {/* Theme Selector Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Palette size={16} color="var(--text-muted)" />
            <select
              value={config.theme || 'soft-dark'}
              onChange={(e) => onSelectTheme(e.target.value)}
              className="glass-input"
              style={{
                padding: '6px 12px',
                fontSize: '0.8rem',
                width: 'auto',
                cursor: 'pointer',
                borderRadius: '10px',
                background: 'rgba(0, 0, 0, 0.2)'
              }}
              title="디자인 테마 선택"
            >
              <option value="soft-dark" style={{ background: '#1e293b', color: '#fff' }}>🍃 소프트 다크 (눈이 편한 슬레이트)</option>
              <option value="midnight-black" style={{ background: '#121318', color: '#fff' }}>⬛ 미드나잇 매트 (차콜 다크)</option>
              <option value="nordic-light" style={{ background: '#f8fafc', color: '#0f172a' }}>☀️ 노르딕 라이트 (화사한 크림)</option>
              <option value="neon-cyber" style={{ background: '#0f172a', color: '#ff007a' }}>⚡ 네온 사이버 (강한 형광)</option>
            </select>
          </div>

          {/* Carrier Calibration Button */}
          <button
            onClick={onOpenCalibration}
            className="glass-btn"
            title="통신사 홈페이지 조회 사용량 입력 및 보정"
            style={{ borderColor: 'var(--brand-badge-border)', color: 'var(--brand-color)' }}
          >
            <Edit3 size={15} />
            <span>사용량 보정</span>
          </button>

          {/* Mini Floating Widget Toggle */}
          <button
            onClick={onToggleMiniGadget}
            className="glass-btn"
            title="화면 구석 상시 고정 미니 가젯으로 전환"
          >
            <Monitor size={15} />
            <span>미니 가젯</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="glass-btn"
            style={{ padding: '9px 12px' }}
            title="설정 및 어댑터 변경"
          >
            <Settings size={16} />
          </button>

        </div>

      </div>
    </header>
  );
}
