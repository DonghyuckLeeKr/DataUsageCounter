import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSupportMailto, SUPPORT_EMAIL } from '../src/utils/appMetadata.js';

test('support email is the configured public contact address', () => {
  assert.equal(SUPPORT_EMAIL, 'donghyucklee.kr@gmail.com');
});

test('support mail link includes the installed app version in the subject', () => {
  const mailto = buildSupportMailto('1.2.8');
  assert.match(mailto, /^mailto:donghyucklee\.kr@gmail\.com\?subject=/);
  assert.equal(decodeURIComponent(mailto.split('subject=')[1]), '[DolphinData v1.2.8] 문의');
});

test('unknown version does not leak a placeholder into the mail subject', () => {
  const mailto = buildSupportMailto('알 수 없음');
  assert.equal(decodeURIComponent(mailto.split('subject=')[1]), '[DolphinData] 문의');
});
