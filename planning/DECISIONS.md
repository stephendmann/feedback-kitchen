# Draft Decision Register (pre-ADR)

Working register. Entries here are **provisional** — promote to fk-decisions.md (with
proper ADR numbering/countersign flow) only after the listed validation step has run
and its outcome is recorded. Status: ☐ Open · ◐ Validation run · ☑ Ready to promote · ✕ Reversed

---

## D-01 ◐ Test the scoring engine before any feature work
- **Why it matters:** Grade arithmetic is the product's licence to exist; a bug ships wrong grades to transcripts.
- **Evidence:** O — shared.test.js covers only AI-wording QA; D5 rounding-drift math is non-trivial; penalty/rounding handlers inline in monolith.
- **Depends on assumption:** the math is extractable/testable without behavior change.
- **Risk if wrong:** low — worst case is a regression net around already-correct code.
- **First validation step:** run FK-01 today; count surprises in INS-4.
- **Outcome:** **Validation run 2026-06-11.** FK-01 implemented (`js/score-grade.test.js`, 75 characterization tests, suite 98/98 green). Surprise count: **5** (INS-4 S-1…S-5) — one latent crash (empty/null scale, unreachable in normal flow), four benign/intended coercion or boundary behaviours. **No surprises affect grade correctness on the normal path** — the assumption "math is testable without behavior change" held; zero source changes were needed (both functions were already exported). Decision validated; promote alongside FK-09's ADR.

## D-02 ◐ De-letter vs re-letter the section badges
- **Why it matters:** FK-02 needs a direction; letters keep decaying as sections evolve (B and D already gone).
- **Evidence:** O — current mismatch is the second drift (focus mode replaced B·Rubric).
- **Depends on assumption:** letters carry no load-bearing references in exports/docs/how-to page.
- **Risk if wrong:** broken cross-references in how-to-feedback-kitchen.html / README.
- **First validation step:** `grep -rn "A · Student\|B · Rubric\|C · Penalty" *.html *.md` to find every letter reference before choosing.
- **Leaning:** de-letter (plain names) — letters re-decay on every structural change; names don't.
- **Outcome:** **Decided 2026-06-11 — DE-LETTER.** Validation grep run across *.html *.md (worktree-wide). Findings:
  - Letter references are confined to scorer.html itself: onboarding banner (lines 344–348, teaches A–E only), nav rail (427–434: A, B, ◎, C, D, E, F, G), step-badges (465, 498, 547, 610, 705, 869, 883, 1115, 1139), title text at 612, comments at 126/1234/2168, JS rail label at 2757–2764.
  - **Letters have already decayed twice more than BOARD.md records:** the page now has a *duplicate F* — "F · Feedback wording assistant" (883, amber badge) and "F · Finish" (1115, green badge) — and a non-letter "◎ Focus marking" badge (610).
  - **One load-bearing letter reference in code:** focus-mode CSS hides rail entries by letter — `[data-rail="B"], [data-rail="D"]` (120) and dims `[data-rail="C"/"E"/"F"/"G"]` (121–122). De-lettering must re-key these selectors to hrefs/ids (FK-02 spec step).
  - how-to-feedback-kitchen.html: **zero** section-letter references (its "A+ → D" strings are grade scales, not sections). README.md: two "Section F" references (164, 231 — both mean the wording assistant); reword during FK-02. REVIEW.md:21 has a stale rail checklist (says "C · Adjustments") — update or delete.
  - `_snapshots/` hits are frozen history; ignore.
  - Risk assumption held: no letter references in exports/docs that would break. De-letter is safe.
  - Promote to ☑ once FK-02 lands consistent with this and passes Validate in runtime.

## D-03 ☐ Build the class-list queue (workbench model)
- **Why it matters:** biggest workflow gap vs ideal; cohort invisible during marking.
- **Evidence:** O — single-record UI; U — record round-trip.
- **Depends on assumption:** records can be made re-loadable from the cohort store.
- **Risk if wrong:** large effort misdirected if a hidden re-edit path exists, or store rework underestimated.
- **First validation step:** INS-1.
- **Outcome:** _(pending)_

## D-04 ☐ Persistent draft pane in focus mode
- **Why it matters:** student-facing artifact accumulates unseen; errors caught only at Copy time.
- **Evidence:** O — draft behind "Open full draft". Impact unmeasured.
- **Depends on assumption:** markers don't habitually open the draft anyway; pane doesn't defeat focus mode's noise-reduction purpose.
- **Risk if wrong:** screen-space cost for no gain; undermines a freshly-shipped feature.
- **First validation step:** prototype collapsed pane; self-test a full 5-criterion mark on the demo scorer; record notes.
- **Outcome:** _(pending)_

## D-05 ☐ Reorder sections to task sequence
- **Why it matters:** per-student friction; override UI before grading invites anchoring.
- **Evidence:** O — current order A, C, Focus.
- **Depends on assumption:** section order isn't load-bearing for index-anchored lookups.
- **Risk if wrong:** breaking focus-mode nav (known fragility class).
- **First validation step:** INS-9 grep before moving anything.
- **Outcome:** _(pending)_

## D-06 ☐ Consolidate cohort actions; isolate destructive
- **Why it matters:** mis-click risk on Clear Cohort; 8 peer buttons.
- **Evidence:** O — button row. U — moderation pair semantics.
- **Depends on assumption:** the moderation pair is partially redundant.
- **Risk if wrong:** hiding a step moderators rely on.
- **First validation step:** INS-2 (read both handlers + moderation doc).
- **Outcome:** _(pending)_

## D-07 ☐ Incremental decomposition of scorer.html (strangler-fig, no rewrite)
- **Why it matters:** DOM/text-anchored coupling has already produced a hardening fix; 261 functions share one scope.
- **Evidence:** O — structure; one coupling-bug commit (thin trend evidence).
- **Depends on assumption:** coupling-related defects will recur.
- **Risk if wrong:** refactor churn with no user-visible payoff.
- **First validation step:** tag the next ~5 scorer bugs by root cause; proceed broadly only if ≥2 are coupling-related. (FK-09 extraction proceeds regardless — it's justified by D-01, not this.)
- **Outcome:** _(pending)_

## D-08 ☐ Measure before migrating off localStorage
- **Why it matters:** avoids a heavy migration on an unquantified risk — and avoids dismissing a real data-loss risk.
- **Evidence:** O — localStorage-only (0 IndexedDB hits); U — payload sizes, quota handling.
- **Depends on assumption:** realistic cohorts might approach quota (to be measured, not assumed).
- **Risk if wrong:** premature migration (wasted) or real marker data loss (severe).
- **First validation step:** INS-5 measurement + decision rule.
- **Outcome:** _(pending)_

## D-09 ☐ Surface rubric-version warnings at export
- **Why it matters:** mixed-version cohorts silently break comparability at moderation.
- **Evidence:** O — `rubric_version_hash` exists in moderation schema.
- **Depends on assumption:** hash is (or can be) stamped per record at mark time.
- **Risk if wrong:** warning is meaningless if computed once at export.
- **First validation step:** INS-6.
- **Outcome:** _(pending)_

## D-10 ☐ Ambient drift indicators — pilot behind a toggle, default off
- **Why it matters:** consistency is a stated product goal; signals are currently destination-only.
- **Evidence:** O — insights module exists separately. Benefit assumption is literature-based, untested here.
- **Depends on assumption:** ambient signals improve consistency without biasing markers toward the mean.
- **Risk if wrong:** the feature *causes* anchoring/regression-to-mean marking — worse than absence. Hence toggle + default-off + self-pilot.
- **First validation step:** INS-7, then one indicator (criterion band histogram) self-piloted across a demo cohort.
- **Outcome:** _(pending)_
