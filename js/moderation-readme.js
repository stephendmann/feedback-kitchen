/* ============================================================
   Feedback Kitchen — Moderation Export Static Content
   (moderation-readme.js)

   Builds the row-array content for the 00_README and
   20_methods sheets. Pure functions — no DOM, no network.

   The 20_methods data dictionary matches the column order
   produced by moderation-export.js and is compatible with
   the downstream fk_moderation_pack.py reader.

   See: docs/fk_moderation_export_v1.md
   ============================================================ */

(function () {
  'use strict';

  /* ── 00_README sheet ─────────────────────────────────────── */
  function buildReadmeContent(optInRecord, suppressionDescriptions) {
    const rec = optInRecord || {};
    const R = [];

    R.push(['FK Moderation Export — 00_README']);
    R.push([]);

    R.push(['PURPOSE']);
    R.push(['A privacy-reduced export to support lecturer-led, pooled, cross-tutor moderation conversations.']);
    R.push(['NOT for performance management of individual tutors.']);
    R.push(['NOT for student-level disclosure or re-identification.']);
    R.push([]);

    R.push(['EXPORT SCOPE']);
    R.push(['Paper code:',     rec.paper_code     || '']);
    R.push(['Cohort ID:',      rec.cohort_id      || '']);
    R.push(['Assessment ID:',  rec.assessment_id  || '']);
    R.push(['Opted in by:',    rec.lecturer_name  || '']);
    R.push(['Role:',           rec.lecturer_role  || '']);
    R.push(['Opt-in time:',    rec.opt_in_timestamp || '']);
    R.push(['Schema version:', rec.opt_in_version  || 'modexport-v1']);
    R.push([]);

    R.push(['WHAT THIS FILE INCLUDES']);
    R.push(['• Shuffled rubric scores per criterion (grade midpoint or override; 0–100 scale)']);
    R.push(['• Weighted total score and grade band (excellent / proficient / developing / satisfactory / unsatisfactory)']);
    R.push(['• Anonymous tutor labels (T1, T2, … Tn); tutors with < 5 students collapsed to T_other']);
    R.push(['• Submission window bucket (on_time / late_band_N / late_fail)']);
    R.push(['• Per-row suppression flags (see codes below)']);
    R.push(['• Rubric version hash, FK version, and export timestamp (rounded to the hour)']);
    R.push([]);

    R.push(['WHAT THIS FILE EXCLUDES']);
    R.push(['• Student names, IDs, NSNs, or email addresses']);
    R.push(['• Tutor names (replaced by anonymous labels)']);
    R.push(['• Marker notes and feedback text']);
    R.push(['• Verbatim snippet wording']);
    R.push(['• Exact timestamps (all rounded or bucketed)']);
    R.push(['• Reversible lookup keys']);
    R.push(['• Any aggregate tutor performance scores (none computed)']);
    R.push(['• Longitudinal student tracking fields']);
    R.push([]);

    R.push(['PRIVACY NOTE — Privacy Act 2020']);
    R.push(['No direct identifiers (names, IDs, or email addresses) are included in this file.']);
    R.push(['This file is privacy-reduced, not fully anonymised. Re-identification may still be']);
    R.push(['possible in small cohorts or where the score distribution is distinctive.']);
    R.push(['The export is blocked for cohorts with fewer than 15 students.']);
    R.push(['You are responsible for how this file is shared, stored, and destroyed.']);
    R.push(['Handle it in accordance with your institution’s privacy policy and the Privacy Act 2020.']);
    R.push([]);

    R.push(['LECTURER / COORDINATOR RESPONSIBILITIES']);
    R.push(['• Confirm your use of this file with your faculty privacy contact before sharing.']);
    R.push(['• Handle the file per your institution’s records management policy.']);
    R.push(['• Retain only for the duration of the moderation cycle; delete when no longer needed.']);
    R.push(['• Do not use this file to rank, evaluate, or score-card individual tutors.']);
    R.push(['• Do not distribute this file to students, student representatives, or external parties.']);
    R.push(['• Disable Moderation Export for this paper in the scorer UI once this moderation cycle is complete.']);
    R.push([]);

    R.push(['SUPPRESSION CODES']);
    R.push(['Code', 'Meaning']);
    if (suppressionDescriptions) {
      for (const code of Object.keys(suppressionDescriptions)) {
        R.push([code, suppressionDescriptions[code]]);
      }
    }
    R.push([]);

    R.push(['See the 20_methods sheet for the full data dictionary and suppression thresholds.']);
    R.push(['See the 90_manifest sheet for rubric hash verification and opt-in audit trail.']);

    return R;
  }

  /* ── 20_methods sheet ─────────────────────────────────────
     thresholds = { COHORT_MIN_N, TUTOR_MIN_N, GRADE_BAND_MIN_N, EXTREME_SD_THRESHOLD } */
  function buildMethodsContent(schemaVersion, fkVersion, thresholds) {
    const t = thresholds || {};
    const M = [];

    M.push(['FK Moderation Export — 20_methods']);
    M.push([]);

    M.push(['VERSIONS']);
    M.push(['Schema version:', schemaVersion || 'modexport-v1', '']);
    M.push(['FK version:',     fkVersion     || '',             '']);
    M.push([]);

    M.push(['SUPPRESSION THRESHOLDS']);
    M.push(['Constant',               'Value', 'Meaning']);
    M.push(['COHORT_MIN_N',           t.COHORT_MIN_N       || 15, 'Minimum students required for export. Below this, no file is produced (COHORT_LT_15_BLOCK).']);
    M.push(['TUTOR_MIN_N',            t.TUTOR_MIN_N        || 5,  'Minimum students per tutor before that tutor is relabelled T_other.']);
    M.push(['GRADE_BAND_MIN_N',       t.GRADE_BAND_MIN_N   || 5,  'Minimum students per grade band before GRADE_BAND_LT_5_SUPPRESSED is set on each row in that band.']);
    M.push(['EXTREME_SD_THRESHOLD',   t.EXTREME_SD_THRESHOLD || 3, 'Standard deviations from the cohort mean total_score above which EXTREME_ROW_FLAGGED is set.']);
    M.push([]);

    M.push(['DATA DICTIONARY — 10_rows columns (in column order)']);
    M.push(['Column', 'Type', 'Description']);
    M.push(['row_label',             'string',  'Randomised row identifier (R001…Rnnn). Zero-padded. Regenerated on every export — values differ across exports of the same cohort.']);
    M.push(['paper_code',            'string',  'Course/paper code from the opt-in form.']);
    M.push(['cohort_id',             'string',  'Cohort identifier from the opt-in form.']);
    M.push(['assessment_id',         'string',  'Assessment identifier from the opt-in form.']);
    M.push(['rubric_version_hash',   'string',  '8-character lowercase hex hash of the rubric definition (criteria names, weights, and all tier descriptors) IN FORCE WHEN THIS RECORD WAS SCORED. Stamped per record at save time, so rows scored against different rubric versions carry different hashes. The 90_manifest rubric_version_hash is the single shared value when all rows agree, or "mixed" when they do not — see rubric_versions in 90_manifest for the full list.']);
    M.push(['tutor_label',           'string',  'Anonymous tutor label T1…Tn. Tutors with fewer than ' + (t.TUTOR_MIN_N || 5) + ' students are relabelled T_other. Sorted alphabetically for determinism within one export.']);
    M.push(['criterion_<k>_score',   'number',  'Raw score (0–100) for criterion k. Uses the grade midpoint, or the marker’s numeric override if set. Empty string if criterion was not graded.']);
    M.push(['criterion_<k>_max',     'number',  'Maximum possible raw score for criterion k (always 100). Divide score/max to obtain a percentage.']);
    M.push(['total_score',           'number',  'Final weighted score after any late penalty (0–100). Equal to penalised_score in the FK session.']);
    M.push(['total_max',             'number',  'Maximum total score (always 100).']);
    M.push(['grade_band',            'string',  'Grade tier: excellent | proficient | developing | satisfactory | unsatisfactory. Derived from suggestedGrade using the scorer’s grade scale.']);
    M.push(['submission_window',     'string',  'Submission timing bucket: on_time | late_band_1 | late_band_2 | … | late_fail. Derived from the late-penalty selection recorded for this student.']);
    M.push(['time_to_mark_bucket',   'string',  'Time-to-mark bucket. Deferred to schema v1.1; value is n/a in this export.']);
    M.push(['edit_count',            'integer', 'Number of criteria explicitly graded by the marker without bulk-fill automation. Proxy for marking engagement.']);
    M.push(['suppression_flag',      'string',  'Semicolon-separated suppression codes applicable to this row. Empty string if none apply.']);
    M.push(['extreme_row_flag',      'integer', '1 if this row’s total_score is more than ' + (t.EXTREME_SD_THRESHOLD || 3) + ' standard deviations from the cohort mean; 0 otherwise.']);
    M.push(['fk_version',            'string',  'Feedback Kitchen app version that generated this export.']);
    M.push(['export_timestamp',      'string',  'Export time rounded down to the nearest hour (ISO 8601, UTC). Exact minutes and seconds are discarded.']);
    M.push([]);

    M.push(['SUPPRESSION CODE REFERENCE']);
    M.push(['Code', 'Applies when', 'Effect on data']);
    M.push(['COHORT_LT_15_BLOCK',        'Cohort has fewer than ' + (t.COHORT_MIN_N || 15) + ' students.',
            'No file is produced. This code does not appear in 10_rows.']);
    M.push(['TUTOR_LT_5_COLLAPSED',      'This row’s original tutor had fewer than ' + (t.TUTOR_MIN_N || 5) + ' students.',
            'Tutor identity suppressed; label set to T_other. Multiple tutors may share T_other.']);
    M.push(['GRADE_BAND_LT_5_SUPPRESSED','This row’s grade_band has fewer than ' + (t.GRADE_BAND_MIN_N || 5) + ' students in the export.',
            'Row is retained but flagged. Treat band-level aggregates for this band with caution.']);
    M.push(['EXTREME_ROW_FLAGGED',       'total_score is > ' + (t.EXTREME_SD_THRESHOLD || 3) + ' SD from the cohort mean.',
            'Row is retained and flagged. Review for data entry errors or exceptional circumstances.']);
    M.push([]);

    M.push(['DOWNSTREAM COMPATIBILITY']);
    M.push(['This workbook is compatible with fk_moderation_pack.py (local-only CLI pooling tool).']);
    M.push(['Required sheets: 10_rows, 20_methods, 90_manifest.']);
    M.push(['The 90_manifest sheet uses a two-column key/value layout (columns: key, value).']);

    return M;
  }

  window.FKModReadme = { buildReadmeContent, buildMethodsContent };
})();
