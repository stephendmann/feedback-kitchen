/* ============================================================
   FK-19 — Moodle offline-grading-worksheet parser + validator.

   Pure functions. No DOM, no localStorage, no network. This is the
   "dry-run" layer: BEFORE FK-19 maps a worksheet into the cohort
   queue, validateWorksheet() confirms the file carries the columns
   the requested workflow actually needs, is structurally sound
   (RFC-4180, rectangular rows), and flags a missing BOM — so a
   malformed or wrong file fails loudly with an actionable message
   instead of silently mis-parsing.

   COLUMN MODEL — the worksheet has NO fixed column set. Moodle
   emits the grading table's visible columns, and those vary per
   assignment: `Group` only with group submission, `Marker` only
   with marking allocation, and `Allow submissions from` / `Due
   date` / `Cut-off date` only once per-user dates can diverge
   (an extension or override granted). Two real exports from the
   same institution therefore differ in both width and order.
   FK resolves every column it touches by LITERAL NAME at parse
   time, requires only the columns the chosen workflow operates
   on, and carries every other column through verbatim.

   ENCODING is variable too. Exports carry a UTF-8 BOM, but the
   record terminator is not fixed: a 2026-06 export used CRLF and
   a 2026-09 export from the same Moodle used lone LF. Both are
   valid RFC-4180 and Moodle accepts either on upload, so FK reads
   both and writes back whichever the source used rather than
   normalising to one.

   Only `Grade` and `Feedback comments` are marker-editable on
   upload; export rewrites those two cells in place and leaves the
   rest of the record untouched, so the uploaded file's full
   schema, column order and line endings survive the round trip.

   See: scripts/gen-moodle-fixture.js (synthetic fixtures for both
        the Group/Marker and date/override real layouts).
   ============================================================ */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.FKMoodle = api;
}(this, function () {
  'use strict';

  const BOM = '﻿';

  /* ── The columns FK reads or writes, by exact Moodle header text ──
     Names, never positions. Moodle rejects a RENAMED column on upload,
     so an exact-name match is the real contract; column ORDER and the
     presence of other columns are not. */
  const IDENTIFIER_COLUMN  = 'ID number';         // → FK sid:
  const NAME_COLUMN        = 'Full name';         // display only — never a match key
  const PARTICIPANT_COLUMN = 'Identifier';        // Moodle's own row key, round-tripped
  const STATUS_COLUMN      = 'Status';
  const GRADE_COLUMN       = 'Grade';
  const FEEDBACK_COLUMN    = 'Feedback comments';

  // Marker-editable on upload. Everything else is preserved verbatim.
  const EDITABLE_COLUMNS = [GRADE_COLUMN, FEEDBACK_COLUMN];

  /* Only the OPERATIONAL columns for the workflow being run are required.
     A file that cannot be exported (no Grade column, e.g. a participants
     list) may still be perfectly importable as a roster, and demanding
     export columns up front would reject it for no reason. */
  const REQUIRED_COLUMNS = {
    // roster in: who the row is, whether there is anything to mark
    import: [PARTICIPANT_COLUMN, NAME_COLUMN, IDENTIFIER_COLUMN, STATUS_COLUMN],
    // marks out: which row to fill, and the two cells to fill
    export: [PARTICIPANT_COLUMN, IDENTIFIER_COLUMN, GRADE_COLUMN, FEEDBACK_COLUMN]
  };
  const DEFAULT_WORKFLOW = 'import';

  /* ── RFC-4180 parser ────────────────────────────────────────
     Records terminate on CRLF or lone LF/CR; quoted fields may
     hold commas, CR, LF, and doubled quotes (""). Strips a leading
     BOM. Throws { code:'E_UNBALANCED_QUOTE' } if EOF is reached
     inside an open quote. Returns an array of records (arrays of
     field strings); a trailing blank line is ignored. Width is
     whatever the file has — the parser imposes no column count. */
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

  /* ── Column resolution (literal name → index) ────────────────
     Header cells are matched LITERALLY, byte for byte, after removing a
     leading BOM and nothing else. Recognised names are not trimmed: a
     header of " Grade " is a different column from "Grade", because it
     is a column Moodle did not write, and quietly accepting it would
     let a hand-edited or spreadsheet-mangled file through as if it were
     an untouched export. Moodle rejects a renamed column on upload, and
     padding is a rename. A duplicate name is fatal rather than
     first-wins: with two `Grade` columns there is no safe answer to
     "which one do I write?".
     Returns { index, missing, duplicates, blanks } — `index` maps
     every recognised name to its position in THIS file. */
  function resolveColumns(header, required) {
    const index = {}, duplicates = [], blanks = [], seen = {};
    (header || []).forEach((cell, i) => {
      // BOM only: parseCsv strips it from the file, but resolveColumns is
      // callable directly with a header array that still carries one.
      const name = String(cell == null ? '' : cell).replace(/^﻿/, '');
      if (!name.trim()) { blanks.push(i); return; }   // blank/whitespace-only: nothing to key on
      if (Object.prototype.hasOwnProperty.call(seen, name)) {
        if (duplicates.indexOf(name) === -1) duplicates.push(name);
        return;                                   // leave index on the first, flag it fatal below
      }
      seen[name] = i;
      index[name] = i;
    });
    const missing = (required || []).filter(name => !Object.prototype.hasOwnProperty.call(index, name));
    return { index: index, missing: missing, duplicates: duplicates, blanks: blanks };
  }

  /* ── File-level preflight validator (narrow + deterministic) ──
     Concerned ONLY with whether the file is a structurally sound Moodle
     worksheet FOR THIS WORKFLOW — parse integrity, the operational
     columns, and encoding. Row-level identity/duplicate/submission
     classification is the planner's job (planImport → dispositions), so
     this stays a clean preflight gate (cf. Moodle core, which aborts on
     structural problems but skips bad rows at import).

       • errors[]   — { code, message, severity:'fatal', column?|row? }
                      structural/parse/header. Any error → isValid:false;
                      the UI must NOT transition to "Ready to Import".
       • warnings[] — { code, message, severity:'warning' } encoding drift
                      (BOM/EOL). Advisory; never block.
       • rows[]     — parsed data rows (header excluded) at the file's own
                      width, in the file's own column order.
       • header[]   — the original header, verbatim, so callers can rebuild
                      the file without inventing a schema.
       • columns    — { name: index } for THIS file.

     `workflow` is 'import' (default) or 'export'; it selects which
     columns are operationally required. Returns
     { isValid, ok, workflow, errors, warnings, rowCount, rows, header, columns }. */
  function validateWorksheet(text, workflow) {
    const flow = REQUIRED_COLUMNS[workflow] ? workflow : DEFAULT_WORKFLOW;
    const required = REQUIRED_COLUMNS[flow];
    const errors = [], warnings = [];
    const err  = (code, message, extra) => errors.push(Object.assign({ code: code, message: message, severity: 'fatal' }, extra || {}));
    const warn = (code, message) => warnings.push({ code: code, message: message, severity: 'warning' });
    const raw = String(text == null ? '' : text);
    const fail = () => ({ isValid: false, ok: false, workflow: flow, errors: errors, warnings: warnings,
                          rowCount: 0, rows: [], header: [], columns: {} });

    if (!raw.trim()) { err('E_EMPTY', 'The file is empty.'); return fail(); }
    if (raw.charCodeAt(0) !== 0xfeff) {
      warn('W_NO_BOM', 'File has no UTF-8 BOM; Moodle exports include one. Re-export or save as UTF-8 to be safe.');
    }
    // NO line-ending warning. INS-10 pinned CRLF from one 2026-06 export, but a
    // 2026-09 export from the same Moodle (BOM present, 91 lone LF, 0 CRLF)
    // terminates records with LF — so "Moodle exports use CRLF" was a sample of
    // one, not a rule, and warning about it told the marker their fresh download
    // was wrong. Both are valid RFC-4180 and Moodle accepts either on upload;
    // buildExportWorksheet writes back whichever the source used (detectEol), so
    // there is nothing here for the marker to act on either.

    let records;
    try { records = parseCsv(raw); }
    catch (e) { err(e.code || 'E_PARSE', 'Could not parse the CSV: ' + (e.message || 'malformed quoting') + '.'); return fail(); }
    if (!records.length) { err('E_EMPTY', 'No rows found.'); return fail(); }

    // The header defines this file's schema. Extra columns are fine and are
    // preserved; only the operational ones must be present and unambiguous.
    const header = records[0];
    const resolved = resolveColumns(header, required);
    resolved.duplicates.forEach(name => {
      err('E_HEADER_DUPLICATE_COLUMN', 'The column "' + name + '" appears more than once — column names must be unique.',
        { column: name });
    });
    resolved.missing.forEach(name => {
      err('E_HEADER_MISSING_COLUMN', 'Required column "' + name + '" is missing (found: ' +
        header.map(h => String(h == null ? '' : h).trim()).filter(Boolean).join(', ') + ').', { column: name });
    });
    if (errors.length) return fail();

    // Structural integrity only, measured against THIS file's own width.
    // Identity / duplicate / submission-status classification is NOT done
    // here — that is planImport's job (row-level dispositions).
    const width = header.length;
    const rows = [];
    for (let r = 1; r < records.length; r++) {
      if (records[r].length !== width) {
        err('E_ROW_FIELD_COUNT', 'Row ' + (r + 1) + ' has ' + records[r].length + ' fields, expected ' +
          width + ' to match the header.', { row: r + 1 });
      } else {
        rows.push(records[r]);
      }
    }

    const isValid = errors.length === 0;
    return { isValid: isValid, ok: isValid, workflow: flow, errors: errors, warnings: warnings,
             rowCount: records.length - 1, rows: isValid ? rows : [],
             header: header.slice(), columns: resolved.index };
  }

  /* Short status bucket for UI badges. */
  function statusBucket(status) {
    const s = String(status || '');
    if (/^No submission/.test(s)) return 'no-submission';
    if (/late/i.test(s))          return 'late';
    if (/^Submitted/.test(s))     return 'submitted';
    return 'other';
  }

  /* Read a named cell out of a row using this file's own column map.
     Returns '' when the column is absent, so optional columns never throw. */
  function cellAt(cells, columns, name) {
    const i = columns ? columns[name] : undefined;
    return (i == null || !cells) ? '' : String(cells[i] == null ? '' : cells[i]);
  }

  /* The ONLY worksheet match key: sid:<ID number>, lower-cased to match
     shared.js studentMatchKey. A blank ID yields null — FK never falls back
     to name matching on a worksheet row, because two students can share a
     name and a wrong match leaks one student's grade to another. A row with
     no ID is surfaced for manual ID assignment instead (disposition
     'verify'), never keyed or imported automatically. */
  function worksheetKey(studentId) {
    const sid = String(studentId == null ? '' : studentId).trim().toLowerCase();
    return sid ? 'sid:' + sid : null;
  }

  /* ── Import mapping (worksheet → cohort-queue plan) ──────────
     The pure planning layer the UI renders. Runs the validator
     first: if a FILE-blocking error exists the plan is empty
     (the UI must not transition to "Ready to Import"). Otherwise
     every data row is classified into a disposition the UI shows
     as a distinct visual state — no row is silently dropped:

       • 'import'       — keyed sid:<ID number>; ready to queue.
       • 'verify'       — ID number blank; UNKEYED and never
                          committed. The marker must assign an ID
                          (mwAssignId → sidCollision) or ignore the
                          row. FK does not match on name.
       • 'skip'         — unusable row (no id and no name) or a
                          duplicate ID number.
       • 'non-markable' — No-submission row; shown but not marked.

     Returns { isValid, validation, entries, summary }. Keys are FK
     cohort keys (sid: only) so the queue can dedupe against an
     existing cohort. markerNotes / moderation data are NEVER read. */
  function planImport(text) {
    const validation = validateWorksheet(text, 'import');
    const summary = { total: 0, import: 0, verify: 0, skip: 0, nonMarkable: 0 };
    if (!validation.isValid) {
      return { isValid: false, validation: validation, entries: [], summary: summary };
    }
    const columns = validation.columns;
    // Row-level classification lives HERE (not the validator). validation.rows
    // are the parsed data rows in original order, so row numbers are
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
      const id     = cellAt(cells, columns, IDENTIFIER_COLUMN).trim();
      const name   = cellAt(cells, columns, NAME_COLUMN).trim();
      const status = statusBucket(cellAt(cells, columns, STATUS_COLUMN));
      const key    = worksheetKey(id);

      let disposition, entryKey = null, keyType = null, reason = null;
      const codes = [];
      if (!id && !name) {
        disposition = 'skip'; reason = 'No ID number or name — cannot match a student.'; codes.push('E_ROW_NO_KEY');
      } else if (key && seenIds[key]) {
        disposition = 'skip'; reason = 'Duplicate ID number (also row ' + seenIds[key] + ').'; codes.push('E_ROW_DUP_ID');
      } else if (status === 'no-submission') {
        disposition = 'non-markable'; reason = 'No submission — nothing to mark.';
        if (key) { entryKey = key; keyType = 'sid'; seenIds[key] = rowNo; }
      } else if (key) {
        disposition = 'import'; entryKey = key; keyType = 'sid'; seenIds[key] = rowNo;
      } else {
        // Name present, ID blank. NOT keyed by name: assign an ID or ignore.
        disposition = 'verify';
        reason = 'No ID number — assign one before importing (FK never matches on name alone).';
        codes.push('E_ROW_NO_ID');
      }

      summary.total++;
      summary[disposition === 'non-markable' ? 'nonMarkable' : disposition]++;
      entries.push({
        row: rowNo,
        participant: cellAt(cells, columns, PARTICIPANT_COLUMN).trim(),
        name: name, identifier: id, key: entryKey, keyType: keyType,
        status: status, disposition: disposition, reason: reason, errorCodes: codes
      });
    });
    return { isValid: true, validation: validation, entries: entries, summary: summary };
  }

  /* Cohort key, normalised exactly like shared.js studentMatchKey
     (lower-cased). Used for EXISTING cohort students, which may legitimately
     be name-keyed from a non-Moodle add. Worksheet rows use worksheetKey. */
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

  /* ── Next student still to mark (FK-53) ──────────────────────
     First record in cohort order that carries no marking, as a store key
     ready for loadCohortRecordIntoSession. Deliberately reads the same
     recordHasMarks that buildExportWorksheet uses to decide which rows to
     fill, so "still to mark" here and "silently skipped at export" there
     cannot drift apart — one definition of marked-ness, two callers.

     excludeKey skips the record just saved, so a save-and-advance flow can
     never re-land on the student it has this moment finished.
     Records with no resolvable key are skipped: nothing can re-open them.
     Returns null when the roster is exhausted, which the caller must treat
     as "run complete", not as an error.

     Lives here rather than in a scorer module because marked-ness is this
     module's concept. It is not Moodle-specific in use: a non-Moodle cohort
     answers the same question the same way. */
  function nextUnmarkedKey(students, excludeKey) {
    const list = students || [];
    for (let i = 0; i < list.length; i++) {
      const s = list[i];
      if (!s) continue;
      const key = s.key || storeKey(s.studentId, s.name);
      if (!key || key === excludeKey) continue;
      if (!recordHasMarks(s)) return key;
    }
    return null;
  }

  /* ── Commit decision (pure — does NOT touch the store) ───────
     Given the (UI-resolved) plan entries and the existing cohort
     students, decide what to actually add. Honours three locked rules:
       • sid-only — an entry without an ID number is never committed,
         however it got here. Name matching is not a fallback.
       • skip-if-marked — never overwrite a record that already holds
         marking (preserve the marker's work); existing UNMARKED
         placeholders may be refreshed.
       • identity-only placeholder — a new student is seeded with name
         + studentId + retained Moodle participant id, NO scoreResult,
         so it appears as an unmarked cohort entry (opened via FK-07).
     Only disposition:'import' entries are committed (verify rows must
     have been resolved to 'import' with an ID, or to 'skip', in the UI).
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
    let skippedRow = 0, skippedUnkeyed = 0;
    (entries || []).forEach(e => {
      if (e.disposition !== 'import') { skippedRow++; return; }
      const studentId = (e.identifier || '').trim();
      const key = worksheetKey(studentId);
      if (!key) { skippedUnkeyed++; return; }        // sid-only: no name fallback, ever
      const existing = byKey[key];
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
      summary: { add: toAdd.length, skippedExisting: skippedExisting.length,
                 skippedRow: skippedRow, skippedUnkeyed: skippedUnkeyed }
    };
  }

  // RFC-4180 field quoting (mirror of parseCsv): quote only when the value
  // contains a comma, double-quote, CR or LF; double any internal quotes.
  function csvField(v) {
    const s = (v == null) ? '' : String(v);
    return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  /* The source file's RECORD terminator. Newlines inside a quoted feedback
     cell are LF in both conventions and are irrelevant here: one CRLF
     anywhere in the raw text can only be a record terminator, since csvField
     never emits a bare CR. Real exports have been seen using each. */
  function detectEol(text) {
    return /\r\n/.test(String(text == null ? '' : text)) ? '\r\n' : '\n';
  }
  function _serializeWorksheet(records, eol) {
    const nl = eol || '\r\n';
    return BOM + records.map(r => r.map(csvField).join(',')).join(nl) + nl;
  }

  /* ── Export (the other half of the round-trip) ───────────────
     Fills Grade + Feedback comments back into the ORIGINAL worksheet
     for students FK has marked. Every record is re-serialised from the
     file's own parse, so the uploaded worksheet's complete schema —
     its column set, its column order, its optional Group / Marker /
     Due date columns, its identifiers and timestamps, its BOM and its
     own line endings (detectEol, not a normalised CRLF) — comes back
     out unchanged apart from the two editable cells. The
     marker re-supplies (or FK caches) the original file: FK can't
     reconstruct Email/Status/timestamps, so the round-trip is "fill
     the file you downloaded", which is also Moodle's own mental model.

     Rows are matched on `ID number` ONLY (worksheetKey). A row with a
     blank ID is left untouched rather than matched by name.

     HARD privacy constraint: the writer reads ONLY scoreResult +
     feedbackText. markerNotes / moderation data are NEVER touched —
     the Feedback comments column carries feedbackText and nothing else.

     Returns { ok, errors, text, summary }. ok:false (with the file
     errors) if the supplied file is not a valid worksheet for export. */
  function buildExportWorksheet(originalText, cohortStudents, opts) {
    opts = opts || {};
    const validation = validateWorksheet(originalText, 'export');
    if (!validation.isValid) return { ok: false, errors: validation.errors, text: null, summary: null };

    const records = parseCsv(originalText);            // [header, ...dataRows]
    const columns = validation.columns;
    const width   = validation.header.length;
    const byKey = {};
    (cohortStudents || []).forEach(s => { const k = s.key || storeKey(s.studentId, s.name); if (k) byKey[k] = s; });

    const gradeCol = columns[GRADE_COLUMN], fbCol = columns[FEEDBACK_COLUMN];
    let filled = 0;
    for (let r = 1; r < records.length; r++) {
      const cells = records[r];
      if (cells.length !== width) continue;            // validated above; belt-and-braces
      const key = worksheetKey(cellAt(cells, columns, IDENTIFIER_COLUMN));
      const rec = key ? byKey[key] : null;             // sid only — no name fallback
      if (!rec || !recordHasMarks(rec)) continue;      // only matched + MARKED rows
      const sr = rec.scoreResult || {};
      const score = (typeof sr.penalisedScore === 'number') ? sr.penalisedScore
                  : (typeof sr.weightedTotal === 'number') ? sr.weightedTotal : null;
      if (score == null) continue;
      cells[gradeCol] = score.toFixed(2);              // FK /100 → Moodle numeric grade
      cells[fbCol]    = String(rec.feedbackText || ''); // feedbackText ONLY — never markerNotes
      filled++;
    }
    const total = records.length - 1;
    const eol = detectEol(originalText);               // write back what the file used
    return { ok: true, errors: [], text: _serializeWorksheet(records, eol),
             summary: { total: total, filled: filled, unmatched: total - filled, eol: eol } };
  }

  /* Verify re-assignment guard (Gemini): when the user assigns an ID to a
     row that has none, confirm the new ID does not collide with another
     import row or an existing cohort student. Returns null when free, else a
     conflict descriptor — the UI must block Commit until resolved. */
  function sidCollision(sid, entries, existingStudents, exceptRow) {
    const key = worksheetKey(sid);
    if (!key) return { code: 'E_ROW_NO_KEY', scope: 'input' };
    const dupRow = (entries || []).find(e =>
      e.row !== exceptRow && e.keyType === 'sid' && worksheetKey(e.identifier) === key);
    if (dupRow) return { code: 'E_ROW_DUP_ID', scope: 'worksheet', row: dupRow.row };
    const dupCohort = (existingStudents || []).find(s =>
      (s.key || storeKey(s.studentId, s.name)) === key);
    if (dupCohort) return { code: 'E_DUP_IN_COHORT', scope: 'cohort', name: dupCohort.name };
    return null;
  }

  return {
    parseCsv, resolveColumns, detectEol, validateWorksheet, planImport, buildCohortImport,
    buildExportWorksheet, sidCollision, statusBucket, storeKey, worksheetKey,
    cellAt, recordHasMarks, nextUnmarkedKey,
    REQUIRED_COLUMNS, EDITABLE_COLUMNS, IDENTIFIER_COLUMN, NAME_COLUMN,
    PARTICIPANT_COLUMN, STATUS_COLUMN, GRADE_COLUMN, FEEDBACK_COLUMN, BOM
  };
}));
