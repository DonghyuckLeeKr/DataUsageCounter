import React from 'react';
import { Minus, Square, X } from 'lucide-react';
import { isTauriAvailable } from '../services/networkTelemetry';

export default function TitleBar({ title = "Data Usage Counter" }) {
  const handleMinimize = async (e) => {
    e.stopPropagation();
    if (isTauriAvailable()) {
      try {
        const { appWindow } = await import('@tauri-apps/api/window');
        await appWindow.minimize();
      } catch (err) {
        console.error('Minimize failed', err);
      }
    }
  };

  const handleMaximize = async (e) => {
    e.stopPropagation();
    if (isTauriAvailable()) {
      try {
        const { appWindow } = await import('@tauri-apps/api/window');
        await appWindow.toggleMaximize();
      } catch (err) {
        console.error('Maximize failed', err);
      }
    }
  };

  const handleClose = async (e) => {
    e.stopPropagation();
    if (isTauriAvailable()) {
      try {
        const { appWindow } = await import('@tauri-apps/api/window');
        await appWindow.hide(); // Hide to system tray
      } catch (err) {
        console.error('Close to tray failed', err);
      }
    }
  };

  return (
    <div
      data-tauri-drag-region
      style={{
        width: '100%',
        height: '36px',
        background: 'rgba(0, 0, 0, 0.25)',
        borderBottom: '1px solid var(--glass-border-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: '16px',
        paddingRight: '4px',
        userSelect: 'none',
        cursor: 'grab',
        zIndex: 9999
      }}
    >
      {/* Title Label (Draggable) */}
      <span data-tauri-drag-region style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>
        {title}
      </span>

      {/* Top Right Window Control Buttons (Non-draggable so clicks fire onClick!) */}
      <div
        data-tauri-drag-region="false"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          height: '100%'
        }}
      >
        {/* Minimize Button */}
        <button
          onClick={handleMinimize}
          type="button"
          style={{
            width: '42px',
            height: '28px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s'
          }}
          className="titlebar-btn"
          title="트레이로 최소화"
        >
          <Minus size={14} />
        </button>

        {/* Maximize Button */}
        <button
          onClick={handleMaximize}
          type="button"
          style={{
            width: '42px',
            height: '28px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s'
          }}
          className="titlebar-btn"
          title="창 최대화 / 복원"
        >
          <Square size={12} />
        </button>

        {/* Close Button */}
        <button
          onClick={handleClose}
          type="button"
          style={{
            width: '42px',
            height: '28px',
            background: 'transparent',
            border: 'none',
            color: '#f43f5e',
            cursor: 'pointer',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s'
          }}
          className="titlebar-btn-close"
          title="트레이로 숨기기"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
