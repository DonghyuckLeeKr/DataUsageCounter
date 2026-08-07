import React from 'react';
import { ArrowDown, ArrowUp, Maximize2, Edit3, Wifi } from 'lucide-react';
import { calculateTotalUsedGB } from '../services/storageService';
import { formatSpeed } from '../utils/formatters';

export default function MiniGadget({ config, telemetry, onExpand, onOpenCalibration }) {
  const totalUsedGB = calculateTotalUsedGB(config);
  const limitGB = config.monthlyLimitGB || 80;
  const remainingGB = Math.max(0, limitGB - totalUsedGB);
  const percentage = Math.min(100, Math.max(0, (totalUsedGB / limitGB) * 100));

  let statusColor = '#34d399'; // Emerald safe
  if (percentage >= 90) statusColor = '#f43f5e'; // Danger
  else if (percentage >= 80) statusColor = '#fbbf24'; // Warning

  return (
    <div style={{
      width: '310px',
      padding: '16px',
      borderRadius: '20px',
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6)',
      color: '#f8fafc',
      fontFamily: 'var(--font-family)',
      position: 'relative'
    }}>
      {/* Mini Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #ff007a 0%, #a855f7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Wifi size={13} color="#fff" />
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: '700', letterSpacing: '-0.2px' }}>
            DataUsageCounter
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={onOpenCalibration}
            style={{ background: 'none', border: 'none', color: '#ff3399', cursor: 'pointer', padding: '2px' }}
            title="사용량 보정"
          >
            <Edit3 size={14} />
          </button>

          <button
            onClick={onExpand}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
            title="메인 대시보드로 열기"
          >
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

      {/* Real-time Speed Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
        
        <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '10px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#38bdf8', fontSize: '0.7rem', fontWeight: '700' }}>
            <ArrowDown size={13} />
            <span>다운로드</span>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: '800', marginTop: '4px' }}>
            {formatSpeed(telemetry.downloadSpeed, config.unitMode)}
          </div>
        </div>

        <div style={{ background: 'rgba(192, 132, 252, 0.1)', border: '1px solid rgba(192, 132, 252, 0.2)', padding: '10px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#c084fc', fontSize: '0.7rem', fontWeight: '700' }}>
            <ArrowUp size={13} />
            <span>업로드</span>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: '800', marginTop: '4px' }}>
            {formatSpeed(telemetry.uploadSpeed, config.unitMode)}
          </div>
        </div>

      </div>

      {/* 80GB Quota Bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
          <span style={{ color: 'var(--text-muted)' }}>LG U+ 80GB 한도</span>
          <span style={{ fontWeight: '700', color: statusColor }}>
            {totalUsedGB.toFixed(1)} / {limitGB} GB ({percentage.toFixed(0)}%)
          </span>
        </div>
        <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '10px', overflow: 'hidden' }}>
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
