// Storage service with multi-profile (up to 5 plans) support and monthly auto-reset

const STORAGE_KEY = 'data_usage_counter_v1_config';

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

const DEFAULT_CONFIG = {
  activeProfileId: 'profile-1',
  profiles: [DEFAULT_PROFILE],
  unitMode: 'MBs',      // 'MBs' or 'Mbps'
  theme: 'soft-dark',   // 'soft-dark', 'midnight-black', 'nordic-light', 'neon-cyber'
  miniMode: false,
  alerts: {
    t80: true,
    t90: true,
    t95: true,
  },
  lastUpdated: new Date().toISOString()
};

export const getCurrentPeriod = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const loadConfig = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = { ...DEFAULT_CONFIG };
      initial.profiles[0].lastResetPeriod = getCurrentPeriod();
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
        lastResetPeriod: parsed.lastResetPeriod || getCurrentPeriod(),
        selectedInterface: parsed.selectedInterface || 'ALL (전체 인터페이스)',
        icon: '📱'
      }];
      merged.activeProfileId = 'profile-1';
    }

    // Auto-reset monthly check for all profiles
    const currentPeriod = getCurrentPeriod();
    let hasReset = false;
    merged.profiles = merged.profiles.map(p => {
      if (p.lastResetPeriod !== currentPeriod) {
        hasReset = true;
        return {
          ...p,
          initialBaselineGB: 0,
          sessionBytes: 0,
          lastResetPeriod: currentPeriod
        };
      }
      return p;
    });

    if (hasReset) {
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

export const getActiveProfile = (config) => {
  if (!config?.profiles || config.profiles.length === 0) {
    return DEFAULT_PROFILE;
  }
  const found = config.profiles.find(p => p.id === config.activeProfileId);
  return found || config.profiles[0] || DEFAULT_PROFILE;
};

export const calculateTotalUsedGB = (profileOrConfig) => {
  if (!profileOrConfig) return 0;
  // If passed root config, resolve active profile first
  const profile = profileOrConfig.profiles ? getActiveProfile(profileOrConfig) : profileOrConfig;
  const baseline = parseFloat(profile.initialBaselineGB) || 0;
  const sessionGB = (profile.sessionBytes || 0) / (1024 * 1024 * 1024);
  return baseline + sessionGB;
};
