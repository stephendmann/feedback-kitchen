/**
 * @jest-environment node
 *
 * FK-19 — tests for planImport (js/moodle-worksheet.js): the pure mapping
 * from a validated worksheet to a cohort-queue plan. Exercised against the
 * synthetic generator only.
 *
 * Run with: npx jest js/moodle-import-plan.test.js
 */

const FKMoodle = require('./moodle-worksheet.js');
const gen = require('../scripts/gen-moodle-fixture.js');

describe('planImport — happy path classification', () => {
  const plan = FKMoodle.planImport(gen.buildWorksheet({ rows: 12 }));

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

  test('the No-submission row is non-markable (still keyed, shown grayed)', () => {
    const e = plan.entries.find(x => x.status === 'no-submission');
    expect(e.disposition).toBe('non-markable');
    expect(e.key).toMatch(/^sid:/);
  });

  test('the name-only row (blank ID) requires manual verification — never auto-import', () => {
    const e = plan.entries.find(x => x.name === 'Kiri Modell');
    expect(e.disposition).toBe('verify');
    expect(e.keyType).toBe('name');
    expect(e.key).toBe('name:Kiri Modell');
    expect(e.reason).toMatch(/confirm/i);
  });
});

describe('planImport — the grade-leakage guard', () => {
  test('NO name-keyed entry is ever silently set to "import"', () => {
    const plan = FKMoodle.planImport(gen.buildWorksheet({ rows: 12 }));
    const nameKeyedAutoImport = plan.entries.filter(e => e.keyType === 'name' && e.disposition === 'import');
    expect(nameKeyedAutoImport).toEqual([]);
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
});

describe('planImport — file-blocking gate', () => {
  test('a header mismatch yields an empty, invalid plan (UI stays out of "Ready to Import")', () => {
    const plan = FKMoodle.planImport(gen.corruptWorksheet('wrong-header', { rows: 6 }));
    expect(plan.isValid).toBe(false);
    expect(plan.entries).toEqual([]);
    expect(plan.validation.errors.map(e => e.code)).toContain('E_HEADER_MISMATCH');
  });
});

describe('planImport — keys are FK cohort keys', () => {
  test('every keyed entry uses the sid:/name: cohort-key convention', () => {
    const plan = FKMoodle.planImport(gen.buildWorksheet({ rows: 12 }));
    plan.entries.filter(e => e.key).forEach(e => {
      expect(e.key).toMatch(/^(sid:|name:)/);
    });
  });
});
