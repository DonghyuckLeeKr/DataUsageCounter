// Persistent configuration, migrations, and billing-cycle rollover helpers.

const STORAGE_KEY = 'data_usage_counter_v1_config';
const BACKUP_KEY = 'data_usage_counter_v1_backup';
const BYTES_PER_GB = 1024 * 1024 * 1024;

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

export const getTodayKey = (date = new Date()) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const getBillingPeriod = (resetDay = 1, date = new Date()) => {
  const year = date.getFullYear();
  const monthIndex = date.getMonth();
  const day = date.getDate();
  const validResetDay = Math.min(31, Math.max(1, parseInt(resetDay, 10) || 1));
  const lastDayThisMonth = new Date(year, monthIndex + 1, 0).getDate();
  const effectiveResetDay = Math.min(validResetDay, lastDayThisMonth);

  let periodYear = year;
  let periodMonthIndex = monthIndex;
  if (day < effectiveResetDay) {
    periodMonthIndex -= 1;
    if (periodMonthIndex < 0) {
      periodMonthIndex = 11;
      periodYear -= 1;
    }
  }

  return `${periodYear}-${String(periodMonthIndex + 1).padStart(2, '0')}@day${validResetDay}`;
};

export const getCurrentPeriod = () => getBillingPeriod(1);

const createDefaultConfig = () => ({
  activeProfileId: 'profile-1',
  profiles: [{ ...DEFAULT_PROFILE, lastResetPeriod: getBillingPeriod(1) }],
  unitMode: 'MBs',
  theme: 'soft-dark',
  miniMode: false,
  autoStart: false,
  dailySurgeLimitGB: 5,
  dailyHistoryByProfile: {},
  alerts: {
    t80: true,
    t90: true,
    t95: true,
    dailySurge: true
  },
  lastUpdated: new Date().toISOString()
});

const normalizeProfile = (profile, index) => {
  const fallbackId = `profile-${index + 1}`;
  const resetDay = Math.min(31, Math.max(1, parseInt(profile?.resetDay, 10) || 1));
  return {
    ...DEFAULT_PROFILE,
    ...profile,
    id: typeof profile?.id === 'string' && profile.id.trim() ? profile.id : fallbackId,
    name: typeof profile?.name === 'string' && profile.name.trim() ? profile.name : `요금제 ${index + 1}`,
    carrierName: typeof profile?.carrierName === 'string' ? profile.carrierName : '',
    monthlyLimitGB: Math.max(1, Number(profile?.monthlyLimitGB) || 100),
    initialBaselineGB: Math.max(0, Number(profile?.initialBaselineGB) || 0),
    sessionBytes: Math.max(0, Math.round(Number(profile?.sessionBytes) || 0)),
    resetDay,
    lastResetPeriod: typeof profile?.lastResetPeriod === 'string' ? profile.lastResetPeriod : '',
    selectedInterface: typeof profile?.selectedInterface === 'string' && profile.selectedInterface
      ? profile.selectedInterface
      : DEFAULT_PROFILE.selectedInterface
  };
};

const normalizeDailyHistory = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const result = {};
  for (const [profileId, history] of Object.entries(value)) {
    if (!history || typeof history !== 'object' || Array.isArray(history)) continue;
    result[profileId] = {};
    for (const [dateKey, bytes] of Object.entries(history)) {
      const numericBytes = Number(bytes);
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateKey) && Number.isFinite(numericBytes) && numericBytes >= 0) {
        result[profileId][dateKey] = Math.round(numericBytes);
      }
    }
  }
  return result;
};

export const normalizeConfig = (input) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('설정 데이터는 JSON 객체여야 합니다.');
  }

  const defaults = createDefaultConfig();
  let profiles;
  if (Array.isArray(input.profiles) && input.profiles.length > 0) {
    profiles = input.profiles.slice(0, 5).map(normalizeProfile);
  } else if (input.monthlyLimitGB !== undefined || input.carrierName !== undefined) {
    profiles = [normalizeProfile({
      id: 'profile-1',
      name: input.carrierName || '메인 데이터 요금제',
      carrierName: input.carrierName || '모바일 데이터 요금제',
      monthlyLimitGB: input.monthlyLimitGB,
      initialBaselineGB: input.initialBaselineGB,
      sessionBytes: input.sessionBytes,
      resetDay: input.resetDay,
      selectedInterface: input.selectedInterface
    }, 0)];
  } else {
    throw new Error('유효한 요금제 프로필이 없습니다.');
  }

  const profileIds = new Set(profiles.map(profile => profile.id));
  const activeProfileId = profileIds.has(input.activeProfileId) ? input.activeProfileId : profiles[0].id;
  let dailyHistoryByProfile = normalizeDailyHistory(input.dailyHistoryByProfile);

  if (Object.keys(dailyHistoryByProfile).length === 0 && input.dailyHistory && typeof input.dailyHistory === 'object') {
    dailyHistoryByProfile = { [activeProfileId]: {} };
    for (const [dateKey, gb] of Object.entries(input.dailyHistory)) {
      const numericGB = Number(gb);
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateKey) && Number.isFinite(numericGB) && numericGB >= 0) {
        dailyHistoryByProfile[activeProfileId][dateKey] = Math.round(numericGB * BYTES_PER_GB);
      }
    }
  }

  return {
    ...defaults,
    ...input,
    activeProfileId,
    profiles,
    unitMode: input.unitMode === 'Mbps' ? 'Mbps' : 'MBs',
    theme: typeof input.theme === 'string' ? input.theme : defaults.theme,
    miniMode: Boolean(input.miniMode),
    autoStart: Boolean(input.autoStart),
    dailySurgeLimitGB: Math.max(0.5, Number(input.dailySurgeLimitGB) || 5),
    dailyHistoryByProfile,
    alerts: { ...defaults.alerts, ...(input.alerts || {}) },
    dailyHistory: undefined,
    processCumulative: undefined
  };
};

export const rolloverBillingCycles = (config, date = new Date()) => {
  let changed = false;
  const profiles = config.profiles.map(profile => {
    const expectedPeriod = getBillingPeriod(profile.resetDay, date);
    if (!profile.lastResetPeriod) {
      changed = true;
      return { ...profile, lastResetPeriod: expectedPeriod };
    }
    if (profile.lastResetPeriod !== expectedPeriod) {
      changed = true;
      return {
        ...profile,
        initialBaselineGB: 0,
        sessionBytes: 0,
        lastResetPeriod: expectedPeriod
      };
    }
    return profile;
  });
  return changed ? { ...config, profiles } : config;
};

export const loadConfig = () => {
  const loadRaw = (raw) => rolloverBillingCycles(normalizeConfig(JSON.parse(raw)));
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const config = loadRaw(raw);
      saveConfig(config);
      return config;
    }
  } catch (error) {
    console.error('Failed to load primary storage config', error);
  }

  try {
    const backupRaw = localStorage.getItem(BACKUP_KEY);
    if (backupRaw) {
      const config = loadRaw(backupRaw);
      saveConfig(config);
      return config;
    }
  } catch (error) {
    console.error('Failed to load backup storage config', error);
  }

  const initial = createDefaultConfig();
  saveConfig(initial);
  return initial;
};

export const saveConfig = (config) => {
  try {
    if (!config || !Array.isArray(config.profiles) || config.profiles.length === 0) {
      console.warn('Blocked attempt to save invalid config with missing profiles:', config);
      return null;
    }
    const updated = { ...config, lastUpdated: new Date().toISOString() };
    delete updated.dailyHistory;
    delete updated.processCumulative;
    const serialized = JSON.stringify(updated);
    localStorage.setItem(STORAGE_KEY, serialized);
    localStorage.setItem(BACKUP_KEY, serialized);
    return updated;
  } catch (error) {
    console.error('Failed to save storage config', error);
    return null;
  }
};

export const getActiveProfile = (config) => {
  if (!Array.isArray(config?.profiles) || config.profiles.length === 0) return DEFAULT_PROFILE;
  return config.profiles.find(profile => profile.id === config.activeProfileId) || config.profiles[0];
};

export const calculateTotalUsedGB = (profileOrConfig) => {
  if (!profileOrConfig) return 0;
  const profile = profileOrConfig.profiles ? getActiveProfile(profileOrConfig) : profileOrConfig;
  const baseline = Number(profile.initialBaselineGB) || 0;
  const sessionGB = (Number(profile.sessionBytes) || 0) / BYTES_PER_GB;
  return baseline + sessionGB;
};

export const getDailyHistoryGB = (config, profileId = config?.activeProfileId) => {
  const bytesHistory = config?.dailyHistoryByProfile?.[profileId] || {};
  return Object.fromEntries(Object.entries(bytesHistory).map(([dateKey, bytes]) => [dateKey, bytes / BYTES_PER_GB]));
};

export const addDailyUsageBytes = (config, profileId, dateKey, addedBytes) => {
  const safeAddedBytes = Math.max(0, Math.round(Number(addedBytes) || 0));
  if (!profileId || safeAddedBytes === 0) return config;
  const dailyHistoryByProfile = { ...(config.dailyHistoryByProfile || {}) };
  const profileHistory = { ...(dailyHistoryByProfile[profileId] || {}) };
  profileHistory[dateKey] = (Number(profileHistory[dateKey]) || 0) + safeAddedBytes;
  dailyHistoryByProfile[profileId] = profileHistory;
  return { ...config, dailyHistoryByProfile };
};

export const getTodayUsedGB = (config, profileId = config?.activeProfileId) => {
  const todayBytes = config?.dailyHistoryByProfile?.[profileId]?.[getTodayKey()] || 0;
  return todayBytes / BYTES_PER_GB;
};
