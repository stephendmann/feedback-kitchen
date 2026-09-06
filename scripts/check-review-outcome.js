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

/**
 * Phrases a deliberate skip uses about itself.
 *
 * This list is the weak point of the approach: it matches prose the review
 * writes freely, so each new phrasing is a false failure until it is added.
 * The one-shot skip alone has appeared three ways, as "no further review is
 * performed", "I did not proceed further", and "I'm stopping here without
 * posting anything further". The workflow therefore establishes the one-shot
 * case by fact, checking whether a Claude comment already exists, before
 * consulting this list at all. These stay as a second line.
 */
const SKIP_MARKERS = [
  'skipped review',
  'stopped after the eligibility check',
  'did not proceed',
  'no further review',
  'no further action',
  'not eligible',
  'already has a claude review',
  'already commented on this pr',
  'double-reviewing',
  'stopping here',
];

/**
 * Phrases an abandoned run uses when it ends waiting on a subagent.
 *
 * Kept deliberately loose after #156, where both runs ended waiting and neither
 * matched: "I'm waiting for that agent to finish" and "Waiting for the background
 * agents to complete" both slip past markers written around "waiting on" and
 * "wait for the background". The failure was still caught, but as the generic
 * "nothing posted" case, which is not specific enough for the retry watcher to
 * act on.
 *
 * The shape that generalises is a wait paired with an agent, so that is what this
 * matches now, with the older literals kept for the phrasings already seen.
 */
const ABANDON_MARKERS = [
  'report back',
  'waiting on',
  'wait for the background',
  "i'll wait",
  'as soon as they report',
  'finish; i',
];

/** True when the result reads as a run that ended waiting for a subagent. */
function isAbandoned(text) {
  if (has(text, ABANDON_MARKERS)) return true;
  return /\bwait(?:ing|s)?\b[^.]{0,80}\bagents?\b/.test(text)
      || /\bagents?\b[^.]{0,80}\bto (?:finish|complete|report)\b/.test(text);
}

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
 *
 * `strict` is for PRs into `manual`, which run a direct prompt rather than the
 * code-review skill. That prompt is told to review every push and never to skip
 * as trivial, so a run that posts nothing has failed to do its job whatever it
 * says about itself. Skip wording earns no pass there.
 *
 * @param {object|null} result the `result` entry from the execution log
 * @param {{strict?: boolean}} [opts]
 * @returns {{ok: boolean, reason: string}}
 */
function classify(result, opts) {
  const strict = !!(opts && opts.strict);
  const posted = !!(opts && opts.posted);
  if (!result) return { ok: false, reason: 'no result entry in the execution log' };
  if (result.is_error) {
    return { ok: false, reason: `run errored: ${String(result.result || '').trim() || 'no message'}` };
  }

  const text = String(result.result || '').toLowerCase();

  // Chapter reviews write findings to a file the workflow posts, so whether a
  // review was produced is already settled as a fact before this runs. Only
  // genuine failures are left to detect, and no prose decides the outcome.
  if (posted) {
    if (isAbandoned(text)) {
      return { ok: false, reason: 'findings written, but the run abandoned before finishing (see #136)' };
    }
    return { ok: true, reason: 'findings written and posted' };
  }

  if (has(text, POSTED_MARKERS)) return { ok: true, reason: 'review posted' };
  if (has(text, SKIP_MARKERS)) {
    return strict
      ? { ok: false, reason: 'skipped, but a chapter review must review every push' }
      : { ok: true, reason: 'deliberate skip' };
  }
  if (isAbandoned(text)) {
    return { ok: false, reason: 'abandoned waiting on background agents (see #136)' };
  }
  return { ok: false, reason: 'nothing posted and no deliberate skip recorded' };
}

function main() {
  const args = process.argv.slice(2);
  const strict = args.includes('--strict');
  const posted = args.includes('--posted');
  const file = args.find((a) => !a.startsWith('--'));
  if (!file) {
    console.error('usage: check-review-outcome.js [--strict] [--posted] <execution-log.json>');
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
  const verdict = classify(result, { strict, posted });

  if (result) {
    console.log(
      `is_error=${result.is_error} turns=${result.num_turns} cost=$${result.total_cost_usd}`
    );
  }
  console.log(`${verdict.ok ? 'OK' : 'FAIL'}${strict ? ' (strict)' : ''}: ${verdict.reason}`);
  process.exit(verdict.ok ? 0 : 1);
}

module.exports = { classify };

if (require.main === module) main();
