// Storage service for managing user preferences, calibration baseline, and monthly auto-reset

const STORAGE_KEY = 'data_usage_counter_v1_config';

const DEFAULT_CONFIG = {
  carrierName: '모바일 데이터 요금제',
  monthlyLimitGB: 100,  // Neutral default 100GB limit
  initialBaselineGB: 0, // Calibrated used GB from carrier portal
  sessionBytes: 0,      // Bytes measured by app telemetry since last calibration/reset
  resetDay: 1,          // 1st of every month
  lastResetPeriod: '',  // 'YYYY-MM'
  unitMode: 'MBs',      // 'MBs' or 'Mbps'
  selectedInterface: 'ALL (전체 인터페이스)',
  theme: 'soft-dark',   // Default: 'soft-dark' (Soft Dark Slate - easy on eyes)
  miniMode: false,      // Always-on-top Mini Gadget
  alerts: {
    t80: true,
    t90: true,
    t95: true,
  },
  lastUpdated: new Date().toISOString()
};

export const loadConfig = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = { ...DEFAULT_CONFIG, lastResetPeriod: getCurrentPeriod() };
      saveConfig(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    const merged = { ...DEFAULT_CONFIG, ...parsed };

    // Check if new month has started for auto-reset
    const currentPeriod = getCurrentPeriod();
    if (merged.lastResetPeriod !== currentPeriod) {
      console.log(`[Auto-Reset] New month detected (${currentPeriod}). Resetting usage.`);
      merged.initialBaselineGB = 0;
      merged.sessionBytes = 0;
      merged.lastResetPeriod = currentPeriod;
      saveConfig(merged);
    }

    return merged;
  } catch (e) {
    console.error('Failed to load storage config', e);
    return DEFAULT_CONFIG;
  }
};

export const saveConfig = (config) => {
  try {
    const updated = { ...config, lastUpdated: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save storage config', e);
  }
};

export const getCurrentPeriod = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const calculateTotalUsedGB = (config) => {
  const baseline = parseFloat(config.initialBaselineGB) || 0;
  const sessionGB = (config.sessionBytes || 0) / (1024 * 1024 * 1024);
  return baseline + sessionGB;
};
