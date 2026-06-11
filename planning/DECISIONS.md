# Draft Decision Register (pre-ADR)

Working register. Entries here are **provisional** — promote to fk-decisions.md (with
proper ADR numbering/countersign flow) only after the listed validation step has run
and its outcome is recorded. Status: ☐ Open · ◐ Validation run · ☑ Ready to promote · ✕ Reversed

---

## D-01 ☐ Test the scoring engine before any feature work
- **Why it matters:** Grade arithmetic is the product's licence to exist; a bug ships wrong grades to transcripts.
- **Evidence:** O — shared.test.js covers only AI-wording QA; D5 rounding-drift math is non-trivial; penalty/rounding handlers inline in monolith.
- **Depends on assumption:** the math is extractable/testable without behavior change.
- **Risk if wrong:** low — worst case is a regression net around already-correct code.
- **First validation step:** run FK-01 today; count surprises in INS-4.
- **Outcome:** _(pending)_

## D-02 ☐ De-letter vs re-letter the section badges
- **Why it matters:** FK-02 needs a direction; letters keep decaying as sections evolve (B and D already gone).
- **Evidence:** O — current mismatch is the second drift (focus mode replaced B·Rubric).
- **Depends on assumption:** letters carry no load-bearing references in exports/docs/how-to page.
- **Risk if wrong:** broken cross-references in how-to-feedback-kitchen.html / README.
- **First validation step:** `grep -rn "A · Student\|B · Rubric\|C · Penalty" *.html *.md` to find every letter reference before choosing.
- **Leaning:** de-letter (plain names) — letters re-decay on every structural change; names don't.
- **Outcome:** _(pending)_

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
