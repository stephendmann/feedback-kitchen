#!/usr/bin/env node
/* ============================================================
   Guard: no real student data in the repository.

   feedback-kitchen is a PUBLIC repo for a marking tool that is used with
   real Moodle exports. The recurring risk is not a dramatic one: it is
   someone pasting one line of a real worksheet into a comment, a test, a
   fixture or a commit message while debugging. That already happened once
   (a real name, participant id and student id reached two source comments
   and were caught by an ad-hoc scan minutes before the push), which is why
   this exists.

   WHY IT ASSERTS THE SYNTHETIC CONVENTION INSTEAD OF HUNTING FOR PII.
   Detecting "is this a real person" in the general case is open-ended and
   noisy: real first names look exactly like fixture first names, so a
   name-matching scan flags Liam and Olivia and gets switched off within a
   week. Inverting it makes the problem tractable. Every synthetic identity
   in this repo follows one convention, so anything worksheet-shaped that
   deviates from it is the alarm:

     email          @example.edu (or @example.com)
     participant    Participant 888xxxx
     student id     990xxxx

   That is a narrow, fast invariant with close to no false positives: it
   holds across every tracked file in the repo today, and it would have
   caught the one real incident.

   WHAT IT CANNOT DO. A bare name, with no id or address beside it, is not
   pattern-detectable and will pass. This is a strong net, not a guarantee.
   Reviewing what you paste is still the actual control.

   Usage:
     node scripts/check-no-real-student-data.js            # all tracked files (CI)
     node scripts/check-no-real-student-data.js --staged   # staged only (pre-commit)
     npm run guard:student-data
   ============================================================ */
'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/* ── The synthetic convention ───────────────────────────────── */
const SYNTHETIC_EMAIL_DOMAIN = /@example\.(edu|com)$/i;
const SYNTHETIC_PARTICIPANT  = /^888\d{4}$/;   // Participant 888xxxx
const SYNTHETIC_STUDENT_ID   = /^(888|990)\d{4}$/;

/* Self-evidently invented ids that predate the 990xxxx convention and are
   still used as placeholders in older tests (9999999, s1234567). A real
   institutional id is never a single repeated digit or a straight run, so
   allowing these costs nothing and avoids pointless churn in those files. */
function isObviousPlaceholder(digits) {
  if (/^(\d)\1+$/.test(digits)) return true;              // 9999999
  const step = (a, b) => b.charCodeAt(0) - a.charCodeAt(0);
  const d = step(digits[0], digits[1]);
  if (d !== 1 && d !== -1) return false;
  for (let i = 1; i < digits.length - 1; i++) {
    if (step(digits[i], digits[i + 1]) !== d) return false;
  }
  return true;                                            // 1234567 / 7654321
}

/* Addresses that are legitimately real and deliberately committed. Keep this
   list tiny and justified: every entry is a hole in the guard. */
const ALLOWED_EMAILS = [
  // README attribution to the author of the original Excel marking tool this
  // project is adapted from, published with his consent.
  'michael.harker@strath.ac.uk'
];

/* Paths never scanned: dependency metadata and generated artefacts, where a
   third-party maintainer address is expected and means nothing about students. */
const SKIP_PATHS = [
  /^node_modules\//,
  /^graphify-out\//,
  /^package-lock\.json$/,
  /^\.git\//
];
const SKIP_EXT = /\.(png|jpe?g|gif|webp|ico|svg|pdf|zip|mp4|mov|woff2?|ttf|eot)$/i;

/* A real Moodle export, by the name Moodle gives it. These must never be
   tracked at all: .gitignore covers them, and this is the backstop for a
   file added with `git add -f` or renamed. */
const EXPORT_FILENAME = /(^|\/)Grades-.*\.csv$/i;

/* Worksheet vocabulary. A bare seven-digit number is meaningless on its own
   (it could be anything), so the student-id rule only applies on a line that
   is talking about worksheet rows. That is what keeps this quiet. */
const WORKSHEET_CONTEXT = /participant|id number|student\s*id|full name|feedback comments/i;

const EMAIL_RE       = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const PARTICIPANT_RE = /Participant\s+(\d{6,8})/gi;
const SEVEN_DIGIT_RE = /(?<![\d.])(\d{7})(?![\d.])/g;

function tracked(staged) {
  const args = staged
    ? ['diff', '--cached', '--name-only', '--diff-filter=ACMR']
    : ['ls-files'];
  return execFileSync('git', args, { encoding: 'utf8' })
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean);
}

function scannable(file) {
  if (SKIP_EXT.test(file)) return false;
  return !SKIP_PATHS.some(re => re.test(file));
}

/* The rules, over a string rather than a path, so they are unit-testable
   without writing a file that would itself have to contain the shapes we are
   trying to keep out of the repo. */
function scanText(file, text) {
  const findings = [];
  scanInto(file, text, findings);
  return findings;
}

function checkFile(file, findings) {
  if (EXPORT_FILENAME.test(file)) {
    findings.push({
      file, line: 0, rule: 'real Moodle export committed',
      detail: path.basename(file),
      fix: 'Real exports must never be tracked. Move it outside the repo, then `git rm --cached` it.'
    });
    return;                                   // do not read a real export's contents
  }

  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch (e) { return; }
  // String.fromCharCode, not a '\u0000' literal: an escape written here gets
  // stored as a real NUL byte, which makes git treat this very file as binary
  // and makes the guard skip itself.
  if (text.indexOf(String.fromCharCode(0)) !== -1) return;  // binary
  scanInto(file, text, findings);
}

function scanInto(file, text, findings) {
  text.split(/\r\n|\n|\r/).forEach((line, i) => {
    const at = i + 1;

    let m;
    EMAIL_RE.lastIndex = 0;
    while ((m = EMAIL_RE.exec(line)) !== null) {
      const email = m[0];
      if (SYNTHETIC_EMAIL_DOMAIN.test(email)) continue;
      if (ALLOWED_EMAILS.some(a => a.toLowerCase() === email.toLowerCase())) continue;
      findings.push({
        file, line: at, rule: 'non-synthetic email address', detail: email,
        fix: 'Fixture addresses use @example.edu. If this address is legitimate and intended, add it to ALLOWED_EMAILS with a reason.'
      });
    }

    PARTICIPANT_RE.lastIndex = 0;
    while ((m = PARTICIPANT_RE.exec(line)) !== null) {
      if (SYNTHETIC_PARTICIPANT.test(m[1])) continue;
      findings.push({
        file, line: at, rule: 'non-synthetic Moodle participant id', detail: m[0],
        fix: 'Synthetic participant ids are Participant 888xxxx. This looks like it came from a real export.'
      });
    }

    if (WORKSHEET_CONTEXT.test(line)) {
      SEVEN_DIGIT_RE.lastIndex = 0;
      while ((m = SEVEN_DIGIT_RE.exec(line)) !== null) {
        if (SYNTHETIC_STUDENT_ID.test(m[1]) || isObviousPlaceholder(m[1])) continue;
        findings.push({
          file, line: at, rule: 'non-synthetic student id beside worksheet text', detail: m[1],
          fix: 'Synthetic student ids are 990xxxx. Replace it, or reword the line so it is not about a worksheet row.'
        });
      }
    }
  });
}

function main() {
  const staged = process.argv.includes('--staged');
  const files = tracked(staged).filter(scannable);
  const findings = [];
  files.forEach(f => checkFile(f, findings));

  if (!findings.length) {
    const scope = staged ? 'staged' : 'tracked';
    console.log('✓ Student-data guard passed — no real student data in ' +
      files.length + ' ' + scope + ' file' + (files.length === 1 ? '' : 's') + '.');
    return 0;
  }

  console.error('✗ Student-data guard FAILED: ' + findings.length +
    ' possible real student identifier' + (findings.length === 1 ? '' : 's') + '.\n');
  findings.forEach(f => {
    console.error('  ' + f.file + (f.line ? ':' + f.line : '') + '  [' + f.rule + ']');
    console.error('    found: ' + f.detail);
    console.error('    ' + f.fix + '\n');
  });
  console.error('This repo is PUBLIC. Pushing a real student identifier exposes it, and');
  console.error('deleting it later does not remove it from history or from anything that');
  console.error('cached it. Fix the lines above rather than bypassing this check.');
  console.error('If every hit is a false positive, adjust the rules in ' + __filename.split(/[\\/]/).pop() + '.');
  return 1;
}

if (require.main === module) process.exit(main());
module.exports = { checkFile, scanText, scannable, isObviousPlaceholder, EXPORT_FILENAME };
