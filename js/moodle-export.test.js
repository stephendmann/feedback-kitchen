/**
 * @jest-environment node
 *
 * FK-19 (export half) — tests for buildExportWorksheet: fill Grade + Feedback
 * back into the original worksheet for marked students, preserving the
 * uploaded file's FULL schema (column set, column order, every other cell,
 * the BOM and its own line endings), and NEVER writing markerNotes.
 * Synthetic fixtures only.
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

// Column map for a given worksheet text — resolved from the file, never assumed.
const colsOf = (csv) => FK.validateWorksheet(csv, 'export').columns;

gen.VARIANTS.forEach(variant => {
  describe('buildExportWorksheet — round trip (' + variant + ' layout)', () => {
    const original = gen.buildWorksheet({ rows: 12, variant });
    const out = FK.buildExportWorksheet(original, marked);
    const cols = colsOf(original);

    test('succeeds and the output is itself a valid worksheet (re-uploadable)', () => {
      expect(out.ok).toBe(true);
      expect(FK.validateWorksheet(out.text, 'export').isValid).toBe(true);
      expect(FK.validateWorksheet(out.text, 'import').isValid).toBe(true);
    });

    test('preserves the BOM and the source CRLF terminators', () => {
      expect(out.text.charCodeAt(0)).toBe(0xfeff);
      expect(out.text).toContain('\r\n');
      expect(out.summary.eol).toBe('\r\n');
    });

    test('the header comes back byte-identical — same columns, same order', () => {
      expect(FK.parseCsv(out.text)[0]).toEqual(gen.headerFor(variant));
    });

    test('fills Grade + Feedback for the marked student only', () => {
      const rows = FK.parseCsv(out.text);
      const aroha = rows.find(r => r[cols['ID number']] === '9900001');
      expect(aroha[cols.Grade]).toBe('85.00');
      expect(aroha[cols['Feedback comments']]).toContain('Strong argument, Aroha.');
      const ben = rows.find(r => r[cols['ID number']] === '9900002');
      expect(ben[cols.Grade]).toBe('');
      expect(out.summary).toMatchObject({ total: 12, filled: 1, unmatched: 11 });
    });

    test('EXACTLY two cells change — every other column survives verbatim', () => {
      const before = FK.parseCsv(gen.buildWorksheet({ rows: 12, variant }));
      const after  = FK.parseCsv(out.text);
      const changed = [];
      for (let r = 1; r < before.length; r++) {
        expect(after[r]).toHaveLength(before[r].length);
        for (let c = 0; c < before[r].length; c++) {
          if (before[r][c] !== after[r][c]) changed.push(gen.headerFor(variant)[c]);
        }
      }
      expect(changed.sort()).toEqual(['Feedback comments', 'Grade']);
    });

    test('PRIVACY: markerNotes never appears anywhere in the export', () => {
      expect(out.text).not.toContain(NOTE_SENTINEL);
    });

    test('multi-line feedback round-trips through quoting', () => {
      const aroha = FK.parseCsv(out.text).find(r => r[cols['ID number']] === '9900001');
      expect(aroha[cols['Feedback comments']]).toContain('\n');
      expect(aroha[cols['Feedback comments']]).toContain('Tighten the conclusion');
    });

    test('a pre-existing long/quoted feedback cell FK did not touch is unchanged', () => {
      const before = FK.parseCsv(gen.buildWorksheet({ rows: 12, variant }));
      const after  = FK.parseCsv(out.text);
      const long = before.findIndex(r => (r[cols['Feedback comments']] || '').length > 6000);
      expect(long).toBeGreaterThan(0);
      expect(after[long][cols['Feedback comments']]).toBe(before[long][cols['Feedback comments']]);
    });
  });
});

/* The marker uploads what FK hands back, so the file must come out with the
   line endings it went in with. INS-10 pinned CRLF from a single export; a
   later real export from the same Moodle used lone LF. FK normalises neither. */
describe('buildExportWorksheet — line endings round-trip, both conventions', () => {
  gen.VARIANTS.forEach(variant => {
    const cases = [
      ['CRLF source', { rows: 12, variant },            '\r\n'],
      ['LF source',   { rows: 12, variant, lf: true },  '\n'],
    ];
    test.each(cases)(variant + ' / %s → the same terminator comes back', (_label, opts, eol) => {
      const original = gen.buildWorksheet(opts);
      const out = FK.buildExportWorksheet(original, marked);
      expect(out.ok).toBe(true);
      expect(out.summary.eol).toBe(eol);

      // Count RECORD terminators only, by blanking quoted cells first: the
      // multi-line feedback cell holds LF in both conventions. 13 = header + 12 rows,
      // each terminated (Moodle ends the file on a terminator too).
      const terminators = (s) => {
        const bare = s.replace(/"[^"]*"/g, '""');
        return { crlf: (bare.match(/\r\n/g) || []).length,
                 lf:   (bare.replace(/\r\n/g, '').match(/\n/g) || []).length };
      };
      const t = terminators(out.text);
      if (eol === '\r\n') { expect(t.lf).toBe(0);   expect(t.crlf).toBe(13); }
      else                { expect(t.crlf).toBe(0); expect(t.lf).toBe(13); }
      expect(terminators(original)).toEqual(t);      // identical to the source
    });

    test(variant + ': an LF file still round-trips its data intact', () => {
      const original = gen.buildWorksheet({ rows: 12, variant, lf: true });
      const out = FK.buildExportWorksheet(original, marked);
      const cols = colsOf(original);
      expect(FK.validateWorksheet(out.text, 'export').isValid).toBe(true);
      expect(FK.parseCsv(out.text)[0]).toEqual(gen.headerFor(variant));

      const before = FK.parseCsv(original), after = FK.parseCsv(out.text);
      const changed = [];
      for (let r = 1; r < before.length; r++) {
        for (let c = 0; c < before[r].length; c++) {
          if (before[r][c] !== after[r][c]) changed.push(gen.headerFor(variant)[c]);
        }
      }
      expect(changed.sort()).toEqual(['Feedback comments', 'Grade']);
      const aroha = after.find(r => r[cols['ID number']] === '9900001');
      expect(aroha[cols.Grade]).toBe('85.00');
      expect(aroha[cols['Feedback comments']]).toContain('\n');   // multi-line feedback survives
    });
  });

  test('exporting twice is idempotent, LF and CRLF alike', () => {
    ['\r\n', '\n'].forEach(eol => {
      const original = gen.buildWorksheet({ rows: 12, lf: eol === '\n' });
      const once  = FK.buildExportWorksheet(original, marked).text;
      const twice = FK.buildExportWorksheet(once, marked).text;
      expect(twice).toBe(once);
    });
  });
});

describe('buildExportWorksheet — layout-specific columns survive', () => {
  test('dates layout: Due date (including the override row) is untouched', () => {
    const original = gen.buildWorksheet({ rows: 12, variant: 'dates' });
    const cols = colsOf(original);
    const out = FK.buildExportWorksheet(original, marked);
    const before = FK.parseCsv(original), after = FK.parseCsv(out.text);
    const due = r => r[cols['Due date']];
    expect(after.slice(1).map(due)).toEqual(before.slice(1).map(due));
    expect(new Set(before.slice(1).map(due)).size).toBe(2);   // the override really is in there
  });

  test('group-marker layout: Group and Marker columns are untouched', () => {
    const original = gen.buildWorksheet({ rows: 12, variant: 'group-marker',
      overrides: { 0: { Group: 'Tutorial A', Marker: 'S. Mann' } } });
    const cols = colsOf(original);
    const out = FK.buildExportWorksheet(original, marked);
    const aroha = FK.parseCsv(out.text).find(r => r[cols['ID number']] === '9900001');
    expect(aroha[cols.Group]).toBe('Tutorial A');
    expect(aroha[cols.Marker]).toBe('S. Mann');
    expect(aroha[cols.Grade]).toBe('85.00');                  // and the fill still happened
  });

  test('an unknown extra column is carried through untouched', () => {
    const original = gen.corruptWorksheet('unknown-col', { rows: 6 });
    const cols = colsOf(original);
    const out = FK.buildExportWorksheet(original, marked);
    expect(out.ok).toBe(true);
    const rows = FK.parseCsv(out.text);
    expect(rows[0]).toContain('Institution note');
    expect(rows[1][cols['Institution note']]).toBe('note-1');
  });
});

describe('buildExportWorksheet — matching is sid-only', () => {
  test('a name-only cohort record never matches a worksheet row', () => {
    const nameOnly = [{
      name: 'Kiri Modell', studentId: '', key: 'name:kiri modell',
      scoreResult: { penalisedScore: 71, rows: [{ grade: 'B' }] }, feedbackText: 'Nope.'
    }];
    const out = FK.buildExportWorksheet(gen.buildWorksheet({ rows: 12 }), nameOnly);
    expect(out.summary.filled).toBe(0);
    expect(out.text).not.toContain('Nope.');
  });

  test('sid matching is case-insensitive', () => {
    const original = gen.buildWorksheet({ rows: 4, overrides: { 0: { 'ID number': 'AB1234' } } });
    const cols = colsOf(original);
    const out = FK.buildExportWorksheet(original,
      [Object.assign({}, marked[0], { studentId: 'ab1234', key: 'sid:ab1234' })]);
    expect(out.summary.filled).toBe(1);
    expect(FK.parseCsv(out.text)[1][cols.Grade]).toBe('85.00');
  });
});

describe('buildExportWorksheet — guards', () => {
  test('an unmarked cohort placeholder is not written into the file', () => {
    const original = gen.buildWorksheet({ rows: 6 });
    const cols = colsOf(original);
    const placeholder = [{ name: 'Aroha Example', studentId: '9900001', key: 'sid:9900001' }]; // no scoreResult
    const out = FK.buildExportWorksheet(original, placeholder);
    expect(out.summary.filled).toBe(0);
    const aroha = FK.parseCsv(out.text).find(r => r[cols['ID number']] === '9900001');
    expect(aroha[cols.Grade]).toBe('');
  });

  const rejected = [
    ['the Grade column is missing',     'renamed-col', 'E_HEADER_MISSING_COLUMN'],
    ['a required column is dropped',    'missing-col', 'E_HEADER_MISSING_COLUMN'],
    ['a column name is duplicated',     'dup-header',  'E_HEADER_DUPLICATE_COLUMN'],
    ['a data row is malformed',         'long-row',    'E_ROW_FIELD_COUNT'],
  ];
  test.each(rejected)('%s → ok:false with the file errors, no text', (_label, kind, code) => {
    const out = FK.buildExportWorksheet(gen.corruptWorksheet(kind, { rows: 6 }), marked);
    expect(out.ok).toBe(false);
    expect(out.errors.map(e => e.code)).toContain(code);
    expect(out.text).toBeNull();
    expect(out.summary).toBeNull();
  });
});
