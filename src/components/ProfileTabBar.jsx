import React from 'react';
import { Plus, Trash2, Edit3 } from 'lucide-react';
import { calculateTotalUsedGB, getBillingPeriod } from '../services/storageService';

export default function ProfileTabBar({
  config,
  onSwitchProfile,
  onAddProfile,
  onDeleteProfile,
  onOpenCalibration
}) {
  const profiles = config.profiles || [];
  const activeId = config.activeProfileId;

  const handleAdd = () => {
    if (profiles.length >= 5) {
      alert('요금제 프로필은 최대 5개까지 등록할 수 있습니다.');
      return;
    }
    const newIndex = profiles.length + 1;
    const newProfile = {
      id: `profile-${Date.now()}`,
      name: `요금제 ${newIndex}`,
      carrierName: `회선 ${newIndex}`,
      monthlyLimitGB: 50,
      initialBaselineGB: 0,
      sessionBytes: 0,
      resetDay: 1,
      lastResetPeriod: getBillingPeriod(1),
      selectedInterface: 'ALL (전체 인터페이스)'
    };
    onAddProfile(newProfile);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
        gap: '10px',
        flexWrap: 'wrap'
      }}
    >
      {/* Left Tabs (Up to 5 profiles) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {profiles.map((profile, idx) => {
          const isActive = profile.id === activeId;
          const usedGB = calculateTotalUsedGB(profile);
          const limitGB = profile.monthlyLimitGB || 100;
          const pct = Math.min(100, Math.max(0, (usedGB / limitGB) * 100));

          return (
            <div
              key={profile.id}
              onClick={() => onSwitchProfile(profile.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '12px',
                background: isActive ? 'var(--brand-badge-bg)' : 'var(--glass-card)',
                border: `1px solid ${isActive ? 'var(--brand-color)' : 'var(--glass-border-light)'}`,
                boxShadow: isActive ? '0 0 14px rgba(14, 165, 233, 0.25)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                userSelect: 'none'
              }}
              title={`${profile.name} (${profile.selectedInterface || '전체'})`}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{
                  fontSize: '0.82rem',
                  fontWeight: isActive ? '700' : '500',
                  color: isActive ? 'var(--text-main)' : 'var(--text-muted)'
                }}>
                  {profile.name || `요금제 ${idx + 1}`}
                </span>
                <span style={{ fontSize: '0.68rem', color: isActive ? 'var(--accent-blue)' : 'var(--text-dim)' }}>
                  {usedGB.toFixed(1)} / {limitGB} GB ({pct.toFixed(0)}%)
                </span>
              </div>

              {/* Action buttons inside active tab */}
              {isActive && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginLeft: '6px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenCalibration();
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--brand-color)', cursor: 'pointer', padding: '2px' }}
                    title="이 요금제 정보 수정"
                  >
                    <Edit3 size={13} />
                  </button>

                  {profiles.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`'${profile.name}' 프로필을 삭제하시겠습니까?`)) {
                          onDeleteProfile(profile.id);
                        }
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', padding: '2px' }}
                      title="이 요금제 삭제"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Add Profile Button (Max 5) */}
        {profiles.length < 5 && (
          <button
            onClick={handleAdd}
            className="glass-btn"
            style={{
              padding: '6px 12px',
              fontSize: '0.78rem',
              borderRadius: '12px',
              borderStyle: 'dashed',
              color: 'var(--text-muted)',
              borderColor: 'var(--glass-border)'
            }}
            title="새 요금제/어댑터 프로필 추가 (최대 5개)"
          >
            <Plus size={14} color="var(--brand-color)" />
            <span>요금제 추가 ({profiles.length}/5)</span>
          </button>
        )}
      </div>
    </div>
  );
}
