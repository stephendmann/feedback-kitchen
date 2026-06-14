/* ============================================================
   FK-19 — Moodle offline-grading-worksheet parser + validator.

   Pure functions. No DOM, no localStorage, no network. This is the
   "dry-run" layer: BEFORE FK-19 maps a worksheet into the cohort
   queue, validateWorksheet() confirms the file conforms to the
   INS-10 schema (14-column header, RFC-4180 structure) and flags
   encoding drift (BOM / CRLF) — so a malformed or wrong file fails
   loudly with an actionable message instead of silently mis-parsing.

   Schema + encoding pinned by INS-10 (real export, byte-checked):
   UTF-8 BOM + CRLF record terminators; 14 fixed columns; only
   `Grade` and `Feedback comments` are marker-editable on upload.

   See: scripts/gen-moodle-fixture.js (synthetic fixtures),
        docs/fk_moodle_worksheet_v1.md (to be written with FK-19).
   ============================================================ */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.FKMoodle = api;
}(this, function () {
  'use strict';

  const BOM = '﻿';

  // THE STRUCTURAL CONTRACT — the canonical 14-column header (INS-10), in
  // order. Hard-coded on purpose: institutional docs + Moodle core both treat
  // any rename / reorder / add / remove as fatal, so ANY deviation here is a
  // FILE-blocking E_HEADER_MISMATCH that must halt the UI "Ready to Import"
  // transition. Do not soften to a fuzzy match.
  const REQUIRED_HEADER = [
    'Identifier', 'Full name', 'ID number', 'Email address', 'Status',
    'Group', 'Marker', 'Grade', 'Maximum grade', 'Marking workflow state',
    'Grade can be changed', 'Last modified (submission)', 'Last modified (grade)',
    'Feedback comments'
  ];
  const EDITABLE_COLUMNS  = ['Grade', 'Feedback comments']; // only these on upload
  const IDENTIFIER_COLUMN = 'ID number';                    // → FK sid:
  const NAME_COLUMN       = 'Full name';                    // → FK name: fallback
  const PARTICIPANT_COLUMN = 'Identifier';                  // Moodle's own row key
  const COL = {};
  REQUIRED_HEADER.forEach((h, i) => { COL[h] = i; });

  /* ── RFC-4180 parser ────────────────────────────────────────
     Records terminate on CRLF or lone LF/CR; quoted fields may
     hold commas, CR, LF, and doubled quotes (""). Strips a leading
     BOM. Throws { code:'E_UNBALANCED_QUOTE' } if EOF is reached
     inside an open quote. Returns an array of records (arrays of
     field strings); a trailing blank line is ignored. */
  function parseCsv(text) {
    let s = String(text == null ? '' : text);
    if (s.charCodeAt(0) === 0xfeff) s = s.slice(1);
    const records = [];
    let row = [], field = '', inQuotes = false, i = 0;
    const n = s.length;
    const endField = () => { row.push(field); field = ''; };
    const endRow   = () => { endField(); records.push(row); row = []; };
    while (i < n) {
      const c = s[i];
      if (inQuotes) {
        if (c === '"') {
          if (s[i + 1] === '"') { field += '"'; i += 2; continue; }
          inQuotes = false; i++; continue;
        }
        field += c; i++; continue;
      }
      if (c === '"') { inQuotes = true; i++; continue; }
      if (c === ',') { endField(); i++; continue; }
      if (c === '\r') { if (s[i + 1] === '\n') i++; endRow(); i++; continue; }
      if (c === '\n') { endRow(); i++; continue; }
      field += c; i++;
    }
    if (inQuotes) { const e = new Error('Unterminated quoted field'); e.code = 'E_UNBALANCED_QUOTE'; throw e; }
    // flush the last field/row unless the file ended exactly on a terminator
    if (field !== '' || row.length) endRow();
    return records;
  }

  /* ── Two-tier dry-run validator ─────────────────────────────
     Mirrors Moodle's known internal contract (institutional docs +
     core grade/import/csv/load_data.php, which skips "invalid row
     with blank user field" rather than aborting):

       • FILE-blocking errors (severity:'file') — structural: empty,
         unparseable, or any header deviation. Abort: no rows import,
         and the UI must NOT transition to "Ready to Import".
       • ROW-level errors (severity:'row', carry {row,column}) — data
         integrity on one row (unkeyable, duplicate id, bad grade).
         Other rows still import; the UI highlights/grays just these.
       • Warnings — encoding drift (BOM/EOL) or informational row
         notes (No-submission). Never block.

     Returns { isValid, ok, errors, warnings, rowCount, importableRows }.
     isValid (===ok) is false iff a file-blocking error exists, OR any
     row error exists when opts.strictRows is set (risk-averse mode). */
  function validateWorksheet(text, opts) {
    opts = opts || {};
    const errors = [], warnings = [];
    const fileErr = (code, message, column) => errors.push({ code, message, severity: 'file', column: (column == null ? null : column) });
    const rowErr  = (code, message, row, column) => errors.push({ code, message, severity: 'row', row, column });
    const warn    = (code, message, row) => warnings.push(row == null ? { code, message } : { code, message, row });
    const raw = String(text == null ? '' : text);

    const done = (rowCount, importable) => {
      const fileBlocking = errors.some(e => e.severity === 'file') ||
        (opts.strictRows && errors.some(e => e.severity === 'row'));
      const ok = !fileBlocking;
      return { isValid: ok, ok: ok, errors: errors, warnings: warnings,
               rowCount: rowCount || 0, importableRows: (importable == null ? (rowCount || 0) : importable) };
    };

    if (!raw.trim()) { fileErr('E_EMPTY', 'The file is empty.'); return done(0, 0); }
    if (raw.charCodeAt(0) !== 0xfeff) {
      warn('W_NO_BOM', 'File has no UTF-8 BOM; Moodle exports include one. Re-export or save as UTF-8 to be safe.');
    }
    if (!/\r\n/.test(raw)) {
      warn('W_EOL_NOT_CRLF', 'File uses LF, not CRLF, line endings; Moodle exports use CRLF. Upload may still work but is not byte-identical.');
    }

    let records;
    try { records = parseCsv(raw); }
    catch (e) { fileErr(e.code || 'E_PARSE', 'Could not parse the CSV: ' + (e.message || 'malformed quoting') + '.'); return done(0, 0); }
    if (!records.length) { fileErr('E_EMPTY', 'No rows found.'); return done(0, 0); }

    // ── FILE-blocking: header is the structural contract ──
    const header = records[0];
    if (header.length !== REQUIRED_HEADER.length) {
      fileErr('E_HEADER_MISMATCH',
        'Header has ' + header.length + ' columns, expected ' + REQUIRED_HEADER.length +
        ' (do not add, remove, rename, or reorder columns).', null);
      return done(records.length - 1, 0);
    }
    const badCol = REQUIRED_HEADER.findIndex((h, k) => header[k] !== h);
    if (badCol !== -1) {
      fileErr('E_HEADER_MISMATCH',
        'Column ' + (badCol + 1) + ' is "' + header[badCol] + '", expected "' + REQUIRED_HEADER[badCol] +
        '" — do not rename, move, add, or remove columns.', badCol);
      return done(records.length - 1, 0);
    }

    // ── Per-row checks (header is sound) ──
    const dataRows = records.length - 1;
    const seenIds = {};
    let skipped = 0;
    for (let r = 1; r < records.length; r++) {
      const rowNo = r + 1;            // 1-based incl. header, for UI/messages
      const cells = records[r];

      // FILE-blocking: a ragged row means the CSV structure is broken.
      if (cells.length !== REQUIRED_HEADER.length) {
        fileErr('E_ROW_FIELD_COUNT',
          'Row ' + rowNo + ' has ' + cells.length + ' fields, expected ' + REQUIRED_HEADER.length + '.', null);
        continue;
      }

      let rowBad = false;
      const id   = (cells[COL[IDENTIFIER_COLUMN]] || '').trim();
      const name = (cells[COL[NAME_COLUMN]] || '').trim();
      const grade = (cells[COL.Grade] || '').trim();
      const maxGrade = parseFloat(cells[COL['Maximum grade']]) || 100;
      const status = (cells[COL.Status] || '');

      // ROW-level: no usable key (FK keys sid:<ID number>, falls back to name:).
      if (!id && !name) {
        rowErr('E_ROW_NO_KEY', 'Row ' + rowNo + ' has no ID number and no Full name — it cannot be matched to a student.', rowNo, IDENTIFIER_COLUMN);
        rowBad = true;
      } else if (id) {
        if (seenIds[id]) { rowErr('E_ROW_DUP_ID', 'Row ' + rowNo + ' repeats ID number "' + id + '" (also row ' + seenIds[id] + ').', rowNo, IDENTIFIER_COLUMN); rowBad = true; }
        else seenIds[id] = rowNo;
      }

      // ROW-level: a pre-filled grade that is non-numeric or out of range.
      if (grade !== '') {
        const g = Number(grade);
        if (!isFinite(g))      { rowErr('E_ROW_GRADE_NONNUMERIC', 'Row ' + rowNo + ' grade "' + grade + '" is not a number.', rowNo, 'Grade'); rowBad = true; }
        else if (g < 0 || g > maxGrade) { rowErr('E_ROW_GRADE_RANGE', 'Row ' + rowNo + ' grade ' + g + ' is outside 0–' + maxGrade + '.', rowNo, 'Grade'); rowBad = true; }
      }

      // Informational (non-blocking): No-submission rows are non-markable.
      if (/^No submission/.test(status)) {
        warn('W_ROW_NO_SUBMISSION', 'Row ' + rowNo + ' has no submission — non-markable; it will be shown but skipped.', rowNo);
      }

      if (rowBad) skipped++;
    }

    return done(dataRows, dataRows - skipped);
  }

  /* Short status bucket for UI badges. */
  function statusBucket(status) {
    const s = String(status || '');
    if (/^No submission/.test(s)) return 'no-submission';
    if (/late/i.test(s))          return 'late';
    if (/^Submitted/.test(s))     return 'submitted';
    return 'other';
  }

  /* ── Import mapping (worksheet → cohort-queue plan) ──────────
     The pure planning layer the UI renders. Runs the validator
     first: if a FILE-blocking error exists the plan is empty
     (the UI must not transition to "Ready to Import"). Otherwise
     every data row is classified into a disposition the UI shows
     as a distinct visual state — no row is silently dropped:

       • 'import'       — keyed sid:<ID number>; ready to queue.
       • 'verify'       — ID number blank but Full name present;
                          keyed name:<name> but REQUIRES manual
                          confirmation first (name-only matching is
                          a grade-leakage risk), so never auto-import.
       • 'skip'         — unkeyable (no id + no name) or duplicate id.
       • 'non-markable' — No-submission row; shown but not marked.

     Returns { isValid, validation, entries, summary }. Keys are the
     FK cohort keys (sid:/name:) so the queue can dedupe against an
     existing cohort. markerNotes / moderation data are NEVER read. */
  function planImport(text, opts) {
    opts = opts || {};
    const validation = validateWorksheet(text, opts);
    const summary = { total: 0, import: 0, verify: 0, skip: 0, nonMarkable: 0 };
    if (!validation.isValid) {
      return { isValid: false, validation: validation, entries: [], summary: summary };
    }
    const records = parseCsv(text);
    const rowCodes = {};
    validation.errors.filter(e => e.severity === 'row')
      .forEach(e => { (rowCodes[e.row] = rowCodes[e.row] || []).push(e.code); });

    const entries = [];
    for (let r = 1; r < records.length; r++) {
      const rowNo = r + 1;
      const cells = records[r];
      if (cells.length !== REQUIRED_HEADER.length) continue;
      const id     = (cells[COL[IDENTIFIER_COLUMN]] || '').trim();
      const name   = (cells[COL[NAME_COLUMN]] || '').trim();
      const status = cells[COL.Status] || '';
      const codes  = rowCodes[rowNo] || [];

      let disposition, key = null, keyType = null, reason = null;
      if (codes.indexOf('E_ROW_NO_KEY') !== -1)      { disposition = 'skip'; reason = 'No ID number or name — cannot match a student.'; }
      else if (codes.indexOf('E_ROW_DUP_ID') !== -1) { disposition = 'skip'; reason = 'Duplicate ID number.'; }
      else if (statusBucket(status) === 'no-submission') {
        disposition = 'non-markable'; reason = 'No submission — nothing to mark.';
        if (id) { key = 'sid:' + id; keyType = 'sid'; } else if (name) { key = 'name:' + name; keyType = 'name'; }
      } else if (id) { disposition = 'import'; key = 'sid:' + id; keyType = 'sid'; }
      else { disposition = 'verify'; key = 'name:' + name; keyType = 'name'; reason = 'Name-only match — confirm this is the right student before importing.'; }

      summary.total++;
      summary[disposition === 'non-markable' ? 'nonMarkable' : disposition]++;
      entries.push({
        row: rowNo,
        participant: (cells[COL[PARTICIPANT_COLUMN]] || '').trim(),
        name: name,
        identifier: id,
        key: key, keyType: keyType,
        status: statusBucket(status),
        disposition: disposition,
        reason: reason,
        errorCodes: codes
      });
    }
    return { isValid: true, validation: validation, entries: entries, summary: summary };
  }

  /* Cohort key, normalised exactly like shared.js studentMatchKey
     (lower-cased) so import dedup matches the store's own keying. */
  function storeKey(studentId, name) {
    const sid = (studentId || '').trim().toLowerCase();
    if (sid) return 'sid:' + sid;
    const nm = (name || '').trim().toLowerCase();
    return nm ? 'name:' + nm : null;
  }

  function recordHasMarks(rec) {
    if (!rec) return false;
    const sr = rec.scoreResult;
    if (sr && Array.isArray(sr.rows) && sr.rows.some(r => r && r.grade)) return true;
    return Array.isArray(rec.grades) && rec.grades.some(g => g && g.grade);
  }

  /* ── Commit decision (pure — does NOT touch the store) ───────
     Given the (UI-resolved) plan entries and the existing cohort
     students, decide what to actually add. Honours two locked rules:
       • skip-if-marked — never overwrite a record that already holds
         marking (preserve the marker's work); existing UNMARKED
         placeholders may be refreshed.
       • identity-only placeholder — a new student is seeded with name
         + studentId + retained Moodle participant id, NO scoreResult,
         so it appears as an unmarked cohort entry (opened via FK-07).
     Only disposition:'import' entries are committed (verify rows must
     have been resolved to 'import' or 'skip' in the UI first).
     Returns { toAdd, skippedExisting, summary } — the caller persists
     toAdd via SA.addToCohort. markerNotes/moderation are never set. */
  function buildCohortImport(entries, existingStudents) {
    existingStudents = existingStudents || [];
    const byKey = {};
    existingStudents.forEach(s => {
      const k = s.key || storeKey(s.studentId, s.name);
      if (k) byKey[k] = s;
    });
    const toAdd = [], skippedExisting = [];
    let skippedRow = 0;
    (entries || []).forEach(e => {
      if (e.disposition !== 'import') { skippedRow++; return; }
      const studentId = e.keyType === 'sid' ? (e.identifier || '') : '';
      const key = storeKey(studentId, e.name);
      const existing = key ? byKey[key] : null;
      if (existing && recordHasMarks(existing)) {
        skippedExisting.push({ key: key, name: e.name, reason: 'already marked in cohort — kept' });
        return;
      }
      toAdd.push({
        name: e.name || '',
        studentId: studentId,
        moodleIdentifier: e.participant || '',  // Moodle "Participant NNNN" retained for export
        source: 'moodle-worksheet'
        // deliberately no scoreResult / markerNotes — an unmarked roster placeholder
      });
    });
    return {
      toAdd: toAdd,
      skippedExisting: skippedExisting,
      summary: { add: toAdd.length, skippedExisting: skippedExisting.length, skippedRow: skippedRow }
    };
  }

  return {
    parseCsv, validateWorksheet, planImport, buildCohortImport,
    statusBucket, storeKey, recordHasMarks,
    REQUIRED_HEADER, EDITABLE_COLUMNS, IDENTIFIER_COLUMN, NAME_COLUMN,
    PARTICIPANT_COLUMN, COL, BOM
  };
}));
