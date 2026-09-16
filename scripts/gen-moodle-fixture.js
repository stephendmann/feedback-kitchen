#!/usr/bin/env node
/* ============================================================
   FK-19 — Moodle offline-grading-worksheet FAKE fixture generator.

   Produces 100% SYNTHETIC Moodle grading-worksheet CSVs reproducing
   real exports' SCHEMAS (column sets, order, BOM, quoting style,
   edge-case rows) — WITHOUT ever reading or embedding a real,
   PII-bearing worksheet. Real downloads stay gitignored; FK-19 logic
   and tests are developed against THIS generator only.

   One caveat these fixtures do NOT reproduce: real Moodle quotes
   fields that need no quoting (`"Participant 8880001","Aroha Example",…`),
   whereas csvField here quotes minimally, exactly as FK's export does.
   That difference is why FK's round trip is semantic and not lexical —
   a real file re-serialised by FK is a smaller byte sequence carrying
   identical values. Fixture-based round-trip tests can therefore
   compare output to input directly; tests against a real export must
   compare parsed VALUES, never bytes.

   TWO REAL LAYOUTS, because the worksheet has no fixed column set.
   Moodle exports the grading table's visible columns, and those
   depend on the assignment's configuration:

     variant 'group-marker' (default, 14 columns) — the INS-10
       export. Carries `Group` and `Marker` (group submission +
       marking allocation enabled), no per-user date columns.

     variant 'dates' (15 columns) — a second real export from the
       same institution. No `Group` / `Marker`, but gains `Allow
       submissions from`, `Due date` and `Cut-off date`, which
       Moodle adds once per-user dates can diverge (an extension
       or override has been granted). Note this is not merely the
       first layout plus columns: two columns are absent and three
       are added, at a different offset.

   Anything that reads a worksheet must therefore resolve columns
   by NAME, never by position — which is what both fixtures exist
   to prove.

   ENCODING is not fixed either. The 2026-06 export was UTF-8 with BOM
   and CRLF record terminators; the 2026-09 export was UTF-8 with BOM
   and lone LF. FK preserves whichever the source used rather than
   normalising, so `--lf` exists to build the LF half of that matrix.
   CRLF remains the default because the INS-10 export used it.

   Usage:
     node scripts/gen-moodle-fixture.js                      # → stdout
     node scripts/gen-moodle-fixture.js --variant dates      # date/override layout
     node scripts/gen-moodle-fixture.js --out path.csv       # → file
     node scripts/gen-moodle-fixture.js --lf                 # LF EOLs (override)
     node scripts/gen-moodle-fixture.js --all                # rewrite both committed fixtures
   Also importable: require('./gen-moodle-fixture.js').buildWorksheet()
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');

const BOM = '﻿';

/* Column sets, verbatim from the two real exports. Only `Grade` and
   `Feedback comments` are marker-editable on upload; everything else is
   identity/technical and must round-trip untouched. */
const HEADERS = {
  'group-marker': [
    'Identifier', 'Full name', 'ID number', 'Email address', 'Status',
    'Group', 'Marker', 'Grade', 'Maximum grade', 'Marking workflow state',
    'Grade can be changed', 'Last modified (submission)', 'Last modified (grade)',
    'Feedback comments'
  ],
  dates: [
    'Identifier', 'Full name', 'ID number', 'Email address', 'Status',
    'Allow submissions from', 'Due date', 'Cut-off date',
    'Grade', 'Maximum grade', 'Marking workflow state',
    'Grade can be changed', 'Last modified (submission)', 'Last modified (grade)',
    'Feedback comments'
  ]
};
const DEFAULT_VARIANT = 'group-marker';
const VARIANTS = Object.keys(HEADERS);

// Fixed (non-random) so the committed fixtures are reproducible.
const STAMP = 'Wednesday, 10 June 2026, 2:14 PM';
const STATUS_OK   = 'Submitted for grading - Released -  - ';
const STATUS_LATE = 'Submitted for grading - 3 mins 31 secs late - Released -  - ';
const STATUS_NONE = 'No submission - Released -  - ';
const DUE_DEFAULT  = 'Friday, 12 June 2026, 5:00 PM';
const DUE_EXTENDED = 'Wednesday, 17 June 2026, 5:00 PM';   // the override that summons the date columns

// RFC-4180-style quoting, matching Moodle: quote a field only if it
// contains a comma, double-quote, CR or LF; double any internal quotes.
function csvField(v) {
  const s = (v == null) ? '' : String(v);
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function longFeedback() {
  const sentence = 'Your analysis shows developing command of the segmentation framework, and the recommendations follow logically from the evidence presented. ';
  let s = '';
  while (s.length < 8000) s += sentence;   // ~INS-10 measured real max (7,975 chars)
  return s.slice(0, 8000);
}

const FIRST = ['Aroha', 'Ben', 'Carla', 'Demo', 'Erin', 'Felix', 'Grace', 'Hemi', 'Ines', 'Jack', 'Kiri', 'Liam', 'Mere', 'Noa', 'Olivia', 'Pita', 'Quinn', 'Rangi', 'Sefa', 'Tama'];
const LAST  = ['Example', 'Fixture', 'Sample', 'Tanaka', 'Placeholder', 'Mocke', 'Testley', 'Specimen', 'Dummy', 'Synthetic', 'Modell', 'Pretend', 'Stand-in', 'Proxy', 'Faux', 'Notreal', 'Stub', 'Mockup', 'Decoy', 'Token'];

/* Build a deterministic synthetic row as a NAME→VALUE map. Index drives a few
   edge cases so a small fixture still exercises the round-trip-critical
   shapes. The map carries every field either variant might ask for; the
   serializer takes only the columns that variant's header declares. */
function makeRow(i) {
  const n = i + 1;
  const first = FIRST[i % FIRST.length];
  const last  = LAST[i % LAST.length];
  const name  = first + ' ' + last;
  const idNumber = String(9900000 + n);              // 7-digit → FK sid:
  const email = (first[0] + last.replace(/[^a-z]/gi, '')).toLowerCase() + '@example.edu';

  const row = {
    Identifier: 'Participant ' + (8880000 + n),
    'Full name': name,
    'ID number': idNumber,
    'Email address': email,
    Status: STATUS_OK,
    Group: '',
    Marker: '',
    'Allow submissions from': '',
    'Due date': DUE_DEFAULT,
    'Cut-off date': '',
    Grade: '',
    'Maximum grade': '100.00',
    'Marking workflow state': 'Released',
    'Grade can be changed': 'Yes',
    'Last modified (submission)': STAMP,
    'Last modified (grade)': '-',
    'Feedback comments': ''
  };

  // ── edge cases by position ───────────────────────────────────────────
  if (i === 4) {                                  // pre-graded + MULTI-LINE feedback (quotes + commas)
    row.Grade = '78.50';
    row['Last modified (grade)'] = STAMP;
    row['Feedback comments'] =
      'Hi ' + first + ' — thank you for your submission.\n\n' +
      'Understanding of the topic: your framing of the "market problem" is clear, well supported.\n\n' +
      'Use of evidence: good range of sources; integrate the survey data earlier in the argument.\n\n' +
      'Next steps: tighten the executive summary, and check APA formatting before resubmission.';
  } else if (i === 5) {                            // pre-graded + VERY LONG feedback (~8k stress)
    row.Grade = '62.00';
    row['Last modified (grade)'] = STAMP;
    row['Feedback comments'] = longFeedback();
  } else if (i === 8) {                            // late submission
    row.Status = STATUS_LATE;
  } else if (i === 9) {                            // no submission (non-markable)
    row.Status = STATUS_NONE;
    row['Last modified (submission)'] = '-';
  } else if (i === 10) {                           // blank ID number → manual 'verify', never name-matched
    row['ID number'] = '';
  }

  // The per-user override that makes Moodle emit the date columns at all.
  if (i === 3 || i === 9) row['Due date'] = DUE_EXTENDED;

  return row;
}

function headerFor(variant) {
  return HEADERS[variant] || HEADERS[DEFAULT_VARIANT];
}

// Assemble the full worksheet string (BOM + header + rows).
function buildWorksheet(opts) {
  opts = opts || {};
  const header = headerFor(opts.variant);
  const rows = Math.max(1, opts.rows || 12);
  const eol = opts.lf ? '\n' : '\r\n';   // real Moodle export is CRLF (default)
  const lines = [header.map(csvField).join(',')];
  for (let i = 0; i < rows; i++) {
    const r = makeRow(i);
    if (opts.overrides && opts.overrides[i]) Object.assign(r, opts.overrides[i]); // per-row field overrides
    lines.push(header.map(h => csvField(r[h])).join(','));
  }
  return BOM + lines.join(eol) + eol;
}

/* Poisoned variants for FK-19's dry-run validator (Q5.2 error handling).
   Each returns a deliberately malformed worksheet so the validator's error
   reporting can be tested against synthetic data — never a real file.
   `opts.variant` selects the base layout, so every poison can be applied to
   either real column set. */
function corruptWorksheet(kind, opts) {
  opts = opts || {};
  const base = buildWorksheet(opts);
  const header = headerFor(opts.variant);
  const recs = base.replace(/^﻿/, '').split('\r\n'); // record terminators only (field-internal \n stay)
  const rebuild = () => BOM + recs.join('\r\n');
  switch (kind) {
    case 'no-bom':
      return base.replace(/^﻿/, '');
    case 'lf-only':
      return base.replace(/\r\n/g, '\n');
    case 'no-header':
      recs.shift();
      return rebuild();
    case 'renamed-col':                        // required column renamed → missing
      return base.replace('Feedback comments', 'Comments');
    case 'missing-col': {                      // drop the `ID number` column from header AND every row
      const at = header.indexOf('ID number');
      return BOM + recs.filter(Boolean).map(line => {
        const fields = splitRecord(line);
        fields.splice(at, 1);
        return fields.map(csvField).join(',');
      }).join('\r\n') + '\r\n';
    }
    case 'dup-header': {                       // the same column name twice (ambiguous target)
      const at = header.indexOf('Grade');
      return BOM + recs.filter(Boolean).map((line, r) => {
        const fields = splitRecord(line);
        fields.splice(at + 1, 0, r === 0 ? 'Grade' : '');
        return fields.map(csvField).join(',');
      }).join('\r\n') + '\r\n';
    }
    case 'unknown-col': {                      // an EXTRA non-FK column, header AND rows — must stay valid
      return BOM + recs.filter(Boolean).map((line, r) => {
        const fields = splitRecord(line);
        fields.splice(1, 0, r === 0 ? 'Institution note' : 'note-' + r);
        return fields.map(csvField).join(',');
      }).join('\r\n') + '\r\n';
    }
    case 'extra-col':                          // extra column in the HEADER only → ragged rows
      return base.replace('Feedback comments', 'Feedback comments,Rogue column');
    case 'short-row':                           // drop the last field of the first data row
      recs[1] = recs[1].replace(/,[^,]*$/, '');
      return rebuild();
    case 'long-row':                            // one field too many on the first data row
      recs[1] = recs[1] + ',surplus';
      return rebuild();
    case 'bad-quote':                          // unterminated quoted field at EOF
      return base + header.map((h, i) => i === 0 ? 'Participant 8889999'
        : h === 'Full name' ? 'Broken Row'
        : h === 'ID number' ? '9999999'
        : h === 'Feedback comments' ? '"unterminated feedback' : '').join(',') + '\r\n';
    // ── row-level (data-integrity) poisons — classified by planImport, not
    //    the file validator; Moodle likewise skips these rows on import ──
    case 'no-key-row':                          // blank ID number AND Full name
      return buildWorksheet(Object.assign({}, opts, { overrides: { 0: { 'Full name': '', 'ID number': '' } } }));
    case 'dup-id':                              // row 2 repeats row 1's ID number
      return buildWorksheet(Object.assign({}, opts, { overrides: { 1: { 'ID number': '9900001' } } }));
    default:
      return base;
  }
}

/* Minimal RFC-4180 record splitter, for the poison helpers above: they need
   to add/remove a column from an already-serialised line without mangling
   quoted feedback cells. */
function splitRecord(line) {
  const out = [];
  let field = '', inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') { field += '"'; i++; continue; }
        inQuotes = false; continue;
      }
      field += c; continue;
    }
    if (c === '"') { inQuotes = true; continue; }
    if (c === ',') { out.push(field); field = ''; continue; }
    field += c;
  }
  out.push(field);
  return out;
}

module.exports = { buildWorksheet, corruptWorksheet, headerFor, splitRecord,
                   HEADERS, VARIANTS, DEFAULT_VARIANT, csvField, BOM };

// ── CLI ────────────────────────────────────────────────────────────────
const COMMITTED = {
  'group-marker': 'test/fixtures/moodle-worksheet.fake.csv',
  dates: 'test/fixtures/moodle-worksheet-dates.fake.csv'
};

if (require.main === module) {
  const argv = process.argv.slice(2);
  const get = (flag, def) => {
    const i = argv.indexOf(flag);
    return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
  };
  const rows = parseInt(get('--rows', '12'), 10);
  const lf = argv.includes('--lf');

  if (argv.includes('--all')) {
    const root = path.resolve(__dirname, '..');
    VARIANTS.forEach(variant => {
      const dest = path.join(root, COMMITTED[variant]);
      fs.writeFileSync(dest, buildWorksheet({ rows: rows, lf: lf, variant: variant }));
      process.stderr.write('Wrote synthetic Moodle fixture (' + variant + ') → ' + COMMITTED[variant] + '\n');
    });
  } else {
    const variant = get('--variant', DEFAULT_VARIANT);
    if (VARIANTS.indexOf(variant) === -1) {
      process.stderr.write('Unknown --variant "' + variant + '"; expected one of: ' + VARIANTS.join(', ') + '\n');
      process.exit(1);
    }
    const out = buildWorksheet({ rows: rows, lf: lf, variant: variant });
    const dest = get('--out', null);
    if (dest) {
      fs.writeFileSync(dest, out);
      process.stderr.write('Wrote synthetic Moodle fixture (' + variant + ') → ' + dest + '\n');
    } else {
      process.stdout.write(out);
    }
  }
}
