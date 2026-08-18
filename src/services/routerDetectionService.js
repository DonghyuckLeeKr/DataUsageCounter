// Detects reachable LTE-router gateway pages. Carrier/USIM details cannot be
// inferred reliably from a gateway IP, so this module never fabricates them.

import { open } from '@tauri-apps/api/shell';
import { isTauriAvailable } from './networkTelemetry';

const COMMON_ROUTER_IPS = [
  { ip: '192.168.8.1', name: 'Huawei / HiLink Router' },
  { ip: '192.168.0.1', name: 'ZTE / LTE Router' },
  { ip: '192.168.1.1', name: 'TP-Link / Netgear LTE' },
  { ip: '192.168.100.1', name: 'CDC-NCM Dongle' }
];

let cachedGatewayIp = null;

const probeRouter = async (router) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1200);
  try {
    await fetch(`http://${router.ip}/`, {
      signal: controller.signal,
      mode: 'no-cors',
      cache: 'no-store'
    });
    return router;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const detectLteRouterCarrier = async () => {
  const probes = await Promise.allSettled(COMMON_ROUTER_IPS.map(probeRouter));
  const detectedRouter = probes.find(result => result.status === 'fulfilled')?.value;

  if (!detectedRouter) {
    return {
      detected: false,
      message: '응답하는 LTE 라우터 게이트웨이를 찾지 못했습니다.'
    };
  }

  cachedGatewayIp = detectedRouter.ip;
  return {
    detected: true,
    gatewayIp: detectedRouter.ip,
    carrierName: '',
    deviceModel: detectedRouter.name,
    signalLevel: '확인 불가',
    networkType: '게이트웨이 응답 확인',
    message: '라우터 관리자 페이지 응답을 확인했습니다. 통신사와 USIM 정보는 직접 입력해 주세요.'
  };
};

export const openRouterAdminPage = async (customIp) => {
  const targetIp = customIp || cachedGatewayIp || '192.168.0.1';
  const targetUrl = targetIp.startsWith('http') ? targetIp : `http://${targetIp}/`;

  if (isTauriAvailable()) {
    await open(targetUrl);
    return;
  }

  if (typeof window !== 'undefined') {
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  }
};
