import React, { useCallback, useEffect, useState } from 'react';
import { Activity, CheckCircle2, Cpu, MemoryStick, RefreshCw, XCircle } from 'lucide-react';
import { fetchTopProcesses, terminateProcess } from '../services/networkTelemetry';
import { formatBytes } from '../utils/formatters';

export default function AppBreakdownCard() {
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortMode, setSortMode] = useState('cpu');

  const loadProcesses = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchTopProcesses();
      setProcesses(Array.isArray(list) ? list : []);
    } catch (error) {
      console.warn('Process load error', error);
      setProcesses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProcesses();
    const interval = setInterval(loadProcesses, 2000);
    return () => clearInterval(interval);
  }, [loadProcesses]);

  const handleKill = async (pid, name) => {
    if (!window.confirm(`프로세스 '${name}' (PID: ${pid})을(를) 강제 종료하시겠습니까? 저장하지 않은 작업이 사라질 수 있습니다.`)) return;
    const success = await terminateProcess(pid);
    if (success) setProcesses(prev => prev.filter(process => process.pid !== pid));
  };

  const sortedProcesses = [...processes].sort((a, b) => (
    sortMode === 'memory'
      ? b.memoryBytes - a.memoryBytes
      : b.cpuPercent - a.cpuPercent
  ));

  return (
    <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)' }}>
              활성 프로세스 리소스 & 종료
            </h3>
            <span style={{
              fontSize: '0.7rem', fontWeight: '700', padding: '2px 8px', borderRadius: '12px',
              background: 'rgba(52, 211, 153, 0.15)', color: 'var(--accent-emerald)',
              border: '1px solid rgba(52, 211, 153, 0.3)', display: 'flex', alignItems: 'center', gap: '4px'
            }}>
              <CheckCircle2 size={11} /> 실제 시스템 값
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            CPU와 메모리 사용량입니다. 프로세스별 네트워크 사용량으로 해석하지 않습니다.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button onClick={() => setSortMode('cpu')} className="glass-btn" style={{ padding: '4px 8px', fontSize: '0.72rem', color: sortMode === 'cpu' ? 'var(--brand-color)' : undefined }}>
            CPU순
          </button>
          <button onClick={() => setSortMode('memory')} className="glass-btn" style={{ padding: '4px 8px', fontSize: '0.72rem', color: sortMode === 'memory' ? 'var(--brand-color)' : undefined }}>
            메모리순
          </button>
          <button onClick={loadProcesses} className="glass-btn" style={{ padding: '4px 8px' }} title="프로세스 새로고침">
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {sortedProcesses.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          데스크톱 앱에서 실행하면 활성 프로세스 정보가 표시됩니다.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {sortedProcesses.slice(0, 6).map(process => (
            <div key={process.pid} style={{
              background: 'var(--glass-card)', border: '1px solid var(--glass-border-light)',
              borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '12px'
            }}>
              <Activity size={17} color="var(--accent-blue)" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {process.name}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>PID: {process.pid}</div>
              </div>
              <div style={{ textAlign: 'right', minWidth: '74px' }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px', fontSize: '0.68rem', color: 'var(--text-muted)' }}><Cpu size={11} /> CPU</span>
                <b style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{process.cpuPercent.toFixed(1)}%</b>
              </div>
              <div style={{ textAlign: 'right', minWidth: '86px' }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px', fontSize: '0.68rem', color: 'var(--text-muted)' }}><MemoryStick size={11} /> 메모리</span>
                <b style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{formatBytes(process.memoryBytes)}</b>
              </div>
              <button onClick={() => handleKill(process.pid, process.name)} style={{
                background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.3)',
                color: 'var(--accent-rose)', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.7rem', fontWeight: '700'
              }} title="이 프로세스 강제 종료">
                <XCircle size={12} /> 종료
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
