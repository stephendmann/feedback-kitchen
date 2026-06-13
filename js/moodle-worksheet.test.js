/**
 * @jest-environment node
 *
 * FK-19 — tests for the Moodle worksheet parser + dry-run validator
 * (js/moodle-worksheet.js). Exercised entirely against the synthetic
 * generator (scripts/gen-moodle-fixture.js) — never the real worksheet.
 *
 * Run with: npx jest js/moodle-worksheet.test.js
 */

const FKMoodle = require('./moodle-worksheet.js');
const gen = require('../scripts/gen-moodle-fixture.js');

describe('parseCsv (RFC-4180)', () => {
  test('strips BOM, splits records on CRLF, returns 14-field rows', () => {
    const recs = FKMoodle.parseCsv(gen.buildWorksheet({ rows: 12 }));
    expect(recs[0]).toEqual(FKMoodle.REQUIRED_HEADER);
    expect(recs.slice(1).every(r => r.length === 14)).toBe(true);
    expect(recs).toHaveLength(13); // header + 12 rows (no trailing blank)
  });

  test('keeps multi-line quoted feedback (embedded newline + doubled quote) intact', () => {
    const recs = FKMoodle.parseCsv(gen.buildWorksheet({ rows: 12 }));
    const fb = recs.find(r => /thank you for your submission/.test(r[13]))[13];
    expect(fb).toContain('\n');                       // embedded line break preserved
    expect(fb).toContain('"market problem"');         // doubled "" decoded back to "
    expect(fb).not.toContain('""');
  });

  test('preserves an empty ID-number field (name-only row)', () => {
    const recs = FKMoodle.parseCsv(gen.buildWorksheet({ rows: 12 }));
    const nameOnly = recs.find(r => r[1] === 'Kiri Modell');
    expect(nameOnly[2]).toBe('');                     // ID number column empty
  });

  test('throws E_UNBALANCED_QUOTE on an unterminated quote', () => {
    expect(() => FKMoodle.parseCsv(gen.corruptWorksheet('bad-quote', { rows: 6 })))
      .toThrow(/Unterminated/);
  });
});

describe('validateWorksheet — conformant file', () => {
  test('a clean generated worksheet passes with no errors or warnings', () => {
    const res = FKMoodle.validateWorksheet(gen.buildWorksheet({ rows: 12 }));
    expect(res.ok).toBe(true);
    expect(res.errors).toEqual([]);
    expect(res.warnings).toEqual([]);
    expect(res.rowCount).toBe(12);
  });
});

describe('validateWorksheet — encoding drift is a WARNING, not a block', () => {
  test('missing BOM → W_NO_BOM, still ok', () => {
    const res = FKMoodle.validateWorksheet(gen.corruptWorksheet('no-bom', { rows: 6 }));
    expect(res.ok).toBe(true);
    expect(res.warnings.map(w => w.code)).toContain('W_NO_BOM');
  });
  test('LF instead of CRLF → W_EOL_NOT_CRLF, still ok', () => {
    const res = FKMoodle.validateWorksheet(gen.corruptWorksheet('lf-only', { rows: 6 }));
    expect(res.ok).toBe(true);
    expect(res.warnings.map(w => w.code)).toContain('W_EOL_NOT_CRLF');
  });
});

describe('validateWorksheet — structural problems BLOCK with actionable codes', () => {
  const cases = [
    ['empty file',        '',                                                  'E_EMPTY'],
    ['missing header',    gen.corruptWorksheet('no-header',    { rows: 6 }),   'E_HEADER_MISMATCH'],
    ['renamed column',    gen.corruptWorksheet('wrong-header', { rows: 6 }),   'E_HEADER_MISMATCH'],
    ['extra column',      gen.corruptWorksheet('extra-col',    { rows: 6 }),   'E_HEADER_MISMATCH'],
    ['short data row',    gen.corruptWorksheet('short-row',    { rows: 6 }),   'E_ROW_FIELD_COUNT'],
    ['unbalanced quote',  gen.corruptWorksheet('bad-quote',    { rows: 6 }),   'E_UNBALANCED_QUOTE'],
  ];
  test.each(cases)('%s → not ok, reports %s', (_label, csv, code) => {
    const res = FKMoodle.validateWorksheet(csv);
    expect(res.ok).toBe(false);
    expect(res.errors.map(e => e.code)).toContain(code);
    // every error carries a human-readable message
    res.errors.forEach(e => expect(typeof e.message).toBe('string'));
  });
});
