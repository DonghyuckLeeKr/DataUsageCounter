import test from 'node:test';
import assert from 'node:assert/strict';
import { createCsvRow, escapeCsvCell } from '../src/utils/csvSecurity.js';

test('CSV cells neutralize spreadsheet formulas including whitespace-prefixed formulas', () => {
  for (const value of ['=1+1', '+cmd', '-2+3', '@SUM(A1:A2)', '  =HYPERLINK("https://example.com")']) {
    assert.equal(escapeCsvCell(value).startsWith('"\''), true, value);
  }
});

test('CSV cells preserve ordinary values and escape quotes', () => {
  assert.equal(escapeCsvCell('돌핀 데이터'), '"돌핀 데이터"');
  assert.equal(escapeCsvCell('통신사 "A"'), '"통신사 ""A"""');
  assert.equal(createCsvRow(['이름', '값']), '"이름","값"');
});
