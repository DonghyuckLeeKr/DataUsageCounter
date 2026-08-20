import test from 'node:test';
import assert from 'node:assert/strict';
import { getActiveNetworkBinding, reconcileNetworkProfile, updateNetworkBinding } from '../src/services/networkProfileService.js';
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
  connectionType: 'Native 802.11',
  gatewayIp: '192.168.219.1'
});

test('a first-seen network creates and activates a tagged profile', () => {
  const result = reconcileNetworkProfile(makeConfig(), identity('network-v1-b'));
  const created = result.config.profiles.at(-1);
  const binding = getActiveNetworkBinding(result.config);

  assert.equal(result.action, 'created');
  assert.equal(result.config.activeProfileId, created.id);
  assert.equal(binding.fingerprint, 'network-v1-b');
  assert.equal(binding.interfaceName, 'Wi-Fi');
  assert.equal(binding.networkConnectionType, 'Native 802.11');
  assert.equal(binding.gatewayIp, '192.168.219.1');
  assert.equal(binding.meteringMode, 'unclassified');
  assert.equal(binding.profileId, created.id);
  assert.equal(created.needsRegistration, true);
  assert.equal(created.networkFingerprint, undefined);
});

test('a known network refreshes its persisted adapter connection type', () => {
  const first = reconcileNetworkProfile(makeConfig(), identity('network-v1-b'));
  const staleBindings = first.config.networkBindings.map(binding => ({ ...binding, networkConnectionType: '' }));
  const second = reconcileNetworkProfile({ ...first.config, networkBindings: staleBindings }, identity('network-v1-b'));

  assert.equal(second.action, 'updated');
  assert.equal(getActiveNetworkBinding(second.config).networkConnectionType, 'Native 802.11');
});

test('a known network switches to its existing profile without duplication', () => {
  const first = reconcileNetworkProfile(makeConfig(), identity('network-v1-b'));
  const withOtherActive = { ...first.config, activeProfileId: 'profile-1' };
  const second = reconcileNetworkProfile(withOtherActive, identity('network-v1-b'));

  assert.equal(second.action, 'switched');
  assert.equal(second.config.profiles.length, 2);
  assert.equal(second.config.activeProfileId, first.profileId);
});

test('the same known network remains unchanged and does not trigger new-network setup again', () => {
  const first = reconcileNetworkProfile(makeConfig(), identity('network-v1-b'));
  const second = reconcileNetworkProfile(first.config, identity('network-v1-b'));

  assert.equal(second.action, 'none');
  assert.equal(second.config, first.config);
});

test('classifying a new network as unmetered removes only its untouched automatic placeholder', () => {
  const first = reconcileNetworkProfile(makeConfig(), identity('network-v1-home', 'Home Wi-Fi'));
  const updated = updateNetworkBinding(first.config, {
    fingerprint: first.fingerprint,
    meteringMode: 'unmetered',
    profileId: ''
  });
  const binding = getActiveNetworkBinding(updated);

  assert.equal(binding.meteringMode, 'unmetered');
  assert.equal(binding.profileId, '');
  assert.equal(updated.profiles.length, 1);
  assert.equal(updated.profiles[0].id, 'profile-1');
});

test('different hotspots receive isolated profiles', () => {
  const first = reconcileNetworkProfile(makeConfig(), identity('network-v1-b', 'Hotspot B'));
  const second = reconcileNetworkProfile(first.config, identity('network-v1-c', 'Hotspot C'));

  assert.equal(second.config.profiles.length, 3);
  assert.equal(second.config.networkBindings.length, 2);
  assert.notEqual(first.profileId, second.profileId);
  assert.equal(getActiveNetworkBinding(second.config).networkName, 'Hotspot C');
});

test('a disconnected snapshot never creates or switches a profile', () => {
  const config = makeConfig();
  const result = reconcileNetworkProfile(config, { connected: false, fingerprint: '' });

  assert.equal(result.action, 'none');
  assert.equal(result.config, config);
});
