---
description: Weekly Feedback Kitchen health check. Silent when green; opens or updates a GitHub issue on failure; drafts fix PRs for small clear problems; never merges.
argument-hint: [test]
---

# FK health check

Run four checks on this repo and report by exception. If everything passes, create nothing, comment on nothing and finish with a one-line summary in the session log. Never merge anything. Never push to main. Skip the CLAUDE.md graphify step: this is a health run, not a codebase question. All issue and pull request text follows the CLAUDE.md writing rules.

## Test mode

If `$ARGUMENTS` contains `test`, skip all checks. Open one issue titled `fk-health: test alert (safe to close)`, then close it immediately with state_reason `not_planned`, and report the issue URL. This proves issue permissions without leaving noise. Stop here.

## Step 0: setup

Work from the repo root. Read the `scripts` block of package.json at runtime and use what is there; if a script named below has been renamed, adapt rather than fail.

Install dependencies without letting Puppeteer download its own browser:

```
PUPPETEER_SKIP_DOWNLOAD=true npm ci
```

If the install fails, record the test suite check as FAILED with the install output and skip step 2.

## Step 1: CI status on main

Using the GitHub tools, list the most recent completed run of the `ci.yml` workflow on branch `main` (repo stephendmann/feedback-kitchen).

- Conclusion `success`: PASS.
- Any other conclusion: FAIL. Keep the run URL for the issue.
- API error or missing scope: SKIP.

## Step 2: local build and tests

Run, in order, matching ci.yml:

```
npm run build && npm run guard:lazy-load && npm test
```

Non-zero exit anywhere: FAIL. Capture roughly the last 40 lines of output for the issue.

## Step 3: live site

Check three URLs with curl (status code plus body for the first):

- https://marking.stephendmann.com/
- https://marking.stephendmann.com/builder.html
- https://marking.stephendmann.com/scorer.html

PASS when all three return 200 and the homepage body contains `<title>Feedback Kitchen`. FAIL on any 4xx or 5xx, or a 200 homepage missing that marker. SKIP when curl cannot connect at all or the response is identifiably from the egress proxy rather than the origin (for example 403 or 407 with proxy headers): a blocked network policy is not a site outage.

## Step 4: accessibility battery

CI does not run this; it is the main reason the weekly check exists.

1. Start the dev server in the background: `node dev-server.js`. Poll `http://localhost:3000/` for up to 15 seconds.
2. Run the battery directly (dependencies are already installed, so bypass run-bbp-a11y.sh):

```
PUPPETEER_EXECUTABLE_PATH=/opt/pw-browsers/chromium node bbp-a11y-tests.mjs
```

3. Judge the result from `bbp-a11y-report.json`, not the exit code; the script exits 0 even when violations exist.
   - FAIL: any axe violation with impact `critical` or `serious`, any keyboard test reporting focus lost or an error, or any page that failed to load.
   - Moderate or minor axe violations alone stay silent; mention them only inside an issue that is being opened anyway.
   - SKIP: Chromium fails to launch or the dev server never comes up.
4. Stop the dev server. If `bbp-a11y-report.json` changed, restore it with `git checkout -- bbp-a11y-report.json`; never commit it.

## Deciding what to report

- Any FAIL: open or update an issue using the rules below.
- All PASS: silence, apart from closing recovered issues.
- SKIPs are silent, with one exception: if two or more of the four checks were SKIPPED, the check is effectively blind, so open or update `fk-health: weekly check could not run` describing what was blocked.

## Issue rules

Use exactly these titles so runs deduplicate against each other:

- `fk-health: CI failing on main`
- `fk-health: test suite failing`
- `fk-health: live site check failed`
- `fk-health: accessibility regressions`
- `fk-health: weekly check could not run`

Before opening anything, list open issues and match titles starting with `fk-health:` (listing is more reliable than the search index). If a matching issue is already open, add a comment with this run's findings instead of creating a duplicate. If a check passes and an open `fk-health:` issue exists for it, close that issue with a one-line comment naming the run that confirmed recovery.

Issue bodies state what failed, the exact command, a short output excerpt, a link to the failing Actions run or draft PR when one exists, and what Stephen should do next (often nothing yet, or review and merge the draft PR). Plain prose, sentence-case headings, no emojis, no placeholders.

## Draft PR rules

Push a fix only when all of these hold:

- The cause is unambiguous from the failing output.
- The fix touches at most 2 files and roughly 40 changed lines.
- It does not touch `api/`, dependency versions in package.json, `dev-server.js`, CI workflows, or test expectations.
- The failing check passes locally after the fix.

Branch from main as `fk-health/fix-<slug>-<YYYYMMDD>` and open a draft pull request with base `main`. Never merge, never enable auto-merge, never force-push. Link the PR from the issue. If an earlier fk-health draft PR for the same problem is still open, comment on it rather than opening another.

## Silence contract

A healthy week produces no issue, no comment and no email. The absence of an fk-health issue means the last run found nothing wrong.
