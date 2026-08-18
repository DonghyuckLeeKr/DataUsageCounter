import React, { useState } from 'react';
import { Sparkles, ExternalLink, X } from 'lucide-react';

export default function AdBanner({ config }) {
  const [closed, setClosed] = useState(false);

  if (closed) return null;

  return (
    <div className="glass-card" style={{
      padding: '16px 20px',
      marginTop: '20px',
      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)',
      border: '1px solid rgba(99, 102, 241, 0.25)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '14px',
      position: 'relative'
    }}>
      {/* Left Icon & Text */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '260px' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'var(--brand-badge-bg)',
          border: '1px solid var(--brand-badge-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--brand-color)',
          shrink: 0
        }}>
          <Sparkles size={18} />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-muted)', fontWeight: 600 }}>
              스폰서 / 추천
            </span>
            <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
              데이터 부족 걱정 없는 '월 1만 원대 무제한 알뜰폰 요금제'
            </h4>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '3px' }}>
            {config.carrierName || 'LG U+'} 데이터 쉐어링 한도 초과 전, 더 알뜰한 요금제를 비교해 보세요.
          </p>
        </div>
      </div>

      {/* Right Action Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <a
          href="https://www.moyoplan.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="glass-btn glass-btn-primary"
          style={{ textDecoration: 'none', padding: '8px 14px', fontSize: '0.8rem' }}
        >
          <span>요금제 비교하기</span>
          <ExternalLink size={14} />
        </a>

        <button
          onClick={() => setClosed(true)}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          title="광고 닫기"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
