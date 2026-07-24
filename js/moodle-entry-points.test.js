/**
 * FK-44 regression guard — the Moodle worksheet import is reachable from where marking starts.
 *
 * Importing a Moodle worksheet is a pre-marking step: it pre-seeds the class list before anyone
 * is marked, and FK-27 then auto-opens the first imported student. The only control for it used
 * to sit in #sec-cohort, the last section on the page, below "Finish" and under a heading a
 * marker starting a Moodle run has no reason to open first. This adds a second entry point in
 * #sec-student calling the same handler; the canonical controls stay where they were.
 *
 * Every Moodle-only control carries a data-fk-moodle attribute so FK-48 (per-scorer Moodle
 * declaration) can hide them with one selector. The values are distinct because FK-48 treats
 * them differently: entry/import are hidden when a scorer declares it is not marked in Moodle,
 * while export stays visible whenever the open cohort holds Moodle-imported records, so nobody
 * is stranded part-way through a round trip.
 */
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'scorer.html'), 'utf8');

const idx = (s) => html.indexOf(s);

describe('FK-44 Moodle import entry point in the Student section', () => {
  test('the Student-section entry point exists and calls the existing import handler', () => {
    expect(html).toMatch(/id="moodle-entry-student"/);
    const entry = html.slice(idx('id="moodle-entry-student"'), idx('id="moodle-entry-student"') + 800);
    expect(entry).toMatch(/S\.openMoodleImport\(\)/);
  });

  test('it sits inside #sec-student, before the Rubric section', () => {
    const student = idx('id="sec-student"');
    const entry = idx('id="moodle-entry-student"');
    const rubric = idx('id="sec-rubric"');
    expect(student).toBeGreaterThan(-1);
    expect(entry).toBeGreaterThan(student);
    expect(entry).toBeLessThan(rubric);
  });

  test('it appears well before the canonical control in #sec-cohort', () => {
    expect(idx('id="moodle-entry-student"')).toBeLessThan(idx('data-fk-moodle="import"'));
  });

  test('the entry point is a real button, not a bare link', () => {
    const entry = html.slice(idx('id="moodle-entry-student"'), idx('id="moodle-entry-student"') + 800);
    expect(entry).toMatch(/<button[^>]*type="button"/);
  });
});

describe('FK-44 canonical Moodle controls are preserved', () => {
  test('the cohort import and export buttons still exist with their handlers', () => {
    expect(html).toMatch(/Import Moodle worksheet…/);
    expect(html).toMatch(/Export Moodle worksheet…/);
    expect(html).toMatch(/S\.openMoodleExport\(\)/);
  });

  test('both file inputs are still wired', () => {
    expect(html).toMatch(/id="moodle-file-input"/);
    expect(html).toMatch(/id="moodle-export-file-input"/);
  });

  test('the cohort section is still reachable from the section rail', () => {
    expect(html).toMatch(/href="#sec-cohort"/);
  });
});

describe('FK-48 visibility hook', () => {
  test('every Moodle-only control carries data-fk-moodle', () => {
    const hooks = html.match(/data-fk-moodle="[a-z]+"/g) || [];
    expect(hooks).toHaveLength(3);
  });

  test('the three hooks are entry, import and export', () => {
    ['entry', 'import', 'export'].forEach((v) => {
      expect(html).toMatch(new RegExp('data-fk-moodle="' + v + '"'));
    });
  });

  test('the hook is not on the rail link, which covers more than Moodle', () => {
    const rail = html.slice(idx('id="section-rail"'), idx('id="rail-rounding"'));
    expect(rail).not.toMatch(/data-fk-moodle/);
  });
});
