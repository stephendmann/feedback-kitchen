/**
 * @jest-environment node
 *
 * FK-19 — tests for the Moodle worksheet parser + dry-run validator
 * (js/moodle-worksheet.js). Exercised entirely against the synthetic
 * generator (scripts/gen-moodle-fixture.js) — never a real worksheet.
 *
 * The governing invariant: there is NO fixed column set. Every test that
 * can run against both real layouts does, so a positional assumption
 * cannot creep back in without a red test.
 *
 * Run with: npx jest js/moodle-worksheet.test.js
 */

const FKMoodle = require('./moodle-worksheet.js');
const gen = require('../scripts/gen-moodle-fixture.js');

const VARIANTS = gen.VARIANTS;                     // ['group-marker', 'dates']
const each = (fn) => VARIANTS.forEach(v => fn(v));

describe('parseCsv (RFC-4180)', () => {
  each(variant => {
    describe(variant + ' layout', () => {
      const csv = gen.buildWorksheet({ rows: 12, variant });
      const width = gen.headerFor(variant).length;

      test('strips BOM, splits on CRLF, returns rows at the file’s own width', () => {
        const recs = FKMoodle.parseCsv(csv);
        expect(recs[0]).toEqual(gen.headerFor(variant));
        expect(recs.slice(1).every(r => r.length === width)).toBe(true);
        expect(recs).toHaveLength(13);             // header + 12 rows (no trailing blank)
      });

      test('keeps multi-line quoted feedback (embedded newline + doubled quote) intact', () => {
        const recs = FKMoodle.parseCsv(csv);
        const cols = FKMoodle.validateWorksheet(csv, 'export').columns;
        const fb = recs.find(r => /thank you for your submission/.test(r[cols['Feedback comments']]))[cols['Feedback comments']];
        expect(fb).toContain('\n');                // embedded line break preserved
        expect(fb).toContain('"market problem"');  // doubled "" decoded back to "
        expect(fb).not.toContain('""');
      });

      test('preserves an empty ID-number field (the blank-ID row)', () => {
        const recs = FKMoodle.parseCsv(csv);
        const cols = FKMoodle.validateWorksheet(csv).columns;
        const blank = recs.find(r => r[cols['Full name']] === 'Kiri Modell');
        expect(blank[cols['ID number']]).toBe('');
      });
    });
  });

  test('throws E_UNBALANCED_QUOTE on an unterminated quote', () => {
    expect(() => FKMoodle.parseCsv(gen.corruptWorksheet('bad-quote', { rows: 6 })))
      .toThrow(/Unterminated/);
  });
});

describe('resolveColumns — exact-name resolution', () => {
  test('maps every declared name to its own index, whatever the order', () => {
    const r = FKMoodle.resolveColumns(['Grade', 'Identifier', 'Full name'], ['Identifier']);
    expect(r.index).toEqual({ Grade: 0, Identifier: 1, 'Full name': 2 });
    expect(r.missing).toEqual([]);
  });

  test('matching is exact, not fuzzy — a renamed column is missing, not guessed', () => {
    const r = FKMoodle.resolveColumns(['ID', 'Identifier'], ['ID number']);
    expect(r.missing).toEqual(['ID number']);
    expect(r.index['ID number']).toBeUndefined();
  });

  test('matching is LITERAL — a padded header cell is NOT the column', () => {
    const r = FKMoodle.resolveColumns([' Grade ', 'Grade'], ['Grade']);
    expect(r.index.Grade).toBe(1);               // the untouched one, not the padded one
    expect(r.index[' Grade ']).toBe(0);          // the padded one is just another column
    expect(r.duplicates).toEqual([]);            // and they are not the same column
    expect(r.missing).toEqual([]);
  });

  test('a padded copy of a required column leaves it missing', () => {
    expect(FKMoodle.resolveColumns(['  Grade  '], ['Grade']).missing).toEqual(['Grade']);
  });

  test('a leading BOM on the first header cell is removed, and only that', () => {
    const r = FKMoodle.resolveColumns(['﻿Identifier', 'Full name'], ['Identifier']);
    expect(r.index.Identifier).toBe(0);
    expect(r.missing).toEqual([]);
  });

  test('a repeated name is reported as a duplicate, not silently first-wins', () => {
    const r = FKMoodle.resolveColumns(['Grade', 'Grade'], []);
    expect(r.duplicates).toEqual(['Grade']);
  });

  test('blank header cells are recorded and never indexed', () => {
    const r = FKMoodle.resolveColumns(['Grade', '', '  '], []);
    expect(r.blanks).toEqual([1, 2]);
    expect(Object.keys(r.index)).toEqual(['Grade']);
  });
});

describe('validateWorksheet — both real layouts are accepted', () => {
  each(variant => {
    test(variant + ': a clean worksheet is valid, with no errors or warnings', () => {
      const res = FKMoodle.validateWorksheet(gen.buildWorksheet({ rows: 12, variant }));
      expect(res.isValid).toBe(true);
      expect(res.ok).toBe(res.isValid);            // back-compat alias
      expect(res.errors).toEqual([]);
      expect(res.warnings).toEqual([]);            // BOM+CRLF, structurally clean
      expect(res.rowCount).toBe(12);
      expect(res.rows).toHaveLength(12);
    });

    test(variant + ': header + columns describe THIS file, not a hard-coded schema', () => {
      const header = gen.headerFor(variant);
      const res = FKMoodle.validateWorksheet(gen.buildWorksheet({ rows: 6, variant }));
      expect(res.header).toEqual(header);
      header.forEach((name, i) => expect(res.columns[name]).toBe(i));
      expect(res.rows[0]).toHaveLength(header.length);
    });
  });

  test('the two layouts genuinely differ in width, order AND membership', () => {
    const a = gen.headerFor('group-marker'), b = gen.headerFor('dates');
    expect(a.length).not.toBe(b.length);
    expect(a).toContain('Group');
    expect(b).not.toContain('Group');
    expect(b).toContain('Due date');
    expect(a).not.toContain('Due date');
    expect(a.indexOf('Grade')).not.toBe(b.indexOf('Grade'));   // same column, different position
  });

  test('an unrecognised extra column is accepted, not rejected', () => {
    const res = FKMoodle.validateWorksheet(gen.corruptWorksheet('unknown-col', { rows: 6 }));
    expect(res.isValid).toBe(true);
    expect(res.header).toContain('Institution note');
  });
});

describe('validateWorksheet — only the workflow’s operational columns are required', () => {
  test('import needs identity + status, not the export columns', () => {
    expect(FKMoodle.REQUIRED_COLUMNS.import).toEqual(
      ['Identifier', 'Full name', 'ID number', 'Status']);
  });

  test('export needs the write targets, not Full name or Status', () => {
    expect(FKMoodle.REQUIRED_COLUMNS.export).toEqual(
      ['Identifier', 'ID number', 'Grade', 'Feedback comments']);
  });

  test('a file missing "Feedback comments" still imports as a roster, but cannot export', () => {
    const csv = gen.corruptWorksheet('renamed-col', { rows: 6 });   // Feedback comments → Comments
    expect(FKMoodle.validateWorksheet(csv, 'import').isValid).toBe(true);
    const out = FKMoodle.validateWorksheet(csv, 'export');
    expect(out.isValid).toBe(false);
    expect(out.errors[0]).toMatchObject({ code: 'E_HEADER_MISSING_COLUMN', column: 'Feedback comments' });
  });

  test('an unknown workflow falls back to the import requirements', () => {
    const res = FKMoodle.validateWorksheet(gen.buildWorksheet({ rows: 4 }), 'nonsense');
    expect(res.workflow).toBe('import');
    expect(res.isValid).toBe(true);
  });
});

describe('validateWorksheet — encoding', () => {
  test('missing BOM → W_NO_BOM warning, still ok', () => {
    const res = FKMoodle.validateWorksheet(gen.corruptWorksheet('no-bom', { rows: 6 }));
    expect(res.ok).toBe(true);
    expect(res.warnings.map(w => w.code)).toContain('W_NO_BOM');
  });

  // Real exports have been seen using each terminator, so neither is "drift".
  test('LF line endings are valid and warn about NOTHING', () => {
    const res = FKMoodle.validateWorksheet(gen.corruptWorksheet('lf-only', { rows: 6 }));
    expect(res.ok).toBe(true);
    expect(res.warnings).toEqual([]);
  });

  test('CRLF line endings are equally silent', () => {
    expect(FKMoodle.validateWorksheet(gen.buildWorksheet({ rows: 6 })).warnings).toEqual([]);
  });

  test('detectEol reads the record terminator, not newlines inside quoted cells', () => {
    expect(FKMoodle.detectEol(gen.buildWorksheet({ rows: 12 }))).toBe('\r\n');
    const lf = gen.buildWorksheet({ rows: 12, lf: true });
    expect(lf).toContain('\n');                      // including LF inside a quoted feedback cell
    expect(FKMoodle.detectEol(lf)).toBe('\n');
    expect(FKMoodle.detectEol('')).toBe('\n');
  });
});

/* REGRESSION — detectEol was once `/\r\n/.test(raw)`. A marker who pastes
   Windows-typed text into Moodle's feedback box produces a CRLF inside a
   quoted cell, and that regex then reported an LF-terminated worksheet as
   CRLF, so export rewrote every record terminator in the file. Terminator
   detection must run with quote state, which is why it shares scanCsv. */
describe('detectEol — CRLF inside quoted feedback must not be read as the terminator', () => {
  // LF records, but the feedback cell of row 5 holds a CRLF.
  const lfRecordsCrlfFeedback = gen.buildWorksheet({
    rows: 12, lf: true,
    overrides: { 4: { 'Feedback comments': 'Line one.\r\nLine two, with a comma.\r\n\r\nLine four.' } }
  });

  test('the fixture really does contain a CRLF, inside quotes only', () => {
    expect(lfRecordsCrlfFeedback).toContain('\r\n');
    expect(lfRecordsCrlfFeedback.replace(/"[^"]*"/g, '""')).not.toContain('\r\n');
  });

  test('detectEol returns LF, the RECORD terminator', () => {
    expect(FKMoodle.detectEol(lfRecordsCrlfFeedback)).toBe('\n');
  });

  test('scanCsv counts only out-of-quote terminators', () => {
    const scan = FKMoodle.scanCsv(lfRecordsCrlfFeedback);
    expect(scan.eol).toBe('\n');
    expect(scan.eols['\r\n']).toBe(0);               // the in-cell CRLFs are content
    expect(scan.eols['\n']).toBe(13);                // header + 12 rows
    expect(scan.records).toHaveLength(13);           // and the file still parses as 13 records
  });

  test('the CRLF survives inside the cell as content', () => {
    const v = FKMoodle.validateWorksheet(lfRecordsCrlfFeedback);
    expect(v.isValid).toBe(true);
    const fb = v.rows[4][v.columns['Feedback comments']];
    expect(fb).toBe('Line one.\r\nLine two, with a comma.\r\n\r\nLine four.');
  });

  test('export keeps LF record terminators and does not touch the in-cell CRLF', () => {
    const out = FKMoodle.buildExportWorksheet(lfRecordsCrlfFeedback, []);
    expect(out.ok).toBe(true);
    expect(out.summary.eol).toBe('\n');
    expect(out.text.replace(/"[^"]*"/g, '""')).not.toContain('\r\n');
    expect(FKMoodle.parseCsv(out.text)[5][FKMoodle.validateWorksheet(out.text).columns['Feedback comments']])
      .toBe('Line one.\r\nLine two, with a comma.\r\n\r\nLine four.');
  });

  test('the mirror case: CRLF records with a lone LF inside feedback', () => {
    const crlfRecords = gen.buildWorksheet({ rows: 12 });   // feedback already holds lone LFs
    const scan = FKMoodle.scanCsv(crlfRecords);
    expect(scan.eol).toBe('\r\n');
    expect(scan.eols['\n']).toBe(0);                 // in-cell LFs are not counted
    expect(scan.eols['\r\n']).toBe(13);
  });
});

describe('scanCsv — BOM reporting', () => {
  test('reports a BOM when present and absent when not', () => {
    expect(FKMoodle.scanCsv(gen.buildWorksheet({ rows: 4 })).bom).toBe(true);
    expect(FKMoodle.scanCsv(gen.corruptWorksheet('no-bom', { rows: 4 })).bom).toBe(false);
  });

  test('the BOM is never left in the first header cell', () => {
    expect(FKMoodle.scanCsv(gen.buildWorksheet({ rows: 4 })).records[0][0]).toBe('Identifier');
  });
});

describe('validateWorksheet — missing required columns BLOCK', () => {
  each(variant => {
    test(variant + ': dropping "ID number" from header and rows is fatal', () => {
      const res = FKMoodle.validateWorksheet(gen.corruptWorksheet('missing-col', { rows: 6, variant }));
      expect(res.isValid).toBe(false);
      const e = res.errors.find(x => x.code === 'E_HEADER_MISSING_COLUMN');
      expect(e.column).toBe('ID number');
      expect(e.message).toMatch(/ID number/);
      expect(res.rows).toEqual([]);
    });
  });

  test('the error names the missing column and lists what was found', () => {
    const res = FKMoodle.validateWorksheet(gen.corruptWorksheet('missing-col', { rows: 6 }));
    const e = res.errors.find(x => x.code === 'E_HEADER_MISSING_COLUMN');
    expect(e.message).toMatch(/Full name/);        // the "found:" list is actionable
    expect(e.severity).toBe('fatal');
  });

  test('a headerless file reports every required column as missing', () => {
    const res = FKMoodle.validateWorksheet(gen.corruptWorksheet('no-header', { rows: 6 }));
    expect(res.isValid).toBe(false);
    expect(res.errors.map(e => e.column).sort())
      .toEqual(['Full name', 'ID number', 'Identifier', 'Status']);
  });
});

describe('validateWorksheet — duplicate header columns BLOCK', () => {
  each(variant => {
    test(variant + ': two "Grade" columns are fatal, never first-wins', () => {
      const res = FKMoodle.validateWorksheet(gen.corruptWorksheet('dup-header', { rows: 6, variant }));
      expect(res.isValid).toBe(false);
      expect(res.errors.map(e => e.code)).toContain('E_HEADER_DUPLICATE_COLUMN');
      expect(res.errors.find(e => e.code === 'E_HEADER_DUPLICATE_COLUMN').column).toBe('Grade');
    });
  });

  test('a duplicate also blocks export, where the ambiguity would corrupt data', () => {
    const out = FKMoodle.buildExportWorksheet(gen.corruptWorksheet('dup-header', { rows: 6 }), []);
    expect(out.ok).toBe(false);
    expect(out.text).toBeNull();
  });
});

describe('validateWorksheet — malformed rows BLOCK, measured against the file’s own width', () => {
  each(variant => {
    const width = gen.headerFor(variant).length;

    test(variant + ': a short row is reported with its row number and the expected width', () => {
      const res = FKMoodle.validateWorksheet(gen.corruptWorksheet('short-row', { rows: 6, variant }));
      expect(res.isValid).toBe(false);
      const e = res.errors.find(x => x.code === 'E_ROW_FIELD_COUNT');
      expect(e.row).toBe(2);                       // header is row 1
      expect(e.message).toContain(String(width - 1) + ' fields');
      expect(e.message).toContain('expected ' + width);
    });

    test(variant + ': a long row is equally fatal', () => {
      const res = FKMoodle.validateWorksheet(gen.corruptWorksheet('long-row', { rows: 6, variant }));
      expect(res.isValid).toBe(false);
      expect(res.errors.find(x => x.code === 'E_ROW_FIELD_COUNT').row).toBe(2);
    });
  });

  test('a header-only extra column makes every data row ragged', () => {
    const res = FKMoodle.validateWorksheet(gen.corruptWorksheet('extra-col', { rows: 6 }));
    expect(res.isValid).toBe(false);
    expect(res.errors.every(e => e.code === 'E_ROW_FIELD_COUNT')).toBe(true);
    expect(res.errors).toHaveLength(6);            // every row, each named
  });

  test('rows[] is empty whenever the file is invalid', () => {
    expect(FKMoodle.validateWorksheet(gen.corruptWorksheet('short-row', { rows: 6 })).rows).toEqual([]);
  });
});

describe('validateWorksheet — parse + emptiness', () => {
  const cases = [
    ['empty file',       '',                                                'E_EMPTY'],
    ['whitespace only',  '   \r\n',                                         'E_EMPTY'],
    ['unbalanced quote', gen.corruptWorksheet('bad-quote', { rows: 6 }),    'E_UNBALANCED_QUOTE'],
  ];
  test.each(cases)('%s → not valid, reports %s', (_label, csv, code) => {
    const res = FKMoodle.validateWorksheet(csv);
    expect(res.isValid).toBe(false);
    expect(res.errors.map(e => e.code)).toContain(code);
    res.errors.forEach(e => expect(typeof e.message).toBe('string'));
  });

  test('every error is tagged severity "fatal"; warnings are "warning"', () => {
    const res = FKMoodle.validateWorksheet(gen.corruptWorksheet('missing-col', { rows: 6 }));
    expect(res.errors.every(e => e.severity === 'fatal')).toBe(true);
    const warned = FKMoodle.validateWorksheet(gen.corruptWorksheet('no-bom', { rows: 6 }));
    expect(warned.warnings.every(w => w.severity === 'warning')).toBe(true);
  });
});

describe('validateWorksheet — narrow contract (row classification is the planner’s job)', () => {
  test('row-DATA problems (no key / duplicate id) are NOT validator errors — the file is valid', () => {
    expect(FKMoodle.validateWorksheet(gen.corruptWorksheet('no-key-row', { rows: 6 })).isValid).toBe(true);
    expect(FKMoodle.validateWorksheet(gen.corruptWorksheet('dup-id',     { rows: 6 })).isValid).toBe(true);
    // (their dispositions are asserted in moodle-import-plan.test.js)
  });
});

describe('cellAt / worksheetKey', () => {
  test('cellAt reads by name and returns "" for a column this file does not have', () => {
    const cols = { Grade: 1 };
    expect(FKMoodle.cellAt(['a', 'b'], cols, 'Grade')).toBe('b');
    expect(FKMoodle.cellAt(['a', 'b'], cols, 'Due date')).toBe('');
  });

  test('worksheetKey is sid-only, lower-cased — a blank ID yields null, never a name key', () => {
    expect(FKMoodle.worksheetKey(' 9900001 ')).toBe('sid:9900001');
    expect(FKMoodle.worksheetKey('AB12')).toBe('sid:ab12');
    expect(FKMoodle.worksheetKey('')).toBeNull();
    expect(FKMoodle.worksheetKey(null)).toBeNull();
  });
});
