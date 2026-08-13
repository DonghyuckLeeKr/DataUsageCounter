import React from 'react';
import { ArrowDown, ArrowUp, Maximize2, Edit3, X, Minus } from 'lucide-react';
import { calculateTotalUsedGB } from '../services/storageService';
import { formatSpeed } from '../utils/formatters';

export default function MiniGadget({ config, telemetry, onExpand, onOpenCalibration }) {
  const totalUsedGB = calculateTotalUsedGB(config);
  const limitGB = config.monthlyLimitGB || 100;
  const remainingGB = Math.max(0, limitGB - totalUsedGB);
  const percentage = Math.min(100, Math.max(0, (totalUsedGB / limitGB) * 100));

  const getAppWindow = async () => {
    if (typeof window !== 'undefined' && window.__TAURI__?.window?.appWindow) {
      return window.__TAURI__.window.appWindow;
    }
    try {
      const winPkg = '@tauri-apps/api/window';
      const { appWindow } = await import(/* @vite-ignore */ winPkg);
      if (appWindow) return appWindow;
    } catch (e) {
      console.warn('Failed to import Tauri appWindow', e);
    }
    return null;
  };

  const handleMinimize = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    const appWindow = await getAppWindow();
    if (appWindow) {
      try {
        await appWindow.minimize();
      } catch (err) {
        console.error('Minimize failed', err);
      }
    }
  };

  const handleCloseToTray = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    const appWindow = await getAppWindow();
    if (appWindow) {
      try {
        await appWindow.hide();
      } catch (err) {
        console.error('Close to tray failed', err);
      }
    }
  };

  // Dolphin Mood & Status Indicator
  let statusColor = 'var(--accent-emerald)';
  let dolphinMood = '🐬✨ 여유';

  if (percentage >= 90) {
    statusColor = 'var(--accent-rose)';
    dolphinMood = '🐬💦 소진 임박!';
  } else if (percentage >= 80) {
    statusColor = 'var(--accent-amber)';
    dolphinMood = '🐬👀 절약 모드';
  } else if (percentage >= 40) {
    statusColor = 'var(--accent-blue)';
    dolphinMood = '🐬🌊 순항 중';
  }

  return (
    <div
      data-tauri-drag-region
      style={{
        width: '100%',
        height: '100%',
        padding: '12px 14px',
        borderRadius: '22px 10px 22px 22px', // Dolphin Fin organic asymmetric curve
        background: 'var(--bg-gradient)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow-glass)',
        color: 'var(--text-main)',
        fontFamily: 'var(--font-family)',
        cursor: 'grab',
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Mini Titlebar & Drag Region */}
      <div data-tauri-drag-region style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div data-tauri-drag-region style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid var(--glass-border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            overflow: 'hidden'
          }}>
            <img src="/icon.png" alt="logo" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
          </div>
          <span data-tauri-drag-region style={{ fontSize: '0.78rem', fontWeight: '700', letterSpacing: '-0.2px', color: 'var(--text-main)' }}>
            돌핀 데이터
          </span>
          <span style={{
            fontSize: '0.65rem',
            fontWeight: '700',
            padding: '1px 6px',
            borderRadius: '10px',
            background: 'rgba(56, 189, 248, 0.15)',
            color: 'var(--accent-blue)',
            border: '1px solid rgba(56, 189, 248, 0.3)'
          }}>
            {dolphinMood}
          </span>
        </div>

        {/* Buttons */}
        <div data-tauri-drag-region="false" style={{ display: 'flex', alignItems: 'center', gap: '2px', zIndex: 10000 }}>
          <button
            onClick={onOpenCalibration}
            onMouseDown={(e) => e.stopPropagation()}
            type="button"
            style={{ background: 'none', border: 'none', color: 'var(--brand-color)', cursor: 'pointer', padding: '3px', borderRadius: '4px' }}
            title="사용량 보정"
          >
            <Edit3 size={13} />
          </button>

          <button
            onClick={onExpand}
            onMouseDown={(e) => e.stopPropagation()}
            type="button"
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '3px', borderRadius: '4px' }}
            title="메인 대시보드로 복원"
          >
            <Maximize2 size={13} />
          </button>

          <button
            onClick={handleMinimize}
            onMouseDown={(e) => e.stopPropagation()}
            type="button"
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '3px', borderRadius: '4px' }}
            title="트레이로 최소화"
          >
            <Minus size={13} />
          </button>

          <button
            onClick={handleCloseToTray}
            onMouseDown={(e) => e.stopPropagation()}
            type="button"
            style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', padding: '3px', borderRadius: '4px' }}
            title="트레이로 숨기기"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Real-time Speed Grid */}
      <div data-tauri-drag-region style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', margin: '4px 0' }}>
        <div style={{
          background: 'rgba(56, 189, 248, 0.12)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          padding: '6px 10px',
          borderRadius: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-blue)', fontSize: '0.65rem', fontWeight: '700' }}>
            <ArrowDown size={11} />
            <span>다운로드</span>
          </div>
          <div style={{ fontSize: '1rem', fontWeight: '800', marginTop: '2px', color: 'var(--text-main)' }}>
            {formatSpeed(telemetry.downloadSpeed, config.unitMode)}
          </div>
        </div>

        <div style={{
          background: 'rgba(167, 139, 250, 0.12)',
          border: '1px solid rgba(167, 139, 250, 0.25)',
          padding: '6px 10px',
          borderRadius: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-purple)', fontSize: '0.65rem', fontWeight: '700' }}>
            <ArrowUp size={11} />
            <span>업로드</span>
          </div>
          <div style={{ fontSize: '1rem', fontWeight: '800', marginTop: '2px', color: 'var(--text-main)' }}>
            {formatSpeed(telemetry.uploadSpeed, config.unitMode)}
          </div>
        </div>
      </div>

      {/* Quota Bar */}
      <div data-tauri-drag-region>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '3px' }}>
          <span style={{ color: 'var(--text-muted)' }}>{config.carrierName || '월간 한도'}</span>
          <span style={{ fontWeight: '700', color: statusColor }}>
            {totalUsedGB.toFixed(1)} / {limitGB} GB ({percentage.toFixed(0)}%)
          </span>
        </div>
        <div style={{ height: '5px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{
            width: `${percentage}%`,
            height: '100%',
            background: statusColor,
            borderRadius: '10px',
            transition: 'width 0.4s ease'
          }} />
        </div>
      </div>
    </div>
  );
}
