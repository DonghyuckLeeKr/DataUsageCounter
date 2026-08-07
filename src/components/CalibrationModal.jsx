import React, { useState } from 'react';
import { X, Check, Edit3, HelpCircle, RefreshCw, Radio, Sparkles } from 'lucide-react';
import { detectLteRouterCarrier } from '../services/routerDetectionService';

export default function CalibrationModal({ config, onSave, onClose }) {
  const [carrierInput, setCarrierInput] = useState(config.carrierName || '모바일 데이터 요금제');
  const [baselineInput, setBaselineInput] = useState(
    config.initialBaselineGB !== undefined ? String(config.initialBaselineGB) : '0'
  );
  const [limitInput, setLimitInput] = useState(
    config.monthlyLimitGB !== undefined ? String(config.monthlyLimitGB) : '100'
  );
  const [resetDayInput, setResetDayInput] = useState(
    config.resetDay !== undefined ? String(config.resetDay) : '1'
  );
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const handleAutoDetect = async () => {
    setScanning(true);
    setScanResult(null);
    const result = await detectLteRouterCarrier();
    setScanning(false);

    if (result && result.detected) {
      setScanResult(result);
      setCarrierInput(result.carrierName.replace(' (USIM 감지완료)', '').replace(' (자동 감지됨)', ''));
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const parsedBaseline = parseFloat(baselineInput) || 0;
    const parsedLimit = parseFloat(limitInput) || 100;
    const parsedResetDay = parseInt(resetDayInput, 10) || 1;

    onSave({
      carrierName: carrierInput.trim() || '데이터 요금제',
      initialBaselineGB: Math.max(0, parsedBaseline),
      monthlyLimitGB: Math.max(1, parsedLimit),
      resetDay: Math.min(31, Math.max(1, parsedResetDay)),
      sessionBytes: 0
    });
    onClose();
  };

  const handleQuickZeroReset = () => {
    if (window.confirm('정말로 사용량을 0 GB로 완전히 초기화하시겠습니까?')) {
      setBaselineInput('0');
      onSave({
        initialBaselineGB: 0,
        sessionBytes: 0
      });
      onClose();
    }
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
      <div className="glass-panel" style={{ width: '100%', maxWidth: '540px', padding: '28px', position: 'relative' }}>
        
        {/* Close Button */}
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

        {/* Modal Header */}
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
            <Edit3 size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-main)' }}>통신사 사용량 보정 & USIM 감지</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              통신사 이름, 월간 한도, 현재 사용량을 직접 설정합니다.
            </p>
          </div>
        </div>

        {/* Scan Result Notification */}
        {scanResult && (
          <div style={{
            background: 'rgba(52, 211, 153, 0.1)',
            border: '1px solid rgba(52, 211, 153, 0.3)',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '16px',
            fontSize: '0.8rem',
            color: 'var(--text-main)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <Radio size={18} color="var(--accent-emerald)" />
            <div>
              <b>✨ LTE 라우터 USIM 자동 감지 성공!</b><br />
              게이트웨이: <code>{scanResult.gatewayIp}</code> | 신호: {scanResult.signalLevel}
            </div>
          </div>
        )}

        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Carrier Name Input with Auto-Detect Button */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)' }}>
                통신사 / 요금제 이름
              </label>

              <button
                type="button"
                onClick={handleAutoDetect}
                disabled={scanning}
                className="glass-btn"
                style={{
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  borderColor: 'var(--brand-color)',
                  color: 'var(--brand-color)'
                }}
              >
                {scanning ? <RefreshCw size={13} className="spin" /> : <Sparkles size={13} />}
                <span>{scanning ? '라우터 조회 중...' : 'USIM 자동 감지'}</span>
              </button>
            </div>

            <input
              type="text"
              value={carrierInput}
              onChange={(e) => setCarrierInput(e.target.value)}
              className="glass-input"
              placeholder="예: 데이터 함께쓰기, LTE/5G 무제한, 100GB 등"
              required
            />
          </div>

          {/* Baseline Input */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
              현재까지 사용한 데이터 수치 (GB 단위)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1000"
                value={baselineInput}
                onChange={(e) => setBaselineInput(e.target.value)}
                className="glass-input"
                placeholder="예: 34.5"
                required
              />
              <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-muted)' }}>GB</span>
            </div>
          </div>

          {/* Monthly Limit Input */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
              월간 데이터 총 한도 (GB)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="number"
                step="1"
                min="1"
                max="2000"
                value={limitInput}
                onChange={(e) => setLimitInput(e.target.value)}
                className="glass-input"
                placeholder="100"
                required
              />
              <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-muted)' }}>GB</span>
            </div>
          </div>

          {/* Reset Day Selector */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
              매월 자동 초기화(리셋) 일자
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="number"
                step="1"
                min="1"
                max="31"
                value={resetDayInput}
                onChange={(e) => setResetDayInput(e.target.value)}
                className="glass-input"
                placeholder="1"
                required
              />
              <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-muted)' }}>일</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              기본값: <b>매월 1일</b> 00:00시 자동 0 GB 초기화
            </span>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px', paddingTop: '16px', borderTop: '1px solid var(--glass-border)' }}>
            <button
              type="button"
              onClick={handleQuickZeroReset}
              style={{
                background: 'rgba(244, 63, 94, 0.12)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                color: 'var(--accent-rose)',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: '600'
              }}
            >
              <RefreshCw size={14} />
              <span>0 GB 초기화</span>
            </button>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={onClose} className="glass-btn">
                취소
              </button>
              <button type="submit" className="glass-btn glass-btn-primary">
                <Check size={16} />
                <span>보정 저장하기</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
