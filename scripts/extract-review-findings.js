#!/usr/bin/env node
/**
 * Pull a chapter review's findings out of the execution log (issue #136).
 *
 * Three delivery channels have now been tried and gated in the session that
 * runs the chapter review: `gh pr comment` (network blocked), the Write tool
 * (permission gate), and a Bash heredoc (file redirection blocked outright,
 * along with tee and a python3 write). Each one cost a completed review.
 *
 * The `result` entry is the one channel nothing can gate, because producing it
 * is not a tool call. The review states its findings in its final response, the
 * action records that response in the log it already writes, and this reads it
 * back out for the workflow to post.
 *
 * Usage: node scripts/extract-review-findings.js <execution-log.json> [out.md]
 * Exits non-zero when there is nothing usable to post.
 */
'use strict';

const fs = require('fs');

/** Below this, a result is a status line rather than a review. */
const MIN_USEFUL_CHARS = 200;

function extract(events) {
  const result = (Array.isArray(events) ? events : []).find((e) => e && e.type === 'result');
  if (!result) return { ok: false, reason: 'no result entry in the execution log' };
  if (result.is_error) {
    return { ok: false, reason: `the review errored: ${String(result.result || '').trim() || 'no message'}` };
  }
  const text = String(result.result || '').trim();
  if (text.length < MIN_USEFUL_CHARS) {
    return { ok: false, reason: `result too short to be a review (${text.length} characters)` };
  }
  return { ok: true, text };
}

function main() {
  const [file, out] = process.argv.slice(2);
  if (!file) {
    console.error('usage: extract-review-findings.js <execution-log.json> [out.md]');
    process.exit(2);
  }
  if (!fs.existsSync(file)) {
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

  const found = extract(events);
  if (!found.ok) {
    console.error(`Nothing to post: ${found.reason}`);
    process.exit(1);
  }

  if (out) fs.writeFileSync(out, found.text, 'utf8');
  console.log(`Extracted ${found.text.length} characters of findings.`);
}

module.exports = { extract, MIN_USEFUL_CHARS };

if (require.main === module) main();
