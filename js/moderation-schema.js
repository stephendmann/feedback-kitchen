/* ============================================================
   Feedback Kitchen — Moderation Export Schema (moderation-schema.js)
   Shared constants used by opt-in module, export engine, and tests.
   No DOM, no network, no localStorage access.
   See: docs/fk_moderation_export_v1.md
   ============================================================ */

(function () {
  'use strict';

  /* ── Schema version ──────────────────────────────────────── */
  const MOD_EXPORT_SCHEMA_VERSION = 'modexport-v1';
  const MOD_OPTIN_TEXT_VERSION    = 'modexport-optin-v1';

  /* ── Workbook sheet names (in canonical order) ───────────── */
  const SHEET_README   = '00_README';
  const SHEET_ROWS     = '10_rows';
  const SHEET_METHODS  = '20_methods';
  const SHEET_MANIFEST = '90_manifest';

  const SHEET_ORDER = [SHEET_README, SHEET_ROWS, SHEET_METHODS, SHEET_MANIFEST];

  /* ── Suppression / flag codes ────────────────────────────── */
  const COHORT_LT_15_BLOCK         = 'COHORT_LT_15_BLOCK';
  const TUTOR_LT_5_COLLAPSED       = 'TUTOR_LT_5_COLLAPSED';
  const GRADE_BAND_LT_5_SUPPRESSED = 'GRADE_BAND_LT_5_SUPPRESSED';
  const EXTREME_ROW_FLAGGED        = 'EXTREME_ROW_FLAGGED';

  const SUPPRESSION_CODES = {
    COHORT_LT_15_BLOCK,
    TUTOR_LT_5_COLLAPSED,
    GRADE_BAND_LT_5_SUPPRESSED,
    EXTREME_ROW_FLAGGED
  };

  /* ── Thresholds ──────────────────────────────────────────── */
  const COHORT_MIN_N = 15;     // below this, export is blocked
  const TUTOR_MIN_N  = 5;      // below this, tutors are collapsed to T_other
  const GRADE_BAND_MIN_N = 5;  // below this, the band aggregate is suppressed
  const EXTREME_SD_THRESHOLD = 3; // |z| > 3 from cohort mean → extreme_row_flag

  /* ── Aggregate suppression display ───────────────────────── */
  // Lecturer-facing suppressed counts must render as the literal string '<5',
  // never the numeric value, per spec.
  const SUPPRESSED_DISPLAY = '<5';

  /* ── Forbidden fields (privacy guard list for tests) ────── */
  // Any string in this list MUST NOT appear as a column name, sheet name,
  // cell value source, manifest field, or filename component in the
  // moderation export. Issue #4 will assert this at the XML level.
  const FORBIDDEN_FIELDS = Object.freeze([
    // Student identity
    'student_name', 'studentName', 'student name',
    'student_id',   'studentId',   'student id',
    'nsn',          'NSN',
    'email',        'student_email', 'studentEmail',
    // Tutor identity
    'tutor_name',   'tutorName',   'tutor name',
    'tutor',                                          // raw tutor name field on student
    // Free-text content
    'marker_notes', 'markerNotes', "marker's notes",
    'feedback',     'feedback_text', 'feedbackText', 'cooked_feedback',
    'snippet',      'snippet_text', 'snippetText',
    // Exact timing
    'timestamp',    'date',         'created',
    'opened_at',    'submitted_at', 'submittedAt',
    'last_edit',    'lastEdit',
    // Reversible keys
    'lookup_key',   'reverse_key',  'student_uid',
    // Composite quality scores
    'tutor_quality_score', 'tutorQualityScore'
  ]);

  /* ── Required v1 row fields (10_rows columns) ────────────── */
  // Per spec §"Required v1 row fields". Column order in the workbook
  // should follow this list.
  const REQUIRED_ROW_FIELDS = Object.freeze([
    'row_label',
    'paper_code',
    'cohort_id',
    'assessment_id',
    'rubric_version_hash',
    'tutor_label',
    // criterion_<k>_score / criterion_<k>_max are expanded dynamically
    // by the export engine (issue #3) based on rubric.
    'total_score',
    'total_max',
    'grade_band',
    'suppression_flag',
    'extreme_row_flag',
    'fk_version',
    'export_timestamp'   // rounded to hour, ISO 8601 with 'Z' or local TZ offset
  ]);

  const OPTIONAL_ROW_FIELDS = Object.freeze([
    'submission_window',
    'edit_count'
  ]);

  /* ── Filename builder ────────────────────────────────────── */
  // FK_ModExport_<PaperCode>_<CohortID>_<AssessmentID>_<YYYYMMDD>.xlsx
  function _safeIdent(s) {
    // Spec doesn't define a sanitiser, but identifiers go into a filename;
    // strip anything that would be unsafe on Windows / macOS / Linux paths.
    // Allow A-Z, a-z, 0-9, '-', '_'. Replace others with '-'. Collapse repeats.
    return String(s == null ? '' : s)
      .replace(/[^A-Za-z0-9_\-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function _yyyymmdd(date) {
    const d = (date instanceof Date) ? date : new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}${m}${day}`;
  }

  function buildModExportFilename(paperCode, cohortId, assessmentId, date) {
    const pc = _safeIdent(paperCode)   || 'PAPER';
    const ci = _safeIdent(cohortId)    || 'COHORT';
    const ai = _safeIdent(assessmentId)|| 'ASSESSMENT';
    return `FK_ModExport_${pc}_${ci}_${ai}_${_yyyymmdd(date)}.xlsx`;
  }

  /* ── Export-timestamp rounding (to the hour) ─────────────── */
  function roundExportTimestampToHour(date) {
    const d = (date instanceof Date) ? new Date(date.getTime()) : new Date();
    d.setMinutes(0, 0, 0);
    return d.toISOString();
  }

  /* ── Export to global ────────────────────────────────────── */
  window.FKModSchema = {
    // Versions
    MOD_EXPORT_SCHEMA_VERSION,
    MOD_OPTIN_TEXT_VERSION,
    // Sheets
    SHEET_README, SHEET_ROWS, SHEET_METHODS, SHEET_MANIFEST,
    SHEET_ORDER,
    // Suppression
    COHORT_LT_15_BLOCK, TUTOR_LT_5_COLLAPSED,
    GRADE_BAND_LT_5_SUPPRESSED, EXTREME_ROW_FLAGGED,
    SUPPRESSION_CODES,
    // Thresholds
    COHORT_MIN_N, TUTOR_MIN_N, GRADE_BAND_MIN_N,
    EXTREME_SD_THRESHOLD,
    SUPPRESSED_DISPLAY,
    // Field lists
    FORBIDDEN_FIELDS,
    REQUIRED_ROW_FIELDS,
    OPTIONAL_ROW_FIELDS,
    // Helpers
    buildModExportFilename,
    roundExportTimestampToHour
  };
})();
