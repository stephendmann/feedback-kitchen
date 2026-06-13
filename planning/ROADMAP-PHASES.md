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

> **✅ PHASE 0 EXIT SATISFIED 2026-06-11.** All criteria met: FK-01 75 tests green
> (suite 98/98) · INS-4 populated (S-1…S-6) · D-02 ☑ + FK-02/FK-03 landed ·
> INS-9 ☑ + FK-05 runtime-validated · FK-06 guard verified (all four confirm paths
> exercised) · FK-04 axe baseline diff clean · FK-16 watch task verified rebuilding ·
> INS-3 ☑ with findings. Evidence on each BOARD.md card. Phase 1 (INS-1 + INS-2) is next.

## Phase 1 — Scope-deciding inspections
**Goal:** resolve the two inspections that determine Phase 2's shape.

| Order | Item | Notes |
|---|---|---|
| 1.1 | Run INS-1 (record round-trip), INS-2 (moderation pair) | Decides Phase 2 scope |

**Exit:** INS-1/INS-2 resolved → FK-07/FK-08 rescoped and moved out of Needs inspection.
*(FK-05/FK-06 moved to Phase 0 — see scope change note above.)*

> **✅ PHASE 1 EXIT SATISFIED 2026-06-12.** INS-1 ☑ (full-fidelity update-in-place
> store, no load path — FK-07 rescoped to M, Safe to implement now) · INS-2 ☑
> (configure-vs-run confirmed, consolidation off the table — FK-08 rescoped to
> copy polish, S/P2, Safe to implement now) · D-03 GO recorded · D-06 resolved.
> Phase 2 next: FK-09 → FK-08 → FK-07 per the table; FK-07 stays the
> centerpiece, now cheaper than planned. (Note: 2.1's "verbatim-extract" wording
> predates INS-3 — FK-09's card carries the current boundary-hardening scope.)

## Phase 2 — Engine extraction + queue (the two big wins)
**Goal:** provably-correct scoring module; cohort visible and editable during marking.

| Order | Item | Notes |
|---|---|---|
| 2.1 | FK-09 engine extraction | Verbatim-extract → tests green → then bug fixes as separate commits |
| 2.2 | FK-08 moderation-pair resolution | Small, per INS-2 |
| 2.3 | FK-07 queue/re-entry | Scope per INS-1 fork; the centerpiece of this phase |
| 2.4 | FK-14 draft pane prototype | After FK-05 layout settles; prototype before committing |

**Exit:** engine module consumed by scorer with green characterization + edge suites; a marker can re-open and re-export a record without duplication; draft-pane go/no-go decided from prototype.

> **✅ PHASE 2 EXIT SATISFIED 2026-06-13.** 2.1 FK-09 ✓ shipped (PR #25, 140/140
> green; production-verified → Addendum F.4) · 2.2 FK-08 ✓ shipped (PR #28 —
> labels/titles, identifier-tuple hint, both states runtime-verified) · 2.3 FK-07
> ✓ shipped (PR #29; full DoD battery in dev + production) · 2.4 FK-14 ✓ GO
> decided from prototype and shipped same sitting (PR #30; D-04 outcome recorded;
> night-mode dark-variant follow-up PR #31). All three exit lines hold.

> **✅ FK-20 PROMOTION CHECKPOINT EXECUTED 2026-06-13** (two-stage PR sequencing,
> user-directed): **Stage 1** = public truth pass — ROADMAP.md reconciled (merged
> PRs marked merged, duplicate/stale tables pruned, FK-07 + FK-14 outcome entries)
> + fk-decisions.md **Addendum G** (G.1 FK-07/D-03 · G.2 FK-14/D-04). **Stage 2**
> = full planning snapshot refresh at `docs/planning-202606/` (including
> PHASE0-PROMPT.md, per user). PRs #12/#16 closed with comments → FK-21/FK-22;
> #13 was already closed. FK-21 (draft persistence v2, after INS-5/FK-10) and
> FK-22 (homepage/dark-mode residuals incl. PR #31 follow-ups) created on the board.
> **Next session** = Phase-3 kickoff: design INS-5 (synthetic 300-record cohort
> measurement + quota-error-handling audit) and run the first measurement
> pass → FK-10 audit verdict. FK-21 lands after this, informed by it.

## Phase 3 — Consistency + data integrity
| Order | Item | Notes |
|---|---|---|
| 3.1 | INS-5 storage measurement → FK-10 audit verdict | **◐ kickoff done 2026-06-13** — see note below |
| 3.2 | INS-6 → FK-11 version stamping/warning | **☑ kickoff done 2026-06-13** — INS-6 ☑, FK-11 ungated (M, per-record stamping); see §3.2 note |
| 3.3 | INS-7 → FK-12 drift indicator behind toggle | **☑ kickoff done 2026-06-13** — INS-7 ☑, FK-12 ungated (S–M); self-pilot before any default-on; see §3.3 note |

**Exit:** storage go/no-go documented; mixed-version cohorts warn at export (or stamping landed); one drift indicator toggleable.

> **3.1 KICKOFF EXECUTED 2026-06-13 (planning/inspection only, frosty-babbage).**
> INS-5 run: failure-mode half **fully resolved by code-read** (the three heavy
> writers — `saveCohort`/`saveAllConfigs`/`saveSnippets` — `setItem` with no
> try/catch ⇒ QuotaExceededError uncaught and never surfaced; `downloadExcel`
> saves the cohort *after* the export, so a quota throw is masked by a successful
> download = silent cohort omission). Capacity half **analytical** from the exact
> stored schema (~6–7 KB/record typical ⇒ 300-record cohort ~1.9–3.9 MB vs a
> shared, conservatively-accounted ~5 MB origin). **FK-10 verdict: GO on a card,
> split** — **FK-24** write-hardening (P1/S) now; full IndexedDB migration
> deferred/conditional (not carded; honours the "wasted migration" caution).
> INS-5 left **◐**: one 60-second live bytes/record confirmation remains
> (non-blocking). Corrected the decision-rule's stale "open FK-17 (IndexedDB)"
> ID-collision → the spawned card is **FK-24**. FK-21 (draft persistence v2) lands
> after FK-24 and routes through the same `safeSetItem` seam. **All implementation
> (FK-23, FK-24) belongs in a feature worktree → main via PR, not frosty-babbage.**

> **3.2 KICKOFF EXECUTED 2026-06-13 (planning/inspection only, frosty-babbage).**
> INS-6 run → **☑**. `rubric_version_hash` is computed **once at export** from the
> currently-loaded rubric (`_rubricHash(config)`, `moderation-export.js:120`) and
> written identically to every row (`:188`) — the cohort record stores **no** hash,
> so a mid-cohort rubric edit is invisible and mixed-version detection is impossible
> as built. Hash = 8-char djb2 over criteria names + weights + all five tier
> descriptors; `fk_version` = app version (`2.5.1`) not schema version
> (`modexport-v1`). **FK-11 verdict: ungated, takes the grow-to-M fork** — per-record
> stamping at mark/save time must land first (move `_rubricHash` to a shared home so
> `saveCurrentStudentToCohort` can call it), then export reads each record's stored
> hash (live-`_rubricHash` fallback for legacy/imported rows) and warns on mixed
> hashes. Doc-drift flagged at `docs/fk_moderation_export_v1.md:71` (cheap ride-along).
> FK-11 moved to Safe-to-implement. **Implementation belongs in a feature worktree →
> main via PR, not frosty-babbage.**

> **3.3 KICKOFF EXECUTED 2026-06-13 (planning/inspection only, frosty-babbage).**
> INS-7 run → **☑**. `js/cohort-insights.js` `cohortMetrics(config, students)` and
> `detectState(cohort, currentTutor)` are **pure functions exported on
> `window.CohortInsights`** — fully reusable in-flow, but the **only** in-app caller
> is `renderInsights` from the Cohort Insights modal (scorer.html:3104, always
> `currentTutor=''`), so the engine is destination-only *in practice, not by design*.
> `cohortMetrics` emits 23 cohort-level fields (spread/distribution: mean, min, max,
> SD, range, scale-use ratio, skew, kurtosis, bimodality, grade-band histogram, fail
> rate; behaviour: within-student SD, late/override counts, notes completion, feedback
> word counts; reliability: Cronbach α). **No standing per-criterion or per-tutor
> breakdown** — per-criterion rows are read but only folded into within-student SD and
> α, so the card's "criterion band histogram chip" example is the one signal **not**
> pre-computed (a cheap additive pass on rows already iterated). **FK-10/INS-5-style
> verdict: GO, ungated** — technical gate cleared, two scope forks travel to the
> feature worktree: (1) **indicator-source** — reuse an existing aggregate (S, no
> engine change) vs add per-criterion tally (M); (2) **dataset** — saved-cohort-only
> (trivial) vs live-augment with the in-progress `scoreResult` (touches recalculate).
> The anchoring product risk is **not** an inspection blocker — it rides as the card's
> existing DoD (behind a settings toggle, **default off**, self-pilot before any
> default-on); the "does an ambient signal help or cause anchoring" question is
> answerable only by that self-pilot. Free finding: `renderInsights`' hard-wired
> `currentTutor=''` makes the State-B per-tutor subset dead in the app today —
> per-tutor ambient signals would need that wiring first. FK-12 moved to
> Safe-to-implement. **Implementation belongs in a feature worktree → main via PR, not
> frosty-babbage.** **Phase-3 inspection sweep now complete (3.1/3.2/3.3 all run);
> next Phase-3 work is the INS-8 remainder → FK-13, plus the second promotion
> checkpoint.**

> **MERGE RECONCILIATION 2026-06-13 (post-INS-7 session).** Three Phase-3 implementation
> cards confirmed merged to main and moved to Shipped on the board: **FK-23** (Jest +
> lazy-load guard in CI) = **PR #35**; **FK-24** (storage write-hardening / `safeSetItem`)
> = **PR #36**; **FK-11** (rubric per-record version stamping + mixed-version warning) =
> **PR #37**. The `frosty-babbage` planning branch deliberately never pulls main's
> commits, so this was a planning-doc edit, not a merge. FK-12 (this session's card) is
> now the **only** open Safe-to-implement card. Carried residual: FK-11's doc-drift
> ride-along (`docs/fk_moderation_export_v1.md:71` — "order and maxima" is wrong) was
> **not** landed in PR #37; fold into the next moderation-touching PR (see BOARD residuals).

> **FK-25 SPLIT 2026-06-13 (post-implementation reconciliation).** A "FK-12" implementation
> session shipped **PR #39** — but what it built is a **rubric-version** drift indicator
> (`SA.detectRubricDrift`: ambient badge when the open cohort's per-record rubric stamp
> from FK-11 ≠ the loaded rubric), which is the *in-app surface of D-09*, **not** the
> FK-12 cohort-consistency/anchoring indicator (D-10) described on the board. The label
> was a misnomer. Reconciled (user-directed): carded the shipped feature as **FK-25 ·
> Rubric-version drift indicator → Shipped (PR #39)**; **FK-12 stays open** as the
> unbuilt consistency indicator. Decision map: **D-09 → FK-11 + FK-25** (both shipped);
> **D-10 → FK-12** (pending self-pilot). Next free card ID is now **FK-26**. The 3.3
> row below ("INS-7 → FK-12 drift indicator") still refers to the **consistency**
> indicator — unchanged and still open.

> **§3.4 KICKOFF EXECUTED 2026-06-13 (planning/inspection only, frosty-babbage).**
> INS-8 → FK-13. *(Numbering note: INS-8/FK-13 is formally the **Phase 4** "ARIA audit
> → card or drop" line, not a Phase-3 table row; it's run here at the Phase-3 close to
> finish the inspection sweep, so it's logged as §3.4 by sequence and the Phase-4 row
> is marked done below.)* INS-8 run → **☑**. Full ARIA grep + JS-setter read of
> scorer.html (54 ARIA occurrences): **Q1 — validation is per-widget but the divergence
> is deliberate.** `#grade-override` signals a HARD invalid (not-in-scale →
> `aria-invalid='true'`, `_renderOverrideStatus` scorer.html:1788–1815); the
> per-criterion `override-<i>` inputs treat out-of-band as a SOFT warning (`.out-of-band`
> class only, `aria-invalid` forced `'false'`, 1916–1931) — **that is the very commit
> FK-13 was named after**; flattening the two into one model would be a regression.
> **Q2 — focus-mode nav IS announced** (`#focus-live` sr-only/polite, 570 → 2256–2260)
> **but the recomputed score is NOT** (`weighted-total-cell`/`penalised-score-display`
> are plain `.textContent`, 1949/1952, outside any live region) ⇒ a screen-reader marker
> changing a grade hears nothing about the result — **WCAG 2.1 AA 4.1.3 Status Messages**
> gap. **Verdict: SPLIT.** Drop the "centralize all ARIA" framing (the per-widget tuning
> is intentional); fold the validation-*model* centralization into **FK-15** (override
> inputs already on its DOM-as-state seam, INS-3); **rescope FK-13** from "centralization
> audit" to **"add a score-result aria-live region + document the hard-invalid/soft-warn
> convention"** (S, P2, additive, independently testable). FK-13 moved Needs-inspection →
> Safe-to-implement; **Needs-inspection column now empty.** INS-8 spawned no new card
> (next free ID was FK-25 at the time — since used for the rubric-version drift
> indicator split, so the next free ID is now **FK-26**; see the FK-25 SPLIT note above).
> **Phase-3 inspection sweep complete: INS-5 ◐(non-blocking) · INS-6 ☑ · INS-7 ☑
> · INS-8 ☑.** **Implementation belongs in a feature worktree → main via PR, not
> frosty-babbage.**

## Phase 4 — Structural hygiene (amortized, runs alongside 2–3)
| Item | Notes |
|---|---|
| ~~FK-16 watch-task slice~~ | Pulled forward to Phase 0 (0.8) — scope change 2026-06-11 |
| FK-15 decomposition program | Gated on the bug-tagging validation (5 bugs tagged by cause); extract-on-contact policy |
| FK-16 styling migration policy | Freeze shared.css, shrink-on-touch |
| FK-13/INS-8 ARIA audit → card or drop | **✅ INS-8 ☑ 2026-06-13 (§3.4 kickoff above).** Verdict: neither pure "drop" nor "centralize" — **rescoped** to a score-result `aria-live` region (WCAG 4.1.3) + a validation-convention note; per-widget hard/soft `aria-invalid` split is intentional; validation-model centralization folded into FK-15. FK-13 now Safe-to-implement (S, P2). |

**Exit:** decomposition go/no-go decided from bug evidence; styling policy written; scorer.html line count trending down if program is on.

## Promotion checkpoint (after Phase 2, again after Phase 3)
Re-read planning/README.md promotion rule. Candidates for promotion at first checkpoint:
- FK-09 outcome → fk-decisions.md addendum (engine module + order-of-operations spec)
- FK-07 outcome → ROADMAP.md entry + PR notes
- Resolved INS findings worth keeping → fold into fk-project-overview.md, then prune here

> **✅ First checkpoint executed 2026-06-13** (the FK-20 session — see Phase 2
> block above). FK-09 had already been promoted early with its production
> verification (Addendum F.4, 2026-06-13); the checkpoint added Addendum G
> (FK-07/D-03, FK-14/D-04), the ROADMAP truth pass, and the snapshot refresh.
> Second checkpoint fires after Phase 3.

> **🟡 SECOND CHECKPOINT — PLANNED MILESTONE, NOT YET EXECUTED (queued after the
> INS-8/FK-13 kickoff, 2026-06-13).** Phase-3's inspection sweep is now complete
> (INS-5/6/7/8) and its three implementation cards shipped (FK-23 #35, FK-24 #36,
> FK-11 #37), so the second checkpoint is the next planning action. **Promotion set
> to fold (via a docs-promotion PR to main — NOT from frosty-babbage):**
> - **INS-5 findings** (localStorage capacity model + the unhandled-quota failure
>   mode) → `fk-project-overview.md`.
> - **FK-10 verdict** (GO-split: FK-24 shipped, IndexedDB deferred/conditional) →
>   a `fk-decisions.md` **addendum** (next free addendum letter after G = **H**;
>   keep planning D-numbers out of it per the ID-hazard rule).
> - Candidates also worth a line if kept: INS-6→FK-11 (rubric-hash provenance) and
>   INS-7→FK-12 (cohort-insights engine is the reusable metrics surface), INS-8→FK-13
>   (deliberate hard/soft validation convention). Then prune the folded INS findings
>   from INSPECTION.md and refresh the `docs/planning-202606/` snapshot.
> - **One open item before/with the checkpoint:** the INS-5 live bytes/record console
>   check (flips INS-5 ◐→☑; non-blocking — the FK-10 verdict stands regardless).
> Sequencing: do this checkpoint as its own session/PR; FK-12 + FK-13 implementation
> happen in feature worktrees independently of it.

## Explicit non-goals (re-affirmed from assessment)
- No framework adoption (React/Vue) — no-framework constraint serves privacy/portability.
- No accounts/backend — local-first is the moat.
- No wording-assistant expansion before FK-07 lands.
- No big-bang rewrite of scorer.html.
