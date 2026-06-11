# Phased Implementation Roadmap (working)

Internal sequencing plan. Phases are gates, not sprints — a phase closes when its
exit criteria hold, regardless of calendar. Card IDs → BOARD.md; INS-x → INSPECTION.md.

## Phase 0 — Correctness net + trust fixes (start immediately)
**Goal:** regression net under the grade math; kill the first-run confusion; land all
remaining no-inspection-needed fixes.

> **Scope change 2026-06-11 (pull-forward):** FK-05 and FK-06 pulled forward from
> Phase 1, FK-04 and the FK-16 watch-task slice added, because their evidence basis
> requires no inspection outcome (FK-05's INS-9 pre-flight is its own first step,
> not a blocker). D-02 added as an in-phase decision gate for FK-02.
> Phase 1 reduces to the two scope-deciding inspections. See PHASE0-PROMPT.md.

| Order | Item | Notes |
|---|---|---|
| 0.1 | FK-01 characterization tests on shared.js score functions | Findings → INS-4, not silent fixes |
| 0.2 | Resolve D-02 (de-letter vs re-letter) | Run its grep validation step; record in DECISIONS.md |
| 0.3 | FK-02 lettering/banner fix + FK-03 casing rider | One small PR; follows D-02 |
| 0.4 | Run INS-3 (scoring-surface map) and INS-9 (reorder pre-flight) | Inspection only, no changes |
| 0.5 | FK-05 section reorder | Pulled forward; uses INS-9 findings (☑ 2026-06-11: no positional lookups; rail re-sequence + FK-02 CSS re-key are the only coupled bits); runtime-validate focus-mode nav. Order clarified 2026-06-11: Student → Rubric/Focus → Penalty → Feedback → Notes → Wording assistant → Finish → Cohort (earlier shorthand omitted Feedback/assistant; the only move is Penalty below the marking blocks) |
| 0.6 | FK-06 Clear Cohort demote/guard | Pulled forward; partial cohort cleanup only — moderation pair stays gated on INS-2 |
| 0.7 | FK-04 non-color signal for yellow fields | Pulled forward |
| 0.8 | FK-16 watch-task slice (`build:css --watch`) | Pulled forward from Phase 4; no styling migration |

**Exit:** score-function tests green and committed; INS-4 populated (or explicitly
empty); D-02 resolved and FK-02/FK-03 landed consistent with it; INS-9 findings
recorded and FK-05 runtime-validated (focus-mode nav, nav strip, expand/collapse-all);
FK-06 guard verified in runtime; FK-04 passes axe with no new violations; FK-16 watch
task running; INS-3 status ☑ with findings.

## Phase 1 — Scope-deciding inspections
**Goal:** resolve the two inspections that determine Phase 2's shape.

| Order | Item | Notes |
|---|---|---|
| 1.1 | Run INS-1 (record round-trip), INS-2 (moderation pair) | Decides Phase 2 scope |

**Exit:** INS-1/INS-2 resolved → FK-07/FK-08 rescoped and moved out of Needs inspection.
*(FK-05/FK-06 moved to Phase 0 — see scope change note above.)*

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
| ~~FK-16 watch-task slice~~ | Pulled forward to Phase 0 (0.8) — scope change 2026-06-11 |
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
