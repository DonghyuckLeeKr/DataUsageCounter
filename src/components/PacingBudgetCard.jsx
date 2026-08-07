import React from 'react';
import { Calendar, Compass, TrendingUp, Zap } from 'lucide-react';
import { calculateTotalUsedGB } from '../services/storageService';
import { getDaysRemainingInMonth, calculateDailyBudget } from '../utils/formatters';

export default function PacingBudgetCard({ config }) {
  const totalUsedGB = calculateTotalUsedGB(config);
  const limitGB = config.monthlyLimitGB || 80;
  const remainingGB = Math.max(0, limitGB - totalUsedGB);
  const daysLeft = getDaysRemainingInMonth(config.resetDay || 1);
  const dailyBudgetGB = calculateDailyBudget(remainingGB, config.resetDay || 1);

  return (
    <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-muted)' }}>
          오늘의 안전 사용량 가이드 (Pacing Budget)
        </h3>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '12px',
          background: 'rgba(56, 189, 248, 0.15)',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          color: 'var(--accent-blue)',
          fontSize: '0.75rem',
          fontWeight: '700'
        }}>
          <Compass size={14} />
          <span>스마트 가이드</span>
        </div>
      </div>

      {/* Main Big Number */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
        border: '1px solid rgba(56, 189, 248, 0.2)',
        borderRadius: '16px',
        padding: '20px',
        textAlign: 'center',
        margin: '8px 0 16px 0'
      }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
          초과 없이 이번 달을 완주하기 위한 하루 권장 용량
        </span>
        <div style={{ fontSize: '2.2rem', fontWeight: '800', color: '#38bdf8', lineHeight: 1.1 }}>
          {dailyBudgetGB.toFixed(2)} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>GB / 일</span>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
          (남은 {remainingGB.toFixed(1)} GB ÷ 이번 달 남은 {daysLeft}일)
        </div>
      </div>

      {/* Pacing Advice */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={15} color="var(--accent-purple)" />
            이번 달 남은 기간
          </span>
          <span style={{ fontWeight: '600' }}>{daysLeft}일 남음</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={15} color="var(--accent-amber)" />
            고화질 스트리밍 가능 시간
          </span>
          <span style={{ fontWeight: '600' }}>약 {(dailyBudgetGB * 0.8).toFixed(1)} 시간 / 일 (FHD)</span>
        </div>
      </div>
    </div>
  );
}
