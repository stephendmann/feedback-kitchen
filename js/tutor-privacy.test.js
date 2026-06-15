/**
 * FK-33 regression guard — tutor-name shared-machine safety.
 *
 * Locks in the wiring of the three mitigations so a refactor can't silently
 * drop them: (1) the always-visible "Marking as" topbar readout, (2) the
 * "Switch tutor" handover button, (3) the opt-in "Clear tutor between students"
 * setting (default OFF) that clears the field on New Student AND keeps the
 * tutor name out of the on-device draft. Also asserts layer 3 (cohort records
 * keep `tutor`) is intentionally NOT touched — it's required by the
 * moderation/multi-marker merge attribution.
 */
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'scorer.html'), 'utf8');

describe('FK-33 topbar readout + switch button', () => {
  test('topbar has the "Marking as" readout', () => {
    expect(html).toMatch(/id="marking-as-name"/);
    expect(html).toMatch(/Marking as:/);
  });
  test('Switch tutor button is wired to S.switchTutor()', () => {
    expect(html).toMatch(/onclick="S\.switchTutor\(\)"/);
    expect(html).toMatch(/function switchTutor\(/);
  });
  test('switchTutor clears the field and drops a stale draft when no unsaved work', () => {
    const fn = html.slice(html.indexOf('function switchTutor('), html.indexOf('function switchTutor(') + 400);
    expect(fn).toMatch(/student-tutor/);
    expect(fn).toMatch(/clearDraft\(\)/);
    expect(fn).toMatch(/_sessionHasUnsavedWork\(\)/);
  });
});

describe('FK-33 opt-in clear-tutor setting (default OFF)', () => {
  test('settings checkbox is present and wired', () => {
    expect(html).toMatch(/id="setting-clear-tutor"/);
    expect(html).toMatch(/onchange="S\.setClearTutorBetweenStudents\(this\.checked\)"/);
  });
  test('every read of the setting defaults to false (off)', () => {
    const reads = html.match(/getSetting\('clearTutorBetweenStudents',\s*false\)/g) || [];
    // used in: _buildDraft exclusion, confirmNewStudent clear (>= 2 sites)
    expect(reads.length).toBeGreaterThanOrEqual(2);
  });
  test('draft excludes the tutor name when the setting is on', () => {
    expect(html).toMatch(/studentTutor:\s*getSetting\('clearTutorBetweenStudents',\s*false\)\s*\?\s*''\s*:\s*v\('student-tutor'\)/);
  });
  test('New Student clears the tutor only when the setting is on', () => {
    expect(html).toMatch(/if \(getSetting\('clearTutorBetweenStudents',\s*false\)\) el\('student-tutor'\)\.value = ''/);
  });
});

describe('FK-33 layer 3 (cohort records) intentionally untouched', () => {
  test('saved cohort record still stores the tutor name (needed for moderation/merge)', () => {
    expect(html).toMatch(/tutor:\s*\(el\('student-tutor'\)\.value/);
  });
});
