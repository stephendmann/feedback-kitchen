/**
 * @jest-environment jsdom
 *
 * #185: fail_rate_pre_penalty counted a late-failed student whose work was fine,
 * because it read the post-penalty grade. The metric now judges the work: the
 * marker's override letter when there is one, otherwise the grade of the stored
 * pre-penalty total (weightedTotal) on the scorer's grade scale. A record that
 * can be judged by neither is left out of both the count and the base.
 *
 * Records are built with the real scoring engine, then JSON-cloned the way the
 * cohort store keeps them, so the shape under test is the shape that is saved.
 *
 * Run with: npx jest js/cohort-insights-fail-rate.test.js
 */

// Loaded at module scope: the describe blocks below build configs while they are defined.
jest.resetModules();
delete global.window.SA;
delete global.window.CohortInsights;
require('./shared.js');
require('./cohort-insights.js');
const SA = global.window.SA;
const CI = global.window.CohortInsights;

/* One criterion at 100%, NZ default scale (gradeScale null). Late penalty idx 4 is
   "more than 3 days late" (a fail), idx 1 is a 10-point deduction. */
function nzConfig() {
  const c = SA.newConfig();
  c.criteria = [{ id: 'c1', name: 'Analysis', weight: 100, rubric: {} }];
  c.gradeScale = null;
  return c;
}

/* A custom five-band scale, F at the bottom, in the shape the builder saves. */
function customConfig() {
  const c = nzConfig();
  c.gradeScale = [
    { grade: 'A', midpoint: 92, bandLow: 85, bandHigh: 100, tier: 'excellent' },
    { grade: 'B', midpoint: 79, bandLow: 75, bandHigh: 84, tier: 'proficient' },
    { grade: 'C', midpoint: 69, bandLow: 65, bandHigh: 74, tier: 'developing' },
    { grade: 'D', midpoint: 57, bandLow: 50, bandHigh: 64, tier: 'satisfactory' },
    { grade: 'F', midpoint: 24, bandLow: 0, bandHigh: 49, tier: 'unsatisfactory' }
  ];
  return c;
}

function record(config, grade, opts) {
  opts = opts || {};
  let sr = SA.computeScores(config, [{ grade, override: opts.criterionOverride == null ? null : opts.criterionOverride }], opts.penalty || 0);
  if (opts.letter) sr = SA.applyGradeOverride(config, sr, opts.letter);
  return { name: 'S', studentId: 'x', feedbackText: 'x', markerNotes: '', scoreResult: JSON.parse(JSON.stringify(sr)) };
}

describe('the example from #185', () => {
  const cfg = nzConfig();
  const lateB = record(cfg, 'B', { penalty: 4 });

  test('the record is B-quality work that was late-failed to E (the premise)', () => {
    expect(lateB.scoreResult.weightedTotal).toBe(72);
    expect(lateB.scoreResult.penalisedScore).toBe(0);
    expect(lateB.scoreResult.suggestedGrade).toBe('E');
  });

  test('it is NOT a pre-penalty failure', () => {
    const m = CI.cohortMetrics(cfg, [lateB]);
    expect(m.fail_count_pre_penalty).toBe(0);
    expect(m.fail_rate_pre_penalty).toBe(0);
    expect(m.fail_n_pre_penalty).toBe(1);
  });

  test('the post-penalty metrics still carry the late fail', () => {
    const m = CI.cohortMetrics(cfg, [lateB]);
    expect(m.grade_bands).toEqual({ Unsatisfactory: 1 });   // grade bands are post-penalty
    expect(m.mean_total).toBe(0);                           // post-penalty mean
    expect(m.mean_pre_penalty).toBe(72);                    // pre-penalty mean, unchanged
    expect(m.late_penalty_count).toBe(1);
  });
});

describe('what still counts as a pre-penalty failure', () => {
  const cfg = nzConfig();

  test('an on-time E student', () => {
    const m = CI.cohortMetrics(cfg, [record(cfg, 'E', { criterionOverride: 12 })]);
    expect(m.fail_count_pre_penalty).toBe(1);
    expect(m.fail_rate_pre_penalty).toBe(1);
  });

  test('an E student who was also late-failed (the work was a fail either way)', () => {
    const m = CI.cohortMetrics(cfg, [record(cfg, 'E', { criterionOverride: 12, penalty: 4 })]);
    expect(m.fail_count_pre_penalty).toBe(1);
  });

  test('a mixed cohort: the rate is over everyone, and only the poor work counts', () => {
    const students = [
      record(cfg, 'E', { criterionOverride: 30 }),   // fail
      record(cfg, 'B', { penalty: 4 }),              // late-fail, good work
      record(cfg, 'B'),
      record(cfg, 'A')
    ];
    const m = CI.cohortMetrics(cfg, students);
    expect(m.fail_count_pre_penalty).toBe(1);
    expect(m.fail_n_pre_penalty).toBe(4);
    expect(m.fail_rate_pre_penalty).toBeCloseTo(0.25);
    expect(m.grade_bands.Unsatisfactory).toBe(2);   // post-penalty: both the E and the late fail
  });

  test('a deduction that drops C- into the fail band is not poor work', () => {
    const r = record(cfg, 'C-', { penalty: 1 });    // 52 less 10 = 42, grade D
    expect(r.scoreResult.suggestedGrade).toBe('D');
    expect(r.scoreResult.weightedTotal).toBe(52);
    const m = CI.cohortMetrics(cfg, [r]);
    expect(m.fail_count_pre_penalty).toBe(0);
    expect(m.grade_bands.Unsatisfactory).toBe(1);
  });

  test('the boundary: 39 is a fail, 40 is a fail (D, same tier), 50 is not', () => {
    const m = CI.cohortMetrics(cfg, [
      record(cfg, 'E', { criterionOverride: 39 }),
      record(cfg, 'D', { criterionOverride: 40 }),
      record(cfg, 'C-', { criterionOverride: 50 })
    ]);
    expect(m.fail_count_pre_penalty).toBe(2);
    expect(m.fail_n_pre_penalty).toBe(3);
  });
});

describe('marker letter overrides keep behaving as they did', () => {
  const cfg = nzConfig();

  test('a letter lowered into the fail band is the marker\'s judgement of the work, and counts', () => {
    // 52 is C-. The marker lowers the overall letter to D without changing the total.
    const r = record(cfg, 'C-', { letter: 'D' });
    expect(r.scoreResult.suggestedGrade).toBe('D');
    expect(r.scoreResult.weightedTotal).toBe(52);
    expect(CI.cohortMetrics(cfg, [r]).fail_count_pre_penalty).toBe(1);
  });

  test('a letter raised out of the fail band (snap-up) does not count', () => {
    const r = record(cfg, 'D', { criterionOverride: 49, letter: 'C-' });
    expect(r.scoreResult.weightedTotal).toBe(50);   // snapped up to the C- band minimum
    expect(CI.cohortMetrics(cfg, [r]).fail_count_pre_penalty).toBe(0);
  });

  test('a late-failed student whose letter the marker set to B is judged as B', () => {
    const r = record(cfg, 'B', { penalty: 4, letter: 'B' });
    expect(CI.cohortMetrics(cfg, [r]).fail_count_pre_penalty).toBe(0);
  });
});

describe('a custom grade scale', () => {
  const cfg = customConfig();

  test('the pre-penalty grade comes from the scorer\'s own scale', () => {
    const m = CI.cohortMetrics(cfg, [
      record(cfg, 'F', { criterionOverride: 45 }),   // fail band on this scale
      record(cfg, 'A', { penalty: 4 }),              // 92, late-failed to F
      record(cfg, 'D')                               // 57, satisfactory
    ]);
    expect(m.fail_count_pre_penalty).toBe(1);
    expect(m.fail_n_pre_penalty).toBe(3);
    expect(m.grade_bands.Unsatisfactory).toBe(2);    // post-penalty: F student and the late fail
  });
});

describe('legacy and malformed records are excluded, never miscounted', () => {
  const cfg = nzConfig();
  const failRecord = () => record(cfg, 'E', { criterionOverride: 10 });

  test('an old-shape record with no weightedTotal and no override letter is left out', () => {
    // Only the post-penalty fields survive: the one thing that must not be trusted here.
    const legacy = { scoreResult: { suggestedGrade: 'E', penalisedScore: 0 } };
    const m = CI.cohortMetrics(cfg, [legacy]);
    expect(m.fail_n_pre_penalty).toBe(0);
    expect(m.fail_count_pre_penalty).toBe(0);
    expect(m.fail_rate_pre_penalty).toBe(0);
    expect(Number.isFinite(m.fail_rate_pre_penalty)).toBe(true);
  });

  test('the denominator excludes it, so the rate over the rest is right', () => {
    const legacy = { scoreResult: { suggestedGrade: 'E', penalisedScore: 0 } };
    const m = CI.cohortMetrics(cfg, [legacy, failRecord(), record(cfg, 'B')]);
    expect(m.fail_n_pre_penalty).toBe(2);
    expect(m.fail_count_pre_penalty).toBe(1);
    expect(m.fail_rate_pre_penalty).toBeCloseTo(0.5);
    expect(m.n).toBe(3);   // the cohort size elsewhere is unchanged
  });

  test('a record with no scoreResult at all is left out', () => {
    const m = CI.cohortMetrics(cfg, [{ name: 'No marking' }, failRecord()]);
    expect(m.fail_n_pre_penalty).toBe(1);
    expect(m.fail_rate_pre_penalty).toBe(1);
  });

  test('a non-numeric or non-finite weightedTotal is left out', () => {
    const odd = [
      { scoreResult: { weightedTotal: '72', suggestedGrade: 'B' } },
      { scoreResult: { weightedTotal: NaN, suggestedGrade: 'E' } },
      { scoreResult: { weightedTotal: null, suggestedGrade: 'E' } },
      { scoreResult: { weightedTotal: Infinity, suggestedGrade: 'E' } }
    ];
    const m = CI.cohortMetrics(cfg, odd.concat([failRecord()]));
    expect(m.fail_n_pre_penalty).toBe(1);
    expect(m.fail_count_pre_penalty).toBe(1);
  });

  test('a stored record that has weightedTotal but no override or flags still works', () => {
    // The minimum a real saved record carries for this metric.
    const bare = { scoreResult: { weightedTotal: 30, penalisedScore: 30, suggestedGrade: 'E' } };
    const m = CI.cohortMetrics(cfg, [bare]);
    expect(m.fail_n_pre_penalty).toBe(1);
    expect(m.fail_count_pre_penalty).toBe(1);
  });

  test('no metric on the result is NaN when nothing can be judged', () => {
    const m = CI.cohortMetrics(cfg, [{ scoreResult: {} }]);
    expect(Number.isFinite(m.fail_rate_pre_penalty)).toBe(true);
    expect(m.fail_rate_pre_penalty).toBe(0);
  });
});

describe('what the panel tells the marker', () => {
  const cfg = nzConfig();
  const render = (students) => {
    const panel = document.createElement('div');
    CI.renderInsights(panel, cfg, { students, multiMarker: false, label: 'T' }, '');
    return panel.textContent;
  };
  // 20 students so the small-cohort branches do not hide anything.
  const cohortOf = (fails, lateFails) => {
    const s = [];
    for (let i = 0; i < fails; i++) s.push(record(cfg, 'E', { criterionOverride: 20 + i }));
    for (let i = 0; i < lateFails; i++) s.push(record(cfg, 'B', { penalty: 4 }));
    while (s.length < 20) s.push(record(cfg, 'B'));
    return s;
  };

  test('late fails alone do not trigger the "fail band before late penalties" prompt', () => {
    expect(render(cohortOf(0, 6))).not.toMatch(/fail band before late penalties/);
  });

  test('poor work does trigger it, with the rate over the work', () => {
    expect(render(cohortOf(6, 0))).toMatch(/30% of scripts were in the fail band before late penalties/);
  });

  test('poor work plus late fails reports only the poor work', () => {
    expect(render(cohortOf(5, 5))).toMatch(/25% of scripts were in the fail band before late penalties/);
  });
});
