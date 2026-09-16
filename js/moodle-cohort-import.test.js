/**
 * @jest-environment node
 *
 * FK-19 — tests for buildCohortImport (js/moodle-worksheet.js): the pure
 * commit-decision layer. Verifies the two locked rules — skip-if-marked
 * (never overwrite marked work) and identity-only placeholders — plus the
 * store-key normalisation that makes dedup match shared.js studentMatchKey.
 *
 * Run with: npx jest js/moodle-cohort-import.test.js
 */

const FK = require('./moodle-worksheet.js');

const imp = (name, id, participant, keyType) => ({
  name, identifier: id, participant, keyType, disposition: 'import'
});

describe('storeKey / worksheetKey / recordHasMarks', () => {
  test('storeKey mirrors studentMatchKey for EXISTING cohort students', () => {
    expect(FK.storeKey('9900001', 'X')).toBe('sid:9900001');
    expect(FK.storeKey('', 'Kiri Modell')).toBe('name:kiri modell');
    expect(FK.storeKey('', '')).toBeNull();
  });
  test('worksheetKey has no name fallback — that is the whole point', () => {
    expect(FK.worksheetKey('9900001')).toBe('sid:9900001');
    expect(FK.worksheetKey('')).toBeNull();
  });
  test('recordHasMarks detects graded rows or grades[]', () => {
    expect(FK.recordHasMarks({ scoreResult: { rows: [{ grade: 'A' }] } })).toBe(true);
    expect(FK.recordHasMarks({ scoreResult: { rows: [{}] } })).toBe(false);
    expect(FK.recordHasMarks({ grades: [{ grade: 'B' }] })).toBe(true);
    expect(FK.recordHasMarks({})).toBe(false);
  });
});

describe('buildCohortImport — overwrite guard (skip-if-marked)', () => {
  const entries = [
    imp('Aroha Example', '9900001', 'Participant 8880001', 'sid'),
    imp('Ben Fixture',   '9900002', 'Participant 8880002', 'sid'),
    imp('Kiri Modell',   '',        'Participant 8880011', null),  // blank ID — must never commit
    { name: 'Jack', identifier: '9900010', participant: 'P', keyType: 'sid', disposition: 'non-markable' },
    { name: '', identifier: '', participant: 'P', keyType: null, disposition: 'skip' },
  ];
  const existing = [
    { name: 'Aroha Example', studentId: '9900001', key: 'sid:9900001', scoreResult: { rows: [{ grade: 'A' }] } }, // MARKED
    { name: 'Ben Fixture',   studentId: '9900002', key: 'sid:9900002' },                                          // unmarked placeholder
  ];
  const res = FK.buildCohortImport(entries, existing);

  test('a marked existing student is preserved, not overwritten', () => {
    expect(res.skippedExisting.map(s => s.key)).toContain('sid:9900001');
    expect(res.toAdd.find(r => r.studentId === '9900001')).toBeUndefined();
  });
  test('an unmarked existing placeholder is refreshed (added)', () => {
    expect(res.toAdd.find(r => r.studentId === '9900002')).toBeTruthy();
  });
  test('only disposition:"import" rows are committed (skip / non-markable excluded)', () => {
    expect(res.summary.skippedRow).toBe(2);
    expect(res.toAdd.find(r => r.name === 'Jack')).toBeUndefined();
  });
  test('an import entry with no ID number is refused, not name-matched', () => {
    expect(res.toAdd.find(r => r.name === 'Kiri Modell')).toBeUndefined();
    expect(res.summary.skippedUnkeyed).toBe(1);
  });
  test('summary tallies add / skippedExisting / skippedRow / skippedUnkeyed', () => {
    expect(res.summary).toEqual({ add: 1, skippedExisting: 1, skippedRow: 2, skippedUnkeyed: 1 });
  });
  test('every committed record carries a studentId', () => {
    res.toAdd.forEach(r => expect(r.studentId).toMatch(/\S/));
  });
});

describe('buildCohortImport — identity-only placeholder shape', () => {
  const res = FK.buildCohortImport([imp('Kiri Modell', '9900011', 'Participant 8880011', 'sid')], []);
  const rec = res.toAdd[0];
  test('import seeds name + studentId + retained Moodle participant', () => {
    expect(rec).toMatchObject({
      name: 'Kiri Modell', studentId: '9900011',
      moodleIdentifier: 'Participant 8880011', source: 'moodle-worksheet'
    });
  });
  test('the placeholder carries NO marking (no scoreResult / markerNotes)', () => {
    expect(rec.scoreResult).toBeUndefined();
    expect(rec.markerNotes).toBeUndefined();
  });
});

describe('sidCollision — verify re-assignment guard', () => {
  const entries = [
    { row: 2, name: 'A', identifier: '9900001', keyType: 'sid' },
    { row: 4, name: 'Kiri', identifier: '', keyType: null },   // the verify row being resolved
  ];
  const existing = [{ name: 'Z', studentId: '9900009', key: 'sid:9900009' }];

  test('a free ID returns null (no collision)', () => {
    expect(FK.sidCollision('9900003', entries, existing, 4)).toBeNull();
  });
  test('collision with another worksheet row is reported', () => {
    const c = FK.sidCollision('9900001', entries, existing, 4);
    expect(c).toMatchObject({ code: 'E_ROW_DUP_ID', scope: 'worksheet', row: 2 });
  });
  test('collision with an existing cohort student is reported', () => {
    const c = FK.sidCollision('9900009', entries, existing, 4);
    expect(c).toMatchObject({ scope: 'cohort' });
  });
  test('exceptRow excludes the row being edited from self-collision', () => {
    const e2 = [{ row: 4, name: 'Kiri', identifier: '9900003', keyType: 'sid' }];
    expect(FK.sidCollision('9900003', e2, [], 4)).toBeNull();
  });
});

describe('buildCohortImport — dedup is case-insensitive (matches store keying)', () => {
  test('an import matches an existing record whose sid key differs only in case', () => {
    const existing = [{ name: 'Kiri Modell', studentId: 'AB1234', key: 'sid:ab1234',
                        scoreResult: { rows: [{ grade: 'B' }] } }];
    const res = FK.buildCohortImport([imp('Kiri Modell', 'AB1234', 'P', 'sid')], existing);
    expect(res.toAdd).toHaveLength(0);                 // matched the marked record -> skipped
    expect(res.skippedExisting).toHaveLength(1);
  });

  test('a name-keyed existing student does NOT absorb a sid-keyed import', () => {
    const existing = [{ name: 'Kiri Modell', key: 'name:kiri modell',
                        scoreResult: { rows: [{ grade: 'B' }] } }];
    const res = FK.buildCohortImport([imp('Kiri Modell', '9900011', 'P', 'sid')], existing);
    expect(res.toAdd).toHaveLength(1);                 // no name fallback, so no false match
    expect(res.skippedExisting).toHaveLength(0);
  });
});
