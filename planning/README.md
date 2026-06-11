# FK Improvement Plan — Planning Workspace

**Status:** internal working plan. NOT publication-ready. Do not copy into README, ROADMAP.md, fk-decisions.md, issues, or PR descriptions yet.

This directory is the temporary planning area for the architecture-assessment follow-up
(assessment delivered 2026-06-11, evidence-led v2). It exists inside the
`frosty-babbage-f2755d` worktree so the plan can be explored, validated, and refined
before anything is promoted.

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
