import React from 'react';
import { Minus, Square, X } from 'lucide-react';

export default function TitleBar({ title = "Data Usage Counter" }) {
  const getAppWindow = async () => {
    if (typeof window !== 'undefined' && window.__TAURI__?.window?.appWindow) {
      return window.__TAURI__.window.appWindow;
    }
    try {
      const winPkg = '@tauri-apps/api/window';
      const { appWindow } = await import(/* @vite-ignore */ winPkg);
      if (appWindow) return appWindow;
    } catch (e) {
      console.warn('Failed to import Tauri appWindow', e);
    }
    return null;
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
    } else {
      console.log('[Browser Fallback] Minimize clicked');
    }
  };

  const handleMaximize = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    const appWindow = await getAppWindow();
    if (appWindow) {
      try {
        await appWindow.toggleMaximize();
      } catch (err) {
        console.error('Maximize failed', err);
      }
    } else {
      console.log('[Browser Fallback] Maximize clicked');
    }
  };

  const handleClose = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    const appWindow = await getAppWindow();
    if (appWindow) {
      try {
        await appWindow.hide(); // Hide to system tray
      } catch (err) {
        console.error('Close to tray failed', err);
      }
    } else {
      console.log('[Browser Fallback] Close clicked');
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

      {/* Top Right Window Control Buttons (Non-draggable container so clicks fire onClick!) */}
      <div
        data-tauri-drag-region="false"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          height: '100%',
          zIndex: 10000
        }}
      >
        {/* Minimize Button */}
        <button
          onClick={handleMinimize}
          onMouseDown={(e) => e.stopPropagation()}
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
          onMouseDown={(e) => e.stopPropagation()}
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
          onMouseDown={(e) => e.stopPropagation()}
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
