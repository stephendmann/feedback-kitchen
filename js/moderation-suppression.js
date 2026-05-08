/* ============================================================
   Feedback Kitchen — Moderation Export Suppression Engine
   (moderation-suppression.js)

   Pure functions. No DOM, no localStorage, no network.
   Reads thresholds from window.FKModSchema when available,
   falls back to inline defaults so this module can be tested
   independently.

   See: docs/fk_moderation_export_v1.md
   ============================================================ */

(function () {
  'use strict';

  function _get(key, fallback) {
    return (window.FKModSchema && window.FKModSchema[key] != null)
      ? window.FKModSchema[key] : fallback;
  }

  /* ── Row shuffling ────────────────────────────────────────
     Fisher-Yates on a shallow copy. Row order is non-
     deterministic across exports — row_labels therefore also
     differ on every export (acceptance criterion). */
  function shuffleRows(rows) {
    const arr = rows.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  /* ── Row label assignment ─────────────────────────────────
     Produces R001..Rnnn (zero-padded to at least 3 digits). */
  function assignRowLabels(count) {
    const w = Math.max(3, String(count).length);
    const out = [];
    for (let i = 1; i <= count; i++) {
      out.push('R' + String(i).padStart(w, '0'));
    }
    return out;
  }

  /* ── Tutor label map ──────────────────────────────────────
     Tutors with n >= TUTOR_MIN_N are assigned T1..Tn sorted
     alphabetically for determinism within a single export.
     All others map to T_other. Empty tutor string is treated
     as its own group (may also collapse to T_other). */
  function buildTutorLabelMap(students) {
    const MIN = _get('TUTOR_MIN_N', 5);
    const counts = {};
    for (const s of students) {
      const t = (s.tutor || '').trim();
      counts[t] = (counts[t] || 0) + 1;
    }
    const qualified = Object.keys(counts).filter(t => counts[t] >= MIN).sort();
    const map = {};
    qualified.forEach((t, i) => { map[t] = 'T' + (i + 1); });
    for (const t of Object.keys(counts)) {
      if (!map[t]) map[t] = 'T_other';
    }
    return map;
  }

  /* Returns { tutorName: count } for all students. */
  function getTutorCounts(students) {
    const c = {};
    for (const s of students) {
      const t = (s.tutor || '').trim();
      c[t] = (c[t] || 0) + 1;
    }
    return c;
  }

  /* ── Extreme row detection ────────────────────────────────
     Returns an array of indices (into totals) where the
     z-score of total_score exceeds EXTREME_SD_THRESHOLD.
     Requires at least 2 rows and non-zero SD; otherwise
     returns []. Population SD is used (consistent with a
     census rather than a sample estimate). */
  function calculateExtremeRows(totals) {
    const THRESH = _get('EXTREME_SD_THRESHOLD', 3);
    if (totals.length < 2) return [];
    const mean = totals.reduce((a, b) => a + b, 0) / totals.length;
    const variance = totals.reduce((s, x) => s + (x - mean) ** 2, 0) / totals.length;
    const sd = Math.sqrt(variance);
    if (sd === 0) return [];
    return totals.reduce(function (acc, x, i) {
      if (Math.abs((x - mean) / sd) > THRESH) acc.push(i);
      return acc;
    }, []);
  }

  /* ── Per-row suppression flags ────────────────────────────
     Returns a semicolon-separated string of applicable codes
     (empty string when no flags apply).

     opts = {
       tutorLabel:     string   ('T_other' → TUTOR_LT_5_COLLAPSED)
       gradeBandCount: number   (< GRADE_BAND_MIN_N → GRADE_BAND_LT_5_SUPPRESSED)
       isExtreme:      boolean  (true → EXTREME_ROW_FLAGGED)
     } */
  function buildSuppressionFlags(opts) {
    const TUTOR_CODE = _get('TUTOR_LT_5_COLLAPSED',       'TUTOR_LT_5_COLLAPSED');
    const BAND_CODE  = _get('GRADE_BAND_LT_5_SUPPRESSED', 'GRADE_BAND_LT_5_SUPPRESSED');
    const EXT_CODE   = _get('EXTREME_ROW_FLAGGED',         'EXTREME_ROW_FLAGGED');
    const BAND_MIN   = _get('GRADE_BAND_MIN_N',            5);
    const flags = [];
    if (opts.tutorLabel === 'T_other')        flags.push(TUTOR_CODE);
    if ((opts.gradeBandCount || 0) < BAND_MIN) flags.push(BAND_CODE);
    if (opts.isExtreme)                       flags.push(EXT_CODE);
    return flags.join(';');
  }

  /* ── Cohort minimum gate ──────────────────────────────────
     Returns true only if the cohort meets the minimum export
     threshold. If false, the export engine must not produce
     a file (COHORT_LT_15_BLOCK). */
  function validateCohortMinimum(students) {
    return Array.isArray(students) && students.length >= _get('COHORT_MIN_N', 15);
  }

  window.FKModSuppression = {
    shuffleRows,
    assignRowLabels,
    buildTutorLabelMap,
    getTutorCounts,
    calculateExtremeRows,
    buildSuppressionFlags,
    validateCohortMinimum
  };
})();
