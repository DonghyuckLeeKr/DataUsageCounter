import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  loadConfig,
  saveConfig,
  getActiveProfile,
  calculateTotalUsedGB,
  getTodayKey,
  getTodayUsedGB
} from './services/storageService';
import {
  fetchRealtimeStats,
  isTauriAvailable,
  fetchNetworkInterfaces,
  setWindowMiniMode,
  updateTrayTooltip
} from './services/networkTelemetry';
import { checkAndNotifyThresholds, checkAndNotifyDailySurge } from './services/notificationService';
import { formatSpeed } from './utils/formatters';
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
import DailyHistoryModal from './components/DailyHistoryModal';

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
  const [showDailyHistory, setShowDailyHistory] = useState(false);

  // useRef to always hold the latest config without re-creating intervals
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // Throttled save: persist to localStorage every 10 seconds for high-frequency telemetry
  const pendingSaveRef = useRef(false);

  // Periodic flush: save to localStorage every 10 seconds if there are pending changes
  useEffect(() => {
    const flushInterval = setInterval(() => {
      if (pendingSaveRef.current) {
        saveConfig(configRef.current);
        pendingSaveRef.current = false;
      }
    }, 10000);

    // Also save on unmount/page close
    const handleBeforeUnload = () => {
      saveConfig(configRef.current);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(flushInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Final flush
      saveConfig(configRef.current);
    };
  }, []);

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
              setConfig(prev => {
                const updated = { ...prev, miniMode: isMini };
                saveConfig(updated);
                return updated;
              });
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
  // Uses configRef to always read the latest state without re-creating the interval
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const latestConfig = configRef.current;
        const currentProfile = getActiveProfile(latestConfig);
        const stats = await fetchRealtimeStats(currentProfile.selectedInterface || 'ALL (전체 인터페이스)');
        if (stats) {
          setTelemetry(stats);

          // Update System Tray hover tooltip with real-time usage & speed
          const totalGB = calculateTotalUsedGB(currentProfile);
          const limitGB = currentProfile.monthlyLimitGB || 100;
          const pct = ((totalGB / limitGB) * 100).toFixed(1);
          const downStr = formatSpeed(stats.downloadSpeed || 0, latestConfig.unitMode);
          const upStr = formatSpeed(stats.uploadSpeed || 0, latestConfig.unitMode);
          const trayTooltipText = `돌핀 데이터 [${currentProfile.name || '메인 요금제'}]\n사용량: ${totalGB.toFixed(2)} / ${limitGB} GB (${pct}%)\n실시간: ↓ ${downStr} | ↑ ${upStr}`;
          updateTrayTooltip(trayTooltipText);

          // Accumulate bytes into the active profile's sessionBytes and dailyHistory
          const addedBytes = (stats.downloadSpeed || 0) + (stats.uploadSpeed || 0);
          if (addedBytes > 0) {
            setConfig(prev => {
              const activeId = prev.activeProfileId;
              let targetProfileName = '요금제';

              const updatedProfiles = (prev.profiles || []).map(p => {
                if (p.id === activeId) {
                  targetProfileName = p.name;
                  const updatedP = {
                    ...p,
                    sessionBytes: (p.sessionBytes || 0) + addedBytes
                  };
                  // Check threshold push notification for this profile
                  const profileTotalGB = calculateTotalUsedGB(updatedP);
                  checkAndNotifyThresholds(profileTotalGB, updatedP.monthlyLimitGB || 100, updatedP.name, updatedP.id);
                  return updatedP;
                }
                return p;
              });

              // Accumulate into dailyHistory
              const todayKey = getTodayKey();
              const updatedDaily = { ...(prev.dailyHistory || {}) };
              const addedGB = addedBytes / (1024 * 1024 * 1024);
              const prevTodayGB = parseFloat(updatedDaily[todayKey]) || 0;
              const newTodayGB = prevTodayGB + addedGB;
              updatedDaily[todayKey] = parseFloat(newTodayGB.toFixed(4));

              // Check daily surge limit notification
              if (prev.alerts?.dailySurge !== false) {
                checkAndNotifyDailySurge(newTodayGB, prev.dailySurgeLimitGB || 5, targetProfileName);
              }

              const updatedConfig = {
                ...prev,
                profiles: updatedProfiles,
                dailyHistory: updatedDaily
              };
              // Mark as pending save (will be flushed every 10s)
              pendingSaveRef.current = true;
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
  }, []); // Empty dependency array: interval created once, reads configRef for latest state

  // Saves config immediately for user-initiated actions (theme, settings, calibration)
  // Safely merges partial updates whether passed as an object or a function
  const handleUpdateConfig = useCallback((newPartial) => {
    setConfig(prev => {
      const partial = typeof newPartial === 'function' ? newPartial(prev) : newPartial;
      const updated = { ...prev, ...partial };
      saveConfig(updated); // Immediate save for explicit user actions
      return updated;
    });
  }, []);

  const handleAccumulateProcesses = useCallback((list) => {
    setConfig(prev => {
      const updatedCumul = { ...(prev.processCumulative || {}) };
      let changed = false;

      list.forEach(p => {
        const added = (p.downloadSpeed || 0) * 2;
        if (added > 0) {
          changed = true;
          const pPrev = updatedCumul[p.name] || { bytes: 0, domain: p.targetDomain, lastSeen: '' };
          updatedCumul[p.name] = {
            bytes: (pPrev.bytes || 0) + added,
            domain: p.targetDomain || pPrev.domain,
            lastSeen: new Date().toISOString()
          };
        }
      });

      if (!changed) return prev;
      const updated = { ...prev, processCumulative: updatedCumul };
      pendingSaveRef.current = true; // Throttled save for high-frequency process accumulation
      return updated;
    });
  }, []);

  const handleUpdateActiveProfile = useCallback((profilePartial) => {
    setConfig(prev => {
      const updatedProfiles = (prev.profiles || []).map(p => {
        if (p.id === prev.activeProfileId) {
          return { ...p, ...profilePartial };
        }
        return p;
      });
      const updated = { ...prev, profiles: updatedProfiles };
      saveConfig(updated); // Immediate save for explicit user calibration
      return updated;
    });
  }, []);

  const handleSwitchProfile = useCallback((profileId) => {
    setConfig(prev => {
      const updated = { ...prev, activeProfileId: profileId };
      saveConfig(updated);
      return updated;
    });
  }, []);

  const handleAddProfile = useCallback((newProfile) => {
    setConfig(prev => {
      if ((prev.profiles || []).length >= 5) return prev;
      const updatedProfiles = [...(prev.profiles || []), newProfile];
      const updated = { ...prev, profiles: updatedProfiles, activeProfileId: newProfile.id };
      saveConfig(updated);
      return updated;
    });
  }, []);

  const handleDeleteProfile = useCallback((profileId) => {
    setConfig(prev => {
      const remaining = (prev.profiles || []).filter(p => p.id !== profileId);
      if (remaining.length === 0) return prev;
      const nextActiveId = prev.activeProfileId === profileId ? remaining[0].id : prev.activeProfileId;
      const updated = { ...prev, profiles: remaining, activeProfileId: nextActiveId };
      saveConfig(updated);
      return updated;
    });
  }, []);

  const handleSelectTheme = useCallback((themeName) => {
    setConfig(prev => {
      const updated = { ...prev, theme: themeName };
      saveConfig(updated);
      return updated;
    });
  }, []);

  const handleToggleMiniGadget = useCallback(() => {
    setConfig(prev => {
      const updated = { ...prev, miniMode: !prev.miniMode };
      saveConfig(updated);
      return updated;
    });
  }, []);

  const handleOpenCalibrationFromMini = useCallback(() => {
    setConfig(prev => {
      const updated = { ...prev, miniMode: false };
      saveConfig(updated);
      return updated;
    });
    setShowCalibration(true);
  }, []);

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
          onOpenDailyHistory={() => setShowDailyHistory(true)}
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
              config={config}
              onAccumulateProcesses={handleAccumulateProcesses}
              onResetCumulative={() => handleUpdateConfig({ processCumulative: {} })}
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

      {showDailyHistory && (
        <DailyHistoryModal
          config={config}
          activeProfile={activeProfile}
          onClose={() => setShowDailyHistory(false)}
        />
      )}

      {showSettings && (
        <SettingsModal
          config={config}
          activeProfile={activeProfile}
          onSave={handleUpdateConfig}
          onSaveProfile={handleUpdateActiveProfile}
          onImportConfig={(newConfig) => {
            setConfig(newConfig);
            saveConfig(newConfig);
          }}
          onClose={() => setShowSettings(false)}
        />
      )}

    </div>
  );
}
