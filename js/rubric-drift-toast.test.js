/**
 * @jest-environment node
 *
 * FK-54 — the "Rubric has changed since this record was saved" toast must not fire for a
 * record that was never marked.
 *
 * loadCohortRecordIntoSession raised the toast whenever savedGrades.length differed from the
 * criteria count. A Moodle-imported placeholder is seeded with identity only — buildCohortImport
 * deliberately writes no scoreResult and no grades — so its savedGrades.length is 0 against N
 * criteria and the bare length test fired every time. Nothing had changed, and the record was
 * never saved *from* marking, so the message was simply untrue.
 *
 * It was pre-existing (FK-27's post-import auto-open tripped it), but FK-53 and FK-55 together
 * turned it from once-per-import into once-per-student in every mode, because a marker now
 * advances through the roster opening one unmarked placeholder after another. A warning that
 * cries wolf on every student trains markers to dismiss the one case where the rubric genuinely
 * did change mid-cohort — the FK-11 / FK-25 signal the toast exists to carry.
 *
 * Two halves are tested: the predicate itself (unit, against the exact record shapes involved)
 * and the gating in scorer.html (static, because the toast is browser-only).
 *
 * Run with: npx jest js/rubric-drift-toast.test.js
 */

const fs = require('fs');
const path = require('path');

const FKMoodle = require('./moodle-worksheet.js');
/* Markup plus js/scorer-app.js: the scorer's logic is no longer inline,
   so reading the page alone would stop seeing what this guard checks. */
const html = require('./scorer-source')();
const idx = (s) => html.indexOf(s);

describe('FK-54 recordHasMarks separates "never marked" from "marked"', () => {
  test('a Moodle-imported placeholder reads as unmarked', () => {
    // Exactly what buildCohortImport seeds: identity only, no scoreResult, no grades.
    const placeholder = { name: 'Alan Turing', studentId: 'S001', key: 'sid:s001',
                          moodleIdentifier: 'Participant 1234', source: 'moodle-worksheet' };
    expect(FKMoodle.recordHasMarks(placeholder)).toBe(false);
  });

  test('a record saved from marking reads as marked, in either shape', () => {
    expect(FKMoodle.recordHasMarks({ scoreResult: { rows: [{ grade: 'B' }] } })).toBe(true);
    expect(FKMoodle.recordHasMarks({ grades: [{ grade: 'B' }] })).toBe(true);
  });

  test('a grades array holding no grade values reads as unmarked', () => {
    // The one shape where recordHasMarks beats a raw `savedGrades.length &&` check: a length
    // test sees rows and fires; nothing was ever marked, so the message is still untrue.
    const rowsButNoGrades = { name: 'Ada', grades: [{ grade: '' }, { grade: '' }, {}] };
    expect(FKMoodle.recordHasMarks(rowsButNoGrades)).toBe(false);
    expect(rowsButNoGrades.grades.length).toBeGreaterThan(0);   // the length check would fire
  });

  test('a partially marked record still reads as marked', () => {
    // One graded criterion out of several is marking; a rubric change still deserves the warning.
    expect(FKMoodle.recordHasMarks({ grades: [{ grade: '' }, { grade: 'C' }] })).toBe(true);
  });

  test('missing and empty records read as unmarked', () => {
    expect(FKMoodle.recordHasMarks(null)).toBe(false);
    expect(FKMoodle.recordHasMarks(undefined)).toBe(false);
    expect(FKMoodle.recordHasMarks({})).toBe(false);
    expect(FKMoodle.recordHasMarks({ grades: [] })).toBe(false);
  });
});

describe('FK-54 the toast is gated on the record having been marked', () => {
  const region = html.slice(idx('function loadCohortRecordIntoSession(key)'),
                            idx('function loadCohortRecordIntoSession(key)') + 4000);

  test('the length test alone no longer raises the toast', () => {
    // The bug in one line: `if (savedGrades.length !== config.criteria.length)` with nothing
    // in front of it fires for every unmarked placeholder.
    expect(region).not.toMatch(/if \(savedGrades\.length !== config\.criteria\.length\)/);
  });

  test('the toast requires wasMarked as well as the length mismatch', () => {
    expect(region).toMatch(/if \(wasMarked && savedGrades\.length !== config\.criteria\.length\)/);
    const guard = region.slice(region.indexOf('if (wasMarked'));
    expect(guard).toMatch(/Rubric has changed since this record was saved/);
  });

  test('wasMarked is derived from recordHasMarks, the shared definition', () => {
    // Not a local re-implementation: the worksheet export and FK-53's nextUnmarkedKey read the
    // same predicate, so "was this marked?" cannot mean different things in different places.
    expect(region).toMatch(/recordHasMarks\(rec\)/);
  });

  test('the fallback degrades to the length check, never back to firing unconditionally', () => {
    // If the module were absent, falling back to `true` would reinstate the defect.
    expect(region).toMatch(/:\s*savedGrades\.length > 0/);
    expect(region).not.toMatch(/recordHasMarks\(rec\)\s*:\s*true/);
  });

  test('the toast text itself is unchanged', () => {
    // The message is correct for a genuinely drifted record; only who sees it changes.
    expect(html).toMatch(/Rubric has changed since this record was saved — review each row\./);
  });
});
