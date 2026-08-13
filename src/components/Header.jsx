import React, { useState } from 'react';
import { Edit3, Settings, Monitor, Palette, Globe, ExternalLink, Sun, Moon, Sparkles, Terminal } from 'lucide-react';
import { openRouterAdminPage } from '../services/routerDetectionService';

export default function Header({
  config,
  activeProfile,
  onOpenCalibration,
  onOpenSettings,
  onToggleMiniGadget,
  onSelectTheme,
  telemetry
}) {
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const themes = [
    { id: 'soft-dark', name: '소프트 다크', icon: '🍃', desc: '눈이 편한 슬레이트' },
    { id: 'midnight-black', name: '미드나잇', icon: '⬛', desc: '차콜 다크' },
    { id: 'nordic-light', name: '노르딕 라이트', icon: '☀️', desc: '화사한 크림' },
    { id: 'neon-cyber', name: '네온 사이버', icon: '⚡', desc: '강한 형광' }
  ];

  return (
    <header
      className="glass-panel"
      data-tauri-drag-region
      style={{
        padding: '12px 18px',
        marginBottom: '14px',
        cursor: 'grab',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        position: 'relative'
      }}
    >
      <div data-tauri-drag-region style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        
        {/* Left Branding (Draggable region) */}
        <div data-tauri-drag-region style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
            pointerEvents: 'none',
            overflow: 'hidden'
          }}>
            <img src="/icon.png" alt="Dolphin Logo" style={{ width: '30px', height: '30px', objectFit: 'contain' }} />
          </div>

          <div data-tauri-drag-region>
            <div data-tauri-drag-region style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 data-tauri-drag-region style={{ fontSize: '1.1rem', fontWeight: '700', letterSpacing: '-0.3px', margin: 0 }}>
                돌핀 데이터 <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>(Dolphin Data)</span>
              </h1>
              <span className="lguplus-badge">{activeProfile.name || '메인 요금제'}</span>
            </div>
            <p data-tauri-drag-region style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="pulse-dot"></span>
              {activeProfile.selectedInterface || 'ALL 인터페이스'} · 실시간 모니터링 중
            </p>
          </div>
        </div>

        {/* Right Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative' }}>
          
          {/* Minimal Compact Theme Selector Button */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowThemeMenu(prev => !prev)}
              className="glass-btn"
              style={{ padding: '6px 10px', fontSize: '0.78rem' }}
              title="테마 색상 변경"
            >
              <Palette size={14} color="var(--brand-color)" />
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>테마</span>
            </button>

            {/* Dropdown popup for Theme */}
            {showThemeMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '38px',
                  right: 0,
                  width: '180px',
                  background: 'var(--glass-bg)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-glass)',
                  padding: '6px',
                  zIndex: 9999,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                {themes.map(t => (
                  <div
                    key={t.id}
                    onClick={() => {
                      onSelectTheme(t.id);
                      setShowThemeMenu(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '7px 10px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: config.theme === t.id ? 'var(--brand-badge-bg)' : 'transparent',
                      color: config.theme === t.id ? 'var(--brand-color)' : 'var(--text-main)',
                      fontSize: '0.78rem',
                      fontWeight: config.theme === t.id ? '700' : '500',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <span>{t.icon}</span>
                    <span>{t.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Open Router Admin Page Button */}
          <button
            onClick={() => openRouterAdminPage()}
            className="glass-btn"
            style={{ padding: '6px 10px', fontSize: '0.78rem', borderColor: 'rgba(56, 189, 248, 0.4)', color: 'var(--accent-blue)' }}
            title="LTE 라우터 웹 관리자 페이지(http://192.168.0.1) 열기"
          >
            <Globe size={14} />
            <span>라우터</span>
            <ExternalLink size={11} />
          </button>

          {/* Carrier Calibration Button */}
          <button
            onClick={onOpenCalibration}
            className="glass-btn"
            style={{ padding: '6px 10px', fontSize: '0.78rem', borderColor: 'var(--brand-badge-border)', color: 'var(--brand-color)' }}
            title="통신사 홈페이지 조회 사용량 입력 및 보정"
          >
            <Edit3 size={14} />
            <span>보정</span>
          </button>

          {/* Mini Floating Widget Toggle */}
          <button
            onClick={onToggleMiniGadget}
            className="glass-btn"
            style={{ padding: '6px 10px', fontSize: '0.78rem' }}
            title="화면 구석 상시 고정 미니 가젯으로 전환"
          >
            <Monitor size={14} />
            <span>미니</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="glass-btn"
            style={{ padding: '6px 9px' }}
            title="설정 및 어댑터 변경"
          >
            <Settings size={14} />
          </button>

        </div>

      </div>
    </header>
  );
}
