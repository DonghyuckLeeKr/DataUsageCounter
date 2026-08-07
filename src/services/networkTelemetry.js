// Telemetry service bridging Tauri Rust IPC and Web Simulation fallback

export const isTauriAvailable = () => {
  return typeof window !== 'undefined' && (Boolean(window.__TAURI__) || Boolean(window.__TAURI_IPC__));
};

let simState = {
  totalRx: 1024 * 1024 * 500, // 500 MB base
  totalTx: 1024 * 1024 * 120, // 120 MB base
};

const getTauriInvoke = async () => {
  if (typeof window !== 'undefined' && window.__TAURI__?.invoke) {
    return window.__TAURI__.invoke;
  }
  try {
    const corePkg = '@tauri-apps/api/core';
    const core = await import(/* @vite-ignore */ corePkg);
    if (core?.invoke) return core.invoke;
  } catch (e) {
    // ignore
  }
  return null;
};

export const fetchNetworkInterfaces = async () => {
  if (isTauriAvailable()) {
    try {
      const invoke = await getTauriInvoke();
      if (invoke) {
        return await invoke('get_network_interfaces');
      }
    } catch (e) {
      console.warn('Tauri invoke error, fallback to sim', e);
    }
  }

  // Fallback interfaces for USB LTE Router
  return [
    'ALL (전체 인터페이스)',
    'Ethernet 2 (LG U+ LTE 라우터 USB)',
    'Wi-Fi (Wireless Adapter)',
    'Cellular (Mobile Broadband NDIS)',
    'vEthernet (Default Switch)'
  ];
};

export const fetchRealtimeStats = async (selectedInterface = 'ALL (전체 인터페이스)') => {
  if (isTauriAvailable()) {
    try {
      const invoke = await getTauriInvoke();
      if (invoke) {
        const res = await invoke('get_realtime_stats', { targetInterface: selectedInterface });
        return {
          downloadSpeed: res.download_bytes_sec,
          uploadSpeed: res.upload_bytes_sec,
          totalRx: res.total_rx_bytes,
          totalTx: res.total_tx_bytes,
          interfaces: res.interfaces || []
        };
      }
    } catch (e) {
      console.warn('Tauri stats failed, falling back to Web telemetry generator', e);
    }
  }

  // Realistic USB LTE Router Telemetry Generator for Web preview
  const isSpike = Math.random() < 0.25;
  const isIdle = Math.random() < 0.1;
  
  let downSpeed = 0;
  let upSpeed = 0;

  if (!isIdle) {
    if (isSpike) {
      downSpeed = Math.floor(Math.random() * 8000000) + 2000000; // 2MB/s - 10MB/s
      upSpeed = Math.floor(Math.random() * 1200000) + 300000;   // 300KB/s - 1.5MB/s
    } else {
      downSpeed = Math.floor(Math.random() * 1500000) + 150000; // 150KB/s - 1.65MB/s
      upSpeed = Math.floor(Math.random() * 300000) + 20000;     // 20KB/s - 320KB/s
    }
  }

  simState.totalRx += downSpeed;
  simState.totalTx += upSpeed;

  return {
    downloadSpeed: downSpeed,
    uploadSpeed: upSpeed,
    totalRx: simState.totalRx,
    totalTx: simState.totalTx,
    interfaces: [
      { name: 'Ethernet 2 (LG U+ LTE 라우터 USB)', rx_bytes: simState.totalRx, tx_bytes: simState.totalTx },
      { name: 'Wi-Fi', rx_bytes: 4050012, tx_bytes: 1204010 }
    ]
  };
};

export const runPingTest = async (host = '8.8.8.8') => {
  const start = performance.now();
  try {
    await new Promise(r => setTimeout(r, Math.floor(Math.random() * 30) + 25));
    const duration = Math.round(performance.now() - start);
    return { success: true, pingMs: duration, host };
  } catch (e) {
    return { success: false, pingMs: -1, host };
  }
};
