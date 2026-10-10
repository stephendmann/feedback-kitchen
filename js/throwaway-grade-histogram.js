/* Grade histogram for a marked cohort.
 *
 * Counts how many students fall in each band of a grade scale, using the
 * post-penalty score each record already carries, and returns one row per band
 * in descending order with the count and its share of the cohort.
 *
 * Throwaway file for verifying the review workflow. Never merged.
 */
(function (root) {
  'use strict';

  function sortedBands(gradeScale) {
    return gradeScale.slice().sort(function (a, b) { return b.bandLow - a.bandLow; });
  }

  function scoreOf(student) {
    var sr = student && student.scoreResult;
    return sr && typeof sr.penalisedScore === 'number' ? sr.penalisedScore : null;
  }

  function gradeHistogram(students, gradeScale) {
    var bands = sortedBands(gradeScale);
    var counts = {};
    bands.forEach(function (b) { counts[b.grade] = 0; });

    var scored = 0;
    students.forEach(function (s) {
      var score = scoreOf(s);
      if (score === null) return;
      scored++;
      for (var i = 0; i < bands.length; i++) {
        if (score > bands[i].bandLow) {
          counts[bands[i].grade]++;
          break;
        }
      }
    });

    return bands.map(function (b) {
      return {
        grade: b.grade,
        tier: b.tier,
        count: counts[b.grade],
        share: scored ? counts[b.grade] / scored : 0
      };
    });
  }

  function summarise(rows) {
    var total = rows.reduce(function (n, r) { return n + r.count; }, 0);
    var modal = rows.reduce(function (best, r) { return r.count > best.count ? r : best; }, rows[0]);
    return { total: total, modalGrade: modal ? modal.grade : null };
  }

  var api = { gradeHistogram: gradeHistogram, summarise: summarise };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.FKGradeHistogram = api;
})(typeof window !== 'undefined' ? window : globalThis);
