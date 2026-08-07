import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import QuickStatsStrip from './components/QuickStatsStrip';
import QuotaRingCard from './components/QuotaRingCard';
import LiveSpeedCard from './components/LiveSpeedCard';
import TrafficTimeSeriesChart from './components/TrafficTimeSeriesChart';
import AppBreakdownCard from './components/AppBreakdownCard';
import PingTestCard from './components/PingTestCard';
import MiniGadget from './components/MiniGadget';
import AdBanner from './components/AdBanner';
import CalibrationModal from './components/CalibrationModal';
import SettingsModal from './components/SettingsModal';
import { loadConfig, saveConfig, calculateTotalUsedGB } from './services/storageService';
import { fetchRealtimeStats, isTauriAvailable } from './services/networkTelemetry';
import { checkAndNotifyThresholds } from './services/notificationService';

export default function App() {
  const [config, setConfig] = useState(loadConfig);
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
    const syncWindowMode = async () => {
      if (isTauriAvailable()) {
        try {
          const { appWindow, LogicalSize } = await import('@tauri-apps/api/window');
          if (config.miniMode) {
            await appWindow.setSize(new LogicalSize(350, 195));
            await appWindow.setAlwaysOnTop(true);
          } else {
            await appWindow.setSize(new LogicalSize(1120, 760));
            await appWindow.setAlwaysOnTop(false);
          }
        } catch (e) {
          console.warn('Failed to resize window via Tauri API', e);
        }
      }
    };
    syncWindowMode();
  }, [config.miniMode]);

  // Listen for Tauri IPC System Tray events ("toggle-mini")
  useEffect(() => {
    let unlisten = null;
    const listenTrayEvents = async () => {
      if (isTauriAvailable()) {
        try {
          const { listen } = await import('@tauri-apps/api/event');
          unlisten = await listen('toggle-mini', (event) => {
            const isMini = Boolean(event.payload);
            handleUpdateConfig({ miniMode: isMini });
          });
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
      const stats = await fetchRealtimeStats(config.selectedInterface);
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
          checkAndNotifyThresholds(totalGB, updated.monthlyLimitGB || 80, updated.carrierName);

          return updated;
        });
      }

      // Update rolling time-series graph (keep last 60 ticks)
      setHistoryData(prev => {
        const next = [...prev, { downloadSpeed: stats.downloadSpeed, uploadSpeed: stats.uploadSpeed, time: new Date() }];
        if (next.length > 60) next.shift();
        return next;
      });

    }, 1000);

    return () => clearInterval(interval);
  }, [config.selectedInterface]);

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

  // Render Always-on-top Mini Gadget View if miniMode is active
  if (config.miniMode) {
    return (
      <div style={{ padding: '0', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'transparent' }}>
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
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '16px' }}>
      
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
        gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
        gap: '20px',
        alignItems: 'start'
      }}>
        
        {/* Left Column: Data Quota & Rolling Traffic Graph */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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

      {/* Bottom Monetization Sponsor / Ad Banner */}
      <AdBanner config={config} />

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
