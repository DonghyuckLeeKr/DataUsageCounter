import test from 'node:test';
import assert from 'node:assert/strict';
import { MAX_BACKUP_FILE_BYTES, parseBackupConfig } from '../src/services/backupService.js';

test('backup parser rejects JSON files larger than 1MB', () => {
  const oversized = JSON.stringify({ padding: '가'.repeat(MAX_BACKUP_FILE_BYTES) });
  assert.throws(() => parseBackupConfig(oversized), /1MB 이하/);
});

test('backup parser accepts the export envelope and applies the strict schema', () => {
  const config = parseBackupConfig(JSON.stringify({
    version: '1.2.0',
    config: {
      activeProfileId: 'profile-1',
      profiles: [{ id: 'profile-1', name: '복원 프로필', unexpected: true }],
      unexpected: true
    }
  }));

  assert.equal(config.profiles[0].name, '복원 프로필');
  assert.equal(config.profiles[0].unexpected, undefined);
  assert.equal(config.unexpected, undefined);
});
