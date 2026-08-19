import { DEFAULT_PROFILE, MAX_PROFILES, getBillingPeriod } from './storageService.js';

const safeText = (value) => typeof value === 'string' ? value.trim() : '';

const createProfileId = (fingerprint, profiles) => {
  const suffix = safeText(fingerprint).replace(/[^a-zA-Z0-9]/g, '').slice(-16) || Date.now().toString(36);
  const baseId = `network-${suffix}`;
  if (!profiles.some(profile => profile.id === baseId)) return baseId;

  let counter = 2;
  while (profiles.some(profile => profile.id === `${baseId}-${counter}`)) counter += 1;
  return `${baseId}-${counter}`;
};

export const reconcileNetworkProfile = (config, identity, now = new Date()) => {
  const fingerprint = safeText(identity?.fingerprint);
  if (!identity?.connected || !fingerprint || !Array.isArray(config?.profiles)) {
    return { config, action: 'none', profileId: config?.activeProfileId || '' };
  }

  const profiles = config.profiles;
  const existingIndex = profiles.findIndex(profile => profile.networkFingerprint === fingerprint);
  const interfaceName = safeText(identity.interfaceName);
  const networkName = safeText(identity.networkName);

  if (existingIndex >= 0) {
    const existing = profiles[existingIndex];
    const interfaceChanged = interfaceName && existing.selectedInterface !== interfaceName;
    const nameChanged = networkName && existing.networkName !== networkName;
    const shouldSwitch = config.activeProfileId !== existing.id;

    if (!interfaceChanged && !nameChanged && !shouldSwitch) {
      return { config, action: 'none', profileId: existing.id };
    }

    const updatedProfiles = profiles.map((profile, index) => index === existingIndex
      ? {
          ...profile,
          ...(interfaceChanged ? { selectedInterface: interfaceName } : {}),
          ...(nameChanged ? { networkName } : {})
        }
      : profile);

    return {
      config: { ...config, profiles: updatedProfiles, activeProfileId: existing.id },
      action: shouldSwitch ? 'switched' : 'updated',
      profileId: existing.id
    };
  }

  if (profiles.length >= MAX_PROFILES) {
    return { config, action: 'limit-reached', profileId: config.activeProfileId };
  }

  const fallbackNumber = profiles.length + 1;
  const profileId = createProfileId(fingerprint, profiles);
  const profileName = networkName || `새 네트워크 ${fallbackNumber}`;
  const newProfile = {
    ...DEFAULT_PROFILE,
    id: profileId,
    name: profileName,
    carrierName: '',
    monthlyLimitGB: 100,
    initialBaselineGB: 0,
    sessionBytes: 0,
    resetDay: 1,
    lastResetPeriod: getBillingPeriod(1, now),
    selectedInterface: interfaceName || DEFAULT_PROFILE.selectedInterface,
    icon: '📡',
    networkFingerprint: fingerprint,
    networkName: profileName,
    networkIdentityKind: safeText(identity.identityKind),
    interfaceDescription: safeText(identity.interfaceDescription),
    profileOrigin: 'auto-network',
    needsRegistration: true
  };

  return {
    config: {
      ...config,
      profiles: [...profiles, newProfile],
      activeProfileId: profileId
    },
    action: 'created',
    profileId
  };
};
