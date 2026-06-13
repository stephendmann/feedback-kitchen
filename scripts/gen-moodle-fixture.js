#!/usr/bin/env node
/* ============================================================
   FK-19 — Moodle offline-grading-worksheet FAKE fixture generator.

   Produces a 100% SYNTHETIC Moodle grading-worksheet CSV that is
   byte-faithful to the real export's SCHEMA (column order, BOM,
   quoting, edge-case rows) — WITHOUT ever reading or embedding the
   real, PII-bearing worksheet. The real download stays gitignored
   (planning/Example Moodle Worksheet/Grades-*.csv); FK-19 logic and
   tests are developed against THIS generated fixture only.

   Schema source: INS-10 (real worksheet analysed, header-only). The
   14 columns and the editable pair (Grade, Feedback comments) are
   from that inspection; all DATA below is invented.

   Real-export encoding (INS-10, byte-checked): UTF-8 **with BOM** and
   **CRLF** record terminators (field-internal newlines in quoted
   feedback stay LF). FK-19's export must reproduce BOM+CRLF to
   round-trip byte-faithfully, so CRLF is this generator's default.

   Usage:
     node scripts/gen-moodle-fixture.js                 # → stdout (BOM+CRLF)
     node scripts/gen-moodle-fixture.js --out path.csv  # → file
     node scripts/gen-moodle-fixture.js --lf            # LF EOLs (override)
   Also importable: require('./gen-moodle-fixture.js').buildWorksheet()
   ============================================================ */
'use strict';

const fs = require('fs');

const BOM = '﻿';

// Canonical column order (INS-10). Only `Grade` and `Feedback comments`
// are marker-editable on upload; everything else is identity/technical.
const HEADER = [
  'Identifier', 'Full name', 'ID number', 'Email address', 'Status',
  'Group', 'Marker', 'Grade', 'Maximum grade', 'Marking workflow state',
  'Grade can be changed', 'Last modified (submission)', 'Last modified (grade)',
  'Feedback comments'
];

// Fixed (non-random) so the committed fixture is reproducible.
const STAMP = 'Wednesday, 10 June 2026, 2:14 PM';
const STATUS_OK   = 'Submitted for grading - Released -  - ';
const STATUS_LATE = 'Submitted for grading - 3 mins 31 secs late - Released -  - ';
const STATUS_NONE = 'No submission - Released -  - ';

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

// Build a deterministic synthetic row. Index drives a few edge cases so a
// small fixture still exercises the round-trip-critical shapes.
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
  } else if (i === 10) {                           // name-only row: EMPTY ID number (sid-fallback edge)
    row['ID number'] = '';
  }
  return row;
}

// Assemble the full worksheet string (BOM + header + rows).
function buildWorksheet(opts) {
  opts = opts || {};
  const rows = Math.max(1, opts.rows || 12);
  const eol = opts.lf ? '\n' : '\r\n';   // real Moodle export is CRLF (default)
  const lines = [HEADER.map(csvField).join(',')];
  for (let i = 0; i < rows; i++) {
    const r = makeRow(i);
    lines.push(HEADER.map(h => csvField(r[h])).join(','));
  }
  return BOM + lines.join(eol) + eol;
}

/* Poisoned variants for FK-19's dry-run validator (Q5.2 error handling).
   Each returns a deliberately malformed worksheet so the validator's error
   reporting can be tested against synthetic data — never the real file. */
function corruptWorksheet(kind, opts) {
  const base = buildWorksheet(opts);
  const recs = base.replace(/^﻿/, '').split('\r\n'); // record terminators only (field-internal \n stay)
  switch (kind) {
    case 'no-bom':
      return base.replace(/^﻿/, '');
    case 'lf-only':
      return base.replace(/\r\n/g, '\n');
    case 'no-header':
      recs.shift();
      return BOM + recs.join('\r\n');
    case 'wrong-header':                       // a renamed column → header mismatch
      return base.replace('Feedback comments', 'Comments');
    case 'extra-col':                          // 15th column appended to header only
      return base.replace('Feedback comments', 'Feedback comments,Rogue column');
    case 'short-row': {                         // drop the last field of the first data row
      recs[1] = recs[1].replace(/,[^,]*$/, '');
      return BOM + recs.join('\r\n');
    }
    case 'bad-quote':                          // unterminated quoted field at EOF
      return base + 'Participant 8889999,Broken Row,9999999,broken@example.edu,' +
        STATUS_OK + ',,,,100.00,Released,Yes,' + STAMP + ',-,"unterminated feedback\r\n';
    default:
      return base;
  }
}

module.exports = { buildWorksheet, corruptWorksheet, HEADER, csvField, BOM };

// ── CLI ────────────────────────────────────────────────────────────────
if (require.main === module) {
  const argv = process.argv.slice(2);
  const get = (flag, def) => {
    const i = argv.indexOf(flag);
    return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
  };
  const out = buildWorksheet({
    rows: parseInt(get('--rows', '12'), 10),
    lf: argv.includes('--lf')
  });
  const dest = get('--out', null);
  if (dest) {
    fs.writeFileSync(dest, out);
    process.stderr.write('Wrote synthetic Moodle fixture → ' + dest + '\n');
  } else {
    process.stdout.write(out);
  }
}
