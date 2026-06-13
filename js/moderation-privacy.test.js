/**
 * @jest-environment jsdom
 *
 * FK-26 / issue #4 — Privacy characterization test for the Moderation Export
 * workbook (js/moderation-export.js).
 *
 * The moderation export exists to be privacy-REDUCED: no student names/IDs,
 * no tutor names, no marker notes, no feedback text, no exact timestamps
 * (docs/fk_moderation_export_v1.md §"Explicit exclusions"). This test builds
 * a synthetic cohort whose private fields carry unmistakable SENTINEL tokens,
 * runs the REAL export engine, captures the workbook by intercepting
 * XLSX.writeFile (no file is written to disk), reads every cell back with
 * SheetJS, and asserts that not one private sentinel survives into the output.
 *
 * This characterizes CURRENT behaviour — it is the guard that fails loudly if
 * a future change starts leaking PII into the moderation pack. No source is
 * modified here; a surprising result is ledgered, not silently fixed
 * (FK-01 no-silent-fixes policy).
 *
 * SheetJS is the repo's vendored build (js/xlsx.full.min.js) — no new dep.
 * Run with: npx jest js/moderation-privacy.test.js
 */

let XLSX;
let captured;

function loadEngine() {
  jest.resetModules();
  ['SA', 'FKModSchema', 'FKModSuppression', 'FKModReadme', 'FKModExport'].forEach(k => {
    delete global.window[k];
  });

  // Vendored SheetJS UMD build. Depending on how the bundle resolves under
  // jsdom+CommonJS it may expose the namespace via module.exports and/or a
  // global; pick whichever candidate actually carries the utils API.
  const required = require('./xlsx.full.min.js');
  const candidates = [required, global.XLSX, global.window && global.window.XLSX, typeof self !== 'undefined' && self.XLSX];
  XLSX = candidates.find(x => x && x.utils && typeof x.utils.book_new === 'function');
  if (!XLSX) {
    throw new Error('SheetJS (utils.book_new) not found; candidate keys: ' +
      candidates.map(c => c ? Object.keys(c).slice(0, 6).join(',') : String(c)).join(' | '));
  }
  global.XLSX = XLSX;
  global.window.XLSX = XLSX;

  // Capture the workbook instead of writing a file to disk.
  captured = null;
  XLSX.writeFile = function (wb, filename) { captured = { wb, filename }; return filename; };

  // jsdom's alert throws "not implemented" — neutralise the engine's error paths.
  global.alert = () => {};
  global.window.alert = global.alert;

  require('./shared.js');                 // window.SA (rubricVersionHash, GRADE_TIERS, formatScore, getFKVersion)
  require('./moderation-schema.js');      // window.FKModSchema
  require('./moderation-suppression.js'); // window.FKModSuppression
  require('./moderation-readme.js');      // window.FKModReadme
  require('./moderation-export.js');      // window.FKModExport
}

/* ── Synthetic cohort with sentinel PII ───────────────────────────────────
   20 students (passes the COHORT_MIN_N=15 gate). Two tutors qualify
   (>=5 → T1/T2), two collapse (<5 → T_other) so the tutor-label privacy
   path is exercised in both branches. */
const GRADES = ['A', 'B', 'C', 'D', 'E'];
const TIERS  = ['excellent', 'proficient', 'developing', 'satisfactory', 'unsatisfactory'];

function buildConfig() {
  return {
    label: 'Privacy test scorer',
    scoreRounding: 'none',
    gradeScale: GRADES.map((g, i) => ({ grade: g, tier: TIERS[i] })),
    latePenalties: [
      { label: 'On time', deduction: 0, fail: false },
      { label: '1 day late', deduction: 5, fail: false },
      { label: 'Fail', deduction: 0, fail: true }
    ],
    criteria: [
      { name: 'Argument',  weight: 50, rubric: { excellent: 'Strong', proficient: 'Clear', developing: 'Thin', satisfactory: 'Basic', unsatisfactory: 'None' } },
      { name: 'Structure', weight: 50, rubric: { excellent: 'Logical', proficient: 'Coherent', developing: 'Lapses', satisfactory: 'Loose', unsatisfactory: 'None' } }
    ]
  };
}

// tutor name → how many students (8 + 6 qualify; 3 + 3 collapse) = 20
const TUTOR_PLAN = [
  ['SENTINEL_TUTOR_ALPHA', 8],
  ['SENTINEL_TUTOR_BETA',  6],
  ['SENTINEL_TUTOR_GAMMA', 3],
  ['SENTINEL_TUTOR_DELTA', 3]
];

const STUDENT_DATE = '2026-03-15T09:23:47.123Z'; // exact (minute/second) — must never survive

function buildCohort(config) {
  const students = [];
  let n = 0;
  TUTOR_PLAN.forEach(([tutor, count]) => {
    for (let i = 0; i < count; i++) {
      const gi = n % GRADES.length;
      students.push({
        name:        'SENTINEL_STUDENTNAME_' + n,
        studentId:   'SENTINEL_SID_' + n,
        tutor:       tutor,
        date:        STUDENT_DATE,
        savedAt:     'SENTINEL_SAVEDAT_' + n,
        createdAt:   'SENTINEL_CREATEDAT_' + n,
        penaltyIdx:  n % 3,
        grades:      config.criteria.map(() => ({ grade: GRADES[gi], autoFilled: false })),
        scoreResult: {
          suggestedGrade: GRADES[gi],
          penalisedScore: 90 - gi * 8,
          rows: config.criteria.map(() => ({ finalScore: 90 - gi * 8 }))
        },
        feedbackText: 'SENTINEL_FEEDBACK_LEAK_TOKEN — verbatim private feedback for student ' + n,
        markerNotes:  'SENTINEL_MARKERNOTES_LEAK_TOKEN — private marker note for student ' + n
      });
      n++;
    }
  });
  return { scorerId: 'privtest', label: 'Privacy cohort', students };
}

function buildOptIn() {
  return {
    paper_code:          'MRKTG101',
    cohort_id:           'C26A',
    assessment_id:       'A1',
    lecturer_name:       'SENTINEL_LECTURER_ALLOWED', // intentionally retained (governance) — positive control
    lecturer_role:       'Coordinator',
    opt_in_timestamp:    '2026-05-08T10:00:00.000Z',
    opt_in_version:      'modexport-optin-v1',
    opt_in_text_version: 'modexport-optin-v1'
  };
}

/* Flatten every cell of every sheet (plus sheet names) into one string. */
function flattenWorkbook(wb) {
  const parts = [].concat(wb.SheetNames);
  wb.SheetNames.forEach(name => {
    const aoa = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, blankrows: true, defval: '' });
    aoa.forEach(row => row.forEach(cell => parts.push(String(cell))));
  });
  return parts.join('');
}

function headerRow(wb, sheetName) {
  return XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 })[0];
}

let wb, haystack, schema;
beforeAll(() => {
  loadEngine();
  schema = global.window.FKModSchema;
  const config = buildConfig();
  const cohort = buildCohort(config);
  const result = global.window.FKModExport.buildAndDownloadModExport({
    config, cohort, optInRecord: buildOptIn()
  });
  expect(result).toBeTruthy();          // export ran and "wrote" a file
  expect(captured).not.toBeNull();      // we captured the workbook
  wb = captured.wb;
  haystack = flattenWorkbook(wb);
});

describe('workbook shape', () => {
  test('produces exactly the four canonical sheets in order', () => {
    expect(wb.SheetNames).toEqual(schema.SHEET_ORDER);
  });
  test('10_rows has one header + one row per student (20)', () => {
    const aoa = XLSX.utils.sheet_to_json(wb.Sheets['10_rows'], { header: 1 });
    expect(aoa.length).toBe(21);
  });
  test('90_manifest reports n_students = 20', () => {
    const kv = Object.fromEntries(
      XLSX.utils.sheet_to_json(wb.Sheets['90_manifest'], { header: 1 }).filter(r => r.length >= 2)
    );
    expect(String(kv.n_students)).toBe('20');
  });
});

describe('required columns + no forbidden field names (schema-level privacy)', () => {
  test('10_rows contains every REQUIRED_ROW_FIELDS column', () => {
    const headers = headerRow(wb, '10_rows');
    schema.REQUIRED_ROW_FIELDS.forEach(f => expect(headers).toContain(f));
  });
  test('no 10_rows column header is a forbidden field name (tutor_label != tutor)', () => {
    const headers = headerRow(wb, '10_rows');
    schema.FORBIDDEN_FIELDS.forEach(f => expect(headers).not.toContain(f));
  });
  test('no manifest key is a forbidden field name', () => {
    const keys = XLSX.utils.sheet_to_json(wb.Sheets['90_manifest'], { header: 1 })
      .map(r => r[0]).filter(Boolean);
    schema.FORBIDDEN_FIELDS.forEach(f => expect(keys).not.toContain(f));
  });
  test('tutor identity appears only as labels (T1/T2/T_other)', () => {
    const headers = headerRow(wb, '10_rows');
    const col = headers.indexOf('tutor_label');
    const aoa = XLSX.utils.sheet_to_json(wb.Sheets['10_rows'], { header: 1 }).slice(1);
    aoa.forEach(r => expect(String(r[col])).toMatch(/^T(\d+|_other)$/));
  });
});

describe('NO private value survives into any cell (the leak guard)', () => {
  const forbiddenValueSentinels = [
    'SENTINEL_STUDENTNAME_',
    'SENTINEL_SID_',
    'SENTINEL_TUTOR_ALPHA', 'SENTINEL_TUTOR_BETA', 'SENTINEL_TUTOR_GAMMA', 'SENTINEL_TUTOR_DELTA',
    'SENTINEL_FEEDBACK_LEAK_TOKEN',
    'SENTINEL_MARKERNOTES_LEAK_TOKEN',
    'SENTINEL_SAVEDAT_',
    'SENTINEL_CREATEDAT_',
    '09:23:47'          // exact-minute/second portion of the student timestamp
  ];

  test.each(forbiddenValueSentinels)('does not leak %s anywhere in the workbook', (sentinel) => {
    expect(haystack).not.toContain(sentinel);
  });

  test('the full exact student timestamp is absent (export_timestamp is hour-rounded)', () => {
    expect(haystack).not.toContain(STUDENT_DATE);
  });
});

describe('positive controls (intended data IS present)', () => {
  test('lecturer name is retained in the manifest (governance, allowed)', () => {
    expect(haystack).toContain('SENTINEL_LECTURER_ALLOWED');
  });
  test('opt-in identifiers (paper/cohort/assessment) are present', () => {
    expect(haystack).toContain('MRKTG101');
    expect(haystack).toContain('C26A');
  });
  test('a per-record rubric_version_hash column is populated (8-char hex)', () => {
    const headers = headerRow(wb, '10_rows');
    const col = headers.indexOf('rubric_version_hash');
    const first = XLSX.utils.sheet_to_json(wb.Sheets['10_rows'], { header: 1 })[1][col];
    expect(String(first)).toMatch(/^[0-9a-f]{8}$/);
  });
});
