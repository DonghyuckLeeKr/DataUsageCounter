import React from 'react';
import { Edit3, Settings, Monitor, Palette, Globe, ExternalLink } from 'lucide-react';
import { openRouterAdminPage } from '../services/routerDetectionService';

export default function Header({
  config,
  onOpenCalibration,
  onOpenSettings,
  onToggleMiniGadget,
  onSelectTheme,
  telemetry
}) {
  return (
    <header
      className="glass-panel"
      data-tauri-drag-region
      style={{
        padding: '14px 20px',
        marginBottom: '18px',
        cursor: 'grab',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}
    >
      <div data-tauri-drag-region style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        
        {/* Left Branding (Draggable region) */}
        <div data-tauri-drag-region style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
            pointerEvents: 'none',
            overflow: 'hidden'
          }}>
            <img src="/icon.png" alt="Dolphin Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
          </div>

          <div data-tauri-drag-region>
            <div data-tauri-drag-region style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 data-tauri-drag-region style={{ fontSize: '1.15rem', fontWeight: '700', letterSpacing: '-0.3px', margin: 0 }}>
                돌핀 데이터 <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>(Dolphin Data)</span>
              </h1>
              <span className="lguplus-badge">{config.carrierName || '모바일 데이터'}</span>
            </div>
            <p data-tauri-drag-region style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="pulse-dot"></span>
              {config.selectedInterface || 'ALL 인터페이스'} · 실시간 모니터링 중
            </p>
          </div>
        </div>

        {/* Right Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          
          {/* Theme Selector Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Palette size={15} color="var(--text-muted)" />
            <select
              value={config.theme || 'soft-dark'}
              onChange={(e) => onSelectTheme(e.target.value)}
              className="glass-input"
              style={{
                padding: '5px 10px',
                fontSize: '0.78rem',
                width: 'auto',
                cursor: 'pointer',
                borderRadius: '8px'
              }}
              title="디자인 테마 선택"
            >
              <option value="soft-dark" style={{ background: '#1e293b', color: '#fff' }}>🍃 소프트 다크 (눈이 편한 슬레이트)</option>
              <option value="midnight-black" style={{ background: '#121318', color: '#fff' }}>⬛ 미드나잇 매트 (차콜 다크)</option>
              <option value="nordic-light" style={{ background: '#f8fafc', color: '#0f172a' }}>☀️ 노르딕 라이트 (화사한 크림)</option>
              <option value="neon-cyber" style={{ background: '#0f172a', color: '#ff007a' }}>⚡ 네온 사이버 (강한 형광)</option>
            </select>
          </div>

          {/* Open Router Admin Page Button */}
          <button
            onClick={() => openRouterAdminPage()}
            className="glass-btn"
            style={{ padding: '6px 12px', fontSize: '0.78rem', borderColor: 'rgba(56, 189, 248, 0.4)', color: 'var(--accent-blue)' }}
            title="LTE 라우터 웹 관리자 페이지(http://192.168.0.1) 열기"
          >
            <Globe size={14} />
            <span>라우터 웹 관리자</span>
            <ExternalLink size={12} />
          </button>

          {/* Carrier Calibration Button */}
          <button
            onClick={onOpenCalibration}
            className="glass-btn"
            style={{ padding: '6px 12px', fontSize: '0.78rem', borderColor: 'var(--brand-badge-border)', color: 'var(--brand-color)' }}
            title="통신사 홈페이지 조회 사용량 입력 및 보정"
          >
            <Edit3 size={14} />
            <span>사용량 보정</span>
          </button>

          {/* Mini Floating Widget Toggle */}
          <button
            onClick={onToggleMiniGadget}
            className="glass-btn"
            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
            title="화면 구석 상시 고정 미니 가젯으로 전환"
          >
            <Monitor size={14} />
            <span>미니 가젯</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="glass-btn"
            style={{ padding: '6px 10px' }}
            title="설정 및 어댑터 변경"
          >
            <Settings size={15} />
          </button>

        </div>

      </div>
    </header>
  );
}
