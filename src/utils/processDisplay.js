const numberOrZero = value => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
};

export const resolveProcessSortMode = (source, requestedMode) => {
  if (source === 'etw') {
    return requestedMode === 'session' ? 'session' : 'network';
  }
  return requestedMode === 'memory' ? 'memory' : 'cpu';
};

export const sortProcessesForDisplay = (processes, source, requestedMode) => {
  const mode = resolveProcessSortMode(source, requestedMode);
  const valueFor = process => {
    if (mode === 'session') {
      return numberOrZero(process.sessionDownloadBytes) + numberOrZero(process.sessionUploadBytes);
    }
    if (mode === 'network') {
      return numberOrZero(process.downloadBytesPerSec) + numberOrZero(process.uploadBytesPerSec);
    }
    if (mode === 'memory') return numberOrZero(process.memoryBytes);
    return numberOrZero(process.cpuPercent);
  };

  return [...(Array.isArray(processes) ? processes : [])]
    .sort((a, b) => valueFor(b) - valueFor(a));
};
