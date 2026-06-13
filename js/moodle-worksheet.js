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

  // Canonical 14-column header (INS-10), in order.
  const REQUIRED_HEADER = [
    'Identifier', 'Full name', 'ID number', 'Email address', 'Status',
    'Group', 'Marker', 'Grade', 'Maximum grade', 'Marking workflow state',
    'Grade can be changed', 'Last modified (submission)', 'Last modified (grade)',
    'Feedback comments'
  ];
  const EDITABLE_COLUMNS  = ['Grade', 'Feedback comments']; // only these on upload
  const IDENTIFIER_COLUMN = 'ID number';                    // → FK sid:
  const PARTICIPANT_COLUMN = 'Identifier';                  // Moodle's own row key

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

  /* ── Dry-run validator ──────────────────────────────────────
     Returns { ok, errors, warnings }. errors block import; warnings
     (BOM / EOL drift) do not, but signal a non-byte-faithful file. */
  function validateWorksheet(text) {
    const errors = [], warnings = [];
    const err  = (code, message) => errors.push({ code, message });
    const warn = (code, message) => warnings.push({ code, message });
    const raw = String(text == null ? '' : text);

    if (!raw.trim()) {
      err('E_EMPTY', 'The file is empty.');
      return { ok: false, errors, warnings };
    }
    if (raw.charCodeAt(0) !== 0xfeff) {
      warn('W_NO_BOM', 'File has no UTF-8 BOM; Moodle exports include one. Re-export or save as UTF-8 to be safe.');
    }
    if (!/\r\n/.test(raw)) {
      warn('W_EOL_NOT_CRLF', 'File uses LF, not CRLF, line endings; Moodle exports use CRLF. Upload may still work but is not byte-identical.');
    }

    let records;
    try {
      records = parseCsv(raw);
    } catch (e) {
      err(e.code || 'E_PARSE', 'Could not parse the CSV: ' + (e.message || 'malformed quoting') + '.');
      return { ok: false, errors, warnings };
    }
    if (!records.length) {
      err('E_EMPTY', 'No rows found.');
      return { ok: false, errors, warnings };
    }

    const header = records[0];
    if (header.length !== REQUIRED_HEADER.length ||
        REQUIRED_HEADER.some((h, k) => header[k] !== h)) {
      err('E_HEADER_MISMATCH',
        'Header does not match the expected Moodle worksheet (do not rename, move, add, or remove columns). Expected ' +
        REQUIRED_HEADER.length + ' columns starting "Identifier,Full name,ID number,…", got ' +
        header.length + ': "' + header.slice(0, 3).join(',') + '…".');
      // header is dispositive — skip per-row checks once it is wrong
      return { ok: false, errors, warnings };
    }

    for (let r = 1; r < records.length; r++) {
      if (records[r].length !== REQUIRED_HEADER.length) {
        err('E_ROW_FIELD_COUNT',
          'Row ' + (r + 1) + ' has ' + records[r].length + ' fields, expected ' + REQUIRED_HEADER.length + '.');
      }
    }

    return { ok: errors.length === 0, errors, warnings, rowCount: records.length - 1 };
  }

  return {
    parseCsv, validateWorksheet,
    REQUIRED_HEADER, EDITABLE_COLUMNS, IDENTIFIER_COLUMN, PARTICIPANT_COLUMN, BOM
  };
}));
