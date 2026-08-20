import test from 'node:test';
import assert from 'node:assert/strict';
import { getNetworkConnectionKind, getNetworkDisplayInfo } from '../src/utils/networkDisplay.js';

test('Wi-Fi adapter metadata always produces Wi-Fi copy without an LTE router label', () => {
  const binding = {
    networkName: 'U+Net284B_5G',
    interfaceName: 'Wi-Fi',
    interfaceDescription: 'Intel(R) Wi-Fi 6 AX201',
    networkConnectionType: 'Native 802.11'
  };
  const display = getNetworkDisplayInfo(binding);

  assert.equal(getNetworkConnectionKind(binding), 'wifi');
  assert.equal(display.label, 'Wi-Fi');
  assert.equal(`${display.trafficDescription} ${display.pingTitle}`.includes('LTE 라우터'), false);
});

test('USB mobile adapters and Ethernet receive distinct copy', () => {
  assert.equal(getNetworkConnectionKind({ interfaceDescription: 'Remote NDIS Compatible Device' }), 'mobile-router');
  assert.equal(getNetworkConnectionKind({ interfaceName: 'Ethernet 2', networkConnectionType: '802.3' }), 'ethernet');
});

test('missing network metadata renders the neutral disconnected state', () => {
  assert.equal(getNetworkConnectionKind(null), 'network');
  assert.equal(getNetworkConnectionKind(undefined), 'network');
  assert.equal(getNetworkDisplayInfo(null).label, '네트워크');
});
