import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DEFAULT_KOREAN_UPDATE_NOTES, getKoreanUpdateNotes } from '../src/utils/updatePresentation.js';

test('Korean release notes are shown as provided', () => {
  assert.equal(getKoreanUpdateNotes('한글 업데이트 안내를 개선했습니다.'), '한글 업데이트 안내를 개선했습니다.');
});

test('missing or English release notes use a Korean fallback', () => {
  assert.equal(getKoreanUpdateNotes('Windows installer and signed bundle.'), DEFAULT_KOREAN_UPDATE_NOTES);
  assert.equal(getKoreanUpdateNotes(''), DEFAULT_KOREAN_UPDATE_NOTES);
});

test('Tauri default updater dialog is disabled in favor of the in-app dialog', () => {
  const config = JSON.parse(readFileSync('src-tauri/tauri.conf.json', 'utf8'));
  assert.equal(config.tauri.updater.dialog, false);
});
