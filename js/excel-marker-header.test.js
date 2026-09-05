/**
 * Guard: the Excel exports label the marker column "Marker", not "Tutor".
 *
 * PR #125 renamed the field to Marker in the UI but left the three export
 * header strings saying Tutor, so the app said one thing and the file it
 * produced said another. That gap is what let the manual describe the export
 * incorrectly (#126). This keeps the two in step.
 *
 * Structural, in the style of the other guards here: js/excel.js builds
 * workbooks through SheetJS and is not exercised end to end in this suite, so
 * this asserts on the header literals rather than on a generated workbook.
 *
 * Deliberately narrow. "Tutor" is still correct elsewhere in the codebase and
 * must not be swept up by a global rename:
 *
 *   - the moderation export's `tutor_label` (js/moderation-suppression.js) is
 *     an anonymised label T1..Tn, a different concept from the marker's name,
 *     and is covered by js/moderation-privacy.test.js;
 *   - internal identifiers (switchTutor, clearTutorBetweenStudents) and the
 *     `tutor` key on saved cohort records are storage-compatibility surfaces,
 *     not display strings.
 */

const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, 'excel.js'), 'utf8');

describe('Excel exports name the marker column "Marker"', () => {
  test('the single-student sheet uses Marker', () => {
    expect(source).toMatch(/'Student ID', student\.id \|\| '', 'Marker'/);
  });

  test('the cohort grade matrix header uses Marker', () => {
    expect(source).toMatch(/const headerRow = \['Student Name', 'Student ID', 'Marker', 'Date'\]/);
  });

  test('the cohort feedback sheet header uses Marker', () => {
    expect(source).toMatch(/\['Student Name', 'Student ID', 'Marker', 'Date', 'Suggested Grade'/);
  });

  test('no export header says Tutor any more', () => {
    // Catches a revert or a new sheet copied from one of the old header rows.
    expect(source).not.toMatch(/'Tutor'/);
  });
});
