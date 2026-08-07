import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, Edit3 } from 'lucide-react';
import { calculateTotalUsedGB } from '../services/storageService';
import { getDaysRemainingInMonth, calculateDailyBudget } from '../utils/formatters';

export default function QuotaRingCard({ config, onOpenCalibration }) {
  const totalUsedGB = calculateTotalUsedGB(config);
  const limitGB = config.monthlyLimitGB || 100;
  const remainingGB = Math.max(0, limitGB - totalUsedGB);
  const percentage = Math.min(100, Math.max(0, (totalUsedGB / limitGB) * 100));

  const daysLeft = getDaysRemainingInMonth(config.resetDay || 1);
  const dailyBudgetGB = calculateDailyBudget(remainingGB, config.resetDay || 1);

  // Status color calculation
  let statusColor = 'var(--accent-emerald)';
  let statusText = '안전 (Safe)';
  let StatusIcon = ShieldCheck;

  if (percentage >= 95) {
    statusColor = 'var(--accent-rose)';
    statusText = '95%+ 긴급 위협';
    StatusIcon = AlertOctagon;
  } else if (percentage >= 90) {
    statusColor = 'var(--accent-rose)';
    statusText = '90%+ 위험 경고';
    StatusIcon = AlertTriangle;
  } else if (percentage >= 80) {
    statusColor = 'var(--accent-amber)';
    statusText = '80%+ 주의 구간';
    StatusIcon = AlertTriangle;
  }

  // Ring SVG stroke logic
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="glass-card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)' }}>
            월간 데이터 한도 & 일일 가이드
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {config.carrierName || '모바일 데이터 요금제'} (월 {limitGB}GB)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 10px',
            borderRadius: '12px',
            background: 'var(--glass-card)',
            border: `1px solid ${statusColor}`,
            color: statusColor,
            fontSize: '0.75rem',
            fontWeight: '700'
          }}>
            <StatusIcon size={14} />
            <span>{statusText}</span>
          </div>

          <button
            onClick={onOpenCalibration}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--brand-color)',
              cursor: 'pointer',
              padding: '4px'
            }}
            title="통신사/요금제 수정 및 사용량 보정"
          >
            <Edit3 size={16} />
          </button>
        </div>
      </div>

      {/* Main Content Grid: Left Ring, Right Details */}
      <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '20px', alignItems: 'center', margin: 'auto 0' }}>
        
        {/* SVG Ring Gauge */}
        <div style={{ position: 'relative', width: '140px', height: '140px', margin: '0 auto' }}>
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="var(--glass-border)"
              strokeWidth="11"
            />
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke={statusColor}
              strokeWidth="11"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 70 70)"
              style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.4s' }}
            />
          </svg>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{ fontSize: '1.6rem', fontWeight: '800', lineHeight: 1, color: 'var(--text-main)' }}>
              {percentage.toFixed(1)}%
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              소진됨
            </span>
          </div>
        </div>

        {/* Right Stats & Pacing Budget Box */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* Numbers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>사용한 용량</span>
              <span style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)' }}>
                {totalUsedGB.toFixed(2)} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>GB</span>
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>남은 용량</span>
              <span style={{ fontSize: '1.25rem', fontWeight: '700', color: statusColor }}>
                {remainingGB.toFixed(2)} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>GB</span>
              </span>
            </div>
          </div>

          {/* Daily Pacing Box */}
          <div style={{
            background: 'var(--glass-card)',
            border: '1px solid var(--glass-border-light)',
            borderRadius: '12px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                오늘의 안전 사용 권장량
              </span>
              <div style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--accent-blue)', marginTop: '2px' }}>
                {dailyBudgetGB.toFixed(2)} GB <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ 일</span>
              </div>
            </div>

            <div style={{ textAlign: 'right', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <div>이번 달 <b>{daysLeft}일</b> 남음</div>
              <div>매월 <b>{config.resetDay || 1}일</b> 리셋</div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
