/**
 * @jest-environment jsdom
 *
 * FK-56 — behavioural guard for what Copy feedback claims (issue #140).
 *
 * `copyFeedback` used to fire a green "added to cohort" toast immediately after
 * calling `saveCurrentStudentToCohort`, without checking whether a save had
 * happened. The save bails several ways and finishes asynchronously, so a marker
 * who had dismissed cohort setup could copy a whole run of students, see a green
 * confirmation each time, and store none of them.
 *
 * A grep cannot catch that: the old code and the new both mention the toast and
 * the save. What matters is whether the message follows the outcome, which only
 * running it shows. Same approach as js/switch-marker-draft.test.js, and the
 * same jsdom concessions (see the comments in bootScorer).
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const COHORT_KEY = 'SA_COHORT_test-scorer';

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
    { grade: 'C', midpoint: 65, bandLow: 60, bandHigh: 69, tier: 'developing' }
  ],
  criteria: [
    { id: 'c1', name: 'Argument', weight: 100,
      rubric: { excellent: 'Strong', proficient: 'Sound', developing: 'Thin', unsatisfactory: 'Absent' } }
  ],
  gradeFeedback: [],
  latePenalties: [],
  enableLatePenalties: false
};

/** Boot scorer.html + shared.js + scorer-app.js into this jsdom window. */
function bootScorer() {
  const html = fs.readFileSync(path.join(ROOT, 'scorer.html'), 'utf8');
  document.documentElement.innerHTML = html.replace(/<!DOCTYPE[^>]*>/i, '');

  window.CSS = { escape: (s) => String(s), supports: () => false };
  window.scrollTo = () => {};
  // The clipboard write is incidental here; stub it so the toast path is what runs.
  window.navigator.clipboard = { writeText: () => Promise.resolve() };

  window.eval(fs.readFileSync(path.join(ROOT, 'js', 'shared.js'), 'utf8'));
  window.SA.saveConfig(CONFIG);
  window.SA.setActiveId(CONFIG.id);

  // `const S` is a global lexical binding, which a browser resolves for inline
  // handlers and jsdom does not. Publishing it is what makes the page's own
  // wiring run in here.
  window.eval(fs.readFileSync(path.join(ROOT, 'js', 'scorer-app.js'), 'utf8') + '\n;window.S = S;');
  window.S.init();
  return window.S;
}

function type(id, value) {
  const elt = document.getElementById(id);
  elt.value = value;
  elt.dispatchEvent(new window.Event('input', { bubbles: true }));
}

function grade(S, i, value) {
  document.getElementById('grade-sel-' + i).value = value;
  S.onGradeChange(i);
}

/**
 * The most recent cohort toast, as text and colour.
 *
 * showCohortToast builds a div and appends it to body with no id, colouring it
 * bg-green-600 or bg-amber-600, so the last matching element is the message the
 * marker is looking at.
 */
function toast() {
  const all = Array.from(document.querySelectorAll('div[class*="bg-green-600"], div[class*="bg-amber-600"]'));
  const t = all[all.length - 1];
  if (!t) return { text: '', colour: null };
  return {
    text: (t.textContent || '').trim(),
    colour: /bg-green-600/.test(t.className) ? 'green' : 'amber'
  };
}

describe('FK-56 · Copy feedback reports the save it actually made', () => {
  let S;

  beforeEach(() => {
    jest.useFakeTimers();
    localStorage.clear();
    S = bootScorer();
  });

  afterEach(async () => {
    // scorer.html's collapsible sections carry a 'toggle' listener that jsdom
    // dispatches on its own timer, outside jest's fake ones. Left queued it fires
    // into a torn-down window and kills the worker.
    jest.clearAllTimers();
    jest.useRealTimers();
    await new Promise((resolve) => setTimeout(resolve, 0));
    document.documentElement.innerHTML = '';
  });

  test('a real save is announced as one', () => {
    type('student-name', 'Ada Lovelace');
    grade(S, 0, 'A');
    window.SA.initCohort(CONFIG.id, 'TEST101 S2', false);

    S.copyFeedback();
    jest.advanceTimersByTime(100);

    expect(localStorage.getItem(COHORT_KEY)).not.toBeNull();
    expect(toast().text).toMatch(/added to cohort/i);
    expect(toast().colour).toBe('green');
  });

  test('a skipped save is not announced as a save', () => {
    // No cohort, and setup was dismissed earlier in this session: the save skips.
    type('student-name', 'Ada Lovelace');
    grade(S, 0, 'A');
    S.hideCohortSetupModal();          // dismissing is what sets the session flag

    S.copyFeedback();
    jest.advanceTimersByTime(100);

    const said = toast().text;
    expect(localStorage.getItem(COHORT_KEY)).toBeNull();   // nothing was stored
    expect(said).toMatch(/not saved to cohort/i);          // and it says so
    expect(said).not.toMatch(/·\s*added to cohort/i);      // THE POINT: no false success
    expect(toast().colour).toBe('amber');
  });

  test('a save that already reported its own failure gets no second toast', () => {
    // The FK-24 paths (full quota, failed write) explain themselves in amber before
    // copyFeedback hears back. showCohortToast appends, so adding the clipboard half
    // here would stack a second amber under the message that matters. Raised on #155.
    type('student-name', 'Ada Lovelace');
    grade(S, 0, 'A');
    window.SA.initCohort(CONFIG.id, 'TEST101 S2', false);
    window.SA.addToCohort = () => ({ saved: false, reason: 'quota', message: 'Storage is full.' });

    S.copyFeedback();
    jest.advanceTimersByTime(100);

    const toasts = document.querySelectorAll('div[class*="bg-amber-600"]');
    expect(toasts.length).toBe(1);
    expect(toasts[0].textContent).toMatch(/storage is full/i);
  });

  test('an unidentified student is told, and not told they were saved', () => {
    grade(S, 0, 'A');                  // graded, but no name and no ID

    S.copyFeedback();
    jest.advanceTimersByTime(100);

    expect(localStorage.getItem(COHORT_KEY)).toBeNull();
    expect(toast().text).not.toMatch(/·\s*added to cohort/i);
  });
});
