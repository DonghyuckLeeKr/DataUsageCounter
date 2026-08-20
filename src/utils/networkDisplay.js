const includesAny = (value, terms) => terms.some(term => value.includes(term));

export const getNetworkConnectionKind = (networkMetadata = {}) => {
  const adapterText = [
    networkMetadata.interfaceName,
    networkMetadata.interfaceDescription,
    networkMetadata.networkConnectionType
  ]
    .filter(value => typeof value === 'string')
    .join(' ')
    .toLowerCase();

  if (includesAny(adapterText, ['wi-fi', 'wifi', 'wireless', 'wlan', '802.11', '무선'])) {
    return 'wifi';
  }
  if (includesAny(adapterText, ['cellular', 'wwan', 'mobile broadband', 'lte', '4g', '5g', 'rndis', 'ndis', 'mbim'])) {
    return 'mobile-router';
  }
  if (includesAny(adapterText, ['ethernet', '802.3', '유선'])) {
    return 'ethernet';
  }
  return 'network';
};

export const getNetworkDisplayInfo = (networkMetadata = {}) => {
  const kind = getNetworkConnectionKind(networkMetadata);
  if (kind === 'wifi') {
    return {
      kind,
      label: 'Wi-Fi',
      trafficDescription: 'Wi-Fi 연결의 실시간 송수신량',
      pingTitle: 'Wi-Fi 지연시간 (Ping) 측정'
    };
  }
  if (kind === 'mobile-router') {
    return {
      kind,
      label: '모바일 라우터',
      trafficDescription: '모바일 라우터 연결의 실시간 송수신량',
      pingTitle: '모바일 라우터 지연시간 (Ping) 측정'
    };
  }
  if (kind === 'ethernet') {
    return {
      kind,
      label: '유선 네트워크',
      trafficDescription: '유선 네트워크의 실시간 송수신량',
      pingTitle: '유선 네트워크 지연시간 (Ping) 측정'
    };
  }
  return {
    kind,
    label: '네트워크',
    trafficDescription: '현재 네트워크의 실시간 송수신량',
    pingTitle: '네트워크 지연시간 (Ping) 측정'
  };
};
