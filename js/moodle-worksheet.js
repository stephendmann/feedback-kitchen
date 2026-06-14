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

  /* ── File-level preflight validator (narrow + deterministic) ──
     Concerned ONLY with whether the file is a structurally sound Moodle
     worksheet — parse integrity, the header contract, and encoding.
     Row-level identity/duplicate/submission classification is the
     planner's job (planImport → dispositions), not the validator's, so
     this stays a clean preflight gate (cf. Moodle core, which aborts on
     structural problems but skips bad rows at import).

       • errors[]   — { code, message, severity:'fatal', column?|row? }
                      structural/parse/header. Any error → isValid:false;
                      the UI must NOT transition to "Ready to Import".
       • warnings[] — { code, message, severity:'warning' } encoding drift
                      (BOM/EOL). Advisory; never block.
       • rows[]     — normalized parsed data rows (header excluded), for
                      downstream planning. Empty unless isValid.

     Returns { isValid, ok, errors, warnings, rowCount, rows }. */
  function validateWorksheet(text) {
    const errors = [], warnings = [];
    const err  = (code, message, extra) => errors.push(Object.assign({ code: code, message: message, severity: 'fatal' }, extra || {}));
    const warn = (code, message) => warnings.push({ code: code, message: message, severity: 'warning' });
    const raw = String(text == null ? '' : text);
    const fail = () => ({ isValid: false, ok: false, errors: errors, warnings: warnings, rowCount: 0, rows: [] });

    if (!raw.trim()) { err('E_EMPTY', 'The file is empty.'); return fail(); }
    if (raw.charCodeAt(0) !== 0xfeff) {
      warn('W_NO_BOM', 'File has no UTF-8 BOM; Moodle exports include one. Re-export or save as UTF-8 to be safe.');
    }
    if (!/\r\n/.test(raw)) {
      warn('W_EOL_NOT_CRLF', 'File uses LF, not CRLF, line endings; Moodle exports use CRLF. Upload may still work but is not byte-identical.');
    }

    let records;
    try { records = parseCsv(raw); }
    catch (e) { err(e.code || 'E_PARSE', 'Could not parse the CSV: ' + (e.message || 'malformed quoting') + '.'); return fail(); }
    if (!records.length) { err('E_EMPTY', 'No rows found.'); return fail(); }

    // The header is the structural contract — any deviation is fatal.
    const header = records[0];
    if (header.length !== REQUIRED_HEADER.length) {
      err('E_HEADER_MISMATCH', 'Header has ' + header.length + ' columns, expected ' + REQUIRED_HEADER.length +
        ' (do not add, remove, rename, or reorder columns).', { column: null });
      return fail();
    }
    const badCol = REQUIRED_HEADER.findIndex((h, k) => header[k] !== h);
    if (badCol !== -1) {
      err('E_HEADER_MISMATCH', 'Column ' + (badCol + 1) + ' is "' + header[badCol] + '", expected "' +
        REQUIRED_HEADER[badCol] + '" — do not rename, move, add, or remove columns.', { column: badCol });
      return fail();
    }

    // Structural integrity only: every data row must be rectangular. Identity /
    // duplicate / submission-status classification is NOT done here — that is
    // planImport's job (row-level dispositions), keeping this a narrow file gate.
    const rows = [];
    for (let r = 1; r < records.length; r++) {
      if (records[r].length !== REQUIRED_HEADER.length) {
        err('E_ROW_FIELD_COUNT', 'Row ' + (r + 1) + ' has ' + records[r].length + ' fields, expected ' +
          REQUIRED_HEADER.length + '.', { row: r + 1 });
      } else {
        rows.push(records[r]);   // normalized parsed data row, for downstream planning
      }
    }

    const isValid = errors.length === 0;
    return { isValid: isValid, ok: isValid, errors: errors, warnings: warnings,
             rowCount: records.length - 1, rows: isValid ? rows : [] };
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
  function planImport(text) {
    const validation = validateWorksheet(text);
    const summary = { total: 0, import: 0, verify: 0, skip: 0, nonMarkable: 0 };
    if (!validation.isValid) {
      return { isValid: false, validation: validation, entries: [], summary: summary };
    }
    // Row-level classification lives HERE (not the validator). validation.rows
    // are the normalized data rows in original order, so row numbers are
    // reconstructable (header is line 1).
    //
    // NOTE — the `Grade` column is deliberately NOT validated on import, and
    // do not "fix" that by adding range/numeric checks here: a standard Moodle
    // offline-grading-worksheet / participant export carries EMPTY grade
    // columns (the marker fills grades in FK, which writes them back on
    // EXPORT). Grade-value validation therefore belongs to the export path,
    // not this import classifier — checking it here would validate data that
    // is empty by definition.
    const entries = [];
    const seenIds = {};
    validation.rows.forEach((cells, idx) => {
      const rowNo  = idx + 2;                       // +1 header, +1 to 1-based
      const id     = (cells[COL[IDENTIFIER_COLUMN]] || '').trim();
      const name   = (cells[COL[NAME_COLUMN]] || '').trim();
      const status = statusBucket(cells[COL.Status] || '');

      let disposition, key = null, keyType = null, reason = null;
      const codes = [];
      if (!id && !name) {
        disposition = 'skip'; reason = 'No ID number or name — cannot match a student.'; codes.push('E_ROW_NO_KEY');
      } else if (id && seenIds[id]) {
        disposition = 'skip'; reason = 'Duplicate ID number (also row ' + seenIds[id] + ').'; codes.push('E_ROW_DUP_ID');
      } else if (status === 'no-submission') {
        disposition = 'non-markable'; reason = 'No submission — nothing to mark.';
        if (id) { key = 'sid:' + id; keyType = 'sid'; seenIds[id] = rowNo; } else { key = 'name:' + name; keyType = 'name'; }
      } else if (id) {
        disposition = 'import'; key = 'sid:' + id; keyType = 'sid'; seenIds[id] = rowNo;
      } else {
        disposition = 'verify'; key = 'name:' + name; keyType = 'name';
        reason = 'Name-only match — confirm this is the right student before importing.';
      }

      summary.total++;
      summary[disposition === 'non-markable' ? 'nonMarkable' : disposition]++;
      entries.push({
        row: rowNo,
        participant: (cells[COL[PARTICIPANT_COLUMN]] || '').trim(),
        name: name, identifier: id, key: key, keyType: keyType,
        status: status, disposition: disposition, reason: reason, errorCodes: codes
      });
    });
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

  // RFC-4180 field quoting (mirror of parseCsv): quote only when the value
  // contains a comma, double-quote, CR or LF; double any internal quotes.
  function csvField(v) {
    const s = (v == null) ? '' : String(v);
    return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function _serializeWorksheet(records) {
    return BOM + records.map(r => r.map(csvField).join(',')).join('\r\n') + '\r\n';
  }

  /* ── Export (the other half of the round-trip) ───────────────
     Fills Grade + Feedback comments back into the ORIGINAL worksheet
     for students FK has marked, preserving every other column /
     identifier / the BOM+CRLF encoding so the file re-uploads to
     Moodle. The marker re-supplies (or FK caches) the original file:
     FK can't reconstruct Email/Status/timestamps, so the round-trip
     is "fill the file you downloaded", which is also Moodle's own
     mental model — and means the import data model needs no change.

     HARD privacy constraint: the writer reads ONLY scoreResult +
     feedbackText. markerNotes / moderation data are NEVER touched —
     the Feedback comments column carries feedbackText and nothing else.

     Returns { ok, errors, text, summary }. ok:false (with the file
     errors) if the supplied file is not a valid worksheet. */
  function buildExportWorksheet(originalText, cohortStudents, opts) {
    opts = opts || {};
    const validation = validateWorksheet(originalText);
    if (!validation.isValid) return { ok: false, errors: validation.errors, text: null, summary: null };

    const records = parseCsv(originalText);             // [header, ...dataRows]
    const byKey = {};
    (cohortStudents || []).forEach(s => { const k = s.key || storeKey(s.studentId, s.name); if (k) byKey[k] = s; });

    const gradeCol = COL.Grade, fbCol = COL['Feedback comments'];
    let filled = 0;
    for (let r = 1; r < records.length; r++) {
      const cells = records[r];
      if (cells.length !== REQUIRED_HEADER.length) continue;
      const key = storeKey(cells[COL[IDENTIFIER_COLUMN]], cells[COL[NAME_COLUMN]]);
      const rec = key ? byKey[key] : null;
      if (!rec || !recordHasMarks(rec)) continue;       // only matched + MARKED rows
      const sr = rec.scoreResult || {};
      const score = (typeof sr.penalisedScore === 'number') ? sr.penalisedScore
                  : (typeof sr.weightedTotal === 'number') ? sr.weightedTotal : null;
      if (score == null) continue;
      cells[gradeCol] = score.toFixed(2);               // FK /100 → Moodle numeric grade
      cells[fbCol]    = String(rec.feedbackText || ''); // feedbackText ONLY — never markerNotes
      filled++;
    }
    const total = records.length - 1;
    return { ok: true, errors: [], text: _serializeWorksheet(records),
             summary: { total: total, filled: filled, unmatched: total - filled } };
  }

  /* Verify re-assignment guard (Gemini): when the user assigns an ID to a
     name-only row, confirm the new ID does not collide with another import
     row or an existing cohort student. Returns null when free, else a
     conflict descriptor — the UI must block Commit until resolved. */
  function sidCollision(sid, entries, existingStudents, exceptRow) {
    const key = storeKey(sid, '');
    if (!key) return { code: 'E_ROW_NO_KEY', scope: 'input' };
    const dupRow = (entries || []).find(e =>
      e.row !== exceptRow && e.keyType === 'sid' && storeKey(e.identifier, '') === key);
    if (dupRow) return { code: 'E_ROW_DUP_ID', scope: 'worksheet', row: dupRow.row };
    const dupCohort = (existingStudents || []).find(s =>
      (s.key || storeKey(s.studentId, s.name)) === key);
    if (dupCohort) return { code: 'E_DUP_IN_COHORT', scope: 'cohort', name: dupCohort.name };
    return null;
  }

  return {
    parseCsv, validateWorksheet, planImport, buildCohortImport, buildExportWorksheet, sidCollision,
    statusBucket, storeKey, recordHasMarks,
    REQUIRED_HEADER, EDITABLE_COLUMNS, IDENTIFIER_COLUMN, NAME_COLUMN,
    PARTICIPANT_COLUMN, COL, BOM
  };
}));
