import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveProcessSortMode, sortProcessesForDisplay } from '../src/utils/processDisplay.js';

const processes = [
  {
    pid: 1,
    cpuPercent: 8,
    memoryBytes: 100,
    downloadBytesPerSec: 10,
    uploadBytesPerSec: 10,
    sessionDownloadBytes: 1000,
    sessionUploadBytes: 1000
  },
  {
    pid: 2,
    cpuPercent: 2,
    memoryBytes: 500,
    downloadBytesPerSec: 100,
    uploadBytesPerSec: 100,
    sessionDownloadBytes: 100,
    sessionUploadBytes: 100
  }
];

test('unavailable ETW automatically falls back to CPU sorting', () => {
  assert.equal(resolveProcessSortMode('unavailable', 'network'), 'cpu');
  assert.deepEqual(sortProcessesForDisplay(processes, 'unavailable', 'network').map(item => item.pid), [1, 2]);
});

test('fallback mode can prioritize memory instead', () => {
  assert.equal(resolveProcessSortMode('unavailable', 'memory'), 'memory');
  assert.deepEqual(sortProcessesForDisplay(processes, 'unavailable', 'memory').map(item => item.pid), [2, 1]);
});

test('ETW mode keeps actual network and session ordering', () => {
  assert.deepEqual(sortProcessesForDisplay(processes, 'etw', 'network').map(item => item.pid), [2, 1]);
  assert.deepEqual(sortProcessesForDisplay(processes, 'etw', 'session').map(item => item.pid), [1, 2]);
});
