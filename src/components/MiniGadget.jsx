import React, { useState, useEffect } from 'react';
import { ArrowDown, ArrowUp, Maximize2, Edit3, Wifi, X, Minus } from 'lucide-react';
import { calculateTotalUsedGB } from '../services/storageService';
import { formatSpeed } from '../utils/formatters';
import { isTauriAvailable } from '../services/networkTelemetry';

export default function MiniGadget({ config, telemetry, onExpand, onOpenCalibration }) {
  const totalUsedGB = calculateTotalUsedGB(config);
  const limitGB = config.monthlyLimitGB || 100;
  const remainingGB = Math.max(0, limitGB - totalUsedGB);
  const percentage = Math.min(100, Math.max(0, (totalUsedGB / limitGB) * 100));

  const [isTauri, setIsTauri] = useState(false);

  useEffect(() => {
    setIsTauri(isTauriAvailable());
  }, []);

  const handleMinimize = async () => {
    if (isTauri) {
      try {
        const { appWindow } = await import('@tauri-apps/api/window');
        await appWindow.minimize();
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const handleCloseToTray = async () => {
    if (isTauri) {
      try {
        const { appWindow } = await import('@tauri-apps/api/window');
        await appWindow.hide();
      } catch (e) {
        console.warn(e);
      }
    }
  };

  let statusColor = 'var(--accent-emerald)';
  if (percentage >= 90) statusColor = 'var(--accent-rose)';
  else if (percentage >= 80) statusColor = 'var(--accent-amber)';

  return (
    <div
      data-tauri-drag-region
      style={{
        width: '320px',
        padding: '14px',
        borderRadius: '16px',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow-glass)',
        color: 'var(--text-main)',
        fontFamily: 'var(--font-family)',
        cursor: 'grab',
        margin: '0 auto',
        userSelect: 'none'
      }}
    >
      {/* Mini Header & Drag Bar */}
      <div data-tauri-drag-region style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div data-tauri-drag-region style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '7px',
            background: 'var(--brand-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none'
          }}>
            <Wifi size={13} color="#fff" />
          </div>
          <span data-tauri-drag-region style={{ fontSize: '0.8rem', fontWeight: '700', letterSpacing: '-0.2px', color: 'var(--text-main)' }}>
            DataUsageCounter
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={onOpenCalibration}
            style={{ background: 'none', border: 'none', color: 'var(--brand-color)', cursor: 'pointer', padding: '3px' }}
            title="사용량 보정"
          >
            <Edit3 size={14} />
          </button>

          <button
            onClick={onExpand}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '3px' }}
            title="메인 대시보드로 복원"
          >
            <Maximize2 size={14} />
          </button>

          <button
            onClick={handleMinimize}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '3px' }}
            title="트레이로 최소화"
          >
            <Minus size={13} />
          </button>

          <button
            onClick={handleCloseToTray}
            style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', padding: '3px' }}
            title="트레이로 숨기기"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Real-time Speed Grid */}
      <div data-tauri-drag-region style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
        
        <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '8px 10px', borderRadius: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-blue)', fontSize: '0.68rem', fontWeight: '700' }}>
            <ArrowDown size={12} />
            <span>다운로드</span>
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: '800', marginTop: '2px', color: 'var(--text-main)' }}>
            {formatSpeed(telemetry.downloadSpeed, config.unitMode)}
          </div>
        </div>

        <div style={{ background: 'rgba(167, 139, 250, 0.1)', border: '1px solid rgba(167, 139, 250, 0.2)', padding: '8px 10px', borderRadius: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-purple)', fontSize: '0.68rem', fontWeight: '700' }}>
            <ArrowUp size={12} />
            <span>업로드</span>
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: '800', marginTop: '2px', color: 'var(--text-main)' }}>
            {formatSpeed(telemetry.uploadSpeed, config.unitMode)}
          </div>
        </div>

      </div>

      {/* Quota Bar */}
      <div data-tauri-drag-region>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '4px' }}>
          <span style={{ color: 'var(--text-muted)' }}>{config.carrierName || '월간 데이터'}</span>
          <span style={{ fontWeight: '700', color: statusColor }}>
            {totalUsedGB.toFixed(1)} / {limitGB} GB ({percentage.toFixed(0)}%)
          </span>
        </div>
        <div style={{ height: '5px', background: 'var(--glass-border)', borderRadius: '10px', overflow: 'hidden' }}>
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
