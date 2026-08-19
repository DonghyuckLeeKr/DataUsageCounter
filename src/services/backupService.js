import { normalizeConfig } from './storageService.js';

export const MAX_BACKUP_FILE_BYTES = 1024 * 1024;

const getUtf8ByteLength = (text) => new TextEncoder().encode(text).byteLength;

export const parseBackupConfig = (rawText) => {
  if (typeof rawText !== 'string') {
    throw new Error('백업 파일을 텍스트로 읽을 수 없습니다.');
  }
  if (getUtf8ByteLength(rawText) > MAX_BACKUP_FILE_BYTES) {
    throw new Error('백업 파일은 1MB 이하여야 합니다.');
  }

  const parsed = JSON.parse(rawText);
  const importedConfig = parsed
    && typeof parsed === 'object'
    && !Array.isArray(parsed)
    && Object.hasOwn(parsed, 'config')
    ? parsed.config
    : parsed;
  return normalizeConfig(importedConfig);
};
