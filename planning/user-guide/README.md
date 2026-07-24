# User guide drafts

Drafts of the lecturer-facing documentation FK does not yet have. Written 2026-07-24 against `origin/main`.

| File | What it is | Audience |
|---|---|---|
| `QUICK-START.md` | Two pages, free path only, build to export | A lecturer opening FK for the first time |
| `USER-MANUAL.md` | Full reference in 12 parts, free features first, supporter features as a closing supplement | Anyone marking with FK, and anyone setting it up for a team |
| `MANUAL-MAINTENANCE.md` | The surface map and the review that runs when documented behaviour changes | Whoever merges a change to FK |

## Status

Not published, and not to be circulated. Publication is carded as **FK-46**, blocked by **FK-44**.

FK-44 is the reason for the block. `Import Moodle worksheet…` currently sits in the last section of the scorer, below Finish, in the one section with no rail link, even though importing is what you do before marking anyone. The manual's Moodle section describes reaching it from where marking starts, which is how FK-44 will leave it. Publishing first would have meant teaching a workaround and rewriting the section afterwards.

## Why these live in the planning worktree

`frosty-babbage` is planning-only: planning artefacts may be edited here, application code, CI, and tests may not. These are drafts and a proposed process, so they belong here for now. Promoting them to `docs/` on `main`, and deciding whether a rendered page joins the site, is FK-46 and happens on a feature branch.

## Accuracy notes

Every claim was checked against `origin/main`, not against this worktree, which is roughly five weeks stale (merge-base `1af58be`, 2026-06-11). Anyone revising these drafts should do the same.

Two drift items were found in existing documentation while drafting, both recorded on FK-46:

- `README.md` still says student session data "is never written to localStorage". Draft autosave (FK-21) and cohort save both write it, and the Cohort Workbench section in the same file describes the cohort records that contradict the claim.
- `fk-decisions.md` D17 says Sonnet is gated to `improve_criterion_body`. Shipped `api/garnish.js:125` allows four modes: `improve_criterion_body`, `draft`, `improve`, `shorten`.

Neither affects the drafts, which were written from the code. Both need fixing where they sit.
