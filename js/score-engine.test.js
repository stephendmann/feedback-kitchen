/**
 * @jest-environment jsdom
 *
 * FK-09 — Edge-case suite for the scoring engine, exercised HEADLESSLY
 * (computeScores + applyGradeOverride with explicit args — the proof that
 * the engine boundary needs no DOM).
 *
 * Covers: override × penalty × each rounding mode, fail-penalty zeroing,
 * snap-up-only letter override, deduction preservation through override,
 * and the deliberate rounded-row summation (INS-3: total = sum of
 * displayed rows, by design).
 *
 * Run with: npx jest js/score-engine.test.js
 */

function loadShared() {
  jest.resetModules();
  delete global.window.SA;
  require('./shared.js');
  return global.window.SA;
}

let SA;
beforeAll(() => { SA = loadShared(); });

/* Minimal config factory: 2 criteria at 50/50, NZ default scale (gradeScale
   null), standard default late penalties (idx 0 none · 1 = −10 · 2 = −20 ·
   3 = −30 · 4 = fail). */
function cfg(rounding) {
  return {
    criteria: [
      { id: 'c1', name: 'Crit one', weight: 50, rubric: { excellent: 'E1', proficient: 'P1', developing: 'D1', satisfactory: 'S1', unsatisfactory: 'U1' } },
      { id: 'c2', name: 'Crit two', weight: 50, rubric: { excellent: 'E2', proficient: 'P2', developing: 'D2', satisfactory: 'S2', unsatisfactory: 'U2' } }
    ],
    latePenalties: JSON.parse(JSON.stringify(SA.DEFAULT_LATE_PENALTIES)),
    enableLatePenalties: true,
    gradeScale: null,
    scoreRounding: rounding || 'none'
  };
}
const G = (g, override = null) => ({ grade: g, override });

describe('computeScores — rounding modes (rounded-row summation by design)', () => {
  // A midpoint 87, B midpoint 72 → row weighted 43.5 and 36.0
  test("'none': total is exact sum of exact rows (43.5 + 36 = 79.5 → B+)", () => {
    const r = SA.computeScores(cfg('none'), [G('A'), G('B')], 0);
    expect(r.rows.map(x => x.weightedScore)).toEqual([43.5, 36]);
    expect(r.weightedTotal).toBe(79.5);
    expect(r.suggestedGrade).toBe('B+');
  });
  test("'whole': rows round FIRST, total = sum of rounded rows (44 + 36 = 80 → A-)", () => {
    const r = SA.computeScores(cfg('whole'), [G('A'), G('B')], 0);
    expect(r.weightedTotal).toBe(80);          // 43.5 → 44, not 79.5 → 80 coincidence:
    expect(r.suggestedGrade).toBe('A-');       // exact-sum rounding would also give 80,
                                               // but the GRADE differs from 'none' (B+) —
                                               // proving the mode reaches the band lookup.
  });
  test("'half': 43.5 stays, total 79.5 → B+", () => {
    const r = SA.computeScores(cfg('half'), [G('A'), G('B')], 0);
    expect(r.weightedTotal).toBe(79.5);
    expect(r.suggestedGrade).toBe('B+');
  });
});

describe('computeScores — per-criterion numeric override', () => {
  test('override replaces the midpoint for that row only', () => {
    const r = SA.computeScores(cfg('none'), [G('A', 90), G('B')], 0);
    expect(r.rows[0].finalScore).toBe(90);
    expect(r.rows[0].weightedScore).toBe(45);
    expect(r.weightedTotal).toBe(81);          // 45 + 36
    expect(r.suggestedGrade).toBe('A-');
  });
  test('ungraded rows contribute nothing and appear as null rows', () => {
    const r = SA.computeScores(cfg('none'), [G('A'), G('')], 0);
    expect(r.rows[1].grade).toBeNull();
    expect(r.weightedTotal).toBe(43.5);
  });
});

describe('computeScores — late penalties', () => {
  test('flat deduction subtracts after summation (79.5 − 20 = 59.5 → C, just under the C+ floor)', () => {
    const r = SA.computeScores(cfg('none'), [G('A'), G('B')], 2);
    expect(r.penalisedScore).toBe(59.5);
    expect(r.suggestedGrade).toBe('C');   // 59.5 < 60 (C+ floor) — banding happens AFTER the deduction
    expect(r.isFail).toBeFalsy();
  });
  test('penalty clamps at 0 (low score, −30)', () => {
    const r = SA.computeScores(cfg('none'), [G('D'), G('')], 3);   // 22 − 30
    expect(r.penalisedScore).toBe(0);
  });
  test('fail penalty: score 0, bottom grade, isFail', () => {
    const r = SA.computeScores(cfg('none'), [G('A'), G('A')], 4);
    expect(r.isFail).toBe(true);
    expect(r.penalisedScore).toBe(0);
    expect(r.suggestedGrade).toBe('D');
  });
});

describe('applyGradeOverride — snap-up-only letter override', () => {
  test('snaps UP to the band minimum of the chosen grade (79.5 → A- lifts to 80)', () => {
    const base = SA.computeScores(cfg('none'), [G('A'), G('B')], 0);
    const e = SA.applyGradeOverride(cfg('none'), base, 'A-');
    expect(e.suggestedGrade).toBe('A-');
    expect(e.weightedTotal).toBe(80);
    expect(e.override.snapped).toBe(true);
  });
  test('never lowers: overriding DOWN keeps the higher total (79.5 stays at C+ override)', () => {
    const base = SA.computeScores(cfg('none'), [G('A'), G('B')], 0);
    const e = SA.applyGradeOverride(cfg('none'), base, 'C+');
    expect(e.suggestedGrade).toBe('C+');       // letter changes…
    expect(e.weightedTotal).toBe(79.5);        // …total does not go down
    expect(e.override.snapped).toBe(false);
  });
  test('preserves the penalty deduction through the snap (−20 reapplied)', () => {
    const base = SA.computeScores(cfg('none'), [G('A'), G('B')], 2); // 79.5 / 59.5
    const e = SA.applyGradeOverride(cfg('none'), base, 'A-');        // total → 80
    expect(e.weightedTotal).toBe(80);
    expect(e.penalisedScore).toBe(60);         // 80 − the original 20-point delta
  });
  test('invalid letter → scoreResult returned unchanged', () => {
    const base = SA.computeScores(cfg('none'), [G('A'), G('B')], 0);
    expect(SA.applyGradeOverride(cfg('none'), base, 'Z+')).toBe(base);
  });
  test('null scoreResult / empty override → passthrough', () => {
    expect(SA.applyGradeOverride(cfg('none'), null, 'A')).toBeNull();
    const base = SA.computeScores(cfg('none'), [G('A'), G('B')], 0);
    expect(SA.applyGradeOverride(cfg('none'), base, '')).toBe(base);
  });
});

describe('override × penalty × rounding — invariant matrix', () => {
  const roundings = ['none', 'half', 'whole'];
  const penalties = [0, 1, 2, 4];               // none, −10, −20, fail
  const letters = ['', 'A'];
  for (const rm of roundings) for (const p of penalties) for (const L of letters) {
    test(`rounding=${rm} penaltyIdx=${p} override='${L || '∅'}' invariants hold`, () => {
      const c = cfg(rm);
      const base = SA.computeScores(c, [G('B+'), G('C', 61)], p);
      const e = SA.applyGradeOverride(c, base, L);
      // fail penalty dominates the base result
      if (p === 4) { expect(base.isFail).toBe(true); expect(base.penalisedScore).toBe(0); }
      // penalised never negative, never exceeds the (possibly lifted) total
      expect(e.penalisedScore).toBeGreaterThanOrEqual(0);
      expect(e.penalisedScore).toBeLessThanOrEqual(e.weightedTotal);
      // letter override never lowers the total
      expect(e.weightedTotal).toBeGreaterThanOrEqual(base.weightedTotal);
      // per-criterion rows are never mutated by the letter override
      expect(e.rows).toBe(base.rows);
    });
  }
});
