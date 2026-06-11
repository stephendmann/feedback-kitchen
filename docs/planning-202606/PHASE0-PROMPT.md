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

## Phase 0 scope

The scope below matches ROADMAP-PHASES.md exactly — the pull-forward of FK-04,
FK-05, FK-06, and the FK-16 watch-task slice into Phase 0 was reconciled and
recorded in the roadmap artefact on 2026-06-11 (see the scope-change note under
Phase 0 there). No further roadmap amendment is needed; follow the Phase 0 table
(items 0.1–0.8) and its exit criteria as written.

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
The authoritative DoD is ROADMAP-PHASES.md's Phase 0 exit criteria (already written
during the 2026-06-11 reconciliation). Restate it here as a checklist in FK-/INS-/D-
IDs, and flag any gap or contradiction you find between those exit criteria and the
per-card DoDs in BOARD.md — propose the fix rather than silently diverging.

### 5. Suggested planning-file updates
Propose (or directly apply) small edits to BOARD.md card DoDs, INSPECTION.md
findings sections, ROADMAP-PHASES.md Phase-0 wording, or README.md promotion rules.
When proposing rather than applying, quote the existing heading and show the exact
lines to add.

### 6. End-of-session planning update summary (mandatory)
Before ending the session, verify the items you actually worked on still match the
Phase 0 table (0.1–0.8) in ROADMAP-PHASES.md — if any mismatch emerged mid-session,
stop and report it rather than papering over it. Then produce a summary with exactly
these sections (this is a planning/recording step — change no code or tests while
producing it):

1. **Planning artefacts touched** — every file under `planning/` updated or needing
   update (BOARD.md, INSPECTION.md, ROADMAP-PHASES.md, DECISIONS.md,
   PHASE0-PROMPT.md). For edits you already applied directly (allowed for
   `planning/`), report what changed. For any edits NOT applied, show the exact
   lines to add/change so they can be pasted in manually.
2. **Status changes** — every FK-, INS-, and D- ID whose status changed this
   session, with the new status (e.g. FK-01 → Validate in runtime,
   INS-3 → ☑ Resolved, D-02 → Decided: de-letter). BOARD.md columns and
   INSPECTION.md/DECISIONS.md status markers must already reflect these.
3. **Still blocked** — every FK-/INS- item that remains blocked and on what
   (e.g. FK-09 blocked on INS-3 findings review; FK-08 blocked on INS-2).
4. **Ready for promotion?** — state explicitly whether Phase 0's exit criteria in
   ROADMAP-PHASES.md are now satisfied. If not, list each unmet criterion verbatim
   with what remains to be done.

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
