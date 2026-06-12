/**
 * @jest-environment jsdom
 *
 * FK-01 — Characterization tests for scoreToGrade / scoreToGradeFromScale
 * (js/shared.js:158 and :167).
 *
 * These tests lock in CURRENT behaviour, including oddities. They assert what
 * the code DOES, not what it should do. Any surprising behaviour captured here
 * is recorded in planning/INSPECTION.md INS-4 — do not "fix" logic in this
 * file's commit (no-silent-fixes rule).
 *
 * Run with: npx jest js/score-grade.test.js
 */

function loadShared() {
  jest.resetModules();
  delete global.window.SA;
  require('./shared.js');
  return global.window.SA;
}

let SA;
beforeAll(() => { SA = loadShared(); });

/* Default NZ thresholds (shared.js:83–88), floors descending:
   90 A+ · 85 A · 80 A- · 75 B+ · 70 B · 65 B- · 60 C+ · 55 C · 50 C- · 0 D */
const NZ_BANDS = [
  [90, 'A+'], [85, 'A'], [80, 'A-'],
  [75, 'B+'], [70, 'B'], [65, 'B-'],
  [60, 'C+'], [55, 'C'], [50, 'C-'],
  [0, 'D']
];

/* A custom gradeScale mirroring the NZ defaults, deliberately shuffled to
   exercise the internal sort in scoreToGradeFromScale. */
const NZ_MIRROR_SCALE_SHUFFLED = [
  { grade: 'C',  bandLow: 55 }, { grade: 'A+', bandLow: 90 },
  { grade: 'B-', bandLow: 65 }, { grade: 'D',  bandLow: 0 },
  { grade: 'A-', bandLow: 80 }, { grade: 'C+', bandLow: 60 },
  { grade: 'B+', bandLow: 75 }, { grade: 'A',  bandLow: 85 },
  { grade: 'C-', bandLow: 50 }, { grade: 'B',  bandLow: 70 }
];

const SPARSE_SCALE = [
  { grade: 'Merit', bandLow: 70 },
  { grade: 'Pass',  bandLow: 50 },
  { grade: 'Fail',  bandLow: 0 }
];

/* Scale whose lowest band starts above 0 — exposes the below-all-bands path. */
const FLOORED_SCALE = [
  { grade: 'High', bandLow: 80 },
  { grade: 'Low',  bandLow: 60 }
];

describe('scoreToGrade — NZ default thresholds', () => {
  describe('band boundaries', () => {
    NZ_BANDS.forEach(([floor, grade], i) => {
      test(`${floor} (exact floor) → ${grade}`, () => {
        expect(SA.scoreToGrade(floor)).toBe(grade);
      });
      test(`${floor} + 0.01 → ${grade}`, () => {
        expect(SA.scoreToGrade(floor + 0.01)).toBe(grade);
      });
      if (floor > 0) {
        const below = NZ_BANDS[i + 1][1];
        test(`${floor} - 0.01 → ${below} (just under the floor)`, () => {
          expect(SA.scoreToGrade(floor - 0.01)).toBe(below);
        });
      }
    });
  });

  describe('range extremes', () => {
    test('100 → A+', () => expect(SA.scoreToGrade(100)).toBe('A+'));
    test('105 (above 100, no cap) → A+', () => expect(SA.scoreToGrade(105)).toBe('A+'));
    test('0 → D', () => expect(SA.scoreToGrade(0)).toBe('D'));
    test('-5 (negative, below all floors) → D via fallback return', () => {
      expect(SA.scoreToGrade(-5)).toBe('D');
    });
  });

  describe('malformed input (characterization — current behaviour)', () => {
    test('NaN → D (every >= comparison is false, falls to fallback)', () => {
      expect(SA.scoreToGrade(NaN)).toBe('D');
    });
    test('undefined → D (comparisons with undefined are false)', () => {
      expect(SA.scoreToGrade(undefined)).toBe('D');
    });
    test('null → D (null >= 0 coerces to true, matches the [0, D] band)', () => {
      expect(SA.scoreToGrade(null)).toBe('D');
    });
    test("numeric string '80' → A- (relational coercion to number)", () => {
      expect(SA.scoreToGrade('80')).toBe('A-');
    });
    test("numeric string '89.99' → A", () => {
      expect(SA.scoreToGrade('89.99')).toBe('A');
    });
    test("non-numeric string 'abc' → D (NaN comparisons all false)", () => {
      expect(SA.scoreToGrade('abc')).toBe('D');
    });
    test("empty string '' → D ('' coerces to 0, matches the [0, D] band)", () => {
      expect(SA.scoreToGrade('')).toBe('D');
    });
  });
});

describe('scoreToGradeFromScale — custom gradeScale', () => {
  describe('band boundaries (shuffled NZ-mirror scale — exercises internal sort)', () => {
    NZ_BANDS.forEach(([floor, grade], i) => {
      test(`${floor} (exact floor) → ${grade}`, () => {
        expect(SA.scoreToGradeFromScale(floor, NZ_MIRROR_SCALE_SHUFFLED)).toBe(grade);
      });
      if (floor > 0) {
        const below = NZ_BANDS[i + 1][1];
        test(`${floor} - 0.01 → ${below}`, () => {
          expect(SA.scoreToGradeFromScale(floor - 0.01, NZ_MIRROR_SCALE_SHUFFLED)).toBe(below);
        });
      }
    });
  });

  describe('sparse 3-band scale', () => {
    test('85 → Merit', () => expect(SA.scoreToGradeFromScale(85, SPARSE_SCALE)).toBe('Merit'));
    test('70 (exact floor) → Merit', () => expect(SA.scoreToGradeFromScale(70, SPARSE_SCALE)).toBe('Merit'));
    test('69.99 → Pass', () => expect(SA.scoreToGradeFromScale(69.99, SPARSE_SCALE)).toBe('Pass'));
    test('50 → Pass', () => expect(SA.scoreToGradeFromScale(50, SPARSE_SCALE)).toBe('Pass'));
    test('49.99 → Fail', () => expect(SA.scoreToGradeFromScale(49.99, SPARSE_SCALE)).toBe('Fail'));
    test('0 → Fail', () => expect(SA.scoreToGradeFromScale(0, SPARSE_SCALE)).toBe('Fail'));
  });

  describe('below-all-bands behaviour (characterization)', () => {
    test('score below every bandLow returns the LOWEST band grade (59 → Low on a 80/60 scale)', () => {
      expect(SA.scoreToGradeFromScale(59, FLOORED_SCALE)).toBe('Low');
    });
    test('even far below (10) → Low — the floor grade is awarded regardless of distance', () => {
      expect(SA.scoreToGradeFromScale(10, FLOORED_SCALE)).toBe('Low');
    });
    test('negative score → lowest band grade (NZ-mirror: -5 → D)', () => {
      expect(SA.scoreToGradeFromScale(-5, NZ_MIRROR_SCALE_SHUFFLED)).toBe('D');
    });
  });

  describe('S-1 guard (FK-09): invalid scale falls back to NZ defaults', () => {
    // Contract change, deliberate: pre-FK-09 these threw TypeError
    // (ledgered as INS-4 S-1). The boundary now falls back to the NZ
    // default thresholds instead of failing mid-marking.
    test('empty scale [] → NZ fallback (75 → B+)', () => {
      expect(SA.scoreToGradeFromScale(75, [])).toBe('B+');
    });
    test('null scale → NZ fallback (75 → B+)', () => {
      expect(SA.scoreToGradeFromScale(75, null)).toBe('B+');
    });
    test('undefined scale → NZ fallback (50 → C-)', () => {
      expect(SA.scoreToGradeFromScale(50, undefined)).toBe('C-');
    });
    test('non-array scale → NZ fallback (90 → A+)', () => {
      expect(SA.scoreToGradeFromScale(90, { not: 'an array' })).toBe('A+');
    });
  });

  describe('malformed input (characterization — current behaviour)', () => {
    test('NaN score → lowest band grade (all comparisons false, falls to floor)', () => {
      expect(SA.scoreToGradeFromScale(NaN, NZ_MIRROR_SCALE_SHUFFLED)).toBe('D');
    });
    test('undefined score → lowest band grade', () => {
      expect(SA.scoreToGradeFromScale(undefined, SPARSE_SCALE)).toBe('Fail');
    });
    test("numeric string score '80' → A- (relational coercion)", () => {
      expect(SA.scoreToGradeFromScale('80', NZ_MIRROR_SCALE_SHUFFLED)).toBe('A-');
    });
    test('entry with missing bandLow never matches; falls through it', () => {
      const scale = [{ grade: 'X' }, { grade: 'Y', bandLow: 50 }];
      // undefined bandLow: comparisons false; sort puts it deterministically,
      // and score 60 matches Y. Characterizes tolerance of malformed entries.
      expect(SA.scoreToGradeFromScale(60, scale)).toBe('Y');
    });
  });

  describe('input is not mutated', () => {
    test('scale array order is unchanged after the call (slice() before sort)', () => {
      const copy = NZ_MIRROR_SCALE_SHUFFLED.map(e => e.grade);
      SA.scoreToGradeFromScale(75, NZ_MIRROR_SCALE_SHUFFLED);
      expect(NZ_MIRROR_SCALE_SHUFFLED.map(e => e.grade)).toEqual(copy);
    });
  });
});
