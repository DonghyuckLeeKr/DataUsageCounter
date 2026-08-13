import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Settings, Download, Upload, FileText, Calendar, Power, AlertTriangle } from 'lucide-react';
import { fetchNetworkInterfaces, setAutoStart, getAutoStart } from '../services/networkTelemetry';

export default function SettingsModal({
  config,
  activeProfile,
  onSave,
  onSaveProfile,
  onImportConfig,
  onOpenDailyHistory,
  onClose
}) {
  const [interfaces, setInterfaces] = useState([]);
  const [selectedIf, setSelectedIf] = useState(
    activeProfile?.selectedInterface || config.selectedInterface || 'ALL (전체 인터페이스)'
  );
  const [unitMode, setUnitMode] = useState(config.unitMode || 'MBs');
  const [autoStartEnabled, setAutoStartEnabled] = useState(Boolean(config.autoStart));
  const [dailySurgeLimit, setDailySurgeLimit] = useState(
    config.dailySurgeLimitGB !== undefined ? String(config.dailySurgeLimitGB) : '5'
  );
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchNetworkInterfaces().then(list => setInterfaces(list));
    getAutoStart().then(enabled => setAutoStartEnabled(enabled));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (onSaveProfile) {
      onSaveProfile({ selectedInterface: selectedIf });
    }
    
    // Apply auto-start in Windows registry
    await setAutoStart(autoStartEnabled);

    onSave({
      unitMode,
      autoStart: autoStartEnabled,
      dailySurgeLimitGB: Math.max(0.5, parseFloat(dailySurgeLimit) || 5)
    });
    onClose();
  };

  // Export CSV with UTF-8 BOM (\uFEFF) to fix Excel Korean character encoding
  const handleExportCSV = () => {
    const profiles = config.profiles || (activeProfile ? [activeProfile] : []);
    const now = new Date().toISOString();
    
    let csvString = "측정일시,프로필명,통신사,기본보정량(GB),실시간누적(GB),총사용량(GB),월간한도(GB),소진율(%),리셋일,연결어댑터\n";
    
    profiles.forEach(p => {
      const baseline = parseFloat(p.initialBaselineGB) || 0;
      const sessionGB = (p.sessionBytes || 0) / (1024 * 1024 * 1024);
      const totalGB = baseline + sessionGB;
      const limit = p.monthlyLimitGB || 100;
      const pct = ((totalGB / limit) * 100).toFixed(1);
      
      csvString += `"${now}","${p.name || ''}","${p.carrierName || ''}",${baseline.toFixed(2)},${sessionGB.toFixed(2)},${totalGB.toFixed(2)},${limit},${pct}%,"매월 ${p.resetDay || 1}일","${p.selectedInterface || '전체'}"\n`;
    });

    const blob = new Blob(["\uFEFF" + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `돌핀데이터_사용기록_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export Full JSON Configuration Backup
  const handleExportJSON = () => {
    const exportData = {
      version: "1.2.0",
      exportDate: new Date().toISOString(),
      config: config
    };
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dolphindata_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Import JSON Configuration Backup
  const handleImportJSON = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        const importedConfig = parsed.config || parsed;

        if (!importedConfig || (!importedConfig.profiles && !importedConfig.monthlyLimitGB)) {
          alert('올바른 돌핀 데이터 백업 파일이 아닙니다.');
          return;
        }

        if (onImportConfig) {
          onImportConfig(importedConfig);
        }
        alert('설정 및 프로필 데이터를 성공적으로 불러왔습니다.');
        onClose();
      } catch (err) {
        console.error('Failed to parse backup json', err);
        alert('설정 파일을 읽는 중 오류가 발생했습니다. 올바른 JSON 파일인지 확인하세요.');
      }
    };
    reader.readAsText(file);
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
      <div className="glass-panel" style={{ width: '100%', maxWidth: '530px', padding: '26px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
        
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
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
            <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main)' }}>환경 설정 & 데이터 백업</h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              자동 실행, 일일 한도 경고, 어댑터 및 백업/복원을 관리합니다.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Windows Auto-Start Toggle Switch */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            background: 'var(--glass-card)',
            border: '1px solid var(--glass-border-light)',
            borderRadius: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Power size={18} color="var(--brand-color)" />
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', display: 'block' }}>
                  윈도우 부팅 시 자동 실행
                </span>
                <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                  PC 시작 시 시스템 트레이에 백그라운드로 자동 실행됩니다.
                </span>
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={autoStartEnabled}
                onChange={(e) => setAutoStartEnabled(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--brand-color)', cursor: 'pointer' }}
              />
            </label>
          </div>

          {/* Daily Surge Limiter */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
              일일 데이터 폭주 방지 경고 한도 (GB)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="100"
                value={dailySurgeLimit}
                onChange={(e) => setDailySurgeLimit(e.target.value)}
                className="glass-input"
                style={{ width: '120px' }}
                required
              />
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)' }}>GB / 일</span>
            </div>
            <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              하루에 이 용량을 초과하여 소비할 경우 윈도우 푸시 알림으로 경고합니다.
            </span>
          </div>

          {/* Network Interface Selection */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
              '{activeProfile?.name || '현재 요금제'}'에 지정할 네트워크 어댑터
            </label>
            <select
              value={selectedIf}
              onChange={(e) => setSelectedIf(e.target.value)}
              className="glass-input"
              style={{ color: 'var(--text-main)', width: '100%' }}
            >
              {interfaces.map((name, idx) => (
                <option key={idx} value={name} style={{ background: 'var(--glass-bg)', color: 'var(--text-main)' }}>{name}</option>
              ))}
            </select>
            <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              스마트폰 핫스팟은 Wi-Fi, 휴대용 라우터는 RNDIS/NDIS/이더넷을 선택하세요.
            </span>
          </div>

          {/* Unit Toggle */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
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

          {/* Backup and Report Controls */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
              데이터 백업 및 리포트
            </label>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              {/* CSV Report Export */}
              <button
                type="button"
                onClick={handleExportCSV}
                className="glass-btn"
                style={{ justifyContent: 'center', fontSize: '0.78rem' }}
                title="엑셀에서 한글 깨짐 없이 열 수 있는 CSV 리포트를 내보냅니다."
              >
                <FileText size={14} color="var(--accent-emerald)" />
                <span>CSV 리포트</span>
              </button>

              {/* JSON Settings Export */}
              <button
                type="button"
                onClick={handleExportJSON}
                className="glass-btn"
                style={{ justifyContent: 'center', fontSize: '0.78rem' }}
                title="모든 요금제 프로필과 설정을 JSON 파일로 백업합니다."
              >
                <Download size={14} color="var(--accent-blue)" />
                <span>설정 내보내기</span>
              </button>
            </div>

            {/* JSON Settings Import */}
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportJSON}
                accept=".json"
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="glass-btn"
                style={{ width: '100%', justifyContent: 'center', fontSize: '0.78rem', borderColor: 'rgba(167, 139, 250, 0.3)', color: 'var(--accent-purple)' }}
                title="이전에 백업해 둔 설정(JSON) 파일을 불러와 복원합니다."
              >
                <Upload size={14} />
                <span>설정 파일(.json) 불러오기 및 복원</span>
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px', paddingTop: '14px', borderTop: '1px solid var(--glass-border)' }}>
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
