# Feedback Kitchen — Engineering Roadmap

Feedback Kitchen is a browser-based rubric scoring tool for university educators that runs entirely client-side, exporting completed evaluations as Excel files via SheetJS.

> **Truth pass 2026-06-13:** this file previously carried the May 2026 sprint plan
> with all five PRs marked Open. It now records outcomes. Detailed specs for the
> closed PRs live in the PRs themselves and in `docs/planning-202606/BOARD.md`
> (cards FK-21/FK-22 re-implement their intent).

## May 2026 engineering sprint — outcome

| PR | Branch | Description | Outcome |
|----|--------|-------------|---------|
| [#12](https://github.com/stephendmann/feedback-kitchen/pull/12) | `feat/draft-persistence` | Persist in-progress student work to localStorage; resume prompt on load | ❌ Closed 2026-06-13 — branch predates the June refactors; intent re-implemented as card **FK-21** (sequenced after the FK-10 storage audit) |
| [#13](https://github.com/stephendmann/feedback-kitchen/pull/13) | `perf/lazy-load-sheetjs` | Remove 930 KB SheetJS from critical path; load on first export | ❌ Closed 2026-06-13 — superseded by #15, which shipped `loadSheetJS()` |
| [#14](https://github.com/stephendmann/feedback-kitchen/pull/14) | `fix/accessible-modals` | role=dialog, aria-modal, focus trap, Esc close for all 12 modals | ✅ Merged |
| [#15](https://github.com/stephendmann/feedback-kitchen/pull/15) | `fix/aria-rubric-table` | Rubric table ARIA + lazy-load SheetJS | ✅ Merged |
| [#16](https://github.com/stephendmann/feedback-kitchen/pull/16) | `perf/homepage-and-dark-mode` | Homepage perf quick wins + dark-mode gap fixes | ❌ Closed 2026-06-13 — stale base; intent re-implemented as card **FK-22** (plus accumulated dark-mode residuals) |

Stalled-branch policy (decided 2026-06-13): closed branches are **not** rebased
against the heavily-refactored scorer.html — their intent is re-implemented from
scratch via new cards. PR #12's `saveDraft`/`clearDraft` scaffolding sits unused
in scorer.html and is removed or absorbed when FK-21 lands.

## June 2026 improvement programme (Phases 0–2 shipped)

Architecture-assessment follow-up, run from a private planning board. Snapshot of
the full planning trail (board, decision register, inspection ledger, phase gates):
[`docs/planning-202606/`](docs/planning-202606/). Locked design decisions:
[`fk-decisions.md`](fk-decisions.md) Addenda **F** (Phase 0) and **G** (Phase 2).

| Phase | Scope | Key PRs | Status |
|---|---|---|---|
| 0 | Characterization-test net over grade math; de-letter + reorder sections; trust/UX fixes; CSS watch task | [#20](https://github.com/stephendmann/feedback-kitchen/pull/20), [#21](https://github.com/stephendmann/feedback-kitchen/pull/21) | ✅ Shipped 2026-06-12 |
| 0+ | WCAG AA pass (84 axe nodes → 0 at full coverage); sticky-rail containment fix | [#22](https://github.com/stephendmann/feedback-kitchen/pull/22), [#23](https://github.com/stephendmann/feedback-kitchen/pull/23), [#24](https://github.com/stephendmann/feedback-kitchen/pull/24) | ✅ Shipped 2026-06-12 |
| 1 | Scope-deciding inspections (record round-trip; moderation pair) | — (code-read) | ✅ Resolved 2026-06-12 |
| 2 | Scoring-engine boundary hardening (guards + 40-test edge suite); moderation-export copy polish; **cohort record re-entry** (saved records re-open into the session via View-list → Open, with unsaved-work guard); **persistent collapsed draft pane in focus mode** (live counts + tail preview, collapsed by default) + night-mode dark variants | [#25](https://github.com/stephendmann/feedback-kitchen/pull/25), [#28](https://github.com/stephendmann/feedback-kitchen/pull/28), [#29](https://github.com/stephendmann/feedback-kitchen/pull/29), [#30](https://github.com/stephendmann/feedback-kitchen/pull/30), [#31](https://github.com/stephendmann/feedback-kitchen/pull/31) | ✅ Shipped 2026-06-13 |
| 3 (next) | localStorage capacity audit (synthetic 300-record cohort) → storage go/no-go; rubric-version stamping; drift-indicator pilot | — | ⏳ Kickoff pending |

Backlog highlights (board cards, not yet scheduled): FK-19 Moodle
offline-grading-worksheet round-trip · FK-21 draft persistence v2 · FK-22
homepage/dark-mode residuals · FK-15 incremental scorer decomposition ·
FK-16 styling consolidation.

## Tooling / CI

- **Axe-core battery** — ✅ exists (`run-bbp-a11y.sh` + `bbp-a11y-tests.mjs`): axe
  scans + keyboard smoke tests over home/builder/demo-loaded scorer, including a
  permanent scrolled-pin assertion. Run manually before merging UI changes; not
  yet wired into CI.
- **Jest** — ✅ 140 tests (characterization + engine edge suites + wording QA).
- **CI** (`ci.yml`) runs on push/PR — `npm run build` (CSS), the **lazy-load guard** (`npm run guard:lazy-load`), then the **Jest suite** (`npm test`, 140 tests). **FK-23** wired Jest + the lazy-load guard into CI: the guard (`scripts/check-lazy-load.js`) enforces the #15 invariant by failing the build if a static SheetJS/`xlsx` `<script src>` tag reappears in production HTML (`_snapshots/` excluded). The axe-core battery is still run manually (needs headless browser + dev server — separate setup); Lighthouse CI deferred to Phase 4/backlog.

## UI Polish and Branding Safety — Parked Items

### Dark-mode UoW logo

- **Live state:** current dark-mode treatment is deployed and acceptable.
- **Implementation:** CSS filter workaround (`invert(0.85)` / `grayscale+invert+screen`) — not an official reversed or dark-background logo asset.
- **End state:** replace filter-based treatment with an official dark-safe UoW asset (transparent PNG or reversed variant) when available from UoW marketing; remove workaround CSS at that point.
- **Stash note:** an alternative filter refinement exists in local stash only and is not planned for release unless the current live version proves inadequate.
