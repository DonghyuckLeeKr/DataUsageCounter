import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, Globe, ArrowDown, HardDrive, XCircle, RotateCcw } from 'lucide-react';
import { fetchTopProcesses, terminateProcess } from '../services/networkTelemetry';
import { formatSpeed, formatBytes } from '../utils/formatters';

export default function AppBreakdownCard({ config, onAccumulateProcesses, onResetCumulative }) {
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortMode, setSortMode] = useState('cumulative'); // 'cumulative' or 'speed'

  const processCumulative = config?.processCumulative || {};

  const loadProcesses = async () => {
    try {
      const list = await fetchTopProcesses();
      if (list && list.length > 0) {
        setProcesses(list);
        if (onAccumulateProcesses) {
          onAccumulateProcesses(list);
        }
      }
    } catch (e) {
      console.warn('Process load error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProcesses();
    const interval = setInterval(loadProcesses, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleKill = async (pid, name) => {
    if (window.confirm(`트래픽 발생 프로세스 '${name}' (PID: ${pid})을(를) 강제 종료하시겠습니까?`)) {
      const success = await terminateProcess(pid);
      if (success) {
        setProcesses(prev => prev.filter(p => p.pid !== pid));
      }
    }
  };

  const handleResetCumulative = () => {
    if (window.confirm('프로세스별 누적 데이터 사용량 기록을 초기화하시겠습니까?')) {
      if (onResetCumulative) {
        onResetCumulative();
      }
    }
  };

  // Combine live processes and cumulative history
  const combinedList = [...processes].map(proc => {
    const cumulBytes = processCumulative[proc.name]?.bytes || 0;
    return {
      ...proc,
      cumulBytes
    };
  });

  // Sort based on sortMode
  if (sortMode === 'cumulative') {
    combinedList.sort((a, b) => b.cumulBytes - a.cumulBytes);
  } else {
    combinedList.sort((a, b) => b.downloadSpeed - a.downloadSpeed);
  }

  return (
    <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      
      {/* Card Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)' }}>
              프로세스별 누적 데이터 & 킬 스위치
            </h3>
            
            <span style={{
              fontSize: '0.7rem',
              fontWeight: '700',
              padding: '2px 8px',
              borderRadius: '12px',
              background: 'rgba(52, 211, 153, 0.15)',
              color: 'var(--accent-emerald)',
              border: '1px solid rgba(52, 211, 153, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <CheckCircle2 size={11} />
              <span>실시간 감시</span>
            </span>
          </div>

          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            내 PC에서 데이터를 많이 소모하는 프로세스 실시간 추적 및 누적 합산
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Sort Mode Buttons */}
          <div style={{ display: 'flex', gap: '2px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '2px' }}>
            <button
              onClick={() => setSortMode('cumulative')}
              style={{
                background: sortMode === 'cumulative' ? 'var(--brand-badge-bg)' : 'transparent',
                border: 'none',
                color: sortMode === 'cumulative' ? 'var(--brand-color)' : 'var(--text-muted)',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                cursor: 'pointer',
                fontWeight: sortMode === 'cumulative' ? '700' : '400'
              }}
            >
              누적순
            </button>
            <button
              onClick={() => setSortMode('speed')}
              style={{
                background: sortMode === 'speed' ? 'var(--brand-badge-bg)' : 'transparent',
                border: 'none',
                color: sortMode === 'speed' ? 'var(--brand-color)' : 'var(--text-muted)',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                cursor: 'pointer',
                fontWeight: sortMode === 'speed' ? '700' : '400'
              }}
            >
              속도순
            </button>
          </div>

          {/* Reset Cumulative Button */}
          <button
            onClick={handleResetCumulative}
            className="glass-btn"
            style={{ padding: '4px 8px', fontSize: '0.72rem' }}
            title="프로세스 누적 사용량 초기화"
          >
            <RotateCcw size={12} />
          </button>

          {/* Refresh Button */}
          <button
            onClick={loadProcesses}
            style={{ background: 'none', border: 'none', color: 'var(--brand-color)', cursor: 'pointer', padding: '4px' }}
            title="프로세스 새로고침"
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Process Network Traffic Table List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {combinedList.slice(0, 5).map((proc, index) => (
          <div
            key={proc.pid || index}
            style={{
              background: 'var(--glass-card)',
              border: '1px solid var(--glass-border-light)',
              borderRadius: '10px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            {/* Process Icon & Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, overflow: 'hidden' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-blue)',
                flexShrink: 0
              }}>
                <HardDrive size={16} />
              </div>

              <div style={{ overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>
                    {proc.name}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    (PID: {proc.pid})
                  </span>
                </div>
                
                {/* Target Domain / Destination Host */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                  <Globe size={11} color="var(--accent-blue)" />
                  <span style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {proc.targetDomain}
                  </span>
                </div>
              </div>
            </div>

            {/* Cumulative & Speed Indicators */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', textAlign: 'right', flexShrink: 0 }}>
              <div>
                <span style={{ fontSize: '0.68rem', color: 'var(--accent-blue)', fontWeight: '700', display: 'block' }}>
                  누적 사용량
                </span>
                <span style={{ fontSize: '0.92rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  {formatBytes(proc.cumulBytes)}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '2px', justifyContent: 'flex-end' }}>
                  <ArrowDown size={10} color="var(--accent-blue)" /> 실시간
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>
                  {formatSpeed(proc.downloadSpeed, config?.unitMode || 'MBs')}
                </span>
              </div>

              {/* Terminate / Kill Process Button */}
              <button
                onClick={() => handleKill(proc.pid, proc.name)}
                style={{
                  background: 'rgba(244, 63, 94, 0.12)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  color: 'var(--accent-rose)',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
                title="이 프로세스 강제 종료"
              >
                <XCircle size={12} />
                <span>종료</span>
              </button>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
