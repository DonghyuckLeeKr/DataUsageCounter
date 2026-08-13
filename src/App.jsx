import React, { useState, useEffect } from 'react';
import {
  loadConfig,
  saveConfig,
  getActiveProfile,
  calculateTotalUsedGB
} from './services/storageService';
import {
  fetchRealtimeStats,
  isTauriAvailable,
  fetchNetworkInterfaces,
  setWindowMiniMode
} from './services/networkTelemetry';
import { checkAndNotifyThresholds } from './services/notificationService';
import Header from './components/Header';
import ProfileTabBar from './components/ProfileTabBar';
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

  const activeProfile = getActiveProfile(config);

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
        const currentProfile = getActiveProfile(config);
        const stats = await fetchRealtimeStats(currentProfile.selectedInterface || 'ALL (전체 인터페이스)');
        if (stats) {
          setTelemetry(stats);

          // Accumulate bytes into the active profile's sessionBytes
          const addedBytes = (stats.downloadSpeed || 0) + (stats.uploadSpeed || 0);
          if (addedBytes > 0) {
            setConfig(prev => {
              const activeId = prev.activeProfileId;
              const updatedProfiles = (prev.profiles || []).map(p => {
                if (p.id === activeId) {
                  const updatedP = {
                    ...p,
                    sessionBytes: (p.sessionBytes || 0) + addedBytes
                  };
                  // Check threshold push notification for this profile
                  const totalGB = calculateTotalUsedGB(updatedP);
                  checkAndNotifyThresholds(totalGB, updatedP.monthlyLimitGB || 100, updatedP.name);
                  return updatedP;
                }
                return p;
              });

              const updatedConfig = { ...prev, profiles: updatedProfiles };
              saveConfig(updatedConfig);
              return updatedConfig;
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
  }, [config.activeProfileId, activeProfile.selectedInterface, activeProfile.monthlyLimitGB]);

  const handleUpdateConfig = (newPartial) => {
    const updated = { ...config, ...newPartial };
    setConfig(updated);
    saveConfig(updated);
  };

  const handleUpdateActiveProfile = (profilePartial) => {
    const updatedProfiles = (config.profiles || []).map(p => {
      if (p.id === config.activeProfileId) {
        return { ...p, ...profilePartial };
      }
      return p;
    });
    handleUpdateConfig({ profiles: updatedProfiles });
  };

  const handleSwitchProfile = (profileId) => {
    handleUpdateConfig({ activeProfileId: profileId });
  };

  const handleAddProfile = (newProfile) => {
    if ((config.profiles || []).length >= 5) return;
    const updatedProfiles = [...(config.profiles || []), newProfile];
    handleUpdateConfig({ profiles: updatedProfiles, activeProfileId: newProfile.id });
  };

  const handleDeleteProfile = (profileId) => {
    const remaining = (config.profiles || []).filter(p => p.id !== profileId);
    if (remaining.length === 0) return;
    const nextActiveId = config.activeProfileId === profileId ? remaining[0].id : config.activeProfileId;
    handleUpdateConfig({ profiles: remaining, activeProfileId: nextActiveId });
  };

  const handleSelectTheme = (themeName) => {
    handleUpdateConfig({ theme: themeName });
  };

  const handleToggleMiniGadget = () => {
    handleUpdateConfig({ miniMode: !config.miniMode });
  };

  const handleOpenCalibrationFromMini = () => {
    handleUpdateConfig({ miniMode: false });
    setShowCalibration(true);
  };

  // Render Always-on-top Mini Gadget View if miniMode is active
  if (config.miniMode) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: 'transparent', overflow: 'hidden', padding: 0, margin: 0 }}>
        <MiniGadget
          config={config}
          telemetry={telemetry}
          onExpand={handleToggleMiniGadget}
          onOpenCalibration={handleOpenCalibrationFromMini}
        />
      </div>
    );
  }

  // Render Main Full Dashboard View
  return (
    <div className="app-window-container">
      
      {/* Top Fixed TitleBar with Window Controls at Top Right */}
      <TitleBar title="돌핀 데이터 (Dolphin Data)" />

      {/* Scrollable Dashboard Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px' }}>
        
        {/* Top Header */}
        <Header
          config={config}
          activeProfile={activeProfile}
          onOpenCalibration={() => setShowCalibration(true)}
          onOpenSettings={() => setShowSettings(true)}
          onToggleMiniGadget={handleToggleMiniGadget}
          onSelectTheme={handleSelectTheme}
          telemetry={telemetry}
        />

        {/* Multi-Profile Tab Switcher Bar (Up to 5 profiles) */}
        <ProfileTabBar
          config={config}
          onSwitchProfile={handleSwitchProfile}
          onAddProfile={handleAddProfile}
          onDeleteProfile={handleDeleteProfile}
          onOpenCalibration={() => setShowCalibration(true)}
        />

        {/* Top Quick Stats Bar */}
        <QuickStatsStrip
          telemetry={telemetry}
          config={config}
          activeProfile={activeProfile}
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
              profile={activeProfile}
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
              sessionBytes={activeProfile.sessionBytes || 0}
            />
          </div>

        </div>

      </div>

      {/* Modals */}
      {showCalibration && (
        <CalibrationModal
          profile={activeProfile}
          onSave={handleUpdateActiveProfile}
          onClose={() => setShowCalibration(false)}
        />
      )}

      {showSettings && (
        <SettingsModal
          config={config}
          activeProfile={activeProfile}
          onSave={handleUpdateConfig}
          onSaveProfile={handleUpdateActiveProfile}
          onClose={() => setShowSettings(false)}
        />
      )}

    </div>
  );
}
