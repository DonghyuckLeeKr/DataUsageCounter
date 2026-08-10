import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, Globe, ArrowDown, HardDrive, XCircle } from 'lucide-react';
import { fetchActiveProcesses, terminateProcess } from '../services/networkTelemetry';
import { formatSpeed } from '../utils/formatters';

export default function AppBreakdownCard() {
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProcesses = async () => {
    try {
      const list = await fetchActiveProcesses();
      setProcesses(list);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProcesses();
    const interval = setInterval(loadProcesses, 2000); // Refresh process bandwidth every 2s
    return () => clearInterval(interval);
  }, []);

  const handleKill = async (pid, name) => {
    if (window.confirm(`정말로 트래픽 폭주 앱 '${name}' (PID: ${pid})을(를) 강제 종료하시겠습니까?`)) {
      const success = await terminateProcess(pid);
      if (success) {
        setProcesses(prev => prev.filter(p => p.pid !== pid));
      }
    }
  };

  const isRealData = processes.length > 0 && processes[0].isReal;

  return (
    <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      
      {/* Card Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)' }}>
              실시간 앱별 다운로드 출처 & 강제 차단
            </h3>
            
            {/* Real Process vs Demo Badge */}
            <span style={{
              fontSize: '0.7rem',
              fontWeight: '700',
              padding: '2px 8px',
              borderRadius: '12px',
              background: isRealData ? 'rgba(52, 211, 153, 0.15)' : 'rgba(251, 191, 36, 0.15)',
              color: isRealData ? 'var(--accent-emerald)' : 'var(--accent-amber)',
              border: `1px solid ${isRealData ? 'rgba(52, 211, 153, 0.3)' : 'rgba(251, 191, 36, 0.3)'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <CheckCircle2 size={11} />
              <span>{isRealData ? '⚡ 실시간 소켓 추적' : '데모 시뮬레이션'}</span>
            </span>
          </div>

          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            현재 인터넷을 다운로드 중인 내 PC의 프로세스 및 연결 도메인
          </p>
        </div>

        <button
          onClick={loadProcesses}
          style={{ background: 'none', border: 'none', color: 'var(--brand-color)', cursor: 'pointer', padding: '4px' }}
          title="트래픽 추적 새로고침"
        >
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
        </button>
      </div>

      {/* Process Network Traffic Table List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {processes.slice(0, 5).map((proc, index) => (
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
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', display: 'block' }}>
                  {proc.name} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>(PID: {proc.pid})</span>
                </span>
                
                {/* Target Domain / Destination Host */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                  <Globe size={11} color="var(--accent-blue)" />
                  <span style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {proc.targetDomain}
                  </span>
                </div>
              </div>
            </div>

            {/* Network Speed Indicators & Kill Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'right', flexShrink: 0 }}>
              <div>
                <span style={{ fontSize: '0.68rem', color: 'var(--accent-blue)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '2px', justifyContent: 'flex-end' }}>
                  <ArrowDown size={10} /> 수신 속도
                </span>
                <span style={{ fontSize: '0.92rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  {formatSpeed(proc.downloadSpeedBytes, 'MBs')}
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
                title="트래픽 폭주 프로세스 강제 종료"
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
