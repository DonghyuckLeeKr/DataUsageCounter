import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('release workflow builds the frontend before compiling Tauri tests', () => {
  const workflow = readFileSync('.github/workflows/release-windows.yml', 'utf8');
  const frontendBuild = workflow.indexOf('- name: Build frontend for Tauri context');
  const rustTests = workflow.indexOf('- name: Run Rust tests');

  assert.notEqual(frontendBuild, -1);
  assert.notEqual(rustTests, -1);
  assert.ok(frontendBuild < rustTests);
  assert.match(workflow.slice(frontendBuild, rustTests), /run: npm run build/);
});
