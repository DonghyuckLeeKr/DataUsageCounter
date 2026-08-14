// Storage service with multi-profile, accurate billing-cycle reset, and persistent calibration safeguards

const STORAGE_KEY = 'data_usage_counter_v1_config';
const BACKUP_KEY = 'data_usage_counter_v1_backup';

export const DEFAULT_PROFILE = {
  id: 'profile-1',
  name: '메인 데이터 요금제',
  carrierName: '모바일 데이터 요금제',
  monthlyLimitGB: 100,
  initialBaselineGB: 0,
  sessionBytes: 0,
  resetDay: 1,
  lastResetPeriod: '',
  selectedInterface: 'ALL (전체 인터페이스)',
  icon: '📱'
};

export const getTodayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Calculates the exact billing cycle period string considering the profile's resetDay (1-31).
 * E.g., if resetDay is 1 and today is 2026-08-14 -> '2026-08@day1'
 * E.g., if resetDay is 15 and today is 2026-08-14 -> '2026-07@day15'
 */
export const getBillingPeriod = (resetDay = 1) => {
  const d = new Date();
  const year = d.getFullYear();
  const month = d.getMonth() + 1; // 1-12
  const day = d.getDate(); // 1-31

  const validResetDay = Math.min(28, Math.max(1, parseInt(resetDay, 10) || 1));

  let periodYear = year;
  let periodMonth = month;

  if (day < validResetDay) {
    // Before this month's reset day -> current cycle started in previous month
    periodMonth = month - 1;
    if (periodMonth < 1) {
      periodMonth = 12;
      periodYear = year - 1;
    }
  }

  return `${periodYear}-${String(periodMonth).padStart(2, '0')}@day${validResetDay}`;
};

export const getCurrentPeriod = () => {
  return getBillingPeriod(1);
};

const DEFAULT_CONFIG = {
  activeProfileId: 'profile-1',
  profiles: [{ ...DEFAULT_PROFILE, lastResetPeriod: getBillingPeriod(1) }],
  unitMode: 'MBs',      // 'MBs' or 'Mbps'
  theme: 'soft-dark',   // 'soft-dark', 'midnight-black', 'nordic-light', 'neon-cyber'
  miniMode: false,
  autoStart: false,
  dailySurgeLimitGB: 5, // Daily limit in GB (surge alert trigger)
  dailyHistory: {},     // { '2026-08-14': 1.45 } in GB
  processCumulative: {}, // { 'chrome.exe': { bytes: 4200000000, domain: 'Google' } }
  alerts: {
    t80: true,
    t90: true,
    t95: true,
    dailySurge: true
  },
  lastUpdated: new Date().toISOString()
};

export const loadConfig = () => {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      raw = localStorage.getItem(BACKUP_KEY);
    }
    
    if (!raw) {
      const initial = { ...DEFAULT_CONFIG };
      initial.profiles[0].lastResetPeriod = getBillingPeriod(initial.profiles[0].resetDay);
      saveConfig(initial);
      return initial;
    }
    
    const parsed = JSON.parse(raw);
    let merged = { ...DEFAULT_CONFIG, ...parsed };

    // Migrate single-profile legacy structure to multi-profile array
    if (!Array.isArray(merged.profiles) || merged.profiles.length === 0) {
      merged.profiles = [{
        id: 'profile-1',
        name: parsed.carrierName || '메인 데이터 요금제',
        carrierName: parsed.carrierName || '모바일 데이터 요금제',
        monthlyLimitGB: parsed.monthlyLimitGB || 100,
        initialBaselineGB: parsed.initialBaselineGB || 0,
        sessionBytes: parsed.sessionBytes || 0,
        resetDay: parsed.resetDay || 1,
        lastResetPeriod: getBillingPeriod(parsed.resetDay || 1),
        selectedInterface: parsed.selectedInterface || 'ALL (전체 인터페이스)',
        icon: '📱'
      }];
      merged.activeProfileId = 'profile-1';
    }

    // Precise Billing Period Check per profile
    let hasReset = false;
    merged.profiles = merged.profiles.map(p => {
      const resetDay = p.resetDay || 1;
      const expectedPeriod = getBillingPeriod(resetDay);

      // If lastResetPeriod is missing/empty, initialize it without wiping user calibration data
      if (!p.lastResetPeriod) {
        hasReset = true;
        return {
          ...p,
          lastResetPeriod: expectedPeriod
        };
      }

      // If billing cycle has legitimately rolled over to the next month
      if (p.lastResetPeriod !== expectedPeriod) {
        hasReset = true;
        return {
          ...p,
          initialBaselineGB: 0,
          sessionBytes: 0,
          lastResetPeriod: expectedPeriod
        };
      }
      return p;
    });

    if (hasReset) {
      saveConfig(merged);
    }

    return merged;
  } catch (e) {
    console.error('Failed to load storage config, trying backup', e);
    try {
      const backupRaw = localStorage.getItem(BACKUP_KEY);
      if (backupRaw) {
        return JSON.parse(backupRaw);
      }
    } catch (backupErr) {
      console.error('Backup load failed', backupErr);
    }
    return DEFAULT_CONFIG;
  }
};

export const saveConfig = (config) => {
  try {
    const updated = { ...config, lastUpdated: new Date().toISOString() };
    const serialized = JSON.stringify(updated);
    localStorage.setItem(STORAGE_KEY, serialized);
    localStorage.setItem(BACKUP_KEY, serialized); // Dual redundancy
    return updated;
  } catch (e) {
    console.error('Failed to save storage config', e);
  }
};

export const getActiveProfile = (config) => {
  if (!config?.profiles || config.profiles.length === 0) {
    return DEFAULT_PROFILE;
  }
  const found = config.profiles.find(p => p.id === config.activeProfileId);
  return found || config.profiles[0] || DEFAULT_PROFILE;
};

export const calculateTotalUsedGB = (profileOrConfig) => {
  if (!profileOrConfig) return 0;
  const profile = profileOrConfig.profiles ? getActiveProfile(profileOrConfig) : profileOrConfig;
  const baseline = parseFloat(profile.initialBaselineGB) || 0;
  const sessionGB = (profile.sessionBytes || 0) / (1024 * 1024 * 1024);
  return baseline + sessionGB;
};

export const getTodayUsedGB = (config) => {
  const todayKey = getTodayKey();
  return config?.dailyHistory?.[todayKey] || 0;
};
