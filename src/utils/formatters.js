// Utility functions for formatting bytes, speeds, dates, and budget calculations

export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0 || isNaN(bytes) || bytes === null) return '0.00 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export const bytesToGB = (bytes) => {
  if (!bytes) return 0;
  return bytes / (1024 * 1024 * 1024);
};

export const gbToBytes = (gb) => {
  if (!gb) return 0;
  return gb * 1024 * 1024 * 1024;
};

export const formatSpeed = (bytesPerSec, unitMode = 'MBs') => {
  if (!bytesPerSec || bytesPerSec <= 0) {
    return unitMode === 'Mbps' ? '0.00 Mbps' : '0.00 MB/s';
  }

  if (unitMode === 'Mbps') {
    const bitsPerSec = bytesPerSec * 8;
    const mbps = bitsPerSec / 1000000;
    if (mbps >= 1000) {
      return `${(mbps / 1000).toFixed(2)} Gbps`;
    }
    return `${mbps.toFixed(2)} Mbps`;
  } else {
    const mbs = bytesPerSec / (1024 * 1024);
    if (mbs < 0.01) {
      const kbs = bytesPerSec / 1024;
      return `${kbs.toFixed(1)} KB/s`;
    }
    return `${mbs.toFixed(2)} MB/s`;
  }
};

export const getDaysRemainingInMonth = (resetDay = 1) => {
  const now = new Date();
  const currentDay = now.getDate();
  const year = now.getFullYear();
  const month = now.getMonth();

  // Last day of current month
  const lastDayOfCurrentMonth = new Date(year, month + 1, 0).getDate();

  if (resetDay === 1) {
    return Math.max(1, lastDayOfCurrentMonth - currentDay + 1);
  } else {
    // Custom reset day logic
    if (currentDay < resetDay) {
      return resetDay - currentDay;
    } else {
      const daysInNextMonth = new Date(year, month + 2, 0).getDate();
      return (lastDayOfCurrentMonth - currentDay) + resetDay;
    }
  }
};

export const calculateDailyBudget = (remainingGB, resetDay = 1) => {
  const days = getDaysRemainingInMonth(resetDay);
  if (remainingGB <= 0) return 0;
  return remainingGB / days;
};

export const formatDate = (dateObj = new Date()) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const mins = String(dateObj.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${mins}`;
};
