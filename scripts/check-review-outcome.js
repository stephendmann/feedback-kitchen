#!/usr/bin/env node
/**
 * Claude review outcome guard (issue #136).
 *
 * The review action exits zero whatever happens, so a green check has never
 * meant "this PR was reviewed". Three ways it can be green and useless, all
 * observed:
 *
 *   1. `is_error: true` — the run died. Seen on PR #111 (3 turns, $0.14) and
 *      again on PR #134, where a session limit consumed the whole review.
 *   2. Abandoned mid-flight — the review fans out to background agents, calls
 *      ScheduleWakeup, and a one-shot CI job has no next turn to wake into.
 *      The session ends waiting. Seen on PR #137 and PR #134.
 *   3. Deliberate skip — the review judges a PR too trivial to examine. This
 *      one is fine and must stay green.
 *
 * This reads the same execution log that the workflow already uploads as an
 * artifact and fails the job for 1 and 2 while letting 3 through. The
 * classification works because each outcome describes itself in the `result`
 * entry: skips say so, and abandoned runs say they are waiting.
 *
 * Non-blocking by design. `main` has no branch protection and this check is
 * not required, so a red review makes the failure visible without stopping a
 * merge. That is the intended scope (see #136).
 *
 * Usage: node scripts/check-review-outcome.js <path-to-execution-log.json>
 */
'use strict';

const fs = require('fs');

/** Phrases a deliberate skip uses about itself. */
const SKIP_MARKERS = [
  'skipped review',
  'stopped after the eligibility check',
  'did not proceed',
  'no further review',
  'not eligible',
];

/** Phrases an abandoned run uses when it ends waiting on background agents. */
const ABANDON_MARKERS = [
  'report back',
  'waiting on',
  'wait for the background',
  "i'll wait",
  'as soon as they report',
  'finish; i',
];

/** Evidence the review actually reached the PR. */
const POSTED_MARKERS = [
  'issuecomment-',
  'posting the summary',
  'posted the',
  'comment posted',
];

const has = (text, markers) => markers.some((m) => text.includes(m));

/**
 * Decide whether a run counts as reviewed.
 * @param {object|null} result the `result` entry from the execution log
 * @returns {{ok: boolean, reason: string}}
 */
function classify(result) {
  if (!result) return { ok: false, reason: 'no result entry in the execution log' };
  if (result.is_error) {
    return { ok: false, reason: `run errored: ${String(result.result || '').trim() || 'no message'}` };
  }

  const text = String(result.result || '').toLowerCase();
  if (has(text, SKIP_MARKERS)) return { ok: true, reason: 'deliberate skip' };
  if (has(text, POSTED_MARKERS)) return { ok: true, reason: 'review posted' };
  if (has(text, ABANDON_MARKERS)) {
    return { ok: false, reason: 'abandoned waiting on background agents (see #136)' };
  }
  return { ok: false, reason: 'nothing posted and no deliberate skip recorded' };
}

function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('usage: check-review-outcome.js <execution-log.json>');
    process.exit(2);
  }
  if (!fs.existsSync(file)) {
    // The action writes this log whenever it runs at all, so its absence means
    // the review never reached the model. The workflow exempts the one case
    // where that is expected: a PR editing fk-claude-review.yml, which the
    // action's own validation guard skips before writing anything.
    console.error('No execution log — the review did not run.');
    process.exit(1);
  }

  let events;
  try {
    events = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    console.error(`Could not parse the execution log: ${e.message}`);
    process.exit(1);
  }

  const result = (Array.isArray(events) ? events : []).find((e) => e && e.type === 'result') || null;
  const verdict = classify(result);

  if (result) {
    console.log(
      `is_error=${result.is_error} turns=${result.num_turns} cost=$${result.total_cost_usd}`
    );
  }
  console.log(`${verdict.ok ? 'OK' : 'FAIL'}: ${verdict.reason}`);
  process.exit(verdict.ok ? 0 : 1);
}

module.exports = { classify };

if (require.main === module) main();
