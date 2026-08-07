import React, { useState, useEffect } from 'react';
import { X, Check, Settings, Download } from 'lucide-react';
import { fetchNetworkInterfaces } from '../services/networkTelemetry';

export default function SettingsModal({ config, onSave, onClose }) {
  const [interfaces, setInterfaces] = useState([]);
  const [selectedIf, setSelectedIf] = useState(config.selectedInterface || 'ALL (전체 인터페이스)');
  const [unitMode, setUnitMode] = useState(config.unitMode || 'MBs');

  useEffect(() => {
    fetchNetworkInterfaces().then(list => setInterfaces(list));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      selectedInterface: selectedIf,
      unitMode
    });
    onClose();
  };

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Date,Carrier,BaselineGB,TotalUsedGB,LimitGB\n"
      + `${new Date().toISOString()},${config.carrierName},${config.initialBaselineGB},${(config.initialBaselineGB + (config.sessionBytes/(1024*1024*1024))).toFixed(2)},${config.monthlyLimitGB}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `data_usage_log_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '28px', position: 'relative' }}>
        
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'var(--brand-badge-bg)',
            border: '1px solid var(--brand-badge-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--brand-color)'
          }}>
            <Settings size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-main)' }}>환경 설정 & 어댑터 지정</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              USB LTE 라우터 인터페이스 선택 및 속도를 설정합니다.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Network Interface Selection */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
              모니터링할 네트워크 어댑터 (인터페이스)
            </label>
            <select
              value={selectedIf}
              onChange={(e) => setSelectedIf(e.target.value)}
              className="glass-input"
              style={{ color: 'var(--text-main)' }}
            >
              {interfaces.map((name, idx) => (
                <option key={idx} value={name} style={{ background: 'var(--glass-bg)', color: 'var(--text-main)' }}>{name}</option>
              ))}
            </select>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              USB LTE 라우터로 연결된 RNDIS 또는 NDIS 어댑터를 선택하세요.
            </span>
          </div>

          {/* Unit Toggle */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
              속도 표기 단위
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setUnitMode('MBs')}
                className="glass-btn"
                style={{
                  justifyContent: 'center',
                  background: unitMode === 'MBs' ? 'var(--brand-badge-bg)' : undefined,
                  borderColor: unitMode === 'MBs' ? 'var(--brand-color)' : undefined,
                  color: unitMode === 'MBs' ? 'var(--brand-color)' : 'var(--text-main)',
                  fontWeight: unitMode === 'MBs' ? 700 : 500
                }}
              >
                MB/s (초당 메가바이트)
              </button>
              <button
                type="button"
                onClick={() => setUnitMode('Mbps')}
                className="glass-btn"
                style={{
                  justifyContent: 'center',
                  background: unitMode === 'Mbps' ? 'var(--brand-badge-bg)' : undefined,
                  borderColor: unitMode === 'Mbps' ? 'var(--brand-color)' : undefined,
                  color: unitMode === 'Mbps' ? 'var(--brand-color)' : 'var(--text-main)',
                  fontWeight: unitMode === 'Mbps' ? 700 : 500
                }}
              >
                Mbps (초당 메가비트)
              </button>
            </div>
          </div>

          {/* Export Data */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
              데이터 백업 및 리포트
            </label>
            <button
              type="button"
              onClick={handleExportCSV}
              className="glass-btn"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <Download size={16} />
              <span>현재 사용 기록 CSV 내보내기</span>
            </button>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', paddingTop: '16px', borderTop: '1px solid var(--glass-border)' }}>
            <button type="button" onClick={onClose} className="glass-btn">
              취소
            </button>
            <button type="submit" className="glass-btn glass-btn-primary">
              <Check size={16} />
              <span>설정 저장</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
