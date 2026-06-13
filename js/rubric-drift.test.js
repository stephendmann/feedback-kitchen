/**
 * @jest-environment jsdom
 *
 * FK-12 — Unit tests for SA.detectRubricDrift (js/shared.js).
 *
 * detectRubricDrift is the read path behind the ambient rubric-drift signal
 * in the scorer (scorer.html → refreshRubricDriftUI). It compares the rubric
 * version stamped on each saved cohort record (FK-11) against the rubric
 * currently loaded, and returns the flags that gate the UI:
 *
 *   drift  — should the ambient signal show at all?
 *   mixed  — single-version drift ("Rubric drift") vs disagreement ("Mixed rubric")?
 *
 * It deliberately mirrors the per-record fallback in js/moderation-export.js
 * (`record.rubricVersionHash || liveConfigHash`), so the in-app badge and the
 * exported 90_manifest can never disagree. The parity block below locks that
 * contract.
 *
 * Run with: npx jest js/rubric-drift.test.js
 */

function loadShared() {
  jest.resetModules();
  delete global.window.SA;
  require('./shared.js');
  return global.window.SA;
}

let SA;
beforeAll(() => { SA = loadShared(); });

function baseConfig() {
  return {
    scoreRounding: 'none',
    label: 'Demo scorer',
    criteria: [
      {
        name: 'Argument',
        weight: 60,
        rubric: {
          excellent: 'Compelling, well-evidenced argument.',
          proficient: 'Clear argument with adequate support.',
          developing: 'Argument present but thinly supported.',
          satisfactory: 'Basic argument.',
          unsatisfactory: 'No discernible argument.'
        }
      },
      {
        name: 'Structure',
        weight: 40,
        rubric: {
          excellent: 'Logical, signposted structure.',
          proficient: 'Mostly coherent structure.',
          developing: 'Some structural lapses.',
          satisfactory: 'Loose structure.',
          unsatisfactory: 'No structure.'
        }
      }
    ]
  };
}

// A config whose rubric differs from baseConfig (so its hash differs).
function editedConfig() {
  const c = baseConfig();
  c.criteria[0].rubric.excellent = 'Compelling, well-evidenced argument. (revised)';
  return c;
}

function cohortOf(students) {
  return { students: students };
}

// Build a record carrying a given rubric stamp (or none, for legacy records).
function rec(hash) {
  return hash === undefined ? { name: 'x' } : { name: 'x', rubricVersionHash: hash };
}

describe('nothing-to-compare guard', () => {
  test('returns null for an empty cohort', () => {
    expect(SA.detectRubricDrift(baseConfig(), cohortOf([]))).toBeNull();
  });

  test('returns null for an absent cohort', () => {
    expect(SA.detectRubricDrift(baseConfig(), null)).toBeNull();
    expect(SA.detectRubricDrift(baseConfig(), undefined)).toBeNull();
    expect(SA.detectRubricDrift(baseConfig(), {})).toBeNull();
  });
});

describe('signal OFF — no drift', () => {
  test('all records stamped with the current rubric hash', () => {
    const cfg = baseConfig();
    const cur = SA.rubricVersionHash(cfg);
    const d = SA.detectRubricDrift(cfg, cohortOf([rec(cur), rec(cur), rec(cur)]));
    expect(d.drift).toBe(false);
    expect(d.mixed).toBe(false);
    expect(d.driftedCount).toBe(0);
    expect(d.versions).toEqual([cur]);
    expect(d.manifestHash).toBe(cur);
  });

  test('legacy (unstamped) records fall back to current — no signal', () => {
    const cfg = baseConfig();
    const cur = SA.rubricVersionHash(cfg);
    const d = SA.detectRubricDrift(cfg, cohortOf([rec(undefined), rec(undefined)]));
    expect(d.drift).toBe(false);
    expect(d.mixed).toBe(false);
    expect(d.legacyCount).toBe(2);
    expect(d.versions).toEqual([cur]);
  });

  test('legacy records mixed with current-stamped records still read as no drift', () => {
    const cfg = baseConfig();
    const cur = SA.rubricVersionHash(cfg);
    const d = SA.detectRubricDrift(cfg, cohortOf([rec(undefined), rec(cur)]));
    expect(d.drift).toBe(false);
    expect(d.mixed).toBe(false);
    expect(d.legacyCount).toBe(1);
  });
});

describe('signal ON — uniform drift (every record on one earlier rubric)', () => {
  test('whole cohort marked under a different rubric than the one loaded', () => {
    const cfg = baseConfig();
    const old = SA.rubricVersionHash(editedConfig());
    const cur = SA.rubricVersionHash(cfg);
    expect(old).not.toBe(cur);

    const d = SA.detectRubricDrift(cfg, cohortOf([rec(old), rec(old), rec(old)]));
    expect(d.drift).toBe(true);
    expect(d.mixed).toBe(false);            // internally consistent → "Rubric drift", not "Mixed"
    expect(d.driftedCount).toBe(3);
    expect(d.total).toBe(3);
    expect(d.versions).toEqual([old]);
    expect(d.manifestHash).toBe(old);
  });
});

describe('signal ON — mixed drift (records disagree)', () => {
  test('some records on the current rubric, some on an earlier one', () => {
    const cfg = baseConfig();
    const cur = SA.rubricVersionHash(cfg);
    const old = SA.rubricVersionHash(editedConfig());

    const d = SA.detectRubricDrift(cfg, cohortOf([rec(cur), rec(old), rec(cur)]));
    expect(d.drift).toBe(true);
    expect(d.mixed).toBe(true);
    expect(d.driftedCount).toBe(1);          // only the `old` record differs from current
    expect(d.versions).toEqual([cur, old].sort());
    expect(d.manifestHash).toBe('mixed');
  });

  test('legacy record + an earlier-rubric record reads as mixed', () => {
    const cfg = baseConfig();
    const cur = SA.rubricVersionHash(cfg);   // legacy falls back to this
    const old = SA.rubricVersionHash(editedConfig());

    const d = SA.detectRubricDrift(cfg, cohortOf([rec(undefined), rec(old)]));
    expect(d.mixed).toBe(true);
    expect(d.drift).toBe(true);
    expect(d.driftedCount).toBe(1);
    expect(d.legacyCount).toBe(1);
    expect(d.versions).toEqual([cur, old].sort());
  });
});

describe('UI signal boundary — exact flip points', () => {
  test('a single drifted record is enough to turn the signal on', () => {
    const cfg = baseConfig();
    const cur = SA.rubricVersionHash(cfg);
    const old = SA.rubricVersionHash(editedConfig());
    const many = Array.from({ length: 20 }, () => rec(cur));

    expect(SA.detectRubricDrift(cfg, cohortOf(many.slice())).drift).toBe(false);
    many[7] = rec(old);                       // flip exactly one
    const d = SA.detectRubricDrift(cfg, cohortOf(many));
    expect(d.drift).toBe(true);
    expect(d.driftedCount).toBe(1);
  });

  test('driftedCount drives the singular/plural tooltip boundary', () => {
    const cfg = baseConfig();
    const cur = SA.rubricVersionHash(cfg);
    const old = SA.rubricVersionHash(editedConfig());
    const one = SA.detectRubricDrift(cfg, cohortOf([rec(cur), rec(old)]));
    const two = SA.detectRubricDrift(cfg, cohortOf([rec(cur), rec(old), rec(old)]));
    expect(one.driftedCount).toBe(1);         // "record was"
    expect(two.driftedCount).toBe(2);         // "records were"
  });
});

describe('parity with the moderation-export manifest read path', () => {
  // Reproduces the version-set logic from js/moderation-export.js so the
  // ambient signal and the exported 90_manifest are provably aligned.
  function manifestView(cfg, students) {
    const liveHash = SA.rubricVersionHash(cfg);
    const rubricVersions = Array.from(new Set(students.map(function (s) {
      return s.rubricVersionHash || liveHash;
    }))).sort();
    const rubricMixed = rubricVersions.length > 1;
    return {
      versions: rubricVersions,
      manifestHash: rubricMixed ? 'mixed' : (rubricVersions[0] || liveHash)
    };
  }

  test.each([
    ['all current',        (cur, old) => [rec(cur), rec(cur)]],
    ['all legacy',         ()         => [rec(undefined), rec(undefined)]],
    ['uniform old',        (cur, old) => [rec(old), rec(old)]],
    ['mixed cur+old',      (cur, old) => [rec(cur), rec(old)]],
    ['legacy+old (mixed)', (cur, old) => [rec(undefined), rec(old)]]
  ])('%s → versions and manifestHash match the export', (_label, build) => {
    const cfg = baseConfig();
    const cur = SA.rubricVersionHash(cfg);
    const old = SA.rubricVersionHash(editedConfig());
    const students = build(cur, old);

    const d = SA.detectRubricDrift(cfg, cohortOf(students));
    const m = manifestView(cfg, students);
    expect(d.versions).toEqual(m.versions);
    expect(d.manifestHash).toBe(m.manifestHash);
  });
});
