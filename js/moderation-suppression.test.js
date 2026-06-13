/**
 * @jest-environment jsdom
 *
 * FK-26 / issue #4 — Characterization tests for the Moderation Export
 * suppression engine (js/moderation-suppression.js).
 *
 * These assert what the suppression engine CURRENTLY does — the privacy
 * guard for the moderation export. No source changes are made here; if a
 * test surprises us, it is ledgered, not fixed inside this commit
 * (FK-01 no-silent-fixes policy).
 *
 * Spec: docs/fk_moderation_export_v1.md
 * Run with: npx jest js/moderation-suppression.test.js
 */

function loadSuppression() {
  jest.resetModules();
  delete global.window.FKModSuppression;
  delete global.window.FKModSchema; // exercise the inline-default fallback path
  require('./moderation-suppression.js');
  return global.window.FKModSuppression;
}

let S;
beforeEach(() => { S = loadSuppression(); });

describe('validateCohortMinimum (COHORT_LT_15_BLOCK gate)', () => {
  test('blocks a cohort below the default minimum of 15', () => {
    expect(S.validateCohortMinimum(new Array(14).fill({}))).toBe(false);
  });
  test('passes a cohort at exactly 15', () => {
    expect(S.validateCohortMinimum(new Array(15).fill({}))).toBe(true);
  });
  test('passes a larger cohort', () => {
    expect(S.validateCohortMinimum(new Array(40).fill({}))).toBe(true);
  });
  test('rejects non-array input', () => {
    expect(S.validateCohortMinimum(null)).toBe(false);
    expect(S.validateCohortMinimum(undefined)).toBe(false);
    expect(S.validateCohortMinimum('15')).toBe(false);
  });
});

describe('buildTutorLabelMap (TUTOR_LT_5_COLLAPSED)', () => {
  function cohort(spec) {
    // spec: { tutorName: count } → flat student list
    const out = [];
    Object.keys(spec).forEach(t => { for (let i = 0; i < spec[t]; i++) out.push({ tutor: t }); });
    return out;
  }

  test('tutors with >= 5 get T1..Tn assigned in alphabetical order', () => {
    const map = S.buildTutorLabelMap(cohort({ Zara: 6, Amir: 5 }));
    // Alphabetical: Amir → T1, Zara → T2
    expect(map.Amir).toBe('T1');
    expect(map.Zara).toBe('T2');
  });

  test('tutors with < 5 collapse to T_other', () => {
    const map = S.buildTutorLabelMap(cohort({ Big: 5, Small: 4, Tiny: 1 }));
    expect(map.Big).toBe('T1');
    expect(map.Small).toBe('T_other');
    expect(map.Tiny).toBe('T_other');
  });

  test('empty-string tutor is its own group and collapses when sparse', () => {
    const map = S.buildTutorLabelMap(cohort({ '': 2, Named: 6 }));
    expect(map['']).toBe('T_other');
    expect(map.Named).toBe('T1');
  });

  test('the raw tutor NAME is never used as a label value', () => {
    const map = S.buildTutorLabelMap(cohort({ Zara: 6, Amir: 5, Solo: 2 }));
    Object.values(map).forEach(label => {
      expect(label).toMatch(/^T(\d+|_other)$/);
    });
  });
});

describe('getTutorCounts', () => {
  test('counts students per trimmed tutor name', () => {
    const c = S.getTutorCounts([{ tutor: 'A ' }, { tutor: 'A' }, { tutor: 'B' }, { tutor: '' }]);
    expect(c.A).toBe(2);
    expect(c.B).toBe(1);
    expect(c['']).toBe(1);
  });
});

describe('calculateExtremeRows (EXTREME_ROW_FLAGGED)', () => {
  test('flags a value more than 3 SD from the mean', () => {
    // 19 values near 50, one extreme outlier at 100.
    const totals = new Array(19).fill(50).concat([100]);
    const idx = S.calculateExtremeRows(totals);
    expect(idx).toContain(19);
  });
  test('returns [] when fewer than 2 rows', () => {
    expect(S.calculateExtremeRows([])).toEqual([]);
    expect(S.calculateExtremeRows([42])).toEqual([]);
  });
  test('returns [] when SD is zero (all identical)', () => {
    expect(S.calculateExtremeRows([70, 70, 70, 70])).toEqual([]);
  });
  test('does not flag a tight, normal-ish spread', () => {
    expect(S.calculateExtremeRows([48, 50, 52, 49, 51, 50])).toEqual([]);
  });
});

describe('buildSuppressionFlags', () => {
  test('T_other tutor → TUTOR_LT_5_COLLAPSED', () => {
    expect(S.buildSuppressionFlags({ tutorLabel: 'T_other', gradeBandCount: 99 }))
      .toBe('TUTOR_LT_5_COLLAPSED');
  });
  test('small grade band → GRADE_BAND_LT_5_SUPPRESSED', () => {
    expect(S.buildSuppressionFlags({ tutorLabel: 'T1', gradeBandCount: 4 }))
      .toBe('GRADE_BAND_LT_5_SUPPRESSED');
  });
  test('extreme row → EXTREME_ROW_FLAGGED', () => {
    expect(S.buildSuppressionFlags({ tutorLabel: 'T1', gradeBandCount: 99, isExtreme: true }))
      .toBe('EXTREME_ROW_FLAGGED');
  });
  test('combines multiple codes, semicolon-separated, in stable order', () => {
    const flags = S.buildSuppressionFlags({ tutorLabel: 'T_other', gradeBandCount: 2, isExtreme: true });
    expect(flags).toBe('TUTOR_LT_5_COLLAPSED;GRADE_BAND_LT_5_SUPPRESSED;EXTREME_ROW_FLAGGED');
  });
  test('no applicable flags → empty string', () => {
    expect(S.buildSuppressionFlags({ tutorLabel: 'T1', gradeBandCount: 99 })).toBe('');
  });
});

describe('assignRowLabels', () => {
  test('produces R001..Rnnn zero-padded to at least 3 digits', () => {
    expect(S.assignRowLabels(3)).toEqual(['R001', 'R002', 'R003']);
  });
  test('widens padding past 999', () => {
    const labels = S.assignRowLabels(1000);
    expect(labels[0]).toBe('R0001');
    expect(labels[999]).toBe('R1000');
  });
});

describe('shuffleRows', () => {
  test('preserves length and multiset membership (no row added or dropped)', () => {
    const rows = Array.from({ length: 30 }, (_, i) => ({ id: i }));
    const shuffled = S.shuffleRows(rows);
    expect(shuffled).toHaveLength(30);
    expect(shuffled.map(r => r.id).sort((a, b) => a - b))
      .toEqual(rows.map(r => r.id));
  });
  test('does not mutate the input array', () => {
    const rows = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const copy = rows.slice();
    S.shuffleRows(rows);
    expect(rows).toEqual(copy);
  });
});
