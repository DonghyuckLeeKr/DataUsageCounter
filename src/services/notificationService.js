// Notification service for desktop push notifications (Tauri & Web fallback)

import { isTauriAvailable } from './networkTelemetry';

let notifiedThresholds = {
  t80: false,
  t90: false,
  t95: false
};

let lastDailyNotifiedDate = '';

export const sendOSNotification = async (title, body) => {
  if (isTauriAvailable()) {
    try {
      const notifPkg = '@tauri-apps/api/notification';
      const { sendNotification, isPermissionGranted, requestPermission } = await import(/* @vite-ignore */ notifPkg);
      let permission = await isPermissionGranted();
      if (!permission) {
        permission = await requestPermission() === 'granted';
      }
      if (permission) {
        sendNotification({ title, body });
        return;
      }
    } catch (e) {
      console.warn('Tauri notification failed, fallback to Web API', e);
    }
  }

  // Web Browser Notification Fallback
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification(title, { body });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, { body });
        }
      });
    }
  }
};

export const checkAndNotifyDailySurge = (todayGB, dailyLimitGB, profileName) => {
  if (!dailyLimitGB || dailyLimitGB <= 0) return;
  const todayStr = new Date().toISOString().slice(0, 10);

  if (todayGB >= dailyLimitGB && lastDailyNotifiedDate !== todayStr) {
    lastDailyNotifiedDate = todayStr;
    sendOSNotification(
      `[일일 데이터 초과 경고] ${profileName || '요금제'}`,
      `오늘 하루 설정한 한도(${dailyLimitGB} GB)를 초과했습니다 (현재 ${todayGB.toFixed(2)} GB). 백그라운드 다운로드를 점검하세요.`
    );
  }
};

export const checkAndNotifyThresholds = (usedGB, limitGB, carrierName) => {
  if (!limitGB || limitGB <= 0) return;
  const percentage = (usedGB / limitGB) * 100;

  if (percentage >= 95 && !notifiedThresholds.t95) {
    notifiedThresholds.t95 = true;
    sendOSNotification(
      `[위험 95%] ${carrierName || '데이터 요금제'} 한도 긴급 초과`,
      `현재 ${usedGB.toFixed(1)} GB / ${limitGB} GB (${percentage.toFixed(1)}%) 사용 중입니다. 곧 차단되거나 추가 요금이 부과될 수 있습니다.`
    );
  } else if (percentage >= 90 && !notifiedThresholds.t90) {
    notifiedThresholds.t90 = true;
    sendOSNotification(
      `[경고 90%] ${carrierName || '데이터 요금제'} 사용량 위험`,
      `현재 ${usedGB.toFixed(1)} GB / ${limitGB} GB (${percentage.toFixed(1)}%) 사용했습니다. 데이터를 절약해 주세요.`
    );
  } else if (percentage >= 80 && !notifiedThresholds.t80) {
    notifiedThresholds.t80 = true;
    sendOSNotification(
      `[주의 80%] ${carrierName || '데이터 요금제'} 사용량 달성`,
      `현재 ${usedGB.toFixed(1)} GB / ${limitGB} GB (${percentage.toFixed(1)}%) 사용했습니다.`
    );
  }

  // Reset notification triggers if usage drops (e.g. after calibration/reset)
  if (percentage < 75) {
    notifiedThresholds.t80 = false;
    notifiedThresholds.t90 = false;
    notifiedThresholds.t95 = false;
  }
};
