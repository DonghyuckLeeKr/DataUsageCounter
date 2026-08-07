import React, { useState } from 'react';
import { Wifi, Play, RefreshCw } from 'lucide-react';
import { runPingTest } from '../services/networkTelemetry';

export default function PingTestCard() {
  const [testing, setTesting] = useState(false);
  const [pingResult, setPingResult] = useState({ pingMs: 28, jitterMs: 3, status: '우수 (Excellent)' });

  const handleRunPing = async () => {
    setTesting(true);
    const results = [];
    for (let i = 0; i < 4; i++) {
      const res = await runPingTest('8.8.8.8');
      results.push(res.pingMs);
    }
    setTesting(false);

    const avgPing = Math.round(results.reduce((a, b) => a + b, 0) / results.length);
    const maxPing = Math.max(...results);
    const minPing = Math.min(...results);
    const jitter = maxPing - minPing;

    let status = '우수 (Excellent)';
    if (avgPing > 80) status = '지연 높음 (High Latency)';
    else if (avgPing > 50) status = '양호 (Good)';

    setPingResult({
      pingMs: avgPing,
      jitterMs: jitter,
      status
    });
  };

  return (
    <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Wifi size={16} color="var(--accent-emerald)" />
          LTE 라우터 지연시간 (Ping) 측정
        </h3>
        <button
          onClick={handleRunPing}
          disabled={testing}
          className="glass-btn"
          style={{ padding: '6px 12px', fontSize: '0.75rem' }}
        >
          {testing ? <RefreshCw size={14} className="spin" /> : <Play size={14} />}
          <span>{testing ? '측정 중...' : 'Ping 재측정'}</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', margin: 'auto 0' }}>
        <div style={{ background: 'var(--glass-card)', padding: '14px', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--glass-border-light)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>평균 Ping</span>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--accent-emerald)' }}>
            {pingResult.pingMs} <span style={{ fontSize: '0.8rem' }}>ms</span>
          </div>
        </div>

        <div style={{ background: 'var(--glass-card)', padding: '14px', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--glass-border-light)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Jitter (변동)</span>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--accent-blue)' }}>
            {pingResult.jitterMs} <span style={{ fontSize: '0.8rem' }}>ms</span>
          </div>
        </div>

        <div style={{ background: 'var(--glass-card)', padding: '14px', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--glass-border-light)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>네트워크 상태</span>
          <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', marginTop: '6px' }}>
            {pingResult.status}
          </div>
        </div>
      </div>
    </div>
  );
}
