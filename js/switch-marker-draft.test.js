/**
 * @jest-environment jsdom
 *
 * FK-33 — behavioural guard for Switch marker's draft handling.
 *
 * Every other scorer test in this suite is a structural guard: it greps the
 * concatenated source for load-bearing wiring (see js/scorer-source.js). Those
 * guards cannot see the sense of a condition. js/tutor-privacy.test.js asserts
 * that switchTutor() mentions clearDraft() and _sessionHasUnsavedWork(), which
 * stays true if the guard is inverted to `if (_sessionHasUnsavedWork())` — the
 * exact regression that would hand one marker's unfinished work to the next.
 *
 * So this file boots the real scorer in jsdom and drives it. It is slower than
 * the greps and it is the only test here that executes scorer-app.js, which is
 * why it covers one behaviour rather than the module at large:
 *
 *   with unsaved marking work  → Switch marker KEEPS the draft
 *   with no unsaved work       → Switch marker CLEARS the stale draft
 *
 * The safety rationale is in issue #129: markers are told to use this control
 * when handing over a shared machine, so which of those two branches runs
 * decides whether the next person can resume the previous person's student.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DRAFT_KEY = 'SA_DRAFT_V1_test-scorer';

const CONFIG = {
  id: 'test-scorer',
  name: 'Test Scorer',
  assessmentTitle: 'Essay',
  courseName: 'TEST101',
  universityName: 'Test U',
  assignmentInfo: '',
  version: '1.0',
  appVersion: '2.5.1',
  gradeScale: [
    { grade: 'A', midpoint: 85, bandLow: 80, bandHigh: 100, tier: 'excellent' },
    { grade: 'C', midpoint: 65, bandLow: 60, bandHigh: 69,  tier: 'developing' }
  ],
  criteria: [
    { id: 'c1', name: 'Argument', weight: 60,
      rubric: { excellent: 'Strong', proficient: 'Sound', developing: 'Thin', unsatisfactory: 'Absent' } },
    { id: 'c2', name: 'Referencing', weight: 40,
      rubric: { excellent: 'Clean', proficient: 'Minor slips', developing: 'Inconsistent', unsatisfactory: 'Missing' } }
  ],
  gradeFeedback: [],
  latePenalties: [],
  enableLatePenalties: false
};

/** Boot scorer.html + shared.js + scorer-app.js into this jsdom window. */
function bootScorer() {
  const html = fs.readFileSync(path.join(ROOT, 'scorer.html'), 'utf8');
  document.documentElement.innerHTML = html.replace(/<!DOCTYPE[^>]*>/i, '');

  // jsdom gaps the app touches during init.
  window.CSS = { escape: (s) => String(s), supports: () => false };
  window.scrollTo = () => {};

  window.eval(fs.readFileSync(path.join(ROOT, 'js', 'shared.js'), 'utf8'));
  window.SA.saveConfig(CONFIG);
  window.SA.setActiveId(CONFIG.id);

  // scorer-app.js declares `const S` at global scope. That is a lexical
  // binding, not a window property: a real browser resolves it for inline
  // handlers like oninput="S.onStudentChange()", jsdom does not. Publishing it
  // on window is what makes the page's own wiring run in here.
  window.eval(fs.readFileSync(path.join(ROOT, 'js', 'scorer-app.js'), 'utf8') + '\n;window.S = S;');
  window.S.init();
  return window.S;
}

/** Type into a field the way a marker would, firing the app's input handlers. */
function type(id, value) {
  const elt = document.getElementById(id);
  elt.value = value;
  elt.dispatchEvent(new window.Event('input', { bubbles: true }));
}

/** Grade one criterion through the app's own change handler. */
function grade(S, i, value) {
  document.getElementById('grade-sel-' + i).value = value;
  S.onGradeChange(i);
}

function readDraft() {
  const raw = localStorage.getItem(DRAFT_KEY);
  return raw ? JSON.parse(raw) : null;
}

describe('FK-33 · Switch marker and the in-progress draft', () => {
  let S;

  beforeEach(() => {
    jest.useFakeTimers();
    localStorage.clear();
    S = bootScorer();
  });

  afterEach(async () => {
    // scorer.html's collapsible sections carry a 'toggle' listener
    // (wireSectionStatePersistence, js/scorer-app.js:3783). jsdom dispatches
    // toggle asynchronously on its own timer, which jest's fake timers do not
    // control. Left queued, it fires after the environment is torn down and
    // crashes the worker. Hand the queue a real tick while the window is still
    // alive, then drop the DOM.
    jest.clearAllTimers();
    jest.useRealTimers();
    await new Promise((resolve) => setTimeout(resolve, 0));
    document.documentElement.innerHTML = '';
  });

  test('keeps the draft when there is unsaved marking work', () => {
    type('student-tutor', 'SM');
    type('student-name', 'Ada Lovelace');
    type('student-id', 's1234567');
    grade(S, 0, 'A');
    jest.advanceTimersByTime(2000);          // let the debounced autosave land

    const before = readDraft();
    expect(before).not.toBeNull();           // a draft exists = there is unsaved work
    expect(before.studentName).toBe('Ada Lovelace');

    S.switchTutor();
    jest.advanceTimersByTime(2000);          // the input event reschedules a save

    const after = readDraft();
    expect(after).not.toBeNull();            // THE POINT: handover does not discard work
    expect(after.studentName).toBe('Ada Lovelace');
    expect(after.studentId).toBe('s1234567');
    expect(after.studentGrades[0].grade).toBe('A');

    // Only the marker attribution is dropped, in the field and in the draft.
    expect(document.getElementById('student-tutor').value).toBe('');
    expect(after.studentTutor).toBe('');
  });

  test('clears a stale draft when there is no unsaved marking work', () => {
    // A draft left behind by an earlier session, with nothing graded now.
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ scorerId: CONFIG.id, studentName: 'Stale' }));
    type('student-tutor', 'SM');

    S.switchTutor();
    jest.advanceTimersByTime(2000);

    expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
  });
});
