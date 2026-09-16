/**
 * @jest-environment node
 *
 * FK-19 — tests for the FAKE Moodle-worksheet fixture generator
 * (scripts/gen-moodle-fixture.js).
 *
 * The generator is the contract that lets FK-19's round-trip logic be built
 * and tested WITHOUT a real, PII-bearing worksheet (those stay gitignored).
 * These assertions pin the two REAL layouts — the INS-10 Group/Marker export
 * and the date/override export — plus the encoding and the round-trip-critical
 * edge rows, so a drift in the generator (or in our understanding of what
 * Moodle emits) fails loudly.
 *
 * Run with: npx jest js/moodle-fixture.test.js
 */

const gen = require('../scripts/gen-moodle-fixture.js');

describe('the two real layouts', () => {
  test('group-marker (INS-10): 14 columns, Group + Marker, no date columns', () => {
    expect(gen.HEADERS['group-marker']).toEqual([
      'Identifier', 'Full name', 'ID number', 'Email address', 'Status',
      'Group', 'Marker', 'Grade', 'Maximum grade', 'Marking workflow state',
      'Grade can be changed', 'Last modified (submission)', 'Last modified (grade)',
      'Feedback comments'
    ]);
  });

  test('dates: 15 columns, per-user date columns, no Group/Marker', () => {
    expect(gen.HEADERS.dates).toEqual([
      'Identifier', 'Full name', 'ID number', 'Email address', 'Status',
      'Allow submissions from', 'Due date', 'Cut-off date',
      'Grade', 'Maximum grade', 'Marking workflow state',
      'Grade can be changed', 'Last modified (submission)', 'Last modified (grade)',
      'Feedback comments'
    ]);
  });

  test('neither layout is a superset of the other, and shared columns move', () => {
    const a = gen.HEADERS['group-marker'], b = gen.HEADERS.dates;
    expect(a.filter(c => b.indexOf(c) === -1)).toEqual(['Group', 'Marker']);
    expect(b.filter(c => a.indexOf(c) === -1))
      .toEqual(['Allow submissions from', 'Due date', 'Cut-off date']);
    ['Grade', 'Maximum grade', 'Feedback comments'].forEach(c => {
      expect(a.indexOf(c)).not.toBe(b.indexOf(c));
    });
  });

  test('headerFor falls back to the default for an unknown variant', () => {
    expect(gen.headerFor('nope')).toEqual(gen.HEADERS[gen.DEFAULT_VARIANT]);
  });
});

gen.VARIANTS.forEach(variant => {
  describe('schema / encoding fidelity — ' + variant, () => {
    const csv = gen.buildWorksheet({ rows: 12, variant });
    const header = gen.headerFor(variant);

    test('starts with a UTF-8 BOM', () => {
      expect(csv.charCodeAt(0)).toBe(0xfeff);
    });

    test('the first record is that variant’s header, in order', () => {
      expect(csv.replace(/^﻿/, '').split('\r\n')[0]).toBe(header.join(','));
    });

    test('record terminator is CRLF by default; --lf overrides to LF', () => {
      expect(csv).toContain('\r\n');
      const lf = gen.buildWorksheet({ rows: 3, lf: true, variant });
      // no CRLF as a record terminator (field-internal newlines, if any, stay LF)
      expect(lf.replace(/"[^"]*"/g, '')).not.toContain('\r\n');
    });
  });

  describe('round-trip-critical edge rows — ' + variant, () => {
    const csv = gen.buildWorksheet({ rows: 12, variant });

    test('a blank ID-number row (the manual-verify edge)', () => {
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
      expect(csv).toMatch(/"Hi Erin — thank you for your submission\.[\s\S]*resubmission\."/);
      expect(csv).toContain('""market problem""'); // internal quotes doubled
    });

    test('a very long (~8k char) feedback row exists (INS-10 stress)', () => {
      const longCell = (csv.match(/"[^"]{6000,}"/g) || [])[0] || '';
      expect(longCell.length).toBeGreaterThan(7000);
    });
  });
});

describe('the dates variant carries the override that summons its columns', () => {
  const csv = gen.buildWorksheet({ rows: 12, variant: 'dates' });

  test('two distinct Due date values are present', () => {
    expect(csv).toContain('Friday, 12 June 2026, 5:00 PM');
    expect(csv).toContain('Wednesday, 17 June 2026, 5:00 PM');
  });

  test('Allow submissions from / Cut-off date are blank, as in the real export', () => {
    const FK = require('./moodle-worksheet.js');
    const v = FK.validateWorksheet(csv);
    v.rows.forEach(r => {
      expect(r[v.columns['Allow submissions from']]).toBe('');
      expect(r[v.columns['Cut-off date']]).toBe('');
    });
  });
});

describe('corruptWorksheet poisons apply to either layout', () => {
  const kinds = ['missing-col', 'dup-header', 'unknown-col', 'short-row', 'long-row', 'no-header'];
  gen.VARIANTS.forEach(variant => {
    test.each(kinds)('%s is generated for ' + variant, (kind) => {
      const csv = gen.corruptWorksheet(kind, { rows: 6, variant });
      expect(typeof csv).toBe('string');
      expect(csv).not.toBe(gen.buildWorksheet({ rows: 6, variant }));
    });
  });

  test('missing-col removes the column from the header AND every row', () => {
    const csv = gen.corruptWorksheet('missing-col', { rows: 6 });
    const recs = csv.replace(/^﻿/, '').split('\r\n').filter(Boolean);
    expect(gen.splitRecord(recs[0])).not.toContain('ID number');
    const width = gen.headerFor(gen.DEFAULT_VARIANT).length - 1;
    recs.forEach(line => expect(gen.splitRecord(line)).toHaveLength(width));
  });

  test('unknown-col keeps every record rectangular (so it stays valid)', () => {
    const csv = gen.corruptWorksheet('unknown-col', { rows: 6 });
    const recs = csv.replace(/^﻿/, '').split('\r\n').filter(Boolean);
    const width = gen.headerFor(gen.DEFAULT_VARIANT).length + 1;
    recs.forEach(line => expect(gen.splitRecord(line)).toHaveLength(width));
  });
});

describe('splitRecord / csvField escaping', () => {
  test('csvField quotes only when needed; doubles internal quotes', () => {
    expect(gen.csvField('plain')).toBe('plain');
    expect(gen.csvField('a,b')).toBe('"a,b"');
    expect(gen.csvField('say "hi"')).toBe('"say ""hi"""');
    expect(gen.csvField('line1\nline2')).toBe('"line1\nline2"');
    expect(gen.csvField('')).toBe('');
    expect(gen.csvField(null)).toBe('');
  });

  test('splitRecord round-trips csvField, including quoted commas and newlines', () => {
    const fields = ['plain', 'a,b', 'say "hi"', 'line1\nline2', ''];
    expect(gen.splitRecord(fields.map(gen.csvField).join(','))).toEqual(fields);
  });
});

describe('determinism', () => {
  gen.VARIANTS.forEach(variant => {
    test(variant + ': same options produce byte-identical output', () => {
      expect(gen.buildWorksheet({ rows: 12, variant })).toBe(gen.buildWorksheet({ rows: 12, variant }));
    });
  });
});

describe('committed fixtures match the generator', () => {
  const fs = require('fs'), path = require('path');
  const files = {
    'group-marker': 'test/fixtures/moodle-worksheet.fake.csv',
    dates: 'test/fixtures/moodle-worksheet-dates.fake.csv'
  };
  gen.VARIANTS.forEach(variant => {
    test(variant + ': ' + files[variant] + ' is current (regenerate with --all)', () => {
      const p = path.resolve(__dirname, '..', files[variant]);
      expect(fs.readFileSync(p, 'utf8')).toBe(gen.buildWorksheet({ rows: 12, variant }));
    });
  });
});
