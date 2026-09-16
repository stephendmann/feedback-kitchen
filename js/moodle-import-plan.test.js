/**
 * @jest-environment node
 *
 * FK-19 — tests for planImport (js/moodle-worksheet.js): the pure mapping
 * from a validated worksheet to a cohort-queue plan. Exercised against the
 * synthetic generator only, and against BOTH real column layouts, so the
 * classification cannot quietly depend on a column's position.
 *
 * Run with: npx jest js/moodle-import-plan.test.js
 */

const FKMoodle = require('./moodle-worksheet.js');
const gen = require('../scripts/gen-moodle-fixture.js');

gen.VARIANTS.forEach(variant => {
  describe('planImport — happy path classification (' + variant + ' layout)', () => {
    const plan = FKMoodle.planImport(gen.buildWorksheet({ rows: 12, variant }));

    test('valid file → one entry per data row', () => {
      expect(plan.isValid).toBe(true);
      expect(plan.entries).toHaveLength(12);
    });

    test('summary partitions every row into exactly one disposition', () => {
      const s = plan.summary;
      expect(s.total).toBe(12);
      expect(s.import + s.verify + s.skip + s.nonMarkable).toBe(s.total);
      expect(s).toMatchObject({ import: 10, verify: 1, nonMarkable: 1, skip: 0 });
    });

    test('a normal row is keyed sid:<ID number> and ready to import', () => {
      const e = plan.entries.find(x => x.name === 'Aroha Example');
      expect(e.disposition).toBe('import');
      expect(e.keyType).toBe('sid');
      expect(e.key).toMatch(/^sid:\d{7}$/);
    });

    test('the Moodle participant id is carried through for the export round trip', () => {
      const e = plan.entries.find(x => x.name === 'Aroha Example');
      expect(e.participant).toBe('Participant 8880001');
    });

    test('the No-submission row is non-markable (still keyed, shown grayed)', () => {
      const e = plan.entries.find(x => x.status === 'no-submission');
      expect(e.disposition).toBe('non-markable');
      expect(e.key).toMatch(/^sid:/);
    });
  });

  describe('planImport — no auto-fallback to name matching (' + variant + ' layout)', () => {
    const plan = FKMoodle.planImport(gen.buildWorksheet({ rows: 12, variant }));

    test('a blank-ID row needs manual verification and is left UNKEYED', () => {
      const e = plan.entries.find(x => x.name === 'Kiri Modell');
      expect(e.disposition).toBe('verify');
      expect(e.key).toBeNull();
      expect(e.keyType).toBeNull();
      expect(e.errorCodes).toContain('E_ROW_NO_ID');
      expect(e.reason).toMatch(/assign/i);
    });

    test('NO entry anywhere is keyed by name', () => {
      expect(plan.entries.filter(e => e.keyType === 'name')).toEqual([]);
      expect(plan.entries.filter(e => e.key && /^name:/.test(e.key))).toEqual([]);
    });

    test('every keyed entry uses the sid: cohort-key convention', () => {
      plan.entries.filter(e => e.key).forEach(e => expect(e.key).toMatch(/^sid:/));
    });
  });
});

describe('planImport — the two layouts produce the same plan', () => {
  const shape = p => p.entries.map(e =>
    [e.row, e.name, e.identifier, e.key, e.keyType, e.status, e.disposition].join('|'));

  test('classification is position-independent', () => {
    const a = FKMoodle.planImport(gen.buildWorksheet({ rows: 12, variant: 'group-marker' }));
    const b = FKMoodle.planImport(gen.buildWorksheet({ rows: 12, variant: 'dates' }));
    expect(shape(a)).toEqual(shape(b));
    expect(a.summary).toEqual(b.summary);
  });

  test('an unrecognised extra column shifts every index but changes nothing', () => {
    const plain = FKMoodle.planImport(gen.buildWorksheet({ rows: 6 }));
    const extra = FKMoodle.planImport(gen.corruptWorksheet('unknown-col', { rows: 6 }));
    expect(extra.isValid).toBe(true);
    expect(shape(extra)).toEqual(shape(plain));
  });
});

describe('planImport — row-level dispositions (skip-row)', () => {
  test('an unkeyable row is skipped; the rest still import', () => {
    const plan = FKMoodle.planImport(gen.corruptWorksheet('no-key-row', { rows: 6 }));
    expect(plan.isValid).toBe(true);
    const skipped = plan.entries.filter(e => e.disposition === 'skip');
    expect(skipped).toHaveLength(1);
    expect(skipped[0].errorCodes).toContain('E_ROW_NO_KEY');
    expect(plan.summary.import).toBeGreaterThan(0);
  });

  test('a duplicate-ID row is skipped', () => {
    const plan = FKMoodle.planImport(gen.corruptWorksheet('dup-id', { rows: 6 }));
    expect(plan.entries.some(e => e.disposition === 'skip' && e.errorCodes.indexOf('E_ROW_DUP_ID') !== -1)).toBe(true);
  });

  test('duplicate detection is case-insensitive, matching the key', () => {
    const plan = FKMoodle.planImport(gen.buildWorksheet({
      rows: 4, overrides: { 0: { 'ID number': 'AB1234' }, 1: { 'ID number': 'ab1234' } }
    }));
    const dup = plan.entries.filter(e => e.errorCodes.indexOf('E_ROW_DUP_ID') !== -1);
    expect(dup).toHaveLength(1);
    expect(dup[0].row).toBe(3);
  });
});

describe('planImport — file-blocking gate', () => {
  const blocking = [
    ['a missing required column', 'missing-col', 'E_HEADER_MISSING_COLUMN'],
    ['a duplicate column name',   'dup-header',  'E_HEADER_DUPLICATE_COLUMN'],
    ['a malformed row',           'short-row',   'E_ROW_FIELD_COUNT'],
  ];
  test.each(blocking)('%s yields an empty, invalid plan', (_label, kind, code) => {
    const plan = FKMoodle.planImport(gen.corruptWorksheet(kind, { rows: 6 }));
    expect(plan.isValid).toBe(false);
    expect(plan.entries).toEqual([]);
    expect(plan.summary.total).toBe(0);
    expect(plan.validation.errors.map(e => e.code)).toContain(code);
  });

  test('the plan validates against the IMPORT requirements only', () => {
    // No `Feedback comments` column: nothing to import is missing.
    const plan = FKMoodle.planImport(gen.corruptWorksheet('renamed-col', { rows: 6 }));
    expect(plan.isValid).toBe(true);
    expect(plan.validation.workflow).toBe('import');
  });
});
