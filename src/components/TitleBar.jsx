import React, { useState } from 'react';
import { Minus, Square, Copy, X } from 'lucide-react';
import { appWindow } from '@tauri-apps/api/window';

export default function TitleBar({ title = "돌핀 데이터 (Dolphin Data)" }) {
  const [isMaximized, setIsMaximized] = useState(false);

  const getAppWindow = async () => {
    if (typeof window !== 'undefined' && window.__TAURI__?.window?.appWindow) {
      return window.__TAURI__.window.appWindow;
    }
    return appWindow;
  };

  const handleMinimize = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    const appWindow = await getAppWindow();
    if (appWindow) {
      try {
        await appWindow.minimize();
      } catch (err) {
        console.error('Minimize failed', err);
      }
    }
  };

  const handleToggleMaximize = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    const appWindow = await getAppWindow();
    if (appWindow) {
      try {
        await appWindow.toggleMaximize();
        setIsMaximized(prev => !prev);
      } catch (err) {
        console.error('Maximize toggle failed', err);
      }
    }
  };

  const handleClose = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    const appWindow = await getAppWindow();
    if (appWindow) {
      try {
        // Hide to system tray instead of terminating
        await appWindow.hide();
      } catch (err) {
        console.error('Close failed', err);
      }
    }
  };

  return (
    <div
      data-tauri-drag-region
      style={{
        height: '38px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px 0 16px',
        userSelect: 'none',
        cursor: 'grab',
        background: 'transparent',
        borderBottom: '1px solid var(--glass-border-light)'
      }}
    >
      {/* Title / App Brand Name */}
      <div data-tauri-drag-region style={{ display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: 'none' }}>
        <img src="/icon.png" alt="Dolphin Logo" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
        <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)' }}>
          {title}
        </span>
      </div>

      {/* Right Fixed Window Controls (Isolated from drag region) */}
      <div
        data-tauri-drag-region="false"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          zIndex: 999999,
          pointerEvents: 'auto'
        }}
      >
        <button
          onClick={handleMinimize}
          onMouseDown={(e) => e.stopPropagation()}
          type="button"
          className="titlebar-btn"
          title="최소화"
        >
          <Minus size={14} />
        </button>

        <button
          onClick={handleToggleMaximize}
          onMouseDown={(e) => e.stopPropagation()}
          type="button"
          className="titlebar-btn"
          title={isMaximized ? "이전 크기로 복원" : "최대화"}
        >
          {isMaximized ? <Copy size={13} /> : <Square size={13} />}
        </button>

        <button
          onClick={handleClose}
          onMouseDown={(e) => e.stopPropagation()}
          type="button"
          className="titlebar-btn close-btn"
          title="트레이로 숨기기"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
