/**
 * @jest-environment node
 *
 * FK-53 — "Save & next student".
 *
 * The defect this guards against is silent and invisible at the moment it happens.
 * Persisting a marked student into the cohort was a side effect of copyFeedback() and
 * downloadExcel(), both named for something else, and nothing in the marking area
 * advanced to the next student. Because buildExportWorksheet fills Grade and Feedback
 * from the saved cohort record — never the clipboard — and silently skips any record
 * with no marking, a marker who graded a student and moved on without pressing "Copy
 * to clipboard" exported that student's row blank. No warning at marking time, none at
 * export time (the file generates fine), and the failure surfaces only in Moodle after
 * upload, or not at all.
 *
 * Two halves are tested here:
 *   1. nextUnmarkedKey — pure selection, unit-tested directly.
 *   2. the wiring in scorer.html — static assertions, because the trap is closed by
 *      *where* the advance happens (inside the save's success callback) as much as by
 *      the selection being right.
 *
 * Run with: npx jest js/save-and-next-student.test.js
 */

const fs = require('fs');
const path = require('path');

const FKMoodle = require('./moodle-worksheet.js');
/* Markup plus js/scorer-app.js: the scorer's logic is no longer inline,
   so reading the page alone would stop seeing what this guard checks. */
const html = require('./scorer-source')();
const idx = (s) => html.indexOf(s);

/* Cohort records as the store actually holds them: marked records carry a scoreResult
   with graded rows, imported placeholders carry identity only (buildCohortImport
   deliberately seeds no scoreResult). */
const marked   = (name, sid) => ({ name, studentId: sid, key: 'sid:' + sid.toLowerCase(),
                                   scoreResult: { rows: [{ grade: 'B' }] } });
const unmarked = (name, sid) => ({ name, studentId: sid, key: 'sid:' + sid.toLowerCase(),
                                   source: 'moodle-worksheet' });

describe('FK-53 nextUnmarkedKey — selecting the next student to mark', () => {
  test('returns the first record with no marking, in cohort order', () => {
    const students = [marked('Ada', 'S1'), unmarked('Alan', 'S2'), unmarked('Grace', 'S3')];
    expect(FKMoodle.nextUnmarkedKey(students)).toBe('sid:s2');
  });

  test('skips records that are already marked', () => {
    const students = [marked('Ada', 'S1'), marked('Alan', 'S2'), unmarked('Grace', 'S3')];
    expect(FKMoodle.nextUnmarkedKey(students)).toBe('sid:s3');
  });

  test('treats a record graded via the grades array (no scoreResult) as marked', () => {
    // loadCohortRecordIntoSession restores both shapes; recordHasMarks accepts either.
    const viaGrades = { name: 'Ada', studentId: 'S1', key: 'sid:s1', grades: [{ grade: 'A' }] };
    expect(FKMoodle.nextUnmarkedKey([viaGrades, unmarked('Alan', 'S2')])).toBe('sid:s2');
  });

  test('an empty grades array is not marking', () => {
    const empty = { name: 'Ada', studentId: 'S1', key: 'sid:s1', grades: [] };
    expect(FKMoodle.nextUnmarkedKey([empty])).toBe('sid:s1');
  });

  test('excludeKey skips the record just saved, so the flow cannot re-land on it', () => {
    const students = [unmarked('Ada', 'S1'), unmarked('Alan', 'S2')];
    expect(FKMoodle.nextUnmarkedKey(students, 'sid:s1')).toBe('sid:s2');
  });

  test('returns null when every student is marked — the run is complete, not an error', () => {
    const students = [marked('Ada', 'S1'), marked('Alan', 'S2')];
    expect(FKMoodle.nextUnmarkedKey(students)).toBeNull();
  });

  test('returns null for an empty, missing or all-null roster', () => {
    expect(FKMoodle.nextUnmarkedKey([])).toBeNull();
    expect(FKMoodle.nextUnmarkedKey(undefined)).toBeNull();
    expect(FKMoodle.nextUnmarkedKey([null, undefined])).toBeNull();
  });

  test('skips records with no resolvable key — nothing can re-open them', () => {
    const keyless = { name: '', studentId: '' };
    expect(FKMoodle.nextUnmarkedKey([keyless, unmarked('Alan', 'S2')])).toBe('sid:s2');
    expect(FKMoodle.nextUnmarkedKey([keyless])).toBeNull();
  });

  test('derives a key from name or id when the record has no stored key', () => {
    expect(FKMoodle.nextUnmarkedKey([{ name: 'Ada Lovelace' }])).toBe('name:ada lovelace');
    expect(FKMoodle.nextUnmarkedKey([{ studentId: 'S9' }])).toBe('sid:s9');
  });

  test('agrees with the export about who still needs marking', () => {
    // The point of sharing recordHasMarks: a record the export would silently skip is
    // exactly a record this offers to the marker. If these ever disagree, blank rows return.
    const students = [marked('Ada', 'S1'), unmarked('Alan', 'S2')];
    const nextKey = FKMoodle.nextUnmarkedKey(students);
    const picked = students.find(s => s.key === nextKey);
    expect(FKMoodle.recordHasMarks(picked)).toBe(false);
  });
});

describe('FK-53 the control exists and is wired to the shared handler', () => {
  test('the button exists and calls the handler', () => {
    expect(html).toMatch(/id="save-next-student"/);
    const btn = html.slice(idx('id="save-next-student"'), idx('id="save-next-student"') + 500);
    expect(btn).toMatch(/S\.saveAndNextStudent\(\)/);
  });

  test('it is hidden inline, not with the `hidden` class', () => {
    // FK-49: `.btn { display: inline-flex }` outranks `.hidden { display: none }`, so a
    // `.btn` carrying `hidden` renders visible. That shipped to production on three controls.
    const btn = html.slice(idx('id="save-next-student"'), idx('id="save-next-student"') + 500);
    expect(btn).toMatch(/style="display:none"/);
    expect(btn).not.toMatch(/class="[^"]*\bhidden\b/);
  });

  test('the handler and its visibility refresh are exposed on the S namespace', () => {
    expect(html).toMatch(/saveAndNextStudent,\s*refreshSaveNextVisibility,/);
  });

  test('visibility is re-evaluated whenever the cohort changes', () => {
    const refresh = html.slice(idx('function refreshCohortUI()'),
                               idx('function refreshCohortUI()') + 1800);
    expect(refresh).toMatch(/refreshSaveNextVisibility\(\)/);
  });
});

/**
 * FK-55 — one instance, in a container no mode hides.
 *
 * FK-53 put the control in #sec-feedback. Focus mode hides that entire section
 * (`.fk-focus-on #sec-rubric, .fk-focus-on #sec-feedback { display: none !important }`), so it
 * rendered 0x0 and was unreachable there. The handler was never the problem: the button's own
 * computed display was `flex`; its *ancestor* was `display: none`, which no amount of toggling
 * the button could beat. In Focus mode the only reachable ways to persist a student were
 * copyFeedback() and downloadExcel() — the unnamed side effects FK-53 exists to replace — so
 * the defect was fully intact on the fastest marking path.
 *
 * The fix is placement, not duplication. #sticky-action-bar is `fixed` and sits outside
 * <main>, so no mode hides it. One instance there is reachable everywhere, and cannot regress
 * the way a mode-scoped container can. An earlier revision of this card added a twin inside
 * #focus-workspace; that worked but left the app one CSS rule from the same class of bug, and
 * needed a mutual-exclusion invariant to stay correct. Single instance needs no invariant.
 *
 * The original FK-53 guard asserted the control sat inside #sec-feedback, and passed happily
 * while the bug was live, because single-section placement WAS the bug. It is gone. What
 * replaces it asserts the property that actually matters: the control is not inside any
 * container a mode can hide.
 */
describe('FK-55 the control lives where no mode can hide it', () => {
  test('exactly one instance exists in the document', () => {
    // Two instances would mean a mode-dependent invariant to keep them in step. There is none.
    const instances = [...html.matchAll(/id="save-next-student"/g)];
    expect(instances).toHaveLength(1);
    expect(html).not.toMatch(/id="focus-save-next-student"/);
  });

  test('it sits in #sticky-action-bar, outside <main>', () => {
    // The bar is `fixed bottom-0` and declared after </main>, so no section-level rule —
    // present or future — can take it off screen with it.
    const bar     = idx('id="sticky-action-bar"');
    const button  = idx('id="save-next-student"');
    const mainEnd = html.indexOf('</main>');
    expect(bar).toBeGreaterThan(-1);
    expect(button).toBeGreaterThan(bar);
    expect(button).toBeGreaterThan(mainEnd);
  });

  test('it is not inside any container a mode hides', () => {
    // Proof of non-containment, not merely of ordering: every section Focus mode manipulates
    // opens AND closes inside <main>, and the button is after </main>, so it cannot be a
    // descendant of any of them.
    const button  = idx('id="save-next-student"');
    const mainEnd = html.indexOf('</main>');
    expect(mainEnd).toBeGreaterThan(-1);
    ['id="sec-feedback"', 'id="sec-rubric"', 'id="focus-workspace"'].forEach(function (sectionId) {
      const start = idx(sectionId);
      expect(start).toBeGreaterThan(-1);
      expect(start).toBeLessThan(mainEnd);
    });
    expect(button).toBeGreaterThan(mainEnd);
  });

  test('it is last in the sticky bar, after "Copy feedback"', () => {
    // Matches where it sat after "Copy to clipboard" in #sec-feedback, so the action keeps the
    // same relative position in its row. "New student" and "Copy feedback" precede it.
    const bar   = html.slice(idx('id="sticky-action-bar"'));
    const newSt = bar.indexOf('S.newStudent()');
    const copy  = bar.indexOf('S.copyFeedback()');
    const save  = bar.indexOf('id="save-next-student"');
    expect(newSt).toBeGreaterThan(-1);
    expect(copy).toBeGreaterThan(newSt);
    expect(save).toBeGreaterThan(copy);
  });

  test('it is NOT in the criterion navigation row', () => {
    // "← Previous" / "Next →" (#focus-prev / #focus-next) are criterion-scoped. A student-scoped
    // control beside them is the "which one do I press?" trap FK-53's risk list names.
    const button = idx('id="save-next-student"');
    expect(button).toBeGreaterThan(idx('id="focus-next"'));
    expect(button).toBeGreaterThan(idx('id="focus-prev"'));
  });

  test('the shared-hook indirection is gone with the twin', () => {
    const fn = html.slice(idx('function refreshSaveNextVisibility()'),
                          idx('function refreshSaveNextVisibility()') + 1200);
    expect(fn).toMatch(/el\('save-next-student'\)/);
    expect(html).not.toMatch(/data-fk-savenext/);
  });

  test('the sticky bar can wrap, so the row must not assume one line', () => {
    // The bar is flex-wrap: a third button can push to a second line on a narrow viewport.
    // That is acceptable (the bar grows upward), but the class must stay for it to be safe.
    const bar = html.slice(idx('id="sticky-action-bar"'), idx('id="sticky-action-bar"') + 900);
    expect(bar).toMatch(/flex-wrap/);
  });
});

describe('FK-53 the advance is gated on the save actually succeeding', () => {
  test('saveCurrentStudentToCohort invokes opts.onSaved only after a successful write', () => {
    const save = html.slice(idx('function saveCurrentStudentToCohort(opts)'),
                            idx('function cloneScoreResultForStorage'));
    expect(save).toMatch(/opts\.onSaved\(result, record\)/);
    // The callback must sit after the early return on a failed save, inside the
    // ensureCohortInitialised callback where the record has actually been stored.
    expect(save.indexOf('if (!result.saved)')).toBeLessThan(save.indexOf('opts.onSaved(result, record)'));
  });

  test('the handler advances inside onSaved, never on the straight-line return', () => {
    const handler = html.slice(idx('function saveAndNextStudent()'),
                               idx('function refreshSaveNextVisibility()'));
    expect(handler).toMatch(/onSaved:\s*function/);
    // The advance must be inside the callback body, after it opens.
    expect(handler.indexOf('onSaved:')).toBeLessThan(handler.indexOf('loadCohortRecordIntoSession'));
  });

  test('an exhausted roster ends the run instead of advancing to nothing', () => {
    const handler = html.slice(idx('function saveAndNextStudent()'),
                               idx('function refreshSaveNextVisibility()'));
    expect(handler).toMatch(/if \(!nextKey\)/);
    expect(handler).toMatch(/everyone in this cohort is now marked/);
  });
});

describe('FK-53 the rejected fix stays rejected', () => {
  test('"Copy to clipboard" keeps its name', () => {
    // Renaming it to something Moodle-shaped was considered and rejected: the clipboard
    // write is the one part of copyFeedback() with no bearing on the exported file. If a
    // later change renames it, that decision is being reversed and should be reargued.
    expect(html).toMatch(/onclick="S\.copyFeedback\(\)">Copy to clipboard</);
    expect(html).not.toMatch(/Copy to Moodle file/);
  });

  test('the two incidental save paths are untouched', () => {
    // copyFeedback + downloadExcel still save, silently and non-silently as before. This
    // card adds a third, named path; it does not move or rename the existing two.
    expect(html).toMatch(/saveCurrentStudentToCohort\(\{ silent: true \}\)/);
    expect(html).toMatch(/saveCurrentStudentToCohort\(\{ silent: false \}\)/);
  });
});
