/**
 * @jest-environment jsdom
 *
 * Marker-name disclosure — the student-facing "Marked by: ..." footer on
 * Feedback Kitchen's print/PDF output (see docs/plan discussion, FK marker
 * name feature).
 *
 * Two layers, matching the codebase's existing test conventions:
 *  1. computeMarkerFooter is a pure function in shared.js — tested
 *     functionally via a real require(), same pattern as js/shared.test.js.
 *  2. Everything else (session-default vs. persisted-record wiring,
 *     print-cleanliness, checkbox markup) is DOM/session-state logic baked
 *     into the scorer's monolithic controller, which the repo tests as
 *     source-string wiring guards (see js/tutor-privacy.test.js) rather than
 *     full jsdom simulation.
 *
 * Design invariants this guards:
 *  - Disclosure is a per-record boolean (record.markerDisclosure), stamped
 *    once at save; it is never re-derived live at render/export time.
 *  - The footer is presentation-only — never merged into feedbackText, so it
 *    can never leak into copied feedback, Moodle CSV, Excel exports, or the
 *    moderation export.
 *  - A transient sessionMarkerDisclosureDefault seeds the checkbox for each
 *    NEW student and carries forward between them, but reopening an existing
 *    saved record must never read from or write to that default
 *    (_reopenedRecordActive guards this).
 *  - Marker name is displayed verbatim (trimmed only) — no parsing/splitting.
 *  - #sec-student (Marker/Name/ID/Date + the new checkbox/hint) must be
 *    excluded from print; #marker-footer must not be.
 */

function loadShared() {
  jest.resetModules();
  delete global.window.SA;
  require('./shared.js');
  return global.window.SA;
}

const html = require('./scorer-source')();

describe('computeMarkerFooter (pure function)', () => {
  test('disclosure false → no footer, regardless of tutor value', () => {
    const SA = loadShared();
    expect(SA.computeMarkerFooter('A. Smith', false)).toBe('');
    expect(SA.computeMarkerFooter('', false)).toBe('');
  });

  test('disclosure true + blank/whitespace-only tutor → no footer', () => {
    const SA = loadShared();
    expect(SA.computeMarkerFooter('', true)).toBe('');
    expect(SA.computeMarkerFooter('   ', true)).toBe('');
    expect(SA.computeMarkerFooter(undefined, true)).toBe('');
  });

  test('disclosure true + populated tutor → exact "Marked by: <name>", trimmed', () => {
    const SA = loadShared();
    expect(SA.computeMarkerFooter('A. Smith', true)).toBe('Marked by: A. Smith');
    expect(SA.computeMarkerFooter('  A. Smith  ', true)).toBe('Marked by: A. Smith');
  });

  test('multiple names are shown verbatim — no splitting, joining, or reformatting', () => {
    const SA = loadShared();
    expect(SA.computeMarkerFooter('A. Smith, J. Ng', true)).toBe('Marked by: A. Smith, J. Ng');
    expect(SA.computeMarkerFooter('A. Smith & J. Ng and R. Lee', true))
      .toBe('Marked by: A. Smith & J. Ng and R. Lee');
  });

  test('exported via window.SA', () => {
    const SA = loadShared();
    expect(typeof SA.computeMarkerFooter).toBe('function');
  });
});

describe('marker-disclosure UI wiring', () => {
  test('checkbox and hint markup exist and are wired to S.onMarkerDisclosureChange()', () => {
    expect(html).toMatch(/id="marker-disclosure"/);
    expect(html).toMatch(/onchange="S\.onMarkerDisclosureChange\(\)"/);
    expect(html).toMatch(/id="marker-disclosure-hint"/);
  });

  test('Marker field title documents verbatim display', () => {
    expect(html).toMatch(/Enter the name or names exactly as you want them shown to the student\./);
  });

  test('footer element and preview label exist near the feedback textarea', () => {
    expect(html).toMatch(/id="marker-footer"/);
    expect(html).toMatch(/Student feedback preview/);
  });

  test('updateMarkerFooter reads live tutor + checkbox state via SA.computeMarkerFooter', () => {
    expect(html).toMatch(/function updateMarkerFooter\(/);
    const fn = html.slice(html.indexOf('function updateMarkerFooter('), html.indexOf('function updateMarkerFooter(') + 600);
    expect(fn).toMatch(/SA\.computeMarkerFooter/);
    expect(fn).toMatch(/student-tutor/);
    expect(fn).toMatch(/marker-disclosure/);
  });
});

describe('print-cleanliness', () => {
  test('#sec-student itself is NOT excluded from print — Name/ID/Date must stay visible', () => {
    expect(html).not.toMatch(/id="sec-student"\s+class="[^"]*\bno-print\b/);
  });

  test('only the Marker field + disclosure checkbox + hint are wrapped in a no-print container', () => {
    expect(html).toMatch(/<div class="no-print">\s*<label for="student-tutor"/);
    // The Marker's no-print wrapper must contain the disclosure checkbox and hint too.
    const idx = html.search(/<div class="no-print">\s*<label for="student-tutor"/);
    expect(idx).toBeGreaterThan(-1);
    const closeIdx = html.indexOf('</div>', idx);
    const wrapper = html.slice(idx, closeIdx);
    expect(wrapper).toMatch(/id="marker-disclosure"/);
    expect(wrapper).toMatch(/id="marker-disclosure-hint"/);
  });

  test('Student Name, Student ID, and Date fields are NOT wrapped in no-print containers', () => {
    expect(html).toMatch(/<div>\s*<label for="student-name"/);
    expect(html).toMatch(/<div>\s*<label for="student-id"/);
    expect(html).toMatch(/<div>\s*<label for="student-date"/);
  });

  test('the "Student feedback preview" label is print-hidden', () => {
    expect(html).toMatch(/class="no-print[^"]*"[^>]*>\s*Student feedback preview/);
  });

  test('#marker-footer itself is NOT tagged no-print', () => {
    const idx = html.indexOf('id="marker-footer"');
    expect(idx).toBeGreaterThan(-1);
    const tagStart = html.lastIndexOf('<div', idx);
    const tag = html.slice(tagStart, idx + 40);
    expect(tag).not.toMatch(/no-print/);
  });

  test('private marker\'s notes section remains excluded from print (pre-existing, unchanged)', () => {
    expect(html).toMatch(/id="sec-notes"\s+class="[^"]*\bno-print\b/);
  });
});

describe('session-default vs. persisted-record model', () => {
  test('sessionMarkerDisclosureDefault and _reopenedRecordActive are declared', () => {
    expect(html).toMatch(/let sessionMarkerDisclosureDefault\s*=\s*false/);
    expect(html).toMatch(/let _reopenedRecordActive\s*=\s*false/);
  });

  test('checkbox change only updates the session default when not viewing a reopened record', () => {
    expect(html).toMatch(/function onMarkerDisclosureChange\(/);
    const fn = html.slice(html.indexOf('function onMarkerDisclosureChange('), html.indexOf('function onMarkerDisclosureChange(') + 400);
    expect(fn).toMatch(/!_reopenedRecordActive/);
    expect(fn).toMatch(/sessionMarkerDisclosureDefault\s*=/);
  });

  test('confirmNewStudent seeds the checkbox from the session default and clears the reopened flag', () => {
    const fn = html.slice(html.indexOf('function confirmNewStudent('), html.indexOf('function confirmNewStudent(') + 800);
    expect(fn).toMatch(/_reopenedRecordActive\s*=\s*false/);
    expect(fn).toMatch(/checked\s*=\s*sessionMarkerDisclosureDefault/);
  });

  test('loadCohortRecordIntoSession repopulates the checkbox from the record and flags reopened state', () => {
    const fn = html.slice(html.indexOf('function loadCohortRecordIntoSession('), html.indexOf('function loadCohortRecordIntoSession(') + 1200);
    expect(fn).toMatch(/_reopenedRecordActive\s*=\s*true/);
    expect(fn).toMatch(/rec\.markerDisclosure/);
  });

  test('switchTutor resets the session default, the reopened flag, and unchecks the box', () => {
    const fn = html.slice(html.indexOf('function switchTutor('), html.indexOf('function switchTutor(') + 600);
    expect(fn).toMatch(/sessionMarkerDisclosureDefault\s*=\s*false/);
    expect(fn).toMatch(/_reopenedRecordActive\s*=\s*false/);
  });

  test('saved cohort record stamps markerDisclosure from the checkbox at save time', () => {
    expect(html).toMatch(/markerDisclosure:\s*!!\(el\('marker-disclosure'\)/);
  });

  test('draft persistence excludes disclosure under the same shared-machine guard as tutor', () => {
    expect(html).toMatch(/markerDisclosure:\s*getSetting\('clearTutorBetweenStudents',\s*false\)\s*\?\s*false\s*:/);
  });
});

describe('draft resumption — a resumed draft continues the prior session', () => {
  // A resumed unsaved draft is treated as a continuation of the marker's prior
  // session, not as reopening a saved record: it restores the checkbox AND
  // rolls that value into sessionMarkerDisclosureDefault, so later NEW students
  // in the same resumed session keep carrying it forward — exactly like tutor.
  // On shared devices, clearTutorBetweenStudents already zeroes both studentTutor
  // and markerDisclosure at draft-save time (previous describe block), so there
  // is nothing sensitive left in the draft for a resumed session to restore.
  test('resumeDraft restores the checkbox and session default from the draft, not from a reopened record', () => {
    const fn = html.slice(html.indexOf('function resumeDraft('), html.indexOf('function resumeDraft(') + 1600);
    expect(fn).toMatch(/_mdResume\.checked\s*=\s*!!d\.markerDisclosure/);
    expect(fn).toMatch(/sessionMarkerDisclosureDefault\s*=\s*!!d\.markerDisclosure/);
    expect(fn).toMatch(/_reopenedRecordActive\s*=\s*false/);
  });

  test('clearTutorBetweenStudents prevents marker name and disclosure from being restored on shared devices', () => {
    // Same guard, same shape, so a shared-device draft carries neither the
    // marker's name nor their disclosure preference — restoring the draft on
    // the next marker's session can't leak either one.
    expect(html).toMatch(/studentTutor:\s*getSetting\('clearTutorBetweenStudents',\s*false\)\s*\?\s*''\s*:/);
    expect(html).toMatch(/markerDisclosure:\s*getSetting\('clearTutorBetweenStudents',\s*false\)\s*\?\s*false\s*:/);
  });
});

describe('Moodle CSV / Excel export regression — footer must never appear there', () => {
  const fs = require('fs');
  const path = require('path');
  const moodleSrc = fs.readFileSync(path.join(__dirname, 'moodle-worksheet.js'), 'utf8');
  const excelSrc = fs.readFileSync(path.join(__dirname, 'excel.js'), 'utf8');

  test('js/moodle-worksheet.js is untouched by this feature', () => {
    expect(moodleSrc).not.toMatch(/markerDisclosure/);
    expect(moodleSrc).not.toMatch(/computeMarkerFooter/);
    expect(moodleSrc).not.toMatch(/Marked by/);
    // Feedback comments column still writes feedbackText verbatim.
    expect(moodleSrc).toMatch(/cells\[fbCol\]\s*=\s*String\(rec\.feedbackText \|\| ''\)/);
  });

  test('js/excel.js is untouched by this feature — Marker column stays unconditional', () => {
    expect(excelSrc).not.toMatch(/markerDisclosure/);
    expect(excelSrc).not.toMatch(/computeMarkerFooter/);
    expect(excelSrc).not.toMatch(/Marked by/);
    expect(excelSrc).toMatch(/'Marker',\s*student\.tutor \|\| ''/);
  });
});
