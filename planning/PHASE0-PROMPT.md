# Phase 0 Kickoff Prompt (refined 2026-06-11)

Reviewed against BOARD.md / ROADMAP-PHASES.md / INSPECTION.md / DECISIONS.md.
Key changes from draft: scope contradiction with ROADMAP Phase 0 resolved via an
explicit pull-forward instruction; D-02 dependency added to FK-02; edit boundaries
clarified (planning/ editable, code spec-only); FK-09 removed from commit example;
known code anchors supplied.

---

You are working inside a dedicated Git worktree planning workspace for Feedback
Kitchen (FK). This worktree has internal planning artefacts under `planning/` that
are not yet pushed to GitHub and are the single source of truth for planning.

## Planning context (do not re-invent)

Use and respect these existing files:

- `planning/BOARD.md` — FK-01…FK-16 cards; columns: Backlog, Needs inspection,
  Safe to implement now, In progress, Validate in runtime, Ready to document.
- `planning/INSPECTION.md` — INS-1…INS-9 items, each with "Where to look",
  "Questions", findings slots, and status markers (☐ Open · ◐ Partial · ☑ Resolved).
- `planning/ROADMAP-PHASES.md` — Phases 0–4 and their exit gates.
- `planning/DECISIONS.md` — D-01…D-10 draft decision register with validation steps.
- `planning/README.md` — workspace rules and promotion criteria.

Do not create new planning structures outside `planning/`. Update these artefacts;
don't duplicate them.

## Edit boundaries for this session

- You MAY edit files under `planning/` directly (board columns, inspection findings,
  decision outcomes, roadmap wording).
- You MUST NOT edit code, tests, styles, or build config in this session
  (scorer.html, js/*, css/*, package.json). For those, produce implementation specs
  only — implementation happens in follow-up commits per card.

## Phase 0 scope — with explicit pull-forward

ROADMAP-PHASES.md currently defines Phase 0 as: FK-01, FK-02 (+FK-03 rider), and
inspections INS-3 + INS-9. This session deliberately PULLS FORWARD the remaining
Safe-to-implement-now items — FK-04, FK-05, FK-06, and the FK-16 watch-task slice —
into an expanded Phase 0, because their evidence basis requires no inspection
outcome (FK-05's INS-9 pre-flight is its own first step, not a blocker).

First action of the session: record this pull-forward in ROADMAP-PHASES.md
(amend the Phase 0 table and exit criteria; note that Phase 1 loses items 1.1/1.2)
so the artefacts stay internally consistent.

Phase-0 (expanded) cards:

- FK-01 — Characterization tests for `scoreToGrade` / `scoreToGradeFromScale`
- FK-02 — Fix section-lettering vs onboarding-banner mismatch
  — **depends on resolving D-02 first** (de-letter vs re-letter; see below)
- FK-03 — Copy/casing consistency pass ("New Student" vs "New student"; consult
  `brand-voice-canon.md` for the casing rule)
- FK-04 — Non-color signal + legend for yellow "awaiting input" fields
- FK-05 — Reorder sections to task sequence
  (Student → Marking/Focus → Penalty → Notes → Finish → Cohort)
- FK-06 — Demote + guard Clear Cohort; group cohort actions visually
  (the "Moderation Export…"/"Export for Moderation" pair stays untouched — gated on INS-2)
- FK-16 (watch-task slice only) — wire `build:css --watch` into the dev workflow;
  no styling migration

Decision to resolve in-session:

- D-02 (DECISIONS.md) — de-letter vs re-letter. Run its validation step first:
  `grep -rn "A · Student\|B · Rubric\|C · Penalty\|D · Feedback\|E · Notes" *.html *.md`
  to find every letter reference (including how-to-feedback-kitchen.html and README).
  Record the outcome in DECISIONS.md; FK-02's spec must follow the chosen direction.

Relevant inspections:

- INS-3 — Map the scoring calculation surface in scorer.html. Gates FK-09 (Phase 2).
  Runs alongside FK-01; FK-01 does NOT wait for it.
- INS-4 — Characterization-test surprises ledger. Collects unexpected behavior found
  while writing FK-01 tests. Rule: no silent fixes inside the FK-01 work — surprises
  are recorded and triaged, never quietly corrected in the same change.
- INS-9 — Pre-flight for FK-05: find positional/DOM-anchored section lookups.

Known code anchors (from the 2026-06-11 assessment — verify, don't trust blindly):

- `scoreToGrade` js/shared.js:158 · `scoreToGradeFromScale` js/shared.js:167
  (call-site cluster js/shared.js:394–726)
- `onPenaltyChange` scorer.html:1824
- `cloneScoreResultForStorage` scorer.html:~2585
- `highlightRoundingBtn` / `setRounding` scorer.html:~3153–3185
- Existing test harness: jest.config.js + js/shared.test.js (currently covers only
  AI-wording post-processing/validation — zero score-math tests)
- scorer.html: 4,975 lines, 20 inline script blocks, 261 function declarations

Out of scope this session: Phase-1+ design (queue/FK-07, engine extraction/FK-09
implementation, storage/FK-10, drift/FK-12, full styling consolidation/FK-16) beyond
what is needed to execute Phase-0 cards safely.

## What to produce

Implementation-ready guidance and planning-file updates, not new planning theory.

### 1. Phase 0 focus recap
3–5 bullets restating expanded Phase 0 using the IDs above.

### 2. Per-card implementation specs
For each of FK-01, FK-02, FK-03, FK-04, FK-05, FK-06, FK-16-slice:

- **Summary** (1–2 sentences).
- **Files and areas to touch** (specific files; line anchors where known).
- **Concrete steps** (3–8, code-level, ordered).
- **Test strategy:**
  - FK-01: enumerate the characterization tests — every grade-band boundary for both
    functions and both scale variants, malformed/edge inputs (null, NaN, negative,
    >100, non-numeric strings, boundary values exactly on band edges) — and state
    that surprises go to INS-4.
  - UI cards: regression checks — existing screenshot/a11y harness
    (bbp-a11y-tests.mjs / run-bbp-a11y.sh) where applicable, plus manual runtime
    checks (focus-mode Previous/Next/Exit, nav strip, expand/collapse-all, cohort
    actions) in the dev server.
- **Risks & mitigations** (FK-05: index-anchored focus-nav breakage per INS-9;
  FK-06: unknown current Clear Cohort confirm behavior; FK-04: the meaning of
  yellow is Inferred — confirm while implementing).
- **Commit message pattern** with IDs, e.g.:
  - `FK-01 INS-4: add characterization tests for scoreToGrade`
  - `FK-05 INS-9: reorder sections to task sequence; de-anchor positional lookups`

Label each card block so pieces can be copied into BOARD.md or commit messages.

### 3. INS-3 / INS-4 / INS-9 execution playbook
- INS-3: stepwise checklist from its "Where to look" + "Questions"; a findings
  template to paste into INSPECTION.md; explicit note that inspection changes no
  code and that findings shape FK-09's eventual module boundary (Phase 2), not
  FK-01.
- INS-4: a bullet template for recording each surprise (input → expected → actual →
  suspected cause → triage: bug / intended / unclear); restate the no-silent-fixes
  rule operationally (test the behavior AS IS; file the surprise; fix in a separate
  commit only after triage).
- INS-9: exact grep patterns for positional lookups in scorer.html, e.g.:
  - `grep -n "children\[" scorer.html`
  - `grep -n "nextElementSibling\|previousElementSibling" scorer.html`
  - `grep -n "querySelector.*section\|closest(" scorer.html`
  - `grep -in "textContent.*===\|headerText\|matchHeader" scorer.html`
  plus how to record hazards and feed them into FK-05's steps.

Output for this section must be copy-pastable into INSPECTION.md as expanded
checklists; better, apply it to INSPECTION.md directly (allowed — it's planning/).

### 4. Phase-0 definition of done
A checklist expressed only in FK-/INS-/D- IDs, aligned with the EXPANDED scope, and
written back into ROADMAP-PHASES.md's Phase 0 exit criteria. Must include at
minimum: FK-01 tests green and committed; INS-4 populated (or explicitly empty);
D-02 resolved and FK-02/FK-03 landed consistent with it; INS-9 findings recorded
and FK-05 runtime-validated; FK-06 guard verified in runtime; FK-16 watch task
running; INS-3 status ☑ with findings.

### 5. Suggested planning-file updates
Propose (or directly apply) small edits to BOARD.md card DoDs, INSPECTION.md
findings sections, ROADMAP-PHASES.md Phase-0 wording, or README.md promotion rules.
When proposing rather than applying, quote the existing heading and show the exact
lines to add.

## Constraints and style

- Respect the Observed / Inferred / Unknown evidence model. Do not upgrade
  confidence without new evidence; mark any step that depends on an inspection or
  decision outcome (FK-05 ← INS-9; FK-02 ← D-02).
- Board hygiene: when work on a card starts, move it to In progress in BOARD.md;
  after runtime checks, to Validate in runtime / Ready to document per README.md.
- No GitHub issues, PR descriptions, or ADRs yet — everything stays in this
  worktree and `planning/`.
- Write for a single developer who knows FK well; plain, direct, tight.

Start your response with section heading:
1. Phase 0 focus recap
