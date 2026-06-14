/**
 * @jest-environment node
 *
 * FK-19 (export half) — tests for buildExportWorksheet: fill Grade + Feedback
 * back into the original worksheet for marked students, byte-preserving
 * everything else, and NEVER writing markerNotes. Synthetic fixtures only.
 *
 * Run with: npx jest js/moodle-export.test.js
 */

const FK = require('./moodle-worksheet.js');
const gen = require('../scripts/gen-moodle-fixture.js');

// Aroha is row 1 of the generator (id 9900001). Mark her, with a markerNotes
// sentinel that MUST NOT appear in the exported worksheet.
const NOTE_SENTINEL = 'SECRET_MARKER_NOTE_DO_NOT_EXPORT';
const marked = [{
  name: 'Aroha Example', studentId: '9900001', key: 'sid:9900001',
  scoreResult: { penalisedScore: 85, rows: [{ grade: 'A' }] },
  feedbackText: 'Strong argument, Aroha.\n\nTighten the conclusion next time.',
  markerNotes: NOTE_SENTINEL
}];

describe('buildExportWorksheet — round trip', () => {
  const original = gen.buildWorksheet({ rows: 12 });
  const out = FK.buildExportWorksheet(original, marked);

  test('succeeds and the output is itself a valid worksheet (re-uploadable)', () => {
    expect(out.ok).toBe(true);
    expect(FK.validateWorksheet(out.text).isValid).toBe(true);
  });

  test('preserves the BOM + CRLF encoding', () => {
    expect(out.text.charCodeAt(0)).toBe(0xfeff);
    expect(out.text).toContain('\r\n');
  });

  test('fills Grade + Feedback for the marked student only', () => {
    const rows = FK.parseCsv(out.text);
    const aroha = rows.find(r => r[FK.COL['ID number']] === '9900001');
    expect(aroha[FK.COL.Grade]).toBe('85.00');
    expect(aroha[FK.COL['Feedback comments']]).toContain('Strong argument, Aroha.');
    // an unmarked student keeps an empty Grade
    const ben = rows.find(r => r[FK.COL['ID number']] === '9900002');
    expect(ben[FK.COL.Grade]).toBe('');
    expect(out.summary).toMatchObject({ filled: 1 });
  });

  test('PRIVACY: markerNotes never appears anywhere in the export', () => {
    expect(out.text).not.toContain(NOTE_SENTINEL);
  });

  test('multi-line feedback round-trips through quoting', () => {
    const aroha = FK.parseCsv(out.text).find(r => r[FK.COL['ID number']] === '9900001');
    expect(aroha[FK.COL['Feedback comments']]).toContain('\n');         // newline preserved
    expect(aroha[FK.COL['Feedback comments']]).toContain('Tighten the conclusion');
  });
});

describe('buildExportWorksheet — guards', () => {
  test('an unmarked cohort placeholder is not written into the file', () => {
    const placeholder = [{ name: 'Aroha Example', studentId: '9900001', key: 'sid:9900001' }]; // no scoreResult
    const out = FK.buildExportWorksheet(gen.buildWorksheet({ rows: 6 }), placeholder);
    expect(out.summary.filled).toBe(0);
    const aroha = FK.parseCsv(out.text).find(r => r[FK.COL['ID number']] === '9900001');
    expect(aroha[FK.COL.Grade]).toBe('');
  });

  test('an invalid original file is rejected (ok:false) with the file errors', () => {
    const out = FK.buildExportWorksheet(gen.corruptWorksheet('wrong-header', { rows: 6 }), marked);
    expect(out.ok).toBe(false);
    expect(out.errors.map(e => e.code)).toContain('E_HEADER_MISMATCH');
    expect(out.text).toBeNull();
  });
});
