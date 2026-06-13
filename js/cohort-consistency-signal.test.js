/**
 * @jest-environment jsdom
 *
 * FK-12 — unit tests for CohortInsights.scaleUseSignal (js/cohort-insights.js),
 * the pure detector behind the ambient cohort-consistency indicator.
 *
 * It reuses cohortMetrics (same scale_compressed / scale_wide thresholds as the
 * Insights panel) and is saved-cohort-only. These assert the classification,
 * the small-N suppression (n < VERY_SMALL_N = 12), and the empty-input guards.
 *
 * Run with: npx jest js/cohort-consistency-signal.test.js
 */

function loadCI() {
  jest.resetModules();
  delete global.window.CohortInsights;
  require('./cohort-insights.js');
  return global.window.CohortInsights;
}

let CI;
beforeEach(() => { CI = loadCI(); });

const CONFIG = { criteria: [{ name: 'A', weight: 100, rubric: {} }] };

// Build a cohort of records whose only relevant field is the total score.
function cohortWithTotals(totals) {
  return totals.map(t => ({ scoreResult: { weightedTotal: t } }));
}
// n evenly-spaced totals spanning [min, max] so range (and scale-use) is exact.
function span(n, min, max) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(min + (max - min) * (i / (n - 1)));
  return out;
}

describe('small-N suppression', () => {
  test('returns null below VERY_SMALL_N (12 scripts)', () => {
    expect(CI.scaleUseSignal(CONFIG, cohortWithTotals(span(11, 30, 90)))).toBeNull();
  });
  test('returns a signal at exactly 12 scripts', () => {
    expect(CI.scaleUseSignal(CONFIG, cohortWithTotals(span(12, 30, 90)))).not.toBeNull();
  });
});

describe('classification against the engine thresholds (compressed 0.60 / wide 0.95)', () => {
  test('compressed when the cohort spans < 60% of the range', () => {
    const sig = CI.scaleUseSignal(CONFIG, cohortWithTotals(span(15, 50, 85))); // range 35 → 0.35
    expect(sig.state).toBe('compressed');
    expect(sig.label).toBe('narrow spread');
    expect(sig.pct).toBe('35%');
  });
  test('wide when the cohort spans > 95% of the range', () => {
    const sig = CI.scaleUseSignal(CONFIG, cohortWithTotals(span(15, 1, 99))); // range 98 → 0.98
    expect(sig.state).toBe('wide');
    expect(sig.label).toBe('wide spread');
  });
  test('healthy in between', () => {
    const sig = CI.scaleUseSignal(CONFIG, cohortWithTotals(span(15, 20, 90))); // range 70 → 0.70
    expect(sig.state).toBe('healthy');
    expect(sig.label).toBe('healthy spread');
    expect(sig.pct).toBe('70%');
  });
});

describe('shape + guards', () => {
  test('exposes n, ratio, pct, state, label, note', () => {
    const sig = CI.scaleUseSignal(CONFIG, cohortWithTotals(span(20, 20, 90)));
    expect(sig).toMatchObject({
      n: 20,
      state: 'healthy',
      label: expect.any(String),
      pct: expect.any(String),
      note: expect.stringContaining('%')
    });
    expect(typeof sig.ratio).toBe('number');
  });
  test('the note never names an average (anchoring guard — consistency signal only)', () => {
    const sig = CI.scaleUseSignal(CONFIG, cohortWithTotals(span(15, 20, 90)));
    expect(sig.note.toLowerCase()).not.toMatch(/mean|average/);
  });
  test('null for empty or missing cohort', () => {
    expect(CI.scaleUseSignal(CONFIG, [])).toBeNull();
    expect(CI.scaleUseSignal(CONFIG, null)).toBeNull();
  });
});
