/**
 * @jest-environment jsdom
 *
 * Throwaway test for the grade histogram. Never merged.
 */
const { gradeHistogram, summarise } = require('./throwaway-grade-histogram.js');

const SCALE = [
  { grade: 'A', bandLow: 85, bandHigh: 100, tier: 'excellent' },
  { grade: 'B', bandLow: 70, bandHigh: 84, tier: 'proficient' },
  { grade: 'C', bandLow: 50, bandHigh: 69, tier: 'developing' },
  { grade: 'E', bandLow: 0, bandHigh: 49, tier: 'unsatisfactory' }
];

const student = (penalisedScore) => ({ scoreResult: { penalisedScore } });

describe('gradeHistogram', () => {
  test('returns one row per band, highest first', () => {
    const rows = gradeHistogram([], SCALE);
    expect(rows.map(r => r.grade)).toEqual(['A', 'B', 'C', 'E']);
  });

  test('counts scores strictly inside each band', () => {
    const rows = gradeHistogram([student(90), student(75), student(75), student(60), student(20)], SCALE);
    expect(rows.map(r => r.count)).toEqual([1, 2, 1, 1]);
  });

  test('shares add up to one', () => {
    const rows = gradeHistogram([student(90), student(75), student(60), student(20)], SCALE);
    expect(rows.reduce((n, r) => n + r.share, 0)).toBeCloseTo(1);
  });

  test('records without a score are ignored', () => {
    const rows = gradeHistogram([student(90), { scoreResult: {} }, {}], SCALE);
    expect(summarise(rows).total).toBe(1);
  });
});

describe('summarise', () => {
  test('reports the most common grade', () => {
    const rows = gradeHistogram([student(90), student(75), student(75)], SCALE);
    expect(summarise(rows)).toEqual({ total: 3, modalGrade: 'B' });
  });
});
