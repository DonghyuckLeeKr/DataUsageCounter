import test from 'node:test';
import assert from 'node:assert/strict';
import { reconcileNetworkProfile } from '../src/services/networkProfileService.js';
import { normalizeConfig } from '../src/services/storageService.js';

const makeConfig = () => normalizeConfig({
  activeProfileId: 'profile-1',
  profiles: [{
    id: 'profile-1',
    name: '기존 수동 프로필',
    resetDay: 1,
    lastResetPeriod: '2026-08@day1'
  }]
});

const identity = (fingerprint, networkName = 'Phone Hotspot B') => ({
  connected: true,
  fingerprint,
  identityKind: 'gateway-mac',
  networkName,
  interfaceName: 'Wi-Fi',
  interfaceDescription: 'Wireless Adapter',
  connectionType: 'Native 802.11'
});

test('a first-seen network creates and activates a tagged profile', () => {
  const result = reconcileNetworkProfile(makeConfig(), identity('network-v1-b'));
  const created = result.config.profiles.at(-1);

  assert.equal(result.action, 'created');
  assert.equal(result.config.activeProfileId, created.id);
  assert.equal(created.networkFingerprint, 'network-v1-b');
  assert.equal(created.selectedInterface, 'Wi-Fi');
  assert.equal(created.needsRegistration, true);
});

test('a known network switches to its existing profile without duplication', () => {
  const first = reconcileNetworkProfile(makeConfig(), identity('network-v1-b'));
  const withOtherActive = { ...first.config, activeProfileId: 'profile-1' };
  const second = reconcileNetworkProfile(withOtherActive, identity('network-v1-b'));

  assert.equal(second.action, 'switched');
  assert.equal(second.config.profiles.length, 2);
  assert.equal(second.config.activeProfileId, first.profileId);
});

test('different hotspots receive isolated profiles', () => {
  const first = reconcileNetworkProfile(makeConfig(), identity('network-v1-b', 'Hotspot B'));
  const second = reconcileNetworkProfile(first.config, identity('network-v1-c', 'Hotspot C'));

  assert.equal(second.config.profiles.length, 3);
  assert.notEqual(first.profileId, second.profileId);
  assert.equal(second.config.profiles.at(-1).networkName, 'Hotspot C');
});

test('a disconnected snapshot never creates or switches a profile', () => {
  const config = makeConfig();
  const result = reconcileNetworkProfile(config, { connected: false, fingerprint: '' });

  assert.equal(result.action, 'none');
  assert.equal(result.config, config);
});
