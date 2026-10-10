/**
 * @jest-environment node
 *
 * Guard for .github/workflows/fk-review-retry.yml (issue #163 follow-up).
 *
 * The watcher decides whether to re-run a failed review by grepping the failed
 * step's log. The log lines below are shaped like real ones from PR #181's three
 * runs: `gh run view --log-failed` prefixes each line with job, step and a
 * timestamp, and it also echoes the failing job's own script, whose comment
 * quotes "FAIL: ... abandoned". That echo is what made the unanchored pattern
 * match every failure.
 *
 * The pattern and the attempt cap are read out of the workflow file, so editing
 * either one there is what these tests exercise.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const WORKFLOW = fs.readFileSync(
  path.join(__dirname, '..', '.github', 'workflows', 'fk-review-retry.yml'), 'utf8');

const PATTERN = (WORKFLOW.match(/grep -qE '([^']+abandoned[^']*)'/) || [])[1];
const PREFIX = 'Claude code review (read-only)\tUNKNOWN STEP\t';

// The echoed script comment, as it appears in every failed review log.
const ECHOED_COMMENT =
  PREFIX + '2026-10-09T23:02:18.4091529Z \u001b[36;1m# step log for "FAIL: ... abandoned" and re-runs once when it finds it.\u001b[0m';

const logOf = (verdict) => [
  PREFIX + '2026-10-09T23:02:18.4089256Z ##[group]Run # Runs the classifier and echoes its verdict.',
  ECHOED_COMMENT,
  PREFIX + '2026-10-09T23:02:19.2130639Z is_error=false turns=3 cost=$0.14201465',
  PREFIX + '2026-10-09T23:02:19.2131520Z ' + verdict,
  PREFIX + '2026-10-09T23:02:19.2146279Z ##[error]Process completed with exit code 1.',
].join('\n');

const matches = (log) => spawnSync('grep', ['-qE', PATTERN], { input: log }).status === 0;

describe('which failures the watcher retries', () => {
  test('the pattern was found in the workflow', () => {
    expect(PATTERN).toBeTruthy();
  });

  test('an abandoned run is retried', () => {
    expect(matches(logOf('FAIL: abandoned waiting on background agents (see #163)'))).toBe(true);
  });

  test('the chapter-review wording of an abandoned run is retried', () => {
    expect(matches(logOf('FAIL: findings written, but the run abandoned before finishing (see #163)'))).toBe(true);
  });

  test('"nothing posted" is not retried, despite the echoed script comment', () => {
    expect(matches(logOf('FAIL: nothing posted and no deliberate skip recorded'))).toBe(false);
  });

  test('an errored run is not retried', () => {
    expect(matches(logOf('FAIL: run errored: session limit'))).toBe(false);
  });

  test('a strict-mode skip failure is not retried', () => {
    expect(matches(logOf('FAIL (strict): skipped, but a chapter review must review every push'))).toBe(false);
  });

  test('the echoed script comment alone never matches', () => {
    expect(matches(ECHOED_COMMENT)).toBe(false);
  });
});

describe('the retry cap', () => {
  const cap = WORKFLOW.match(/run_attempt\s*<\s*(\d+)/);

  test('the workflow caps by run_attempt with a number', () => {
    expect(cap).not.toBeNull();
  });

  test('later attempts are retried, so the cap is above 2', () => {
    expect(Number(cap[1])).toBeGreaterThan(2);
  });

  test('the cap is small, so a stuck review cannot loop for long', () => {
    expect(Number(cap[1])).toBeLessThanOrEqual(4);
  });

  test('the old attempt-1-only condition is gone', () => {
    expect(WORKFLOW).not.toMatch(/run_attempt\s*==\s*1/);
  });
});
