# Phased Implementation Roadmap (working)

Internal sequencing plan. Phases are gates, not sprints — a phase closes when its
exit criteria hold, regardless of calendar. Card IDs → BOARD.md; INS-x → INSPECTION.md.

## Phase 0 — Correctness net + trust fixes (start immediately)
**Goal:** regression net under the grade math; kill the first-run confusion.

| Order | Item | Notes |
|---|---|---|
| 0.1 | FK-01 characterization tests on shared.js score functions | Findings → INS-4, not silent fixes |
| 0.2 | FK-02 lettering/banner fix + FK-03 casing rider | One small PR |
| 0.3 | Run INS-3 (scoring-surface map) and INS-9 (reorder pre-flight) | Inspection only, no changes |

**Exit:** score-function tests green and committed; banner matches page; INS-3/INS-9 findings recorded.

## Phase 1 — Workflow order + destructive-action safety
**Goal:** page order matches marking sequence; cohort actions safe.

| Order | Item | Notes |
|---|---|---|
| 1.1 | FK-05 section reorder | Uses INS-9 findings; runtime-validate focus-mode nav |
| 1.2 | FK-06 Clear Cohort demote/guard | Partial cohort cleanup only |
| 1.3 | Run INS-1 (record round-trip), INS-2 (moderation pair) | Decides Phase 2 scope |

**Exit:** reordered page passes focus-mode runtime checks; Clear Cohort guarded; INS-1/INS-2 resolved → FK-07/FK-08 rescoped and moved out of Needs inspection.

## Phase 2 — Engine extraction + queue (the two big wins)
**Goal:** provably-correct scoring module; cohort visible and editable during marking.

| Order | Item | Notes |
|---|---|---|
| 2.1 | FK-09 engine extraction | Verbatim-extract → tests green → then bug fixes as separate commits |
| 2.2 | FK-08 moderation-pair resolution | Small, per INS-2 |
| 2.3 | FK-07 queue/re-entry | Scope per INS-1 fork; the centerpiece of this phase |
| 2.4 | FK-14 draft pane prototype | After FK-05 layout settles; prototype before committing |

**Exit:** engine module consumed by scorer with green characterization + edge suites; a marker can re-open and re-export a record without duplication; draft-pane go/no-go decided from prototype.

## Phase 3 — Consistency + data integrity
| Order | Item | Notes |
|---|---|---|
| 3.1 | INS-5 storage measurement → FK-10 audit verdict | Migration card only if decision rule triggers |
| 3.2 | INS-6 → FK-11 version stamping/warning | Scope forks on stamping semantics |
| 3.3 | INS-7 → FK-12 drift indicator behind toggle | Self-pilot before any default-on |

**Exit:** storage go/no-go documented; mixed-version cohorts warn at export (or stamping landed); one drift indicator toggleable.

## Phase 4 — Structural hygiene (amortized, runs alongside 2–3)
| Item | Notes |
|---|---|
| FK-16 watch-task slice | Same-day: wire `build:css --watch` into dev workflow — do anytime |
| FK-15 decomposition program | Gated on the bug-tagging validation (5 bugs tagged by cause); extract-on-contact policy |
| FK-16 styling migration policy | Freeze shared.css, shrink-on-touch |
| FK-13/INS-8 ARIA audit → card or drop | |

**Exit:** decomposition go/no-go decided from bug evidence; styling policy written; scorer.html line count trending down if program is on.

## Promotion checkpoint (after Phase 2, again after Phase 3)
Re-read planning/README.md promotion rule. Candidates for promotion at first checkpoint:
- FK-09 outcome → fk-decisions.md addendum (engine module + order-of-operations spec)
- FK-07 outcome → ROADMAP.md entry + PR notes
- Resolved INS findings worth keeping → fold into fk-project-overview.md, then prune here

## Explicit non-goals (re-affirmed from assessment)
- No framework adoption (React/Vue) — no-framework constraint serves privacy/portability.
- No accounts/backend — local-first is the moat.
- No wording-assistant expansion before FK-07 lands.
- No big-bang rewrite of scorer.html.
