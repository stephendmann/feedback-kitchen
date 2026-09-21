/**
 * @jest-environment node
 *
 * Marking date — the Date field means "the day this record was marked".
 *
 * The defect: the field was filled with today's date once, at page load, and then
 * treated as stored data. Resuming an autosaved draft or opening a cohort record wrote
 * the old date back into it, "New student" never reset it, and the autosave captured
 * the stale value so the next Resume replayed it. The field is readonly, so a marker
 * had no way out: every record saved that day carried a date from weeks earlier.
 *
 * The fix makes the field an indicator rather than a data source. The saved record's
 * date is derived at save time, the field is reset on New student, and neither Resume
 * nor Open writes an old date into it.
 *
 * Static guard in the style of FK's other scorer wiring tests.
 * Run with: npx jest js/marking-date.test.js
 */

const html = require('./scorer-source')();

function fnBody(name) {
  const m = html.match(new RegExp('function ' + name + String.raw`\s*\([^)]*\)\s*\{`));
  if (!m) throw new Error('function ' + name + ' not found');
  let i = m.index + m[0].length, depth = 1;
  while (depth > 0 && i < html.length) {
    const c = html[i++];
    if (c === '{') depth++; else if (c === '}') depth--;
  }
  return html.slice(m.index, i);
}

describe('marking date is derived at save time', () => {
  test('the cohort record stamps SA.formatDate(), not the field value', () => {
    expect(html).toMatch(/date:\s*SA\.formatDate\(\)/);
    expect(html).not.toMatch(/date:\s*\(el\('student-date'\)\.value/);
  });
});

describe('no path writes an old date into the field', () => {
  test('resumeDraft does not restore studentDate', () => {
    expect(fnBody('resumeDraft')).not.toMatch(/student-date/);
  });
  test('the autosave draft no longer carries a studentDate', () => {
    expect(fnBody('_buildDraft')).not.toMatch(/studentDate/);
  });
  test('opening a cohort record does not restore the saved date into the field', () => {
    expect(fnBody('loadCohortRecordIntoSession')).not.toMatch(/student-date/);
  });
});

describe('the field always shows today', () => {
  test('New student resets the field to today', () => {
    expect(fnBody('confirmNewStudent')).toMatch(/el\('student-date'\)\.value\s*=\s*SA\.formatDate\(\)/);
  });
  test('the tooltip describes the field as today, stamped on save', () => {
    expect(html).not.toMatch(/Auto-filled with today's date\. Recorded in your Excel marker's record\./);
    expect(html).toMatch(/id="student-date"[^>]*title="Today's date\. Each record is stamped with the date you save it\."/);
  });
});
