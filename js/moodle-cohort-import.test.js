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

describe('storeKey / recordHasMarks', () => {
  test('storeKey mirrors studentMatchKey (sid lower-cased, name fallback)', () => {
    expect(FK.storeKey('9900001', 'X')).toBe('sid:9900001');
    expect(FK.storeKey('', 'Kiri Modell')).toBe('name:kiri modell');
    expect(FK.storeKey('', '')).toBeNull();
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
    imp('Kiri Modell',   '',        'Participant 8880011', 'name'), // verify→import, name-keyed
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
  test('summary tallies add / skippedExisting / skippedRow', () => {
    expect(res.summary).toEqual({ add: 2, skippedExisting: 1, skippedRow: 2 });
  });
});

describe('buildCohortImport — identity-only placeholder shape', () => {
  const res = FK.buildCohortImport([imp('Kiri Modell', '', 'Participant 8880011', 'name')], []);
  const rec = res.toAdd[0];
  test('name-keyed import seeds name + retained Moodle participant, blank studentId', () => {
    expect(rec).toMatchObject({
      name: 'Kiri Modell', studentId: '', moodleIdentifier: 'Participant 8880011', source: 'moodle-worksheet'
    });
  });
  test('the placeholder carries NO marking (no scoreResult / markerNotes)', () => {
    expect(rec.scoreResult).toBeUndefined();
    expect(rec.markerNotes).toBeUndefined();
  });
});

describe('buildCohortImport — dedup is case-insensitive (matches store keying)', () => {
  test('a name-only import matches an existing record keyed lower-case', () => {
    const existing = [{ name: 'Kiri Modell', key: 'name:kiri modell', scoreResult: { rows: [{ grade: 'B' }] } }];
    const res = FK.buildCohortImport([imp('Kiri Modell', '', 'P', 'name')], existing);
    expect(res.toAdd).toHaveLength(0);                 // matched the marked record → skipped
    expect(res.skippedExisting).toHaveLength(1);
  });
});
