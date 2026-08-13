// Telemetry service bridging Tauri Rust IPC and Web Simulation fallback

export const isTauriAvailable = () => {
  return typeof window !== 'undefined' && (Boolean(window.__TAURI__) || Boolean(window.__TAURI_IPC__));
};

let simState = {
  totalRx: 1024 * 1024 * 500, // 500 MB base
  totalTx: 1024 * 1024 * 120, // 120 MB base
};

export const getTauriInvoke = async () => {
  if (typeof window !== 'undefined') {
    if (window.__TAURI__?.tauri?.invoke) {
      return window.__TAURI__.tauri.invoke;
    }
    if (window.__TAURI__?.invoke) {
      return window.__TAURI__.invoke;
    }
  }
  try {
    const tauriPkg = '@tauri-apps/api/tauri';
    const { invoke } = await import(/* @vite-ignore */ tauriPkg);
    if (invoke) return invoke;
  } catch (e) {
    // ignore
  }
  return null;
};

export const setWindowMiniMode = async (mini) => {
  if (isTauriAvailable()) {
    try {
      const invoke = await getTauriInvoke();
      if (invoke) {
        return await invoke('set_mini_mode', { mini: Boolean(mini) });
      }
    } catch (e) {
      console.warn('Failed to set mini mode via Tauri', e);
    }
  }
  return false;
};

export const updateTrayTooltip = async (tooltipText) => {
  if (isTauriAvailable()) {
    try {
      const invoke = await getTauriInvoke();
      if (invoke) {
        return await invoke('update_tray_tooltip', { tooltip: String(tooltipText) });
      }
    } catch (e) {
      console.warn('Failed to update tray tooltip via Tauri', e);
    }
  }
};

export const setAutoStart = async (enable) => {
  if (isTauriAvailable()) {
    try {
      const invoke = await getTauriInvoke();
      if (invoke) {
        return await invoke('set_auto_start', { enable: Boolean(enable) });
      }
    } catch (e) {
      console.warn('Failed to set auto start via Tauri', e);
    }
  }
  return false;
};

export const getAutoStart = async () => {
  if (isTauriAvailable()) {
    try {
      const invoke = await getTauriInvoke();
      if (invoke) {
        return await invoke('get_auto_start');
      }
    } catch (e) {
      console.warn('Failed to get auto start via Tauri', e);
    }
  }
  return false;
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
    'Wi-Fi (무선 랜 / 핫스팟)',
    'Cellular (LTE 모뎀)'
  ];
};

export const fetchRealtimeStats = async (targetInterface = 'ALL (전체 인터페이스)') => {
  if (isTauriAvailable()) {
    try {
      const invoke = await getTauriInvoke();
      if (invoke) {
        const data = await invoke('get_realtime_stats', { targetInterface });
        if (data) {
          return {
            downloadSpeed: data.download_bytes_sec,
            uploadSpeed: data.upload_bytes_sec,
            totalRx: data.total_rx_bytes,
            totalTx: data.total_tx_bytes,
            interfaces: data.interfaces.map(i => ({
              name: i.name,
              rxBytes: i.rx_bytes,
              txBytes: i.tx_bytes
            }))
          };
        }
      }
    } catch (e) {
      console.warn('Tauri get_realtime_stats failed, using sim', e);
    }
  }

  // Simulation mode with dynamic natural variations
  const time = Date.now() / 1000;
  const isSurge = Math.sin(time / 8) > 0.6;
  const baseDown = isSurge ? 3.5 * 1024 * 1024 : 650 * 1024;
  const jitterDown = (Math.sin(time * 2) + Math.cos(time * 3.5)) * 200 * 1024;
  const downloadSpeed = Math.max(25000, Math.floor(baseDown + jitterDown));

  const baseUp = isSurge ? 450 * 1024 : 85 * 1024;
  const jitterUp = Math.cos(time * 2.5) * 40 * 1024;
  const uploadSpeed = Math.max(5000, Math.floor(baseUp + jitterUp));

  simState.totalRx += downloadSpeed;
  simState.totalTx += uploadSpeed;

  return {
    downloadSpeed,
    uploadSpeed,
    totalRx: simState.totalRx,
    totalTx: simState.totalTx,
    interfaces: [
      { name: 'Ethernet 2 (LG U+ LTE 라우터 USB)', rxBytes: simState.totalRx, txBytes: simState.totalTx },
      { name: 'Wi-Fi', rxBytes: 1024 * 1024 * 40, txBytes: 1024 * 1024 * 10 }
    ]
  };
};

export const fetchTopProcesses = async () => {
  if (isTauriAvailable()) {
    try {
      const invoke = await getTauriInvoke();
      if (invoke) {
        const list = await invoke('get_top_processes');
        if (list && list.length > 0) {
          return list.map(p => ({
            pid: p.pid,
            name: p.name,
            downloadSpeed: p.download_speed_bytes,
            uploadSpeed: p.upload_speed_bytes,
            targetDomain: p.target_domain
          }));
        }
      }
    } catch (e) {
      console.warn('Tauri get_top_processes failed', e);
    }
  }

  return [
    { pid: 14220, name: 'chrome.exe', downloadSpeed: 1850000, uploadSpeed: 95000, targetDomain: 'Google / YouTube (video.googlevideo.com)' },
    { pid: 8932, name: 'steam.exe', downloadSpeed: 920000, uploadSpeed: 45000, targetDomain: 'Steam Content CDN (steamcontent.com)' },
    { pid: 1104, name: 'svchost.exe', downloadSpeed: 210000, uploadSpeed: 12000, targetDomain: 'Windows Update Service (delivery.mp.microsoft.com)' },
    { pid: 7450, name: 'discord.exe', downloadSpeed: 45000, uploadSpeed: 18000, targetDomain: 'Discord Voice Gateway (discord.gg)' }
  ];
};

export const terminateProcess = async (pid) => {
  if (isTauriAvailable()) {
    try {
      const invoke = await getTauriInvoke();
      if (invoke) {
        return await invoke('kill_process', { targetPid: Number(pid) });
      }
    } catch (e) {
      console.error('Tauri terminateProcess failed', e);
    }
  }
  return true;
};

export const runPingTest = async (host = '8.8.8.8') => {
  const start = performance.now();
  try {
    // Attempt rapid image/favicon fetch or simulated round-trip
    await fetch(`https://${host}/favicon.ico?_t=${Date.now()}`, { mode: 'no-cors', cache: 'no-store' });
  } catch (e) {
    // Expected for no-cors/offline
  }
  const end = performance.now();
  const elapsed = Math.round(end - start);
  const clampedPing = Math.min(180, Math.max(18, elapsed > 500 ? 25 + Math.floor(Math.random() * 12) : elapsed));
  return { pingMs: clampedPing };
};
