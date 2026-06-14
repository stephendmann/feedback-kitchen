/**
 * @jest-environment node
 *
 * FK-19 — tests for the FAKE Moodle-worksheet fixture generator
 * (scripts/gen-moodle-fixture.js).
 *
 * The generator is the contract that lets FK-19's round-trip logic be built
 * and tested WITHOUT the real, PII-bearing worksheet (which stays gitignored).
 * These assertions pin the schema invariants discovered in INS-10 — 14-column
 * order, BOM, CRLF, editable-pair, and the round-trip-critical edge rows — so a
 * drift in the generator (or our understanding) fails loudly.
 *
 * Run with: npx jest js/moodle-fixture.test.js
 */

const gen = require('../scripts/gen-moodle-fixture.js');

describe('schema / encoding fidelity (INS-10)', () => {
  const csv = gen.buildWorksheet({ rows: 12 });

  test('starts with a UTF-8 BOM', () => {
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });

  test('header is the exact 14 canonical columns in order', () => {
    const header = csv.replace(/^﻿/, '').split('\r\n')[0];
    expect(header).toBe(
      'Identifier,Full name,ID number,Email address,Status,Group,Marker,Grade,' +
      'Maximum grade,Marking workflow state,Grade can be changed,' +
      'Last modified (submission),Last modified (grade),Feedback comments'
    );
    expect(gen.HEADER).toHaveLength(14);
  });

  test('record terminator is CRLF by default; --lf overrides to LF', () => {
    expect(csv).toContain('\r\n');
    const lf = gen.buildWorksheet({ rows: 3, lf: true });
    // no CRLF as a record terminator (field-internal newlines, if any, stay LF)
    expect(lf.replace(/"[^"]*"/g, '')).not.toContain('\r\n');
  });
});

describe('round-trip-critical edge rows are present', () => {
  const csv = gen.buildWorksheet({ rows: 12 });

  test('a name-only row with an EMPTY ID number (sid-fallback edge)', () => {
    // ...,Kiri Modell,,kmodell@... — empty ID number field between two commas
    expect(csv).toMatch(/,Kiri Modell,,/);
  });

  test('a No-submission (non-markable) row', () => {
    expect(csv).toContain('No submission - Released -  - ');
  });

  test('a late-submission status row', () => {
    expect(csv).toMatch(/Submitted for grading - \d+ mins?.*late/);
  });

  test('pre-graded numeric rows in the editable Grade column', () => {
    expect(csv).toContain(',78.50,100.00,');
    expect(csv).toContain(',62.00,100.00,');
  });

  test('a multi-line feedback field is quoted and keeps embedded newlines', () => {
    // the quoted feedback cell spans lines and contains an escaped quote
    expect(csv).toMatch(/"Hi Erin — thank you for your submission\.[\s\S]*resubmission\."/);
    expect(csv).toContain('""market problem""'); // internal quotes doubled
  });

  test('a very long (~8k char) feedback row exists (INS-10 stress)', () => {
    const longCell = (csv.match(/"[^"]{6000,}"/g) || [])[0] || '';
    expect(longCell.length).toBeGreaterThan(7000);
  });
});

describe('csvField escaping', () => {
  test('quotes only when needed; doubles internal quotes', () => {
    expect(gen.csvField('plain')).toBe('plain');
    expect(gen.csvField('a,b')).toBe('"a,b"');
    expect(gen.csvField('say "hi"')).toBe('"say ""hi"""');
    expect(gen.csvField('line1\nline2')).toBe('"line1\nline2"');
    expect(gen.csvField('')).toBe('');
    expect(gen.csvField(null)).toBe('');
  });
});

describe('determinism', () => {
  test('same options produce byte-identical output (reproducible fixture)', () => {
    expect(gen.buildWorksheet({ rows: 12 })).toBe(gen.buildWorksheet({ rows: 12 }));
  });
});
