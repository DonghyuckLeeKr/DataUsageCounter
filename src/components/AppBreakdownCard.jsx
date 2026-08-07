import React, { useState } from 'react';
import { Cpu, Search, Info, AlertCircle } from 'lucide-react';
import { formatBytes } from '../utils/formatters';

const INITIAL_APPS = [
  { id: 'chrome', name: 'Google Chrome (웹 브라우저)', category: 'Browser', icon: '🌐', rx: 14.2 * 1024 * 1024 * 1024, tx: 1.1 * 1024 * 1024 * 1024 },
  { id: 'steam', name: 'Steam Client (게임 다운로드)', category: 'Gaming', icon: '🎮', rx: 18.5 * 1024 * 1024 * 1024, tx: 0.4 * 1024 * 1024 * 1024 },
  { id: 'youtube', name: 'YouTube / Media Player', category: 'Media', icon: '🎬', rx: 8.8 * 1024 * 1024 * 1024, tx: 0.2 * 1024 * 1024 * 1024 },
  { id: 'discord', name: 'Discord (음성 / 화상 통화)', category: 'Social', icon: '💬', rx: 1.4 * 1024 * 1024 * 1024, tx: 0.8 * 1024 * 1024 * 1024 },
  { id: 'winupdate', name: 'Windows Delivery Optimization', category: 'System', icon: '⚙️', rx: 4.2 * 1024 * 1024 * 1024, tx: 0.1 * 1024 * 1024 * 1024 },
  { id: 'zoom', name: 'Zoom Meetings (화상 회의)', category: 'Work', icon: '📹', rx: 2.1 * 1024 * 1024 * 1024, tx: 1.5 * 1024 * 1024 * 1024 },
];

export default function AppBreakdownCard({ sessionBytes }) {
  const [search, setSearch] = useState('');
  const [showInfo, setShowInfo] = useState(false);

  // Dynamically scale app usage based on total session bytes
  const factor = 1 + (sessionBytes / (1024 * 1024 * 1024 * 20));
  
  const appsWithUsage = INITIAL_APPS.map(app => ({
    ...app,
    totalBytes: (app.rx + app.tx) * factor
  }));

  const grandTotal = appsWithUsage.reduce((acc, a) => acc + a.totalBytes, 0);

  const filteredApps = appsWithUsage
    .filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.category.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.totalBytes - a.totalBytes);

  return (
    <div className="glass-card" style={{ padding: '24px', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cpu size={18} color="var(--accent-purple)" />
          <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-main)' }}>
            앱 / 프로세스별 데이터 사용 순위
          </h3>
          <span
            onClick={() => setShowInfo(!showInfo)}
            style={{
              fontSize: '0.7rem',
              padding: '2px 8px',
              borderRadius: '8px',
              background: 'rgba(234, 179, 8, 0.15)',
              border: '1px solid rgba(234, 179, 8, 0.3)',
              color: '#eab308',
              cursor: 'pointer',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="클릭하여 데이터 출처 확인"
          >
            <AlertCircle size={12} />
            <span>데모 예시 데이터</span>
          </span>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: '180px' }}>
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '9px' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="앱 검색..."
            className="glass-input"
            style={{ paddingLeft: '30px', padding: '5px 12px 5px 30px', fontSize: '0.8rem' }}
          />
        </div>
      </div>

      {/* Info Notice Box */}
      {showInfo && (
        <div style={{
          background: 'rgba(234, 179, 8, 0.1)',
          border: '1px solid rgba(234, 179, 8, 0.25)',
          borderRadius: '12px',
          padding: '10px 14px',
          marginBottom: '14px',
          fontSize: '0.78rem',
          color: 'var(--text-main)',
          lineHeight: '1.4'
        }}>
          <b>💡 안내 (앱별 데이터 트래킹 구조):</b><br />
          네트워크 어댑터 전체 사용량(업/다운로드 속도 및 80GB 카운터)은 <b>실제 OS 패킷 수치</b>를 실시간 측정합니다.<br />
          단, Windows에서 <code>Steam.exe</code>, <code>Chrome.exe</code>처럼 <b>프로세스 개별 소켓</b>을 분리하여 추적하려면 Windows ETW(Event Tracing) 커널 모듈 또는 관리자 권한 트래커가 필요하여, 현재 뷰에는 가공된 예시 시뮬레이션 비율이 보여집니다.
        </div>
      )}

      {/* App Table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
        {filteredApps.map((app) => {
          const sharePct = Math.min(100, Math.max(0, (app.totalBytes / grandTotal) * 100));
          return (
            <div
              key={app.id}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--glass-border-light)',
                borderRadius: '12px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '1.4rem' }}>{app.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {app.name}
                  </div>
                  {/* Share Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <div style={{ flex: 1, height: '5px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '10px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${sharePct}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, var(--accent-blue) 0%, var(--brand-color) 100%)',
                          borderRadius: '10px'
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', width: '38px' }}>
                      {sharePct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right', shrink: 0 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: '700' }}>
                  {formatBytes(app.totalBytes)}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  다운 {formatBytes(app.rx)} / 업 {formatBytes(app.tx)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
