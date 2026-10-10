/**
 * @jest-environment jsdom
 *
 * Back-compat for the NZ E band (0–39). Scorers saved before E existed have no
 * E in gradeScale and/or gradeFeedback. They must load and score without
 * errors and without being rewritten.
 *
 * Fallback contract (deliberate):
 *  - Config with NO gradeScale: the shared NZ threshold path applies, so a
 *    0–39 total grades E. The tier resolves via GRADE_TIERS and the feedback
 *    text borrows the D entry (same 'unsatisfactory' tier) via findGradeFeedback.
 *  - Config WITH a gradeScale that has no E: the scale is authoritative, so a
 *    0–39 total lands in that scale's lowest band (D for a legacy NZ scale),
 *    exactly as before. Nothing is migrated.
 *
 * Run with: npx jest js/e-band-backcompat.test.js
 */

const fs = require('fs');
const path = require('path');

function loadShared() {
  jest.resetModules();
  delete global.window.SA;
  require('./shared.js');
  return global.window.SA;
}

let SA;
beforeAll(() => { SA = loadShared(); });

const G = (g, override = null) => ({ grade: g, override });

const RUBRIC = { excellent: 'Ex', proficient: 'Pr', developing: 'De', satisfactory: 'Sa', unsatisfactory: 'Un' };

// Pre-E feedback: grades A+ … D only, as saved by older builds.
function legacyFeedback() {
  return SA.DEFAULT_GRADE_FEEDBACK.filter(gf => gf.grade !== 'E')
    .map(gf => ({ ...gf }));
}

// Pre-E NZ scale: ten bands, D = 40–49 and nothing below.
function legacyScale() {
  return [
    { grade: 'A+', midpoint: 95, bandLow: 90, bandHigh: 100, tier: 'excellent' },
    { grade: 'A',  midpoint: 87, bandLow: 85, bandHigh: 89,  tier: 'excellent' },
    { grade: 'A-', midpoint: 82, bandLow: 80, bandHigh: 84,  tier: 'excellent' },
    { grade: 'B+', midpoint: 77, bandLow: 75, bandHigh: 79,  tier: 'proficient' },
    { grade: 'B',  midpoint: 72, bandLow: 70, bandHigh: 74,  tier: 'proficient' },
    { grade: 'B-', midpoint: 67, bandLow: 65, bandHigh: 69,  tier: 'proficient' },
    { grade: 'C+', midpoint: 62, bandLow: 60, bandHigh: 64,  tier: 'developing' },
    { grade: 'C',  midpoint: 57, bandLow: 55, bandHigh: 59,  tier: 'developing' },
    { grade: 'C-', midpoint: 52, bandLow: 50, bandHigh: 54,  tier: 'developing' },
    { grade: 'D',  midpoint: 44, bandLow: 40, bandHigh: 49,  tier: 'unsatisfactory' }
  ];
}

function legacyConfig(gradeScale) {
  return {
    assessmentTitle: 'Legacy task',
    criteria: [
      { id: 'c1', name: 'Crit one', weight: 50, rubric: { ...RUBRIC } },
      { id: 'c2', name: 'Crit two', weight: 50, rubric: { ...RUBRIC } }
    ],
    gradeScale,
    gradeFeedback: legacyFeedback(),
    latePenalties: JSON.parse(JSON.stringify(SA.DEFAULT_LATE_PENALTIES)),
    enableLatePenalties: true,
    scoreRounding: 'none'
  };
}

describe('E-less legacy config, gradeScale null (shared threshold path)', () => {
  test('0–39 total → E, tier unsatisfactory, no throw', () => {
    const c = legacyConfig(null);
    let r;
    expect(() => { r = SA.computeScores(c, [G('D', 12), G('D', 12)], 0); }).not.toThrow();
    expect(r.weightedTotal).toBe(12);
    expect(r.suggestedGrade).toBe('E');
    expect(r.rows[0].tier).toBe('unsatisfactory');
    expect(r.rows[0].descriptor).toBe('Un');
  });

  test('feedback text is built, borrowing the D intro/outro (never undefined)', () => {
    const c = legacyConfig(null);
    const r = SA.computeScores(c, [G('D', 12), G('D', 12)], 0);
    const text = SA.generateFeedbackText(c, r, {});
    const d = c.gradeFeedback.find(gf => gf.grade === 'D');
    expect(typeof text).toBe('string');
    expect(text).toContain(d.intro);
    expect(text).toContain(d.outro);
    expect(text).not.toContain('undefined');
  });

  test('late-penalty fail → E and the notice names E', () => {
    const c = legacyConfig(null);
    const r = SA.computeScores(c, [G('A'), G('A')], 4);
    expect(r.suggestedGrade).toBe('E');
    expect(SA.generateFeedbackText(c, r, {})).toContain('receives a grade of E');
  });

  test('findGradeFeedback: exact match wins; E falls back to D; unknown grade → undefined', () => {
    const c = legacyConfig(null);
    expect(SA.findGradeFeedback(c, 'B').grade).toBe('B');
    expect(SA.findGradeFeedback(c, 'E').grade).toBe('D');
    expect(SA.findGradeFeedback(c, 'ZZ')).toBeUndefined();
    expect(SA.findGradeFeedback({}, 'E')).toBeUndefined();
  });

  test('a config that has its own E feedback uses it', () => {
    const c = legacyConfig(null);
    c.gradeFeedback = SA.DEFAULT_GRADE_FEEDBACK.map(gf => ({ ...gf }));
    expect(SA.findGradeFeedback(c, 'E').grade).toBe('E');
  });
});

describe('E-less legacy config, ten-band NZ gradeScale (scale is authoritative)', () => {
  test('0–39 total → lowest band D, tier unsatisfactory, no throw', () => {
    const c = legacyConfig(legacyScale());
    let r;
    expect(() => { r = SA.computeScores(c, [G('D', 12), G('D', 12)], 0); }).not.toThrow();
    expect(r.suggestedGrade).toBe('D');
    expect(r.rows[0].tier).toBe('unsatisfactory');
    const text = SA.generateFeedbackText(c, r, {});
    expect(text).toContain(c.gradeFeedback.find(gf => gf.grade === 'D').intro);
  });

  test('late-penalty fail → the scale\'s own bottom grade (D), not a grade absent from the scale', () => {
    const c = legacyConfig(legacyScale());
    const r = SA.computeScores(c, [G('A'), G('A')], 4);
    expect(r.suggestedGrade).toBe('D');
    expect(SA.generateFeedbackText(c, r, {})).toContain('receives a grade of D');
  });

  test('config object is not mutated by scoring', () => {
    const c = legacyConfig(legacyScale());
    const before = JSON.stringify(c);
    SA.computeScores(c, [G('D', 12), G('D', 12)], 0);
    expect(JSON.stringify(c)).toBe(before);
  });
});

describe('Demo_Scorer___Written_Response.json (A/B/C/D/F scale, no E)', () => {
  const demo = JSON.parse(fs.readFileSync(
    path.join(__dirname, '..', 'Demo_Scorer___Written_Response.json'), 'utf8'));

  test('scores at both ends of the scale without error', () => {
    const top = demo.criteria.map(() => G('A'));
    const bottom = demo.criteria.map(() => G('F'));
    expect(() => SA.computeScores(demo, top, 0)).not.toThrow();
    const r = SA.computeScores(demo, bottom, 0);
    expect(r.suggestedGrade).toBe('F');
    expect(typeof SA.generateFeedbackText(demo, r, {})).toBe('string');
  });
});
