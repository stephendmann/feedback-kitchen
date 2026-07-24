# User guide drafts

Drafts of the lecturer-facing documentation FK does not yet have. Written 2026-07-24 against `origin/main`.

| File | What it is | Audience |
|---|---|---|
| `QUICK-START.md` | Two pages, free path only, build to export | A lecturer opening FK for the first time |
| `USER-MANUAL.md` | Full reference in 12 parts, free features first, supporter features as a closing supplement | Anyone marking with FK, and anyone setting it up for a team |
| `MANUAL-MAINTENANCE.md` | The surface map and the review that runs when documented behaviour changes | Whoever merges a change to FK |

## Status

Not yet published, and not to be circulated until it is. Publication is carded as **FK-46**, which is **no longer blocked**: FK-44 (PR #92) and FK-48 (PR #93) both shipped on 2026-07-24 and the drafts were revised the same day to match.

Part 6 of the manual now describes the shipped Student-section import entry point, and gains a section on the per-scorer "This assessment is marked in Moodle" setting, including that it travels with a shared scorer and that the export control stays available mid-round-trip.

One thing to settle before publishing: markdown in `docs/` is served as `text/markdown` and browsers display it as raw text with the markup visible, so it reads correctly on GitHub but not on the live site. Publishing to `docs/` plus a README link works today; a lecturer-facing page on the site needs a rendering step, which is tracked on the FK-46 card.

## Why these live in the planning worktree

`frosty-babbage` is planning-only: planning artefacts may be edited here, application code, CI, and tests may not. These are drafts and a proposed process, so they belong here for now. Promoting them to `docs/` on `main`, and deciding whether a rendered page joins the site, is FK-46 and happens on a feature branch.

## Accuracy notes

Every claim was checked against `origin/main`, not against this worktree, which is roughly five weeks stale (merge-base `1af58be`, 2026-06-11). Anyone revising these drafts should do the same.

One drift item stands, recorded on FK-46: `fk-decisions.md` (lines 1121 and 1161) says Sonnet is gated to `improve_criterion_body`, while shipped `api/garnish.js:125` allows four modes (`improve_criterion_body`, `draft`, `improve`, `shorten`). It does not affect these drafts, which were written from the code, but the decision record needs correcting.

A second claimed drift item has been **withdrawn as an error**. These notes previously said `README.md` still asserts that student session data is never written to localStorage. That is not true of `main`: `README.md:274` already describes cohort records being saved to localStorage, accurately. The mistake came from reading this worktree's own five-week-stale copy of `README.md` instead of `main`, which is exactly the hazard noted above.
