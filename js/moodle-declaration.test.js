/**
 * FK-48 regression guard — per-scorer Moodle declaration.
 *
 * A scorer declares whether its assessment is marked in Moodle. When it is not, the Moodle entry
 * points are hidden rather than disabled, because nothing a marker does in-session can change the
 * answer. The flag lives on the config, not in SA_SCORER_SETTINGS_V1: that blob is device-global
 * and would switch Moodle off for every scorer on the machine.
 *
 * Absent means enabled, so scorers built before this setting existed keep working with no migration.
 *
 * The one case that must not regress is the stranded round trip: a marker imports a worksheet,
 * marks half the cohort, then the flag goes off (their own edit, or re-importing a team scorer that
 * has it off). A blanket hide would remove the export control mid-round-trip with no way to finish.
 * Export therefore stays visible while the cohort holds Moodle-imported records.
 */
const fs = require('fs');
const path = require('path');

const scorer = fs.readFileSync(path.join(__dirname, '..', 'scorer.html'), 'utf8');
const builder = fs.readFileSync(path.join(__dirname, '..', 'builder.html'), 'utf8');

/* The shipped predicates, mirrored here so the semantics are pinned independently of the DOM. */
const moodleDeclared = (config) => !config || config.moodleEnabled !== false;
const shouldShow = (kind, config, cohortHasMoodleRecords) => {
  const declared = moodleDeclared(config);
  return declared || (kind === 'export' && cohortHasMoodleRecords);
};

describe('FK-48 back-compat predicate', () => {
  test('a config with no moodleEnabled field reads as enabled', () => {
    expect(moodleDeclared({ id: 'x' })).toBe(true);
  });

  test('undefined and null configs read as enabled', () => {
    expect(moodleDeclared(undefined)).toBe(true);
    expect(moodleDeclared(null)).toBe(true);
  });

  test('only an explicit false disables', () => {
    expect(moodleDeclared({ moodleEnabled: false })).toBe(false);
    expect(moodleDeclared({ moodleEnabled: true })).toBe(true);
  });

  test('falsy-but-not-false values do not disable, so a truthiness slip cannot hide the tools', () => {
    [undefined, 0, '', null].forEach((v) => {
      expect(moodleDeclared({ moodleEnabled: v })).toBe(true);
    });
  });
});

describe('FK-48 visibility rules', () => {
  const on = { moodleEnabled: true };
  const off = { moodleEnabled: false };

  test('all three controls show when the scorer is marked in Moodle', () => {
    ['entry', 'import', 'export'].forEach((k) => expect(shouldShow(k, on, false)).toBe(true));
  });

  test('entry and import hide when it is not', () => {
    expect(shouldShow('entry', off, false)).toBe(false);
    expect(shouldShow('import', off, false)).toBe(false);
  });

  test('export also hides when off and no Moodle records are present', () => {
    expect(shouldShow('export', off, false)).toBe(false);
  });

  test('export stays visible when off but the cohort holds Moodle-imported records', () => {
    expect(shouldShow('export', off, true)).toBe(true);
  });

  test('the stranded exception does not resurrect entry or import', () => {
    expect(shouldShow('entry', off, true)).toBe(false);
    expect(shouldShow('import', off, true)).toBe(false);
  });

  test('a legacy config with no field shows everything', () => {
    ['entry', 'import', 'export'].forEach((k) => expect(shouldShow(k, {}, false)).toBe(true));
  });
});

describe('FK-48 builder wiring', () => {
  test('step 6 has the declaration checkbox with an accessible name', () => {
    expect(builder).toMatch(/id="enable-moodle"/);
    expect(builder).toMatch(/aria-label="This assessment is marked in Moodle"/);
  });

  test('it sits beside the late-penalty settings on step 6, before the summary', () => {
    const penalties = builder.indexOf('id="penalties-section"');
    const moodle = builder.indexOf('id="enable-moodle"');
    const summary = builder.indexOf('id="review-summary"');
    expect(penalties).toBeGreaterThan(-1);
    expect(moodle).toBeGreaterThan(penalties);
    expect(moodle).toBeLessThan(summary);
  });

  test('the copy frames relevance, never capability', () => {
    expect(builder).toMatch(/This assessment is marked in Moodle/);
    expect(builder).not.toMatch(/Moodle (integration )?(is )?unavailable/i);
  });

  test('the flag is written to the config on save and read back on edit', () => {
    expect(builder).toMatch(/config\.moodleEnabled\s*=\s*moodleCb\.checked/);
    expect(builder).toMatch(/moodleCb\.checked\s*=\s*config\.moodleEnabled\s*!==\s*false/);
  });
});

describe('FK-48 scorer wiring', () => {
  test('the predicate, cohort check and visibility pass all exist', () => {
    expect(scorer).toMatch(/function moodleDeclared\(\)/);
    expect(scorer).toMatch(/function cohortHasMoodleRecords\(\)/);
    expect(scorer).toMatch(/function applyMoodleVisibility\(\)/);
  });

  test('the setting writes through to the config, not the device settings blob', () => {
    const fn = scorer.slice(scorer.indexOf('function setMoodleEnabled'), scorer.indexOf('function setMoodleEnabled') + 600);
    expect(fn).toMatch(/config\.moodleEnabled\s*=\s*!!on/);
    expect(fn).toMatch(/SA\.saveConfig\(config\)/);
    expect(fn).not.toMatch(/setSetting\(/);
  });

  test('the stranded exception keys off the source stamp buildCohortImport writes', () => {
    expect(scorer).toMatch(/source === 'moodle-worksheet'/);
  });

  /* Two of the three targets are `.btn` elements, and `.btn { display: inline-flex }` beats
     `.hidden { display: none }`. Toggling the utility class applies it without hiding anything —
     runtime-confirmed during FK-48 (class present, computed display still flex). This is the FK-06
     / FK-16 cascade hazard, and it is live on main for btn-insights, btn-modexport-run and
     btn-modexport-disable. Pin the inline-style mechanism so a future tidy-up cannot reintroduce it. */
  test('visibility uses an inline display, not the hidden utility class', () => {
    const fn = scorer.slice(scorer.indexOf('function applyMoodleVisibility'), scorer.indexOf('function applyMoodleSetting'));
    expect(fn).toMatch(/node\.style\.display\s*=\s*show\s*\?\s*''\s*:\s*'none'/);
    expect(fn).not.toMatch(/classList\.toggle\('hidden'/);
  });

  test('visibility is re-evaluated whenever the cohort changes', () => {
    const fn = scorer.slice(scorer.indexOf('function refreshCohortUI'), scorer.indexOf('function refreshCohortUI') + 1400);
    expect(fn).toMatch(/applyMoodleVisibility\(\)/);
  });

  test('the settings checkbox is present and separated from the device-scoped ones', () => {
    expect(scorer).toMatch(/id="setting-moodle-enabled"/);
    expect(scorer).toMatch(/This scorer/);
    expect(scorer).toMatch(/This device/);
  });

  test('the settings footer no longer claims every setting is device-only', () => {
    expect(scorer).not.toMatch(/>Settings are saved on this device only\.</);
  });

  test('the handlers are exported on the S namespace', () => {
    expect(scorer).toMatch(/setMoodleEnabled,\s*applyMoodleVisibility,/);
  });
});

describe('FK-44 hook still intact', () => {
  test('all three Moodle controls still carry the hook FK-48 depends on', () => {
    ['entry', 'import', 'export'].forEach((v) => {
      expect(scorer).toMatch(new RegExp('data-fk-moodle="' + v + '"'));
    });
  });
});
