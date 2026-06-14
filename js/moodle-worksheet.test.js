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
  test('a clean worksheet is valid, no errors; only a No-submission row note', () => {
    const res = FKMoodle.validateWorksheet(gen.buildWorksheet({ rows: 12 }));
    expect(res.isValid).toBe(true);
    expect(res.ok).toBe(res.isValid);               // back-compat alias
    expect(res.errors).toEqual([]);
    expect(res.rowCount).toBe(12);
    expect(res.importableRows).toBe(12);            // no row errors → all importable
    // the only warning is the informational No-submission row (Jack, row 11)
    expect(res.warnings.map(w => w.code)).toEqual(['W_ROW_NO_SUBMISSION']);
    expect(res.warnings[0].row).toBe(11);
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
  test.each(cases)('%s → not valid, reports %s', (_label, csv, code) => {
    const res = FKMoodle.validateWorksheet(csv);
    expect(res.isValid).toBe(false);
    expect(res.errors.map(e => e.code)).toContain(code);
    res.errors.forEach(e => expect(typeof e.message).toBe('string'));
  });

  test('every file-blocking error is tagged severity "file"', () => {
    const res = FKMoodle.validateWorksheet(gen.corruptWorksheet('wrong-header', { rows: 6 }));
    expect(res.errors.every(e => e.severity === 'file')).toBe(true);
  });

  test('a header mismatch carries the offending column index', () => {
    const res = FKMoodle.validateWorksheet(gen.corruptWorksheet('wrong-header', { rows: 6 }));
    const e = res.errors.find(x => x.code === 'E_HEADER_MISMATCH');
    expect(e.column).toBe(13);            // "Feedback comments" → "Comments" (0-based col 13)
  });
});

describe('validateWorksheet — ROW-level integrity (skip-row, mirrors Moodle load_data.php)', () => {
  test('a row with no ID number AND no name is a non-blocking row error with coordinates', () => {
    const res = FKMoodle.validateWorksheet(gen.corruptWorksheet('no-key-row', { rows: 6 }));
    expect(res.isValid).toBe(true);                    // file still imports the good rows
    const e = res.errors.find(x => x.code === 'E_ROW_NO_KEY');
    expect(e.severity).toBe('row');
    expect(e.row).toBe(2);                             // first data row (1-based incl. header)
    expect(e.column).toBe('ID number');
    expect(res.importableRows).toBe(res.rowCount - 1); // one row skipped
  });

  test('a duplicate ID number → E_ROW_DUP_ID (row severity), file still valid', () => {
    const res = FKMoodle.validateWorksheet(gen.corruptWorksheet('dup-id', { rows: 6 }));
    expect(res.isValid).toBe(true);
    expect(res.errors.map(e => e.code)).toContain('E_ROW_DUP_ID');
    expect(res.errors.every(e => e.severity === 'row')).toBe(true);
  });

  test('a non-numeric grade → E_ROW_GRADE_NONNUMERIC', () => {
    const res = FKMoodle.validateWorksheet(gen.corruptWorksheet('bad-grade-text', { rows: 6 }));
    expect(res.isValid).toBe(true);
    expect(res.errors.map(e => e.code)).toContain('E_ROW_GRADE_NONNUMERIC');
  });

  test('a grade above the maximum → E_ROW_GRADE_RANGE', () => {
    const res = FKMoodle.validateWorksheet(gen.corruptWorksheet('bad-grade-range', { rows: 6 }));
    expect(res.isValid).toBe(true);
    expect(res.errors.map(e => e.code)).toContain('E_ROW_GRADE_RANGE');
  });

  test('strictRows promotes any row error to file-blocking (risk-averse mode)', () => {
    const csv = gen.corruptWorksheet('no-key-row', { rows: 6 });
    expect(FKMoodle.validateWorksheet(csv).isValid).toBe(true);
    expect(FKMoodle.validateWorksheet(csv, { strictRows: true }).isValid).toBe(false);
  });
});
