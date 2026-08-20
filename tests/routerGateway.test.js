import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRouterAdminUrl, isPrivateIpv4 } from '../src/utils/routerGateway.js';

test('router URL uses the active private gateway instead of a hardcoded address', () => {
  assert.equal(buildRouterAdminUrl('192.168.219.1'), 'http://192.168.219.1/');
  assert.equal(buildRouterAdminUrl('https://10.0.0.1'), 'https://10.0.0.1/');
});

test('router URL rejects public, credentialed, and non-HTTP destinations', () => {
  assert.equal(isPrivateIpv4('172.16.0.1'), true);
  assert.equal(isPrivateIpv4('8.8.8.8'), false);
  assert.throws(() => buildRouterAdminUrl('8.8.8.8'), /사설 네트워크/);
  assert.throws(() => buildRouterAdminUrl('http://admin:password@192.168.1.1'), /안전한 게이트웨이/);
  assert.throws(() => buildRouterAdminUrl('javascript:alert(1)'), /게이트웨이/);
});
