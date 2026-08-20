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

const bindingFromIdentity = (identity, profileId, now) => ({
  fingerprint: safeText(identity.fingerprint),
  networkName: safeText(identity.networkName) || '알 수 없는 네트워크',
  identityKind: safeText(identity.identityKind),
  interfaceName: safeText(identity.interfaceName),
  interfaceDescription: safeText(identity.interfaceDescription),
  networkConnectionType: safeText(identity.connectionType),
  profileId,
  meteringMode: 'unclassified',
  lastSeenAt: now.toISOString()
});

export const getActiveNetworkBinding = (config) => {
  if (!config?.activeNetworkFingerprint || !Array.isArray(config.networkBindings)) return null;
  return config.networkBindings.find(binding => binding.fingerprint === config.activeNetworkFingerprint) || null;
};

export const updateNetworkBinding = (config, bindingPartial = {}) => {
  const fingerprint = safeText(bindingPartial.fingerprint) || config?.activeNetworkFingerprint;
  const bindings = Array.isArray(config?.networkBindings) ? config.networkBindings : [];
  const bindingIndex = bindings.findIndex(binding => binding.fingerprint === fingerprint);
  if (bindingIndex < 0) return config;

  const requestedMode = ['metered', 'unmetered', 'ignored', 'unclassified'].includes(bindingPartial.meteringMode)
    ? bindingPartial.meteringMode
    : 'unclassified';
  const requestedProfileId = (config.profiles || []).some(profile => profile.id === bindingPartial.profileId)
    ? bindingPartial.profileId
    : '';
  if (requestedMode === 'metered' && !requestedProfileId) return config;

  const previousBinding = bindings[bindingIndex];
  const profileId = requestedMode === 'metered'
    ? requestedProfileId
    : requestedMode === 'unclassified'
      ? previousBinding.profileId
      : '';
  const networkBindings = bindings.map((binding, index) => index === bindingIndex
    ? { ...binding, meteringMode: requestedMode, profileId }
    : binding);

  let profiles = config.profiles || [];
  let activeProfileId = profileId || config.activeProfileId;
  if (['unmetered', 'ignored'].includes(requestedMode) && profiles.length > 1) {
    const candidate = profiles.find(profile => profile.id === previousBinding.profileId);
    const usedByAnotherNetwork = networkBindings.some(binding => binding.fingerprint !== fingerprint
      && binding.profileId === previousBinding.profileId);
    const isUnusedAutomaticPlaceholder = candidate?.profileOrigin === 'auto-network'
      && candidate.needsRegistration
      && (Number(candidate.initialBaselineGB) || 0) === 0
      && (Number(candidate.sessionBytes) || 0) === 0
      && !usedByAnotherNetwork;
    if (isUnusedAutomaticPlaceholder) {
      profiles = profiles.filter(profile => profile.id !== candidate.id);
      if (activeProfileId === candidate.id) activeProfileId = profiles[0].id;
    }
  }

  return {
    ...config,
    profiles,
    networkBindings,
    activeProfileId
  };
};

export const reconcileNetworkProfile = (config, identity, now = new Date()) => {
  const fingerprint = safeText(identity?.fingerprint);
  if (!identity?.connected || !fingerprint || !Array.isArray(config?.profiles)) {
    return { config, action: 'none', profileId: config?.activeProfileId || '', fingerprint: '' };
  }

  const profiles = config.profiles;
  const bindings = Array.isArray(config.networkBindings) ? config.networkBindings : [];
  const existingIndex = bindings.findIndex(binding => binding.fingerprint === fingerprint);

  if (existingIndex >= 0) {
    const existing = bindings[existingIndex];
    const refreshed = {
      ...existing,
      networkName: safeText(identity.networkName) || existing.networkName,
      identityKind: safeText(identity.identityKind) || existing.identityKind,
      interfaceName: safeText(identity.interfaceName) || existing.interfaceName,
      interfaceDescription: safeText(identity.interfaceDescription) || existing.interfaceDescription,
      networkConnectionType: safeText(identity.connectionType) || existing.networkConnectionType,
      lastSeenAt: now.toISOString()
    };
    const profileId = profiles.some(profile => profile.id === refreshed.profileId)
      ? refreshed.profileId
      : config.activeProfileId;
    refreshed.profileId = profileId || '';
    const shouldSwitch = config.activeNetworkFingerprint !== fingerprint
      || (profileId && config.activeProfileId !== profileId);
    const metadataChanged = [
      'networkName',
      'identityKind',
      'interfaceName',
      'interfaceDescription',
      'networkConnectionType'
    ].some(key => refreshed[key] !== existing[key]);

    if (!shouldSwitch && !metadataChanged) {
      return { config, action: 'none', profileId, fingerprint };
    }

    const updatedBindings = bindings.map((binding, index) => index === existingIndex ? refreshed : binding);
    return {
      config: {
        ...config,
        networkBindings: updatedBindings,
        activeNetworkFingerprint: fingerprint,
        ...(profileId ? { activeProfileId: profileId } : {})
      },
      action: shouldSwitch ? 'switched' : 'updated',
      profileId,
      fingerprint
    };
  }

  let profileId = config.activeProfileId;
  let updatedProfiles = profiles;
  if (profiles.length < MAX_PROFILES) {
    profileId = createProfileId(fingerprint, profiles);
    const fallbackNumber = profiles.length + 1;
    const profileName = safeText(identity.networkName) || `새 네트워크 ${fallbackNumber}`;
    const newProfile = {
      ...DEFAULT_PROFILE,
      id: profileId,
      name: profileName,
      carrierName: '',
      lastResetPeriod: getBillingPeriod(1, now),
      icon: '📡',
      profileOrigin: 'auto-network',
      needsRegistration: true
    };
    updatedProfiles = [...profiles, newProfile];
  }

  const newBinding = bindingFromIdentity(identity, profileId, now);
  return {
    config: {
      ...config,
      profiles: updatedProfiles,
      networkBindings: [...bindings, newBinding],
      activeNetworkFingerprint: fingerprint,
      activeProfileId: profileId
    },
    action: 'created',
    profileId,
    fingerprint
  };
};
