# FK Improvement Plan — Planning Workspace

**Status:** internal working plan. NOT publication-ready. Do not copy into README, ROADMAP.md, fk-decisions.md, issues, or PR descriptions yet.

This directory is the temporary planning area for the architecture-assessment follow-up
(assessment delivered 2026-06-11, evidence-led v2). It exists inside the
`frosty-babbage-f2755d` worktree so the plan can be explored, validated, and refined
before anything is promoted.

## Step 0 — Live board reality check (do this BEFORE any planning)

The single source of truth for the board is **`planning/BOARD.md` on the
`frosty-babbage` planning worktree** — the file you are reading next to this one.
Everything else is secondary or frozen:

- **`docs/planning-202606/` (on `main`) is a FROZEN snapshot** (refreshed 2026-06-13 at
  the FK-20 promotion checkpoint). It is historical provenance only. **Never plan from
  it** and never trust its column counts, card list, or "Next free card ID" as current —
  they are years/PRs out of date relative to the live board.
- Before assigning a new card ID, reconcile the live board's **"Next free card ID"** line
  against any **reserved / deferred** IDs. Reserved IDs are real even when the card isn't
  written yet (e.g. FK-39 / FK-40 are reserved for the deferred accordion / View
  Transitions animation slices, so the next *free* ID is FK-42, not FK-39). The count line
  can drift — re-derive it from the columns + reservations, don't copy it blindly.
- **Stale-local-main gotcha:** the planning worktree's checkout of the *app* files
  (scorer.html, builder.html, css/…) predates recently-merged feature PRs. When you need
  the real state of code for evidence, read `git show main:<file>` — not this branch's
  working copy.

If a planning prompt or snapshot doc disagrees with `planning/BOARD.md`, the live board
wins; fix the drift rather than propagating it.

## Files

| File | Purpose |
|---|---|
| `BOARD.md` | Project board — all work items as cards with column placement |
| `ROADMAP-PHASES.md` | Phased implementation roadmap (sequencing + gates) |
| `INSPECTION.md` | Code-inspection checklist — questions that must be answered before certain cards can move out of "Needs inspection" |
| `DECISIONS.md` | Draft decision register — pre-ADR; promote entries to fk-decisions.md only after validation |

## Board columns

`Backlog → Needs inspection → Safe to implement now → In progress → Validate in runtime → Ready to document`

- **Backlog** — agreed direction, not yet actionable (blocked by dependency or sequencing).
- **Needs inspection** — cannot be scoped or safely started until the matching INSPECTION.md item is resolved. Resolving an inspection item moves the card to *Safe to implement now*, *Backlog* (rescoped), or *dropped* (evidence killed it).
- **Safe to implement now** — evidence basis is sufficient (screenshots/repo); no open inspection question gates it.
- **In progress / Validate in runtime / Ready to document** — execution states. "Validate in runtime" means verified in the running app (dev server / demo scorer), not just unit tests.

## Promotion rule

Nothing leaves this directory until:
1. Every inspection item a card depends on is marked **Resolved** in INSPECTION.md with findings recorded.
2. The card has passed *Validate in runtime* (or is documentation-only).
3. The decision register entry (if any) has its "first validation step" outcome recorded.

Then, per item, rewrite as: ADR addendum (fk-decisions.md) for locked design choices;
GitHub issue for deferred work; PR-ready notes for implemented work. Strip all
working-plan language (confidence levels stay in ADRs; board mechanics do not).

> **Workflow note (2026-06-14):** the original `promotion/` staging folder is retired
> and lives under `_archive/promotion-phase0/`. Since Phase 2 the mechanics are:
> PR bodies → `%TEMP%\fk-pr-bodies\`; docs/decision promotion → a dedicated docs
> branch (e.g. `docs/phase3-promotion` = PR #38) + `docs/planning-202606/` snapshots
> on main. Don't recreate `promotion/`. See `_archive/README.md`.
