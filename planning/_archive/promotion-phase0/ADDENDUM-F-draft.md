# DRAFT — Addendum F for fk-decisions.md

> Drop this section into fk-decisions.md under "Addenda". Do NOT title it
> "Phase 0" bare — fk-decisions.md's own header already means the CD project's
> Phase 0, which is a different programme. Addenda A–E are taken; F is next free.
> No new global D-numbers: subsections are addendum-scoped (F.1–F.3) and cite
> the planning register IDs explicitly.

---

## Addendum F — Improvement-programme Phase 0 decisions (2026-06)

**Track:** 2026-06 architecture-assessment improvement programme (planning
worktree board) — distinct from the CD-project "Phase 0" this document's title
refers to. Planning trail snapshot: `docs/planning-202606/` (DECISIONS.md,
BOARD.md, INSPECTION.md).
**Status:** recorded, solo-maintainer track. Each decision below ran its
planning-register validation step before promotion; outcomes are quoted.

### F.1 — Characterise the scoring functions before any feature work *(planning D-01)*

**Decision.** Grade arithmetic gets a characterization-test net before any
behavioural change ships. Tests assert what the code *does*, not what it
should do; surprises are ledgered (planning INS-4) and triaged — never fixed
inside the test commit.

**Rationale.** Grade arithmetic is the product's licence to exist; until this
programme, the Jest suite covered only AI-wording post-processing — zero
score-math tests.

**Validation outcome (2026-06-11).** `js/score-grade.test.js`: 75 tests over
`scoreToGrade` / `scoreToGradeFromScale` — every NZ band boundary (floor,
±0.01), custom scales (shuffled, sparse, floored), malformed input. All passed
on first run; **zero source changes needed** (both functions were already
exported). Five surprises ledgered (INS-4 S-1…S-5): one latent crash
(empty/null gradeScale → TypeError, unreachable in normal flow), four
intended/benign coercion behaviours. None affect normal-path correctness.
Suite 98/98.

**Consequences.** FK-09 (engine boundary hardening) inherits the S-1/S-4/S-5
guard decisions as interface-contract items. The no-silent-fixes rule is
standing policy for future characterization work.

**Refs.** planning D-01 · FK-01 · INS-3, INS-4 · commit `cec854b`.

### F.2 — De-letter sections and navigation *(planning D-02)*

**Decision.** Section identity is the plain name ("Student", "Rubric scores",
"Penalty & grade override", …). The A–G letter badges are removed from step
badges, onboarding banner, nav rail, and the letter-keyed CSS hooks
(`data-rail` re-keyed to section slugs). Letters do not return.

**Rationale.** Letters re-decay on every structural change — observed twice
before the decision (focus mode replaced B·Rubric; the page carried a
*duplicate F*: wording assistant and Finish) and the onboarding banner taught
sections that no longer matched. Names don't decay.

**Validation outcome (2026-06-11).** Repo-wide grep: letter references were
confined to scorer.html (plus one stale REVIEW.md checklist); the how-to page
and README carried no load-bearing letters. One load-bearing code reference —
focus-mode CSS hiding rail entries by letter — was re-keyed to slugs *before*
markup changes. Landed with FK-02/FK-03; runtime-validated (focus enter/exit,
rail, banner); a11y baseline diff clean (one pre-existing violation removed).

**Consequences.** brand-voice-canon.md gained §7 (UI control casing: sentence
case). FK-05's reorder no longer interacts with navigation labelling.

**Refs.** planning D-02 · FK-02, FK-03 · INS-9 · commit `f1cc122`.

### F.3 — Reorder sections to the marking task sequence *(planning D-05)*

**Decision.** Page order follows the marker's task order: Student → Rubric /
Focus marking → Penalty & grade override → Feedback draft → Notes → Finish →
Cohort. Penalty/override no longer renders above the marking blocks.

**Rationale.** Marker task order is score-then-penalise; the old layout forced
a per-student visual skip and put override UI in view before grading (anchoring
risk).

**Validation outcome (2026-06-11).** Pre-flight inspection (planning INS-9)
found zero positional DOM lookups — focus navigation is criterion-indexed and
order-independent — so the move was a markup splice plus banner re-match; the
rail was already in target order. Runtime battery (focus nav, expand/collapse-
all, penalty → recalculate → sticky bar) and a11y baseline diff clean.

**Consequences.** Section order is confirmed non-load-bearing; future reorders
need only the INS-9 grep set re-run as a guard.

**Refs.** planning D-05 · FK-05 · INS-9, INS-3 · commit `3b6e286`.
