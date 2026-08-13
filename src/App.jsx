import React, { useState, useEffect } from 'react';
import { loadConfig, saveConfig, calculateTotalUsedGB } from './services/storageService';
import { fetchRealtimeStats, isTauriAvailable, fetchNetworkInterfaces, setWindowMiniMode } from './services/networkTelemetry';
import { checkAndNotifyThresholds } from './services/notificationService';
import Header from './components/Header';
import QuickStatsStrip from './components/QuickStatsStrip';
import QuotaRingCard from './components/QuotaRingCard';
import TrafficTimeSeriesChart from './components/TrafficTimeSeriesChart';
import LiveSpeedCard from './components/LiveSpeedCard';
import PingTestCard from './components/PingTestCard';
import AppBreakdownCard from './components/AppBreakdownCard';
import MiniGadget from './components/MiniGadget';
import TitleBar from './components/TitleBar';
import CalibrationModal from './components/CalibrationModal';
import SettingsModal from './components/SettingsModal';

export default function App() {
  const [config, setConfig] = useState(loadConfig());
  const [telemetry, setTelemetry] = useState({
    downloadSpeed: 0,
    uploadSpeed: 0,
    totalRx: 0,
    totalTx: 0,
    interfaces: []
  });
  const [historyData, setHistoryData] = useState([]);
  const [showCalibration, setShowCalibration] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Sync theme attribute to document root element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', config.theme || 'soft-dark');
  }, [config.theme]);

  // Adjust Tauri window size & always-on-top mode dynamically when switching miniMode
  useEffect(() => {
    setWindowMiniMode(config.miniMode);
  }, [config.miniMode]);

  // Listen for Tauri IPC System Tray events ("toggle-mini")
  useEffect(() => {
    let unlisten = null;
    const listenTrayEvents = async () => {
      if (isTauriAvailable()) {
        try {
          const eventPkg = '@tauri-apps/api/event';
          const { listen } = await import(/* @vite-ignore */ eventPkg);
          if (listen) {
            unlisten = await listen('toggle-mini', (event) => {
              const isMini = Boolean(event.payload);
              handleUpdateConfig({ miniMode: isMini });
            });
          }
        } catch (e) {
          console.warn(e);
        }
      }
    };
    listenTrayEvents();
    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  // Real-time telemetry tick (every 1 second)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const stats = await fetchRealtimeStats(config.selectedInterface);
        if (stats) {
          setTelemetry(stats);

          // Accumulate bytes into config sessionBytes
          const addedBytes = (stats.downloadSpeed || 0) + (stats.uploadSpeed || 0);
          if (addedBytes > 0) {
            setConfig(prev => {
              const updated = {
                ...prev,
                sessionBytes: (prev.sessionBytes || 0) + addedBytes
              };
              saveConfig(updated);
              
              // Check for threshold OS Push Notifications
              const totalGB = calculateTotalUsedGB(updated);
              checkAndNotifyThresholds(totalGB, updated.monthlyLimitGB || 100, updated.carrierName);

              return updated;
            });
          }

          // Update rolling time-series graph (keep last 60 ticks)
          setHistoryData(prev => {
            const next = [...prev, { downloadSpeed: stats.downloadSpeed, uploadSpeed: stats.uploadSpeed, time: new Date() }];
            if (next.length > 60) next.shift();
            return next;
          });
        }
      } catch (err) {
        console.error('Telemetry tick error in App.jsx', err);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [config.selectedInterface, config.monthlyLimitGB, config.carrierName]);

  const handleUpdateConfig = (newPartial) => {
    const updated = { ...config, ...newPartial };
    setConfig(updated);
    saveConfig(updated);
  };

  const handleSelectTheme = (themeName) => {
    handleUpdateConfig({ theme: themeName });
  };

  const handleToggleMiniGadget = () => {
    handleUpdateConfig({ miniMode: !config.miniMode });
  };

  // Render Always-on-top Mini Gadget View if miniMode is active (100% compact window, no blank margins)
  if (config.miniMode) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: 'transparent', overflow: 'hidden', padding: 0, margin: 0 }}>
        <MiniGadget
          config={config}
          telemetry={telemetry}
          onExpand={handleToggleMiniGadget}
          onOpenCalibration={() => setShowCalibration(true)}
        />
        {showCalibration && (
          <CalibrationModal
            config={config}
            onSave={handleUpdateConfig}
            onClose={() => setShowCalibration(false)}
          />
        )}
      </div>
    );
  }

  // Render Main Full Dashboard View
  return (
    <div className="app-window-container">
      
      {/* Top Fixed TitleBar with Window Controls at Top Right */}
      <TitleBar title="Data Usage Counter" />

      {/* Scrollable Dashboard Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        
        {/* Top Header */}
        <Header
          config={config}
          onOpenCalibration={() => setShowCalibration(true)}
          onOpenSettings={() => setShowSettings(true)}
          onToggleMiniGadget={handleToggleMiniGadget}
          onSelectTheme={handleSelectTheme}
          telemetry={telemetry}
        />

        {/* Top Quick Stats Bar */}
        <QuickStatsStrip
          telemetry={telemetry}
          config={config}
        />

        {/* 2-Column Responsive Dashboard Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
          gap: '18px',
          alignItems: 'start'
        }}>
          
          {/* Left Column: Data Quota & Rolling Traffic Graph */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <QuotaRingCard
              config={config}
              onOpenCalibration={() => setShowCalibration(true)}
            />
            <TrafficTimeSeriesChart
              historyData={historyData}
              unitMode={config.unitMode}
            />
          </div>

          {/* Right Column: Speed Meters, Latency Ping, App Usage */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <LiveSpeedCard
              telemetry={telemetry}
              unitMode={config.unitMode}
            />
            <PingTestCard />
            <AppBreakdownCard
              sessionBytes={config.sessionBytes || 0}
            />
          </div>

        </div>

      </div>

      {/* Modals */}
      {showCalibration && (
        <CalibrationModal
          config={config}
          onSave={handleUpdateConfig}
          onClose={() => setShowCalibration(false)}
        />
      )}

      {showSettings && (
        <SettingsModal
          config={config}
          onSave={handleUpdateConfig}
          onClose={() => setShowSettings(false)}
        />
      )}

    </div>
  );
}
