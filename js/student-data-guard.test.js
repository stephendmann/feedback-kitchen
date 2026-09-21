/**
 * @jest-environment node
 *
 * Tests for the student-data guard (scripts/check-no-real-student-data.js).
 *
 * A guard with no tests rots quietly: it keeps exiting 0 long after its rules
 * have stopped matching reality, and nobody notices until something leaks.
 * These pin both halves — that it catches the shapes it exists to catch, and
 * that it stays silent on the synthetic convention the repo actually uses.
 *
 * NOTE ON THE PROBE DATA. A test for this guard has to handle the very shapes
 * the guard rejects, so writing them as literals would make this file fail the
 * guard and need an exemption. An exempt file is a hole: somewhere real data
 * could later be pasted with nothing watching. So the probes are assembled at
 * runtime from fragments that match nothing on their own, and the guard keeps
 * applying to every file in the repo without exception.
 *
 * Every identifier below is invented. None of it came from a real export.
 *
 * Run with: npx jest js/student-data-guard.test.js
 */

const guard = require('../scripts/check-no-real-student-data.js');
const rules = (text) => guard.scanText('probe.js', text).map(f => f.rule);

// Assembled, never written whole. See the note above.
const PARTICIPANT_N = [61, 11222].join('');            // 7 digits, not 888xxxx
const SID           = [17, 11222].join('');            // 7 digits, not 990xxxx
const EMAIL         = 'jfake' + '@' + 'gmail' + '.com';
const PARTICIPANT   = 'Participant ' + PARTICIPANT_N;

describe('catches the shapes that leaked', () => {
  // The incident this guard exists for: one line of a real worksheet pasted
  // into a source comment as an illustration, reconstructed with fake values.
  const leaked = '// e.g. "' + PARTICIPANT + '","Jordan Fakename",' + SID + ',' + EMAIL + ',...';

  test('flags the participant id, the student id and the address', () => {
    expect([...new Set(rules(leaked))].sort()).toEqual([
      'non-synthetic Moodle participant id',
      'non-synthetic email address',
      'non-synthetic student id beside worksheet text'
    ].sort());
  });

  test('both seven-digit ids on that line are caught, not just one', () => {
    // The participant number trips the id rule too, which is intended: on a
    // worksheet line it is exactly as identifying as the student id.
    const ids = guard.scanText('probe.js', leaked)
      .filter(f => f.rule === 'non-synthetic student id beside worksheet text')
      .map(f => f.detail);
    expect(ids.sort()).toEqual([PARTICIPANT_N, SID].sort());
  });

  test('reports the line number and the offending text', () => {
    const found = guard.scanText('probe.js', 'clean line\n' + leaked);
    found.forEach(f => expect(f.line).toBe(2));
    expect(found.map(f => f.detail)).toContain(EMAIL);
    expect(found.map(f => f.detail)).toContain(PARTICIPANT);
  });

  test('every finding carries actionable advice', () => {
    guard.scanText('probe.js', leaked).forEach(f => {
      expect(typeof f.fix).toBe('string');
      expect(f.fix.length).toBeGreaterThan(20);
    });
  });

  test('a real export filename is refused on name alone, unread', () => {
    const findings = [];
    guard.checkFile('Grades-STMGT101-Essay-' + [22, 92229].join('') + '.csv', findings);
    expect(findings).toHaveLength(1);
    expect(findings[0].rule).toBe('real Moodle export committed');
    expect(guard.EXPORT_FILENAME.test('planning/Grades-anything.csv')).toBe(true);
  });
});

describe('stays silent on the synthetic convention', () => {
  test('the fixture shapes produce nothing', () => {
    expect(rules('Participant 8880001,Aroha Example,9900001,aexample@example.edu')).toEqual([]);
  });

  test('a seven-digit number away from worksheet vocabulary is ignored', () => {
    // Timestamps, sizes and ids of other kinds must not trip the guard.
    expect(rules('const cacheBust = ' + SID + ';')).toEqual([]);
  });

  test('the same number IS flagged once the line is about a worksheet row', () => {
    expect(rules('// ID number ' + SID + ' for that row')).toEqual([
      'non-synthetic student id beside worksheet text'
    ]);
  });

  test('obvious placeholders are allowed, real-looking ids are not', () => {
    expect(guard.isObviousPlaceholder('9999999')).toBe(true);   // repdigit
    expect(guard.isObviousPlaceholder([12, 34567].join(''))).toBe(true);   // ascending
    expect(guard.isObviousPlaceholder([76, 54321].join(''))).toBe(true);   // descending
    expect(guard.isObviousPlaceholder(SID)).toBe(false);
    expect(guard.isObviousPlaceholder(PARTICIPANT_N)).toBe(false);
  });

  test('the allowlisted README attribution address does not fire', () => {
    expect(rules('Adapted from a tool by Dr Michael Harker, michael.harker@strath.ac.uk.')).toEqual([]);
  });
});

describe('scope', () => {
  test('dependency metadata and generated output are never scanned', () => {
    expect(guard.scannable('package-lock.json')).toBe(false);
    expect(guard.scannable('node_modules/x/index.js')).toBe(false);
    expect(guard.scannable('graphify-out/GRAPH_REPORT.md')).toBe(false);
    expect(guard.scannable('assets/logo.png')).toBe(false);
  });

  test('source, tests, docs and fixtures are scanned', () => {
    ['js/scorer-app.js', 'js/moodle-worksheet.test.js', 'README.md',
     'test/fixtures/moodle-worksheet.fake.csv'].forEach(f => {
      expect(guard.scannable(f)).toBe(true);
    });
  });

  test('this test file passes the guard it tests, with no exemption', () => {
    const fs = require('fs'), path = require('path');
    const self = path.join(__dirname, 'student-data-guard.test.js');
    expect(guard.scannable('js/student-data-guard.test.js')).toBe(true);
    expect(guard.scanText(self, fs.readFileSync(self, 'utf8'))).toEqual([]);
  });
});

describe('staged mode scans the index blob, not the working copy', () => {
  // The defect this pins: the file LIST came from the index while the CONTENT
  // came from disk, so the hook judged something other than what was being
  // committed. Merely annoying in one direction (it blocked a commit whose
  // staged content was clean) and a leak in the other (it passed a commit
  // whose staged content held a real identifier, because the working file had
  // been fixed without re-staging).
  //
  // The blob reader is injected, so both sides can be set independently and no
  // test here has to stage anything. The on-disk file is real and deliberately
  // holds the OPPOSITE of the staged content: if the guard ever reads from
  // disk again in this mode, the first two tests invert and fail.
  const fs = require('fs'), os = require('os'), path = require('path');

  const dirty = '// ID number ' + SID + ' pasted while debugging';
  const clean = '// ID number 9900001 pasted while debugging';

  let dir;
  beforeAll(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fk-guard-')); });
  afterAll(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  const onDisk = (name, text) => {
    const p = path.join(dir, name);
    fs.writeFileSync(p, text, 'utf8');
    return p;
  };

  test('staged content is flagged even when the working copy is clean', () => {
    const file = onDisk('probe-dirty-staged.txt', clean);
    const findings = [];
    guard.checkStagedFile(file, findings, () => dirty);
    expect(findings.map(f => f.rule)).toEqual([
      'non-synthetic student id beside worksheet text'
    ]);
    expect(findings[0].detail).toBe(SID);
  });

  test('clean staged content passes even when the working copy is dirty', () => {
    const file = onDisk('probe-dirty-worktree.txt', dirty);
    const findings = [];
    guard.checkStagedFile(file, findings, () => clean);
    expect(findings).toEqual([]);
  });

  test('a staged path whose blob will not read fails closed', () => {
    // Staged but deleted from the working tree, a corrupt index, a permission
    // error: none of these is a file the guard can clear, so none of them may
    // pass silently.
    const findings = [];
    guard.checkStagedFile('js/gone.js', findings, () => {
      throw new Error('fatal: path does not exist in the index');
    });
    expect(findings).toHaveLength(1);
    expect(findings[0].rule).toBe('staged content could not be read');
    expect(findings[0].fix.length).toBeGreaterThan(20);
  });

  test('an export filename is refused on the path alone, without reading the blob', () => {
    const findings = [];
    guard.checkStagedFile('Grades-STMGT101-Essay-' + [22, 92229].join('') + '.csv', findings, () => {
      throw new Error('the blob must not be read');
    });
    expect(findings.map(f => f.rule)).toEqual(['real Moodle export committed']);
  });

  test('a binary blob is skipped rather than scanned as text', () => {
    const findings = [];
    guard.checkStagedFile('assets/blob.bin', findings,
      () => 'PK' + String.fromCharCode(0) + dirty);
    expect(findings).toEqual([]);
  });
});
