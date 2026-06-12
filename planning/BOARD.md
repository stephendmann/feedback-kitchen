# FK Improvement Board

Working board. Card IDs are stable — refer to them in commits/notes as `[FK-xx]`.
Evidence types: **O** = Observed (screenshot/repo), **I** = Inferred, **U** = Unknown.
Inspection refs point to `INSPECTION.md` items (INS-x).

Column counts (2026-06-12, post-Phase-1): Safe to implement now: 3 (FK-07, FK-08, FK-09) · Needs inspection: 4 · Backlog: 3 · Shipped: 9 · others: 0

> Board pruned 2026-06-12 at the Phase-1 refresh: shipped cards are one-line
> tombstones in **Shipped** below. Full card history: git log of this file and
> `docs/planning-202606/` on main.

---

## Safe to implement now

### FK-07 · Record re-entry + cohort queue (the workbench upgrade)
- **Rationale:** Largest workflow gap vs ideal: no visible way to re-open a saved record or work a cohort as a queue. Converts "form you reset" into "workbench you work through".
- **Rescoped 2026-06-12 per INS-1 ☑ — the fork landed between its two arms, on the cheap side.** No re-edit path exists anywhere (View list offers only Remove; zero loader functions), **but** the store needs no rework: records are full-fidelity (per-criterion `grades` incl. overrides, full `scoreResult` clone with rows + override audit, `feedbackText`, `markerNotes`, `penaltyIdx`) and re-saving **updates in place** keyed `sid:<studentId>` (fallback `name:<name>`) — live-verified (`replaced:true`, count stable). The missing piece is purely UI + one inverse function.
- **Scope (core):**
  1. `loadCohortRecordIntoSession(key)` — inverse of `saveCurrentStudentToCohort`: restore name/ID/tutor/date inputs, `studentGrades` + per-row grade selects and override inputs, penalty select, feedback textarea, marker notes; then `recalculate()` and assert displayed totals match the stored `scoreResult`.
  2. "Open" action on each View-list row (rows already show grade · score · savedAt — that's the per-student status).
  3. Unsaved-work guard: opening a record while the current session has ungraded→graded changes must confirm first.
- **Scope (stretch — SUPERSEDED 2026-06-12):** ~~paste/import a class list to pre-seed the queue~~ → absorbed by **FK-19** (Moodle worksheet round-trip); the Moodle import *is* the class-list import with a real format and key. Don't build a generic paste path separately.
- **Known edges (record, handle, or ledger to INS-4 during build):** `penaltyIdx` is positional — config penalty edits between save and load can shift meaning; key fallback means renaming a no-ID student creates a sibling record rather than updating; feedback-draft restore guard (scorer.html ~1244) interplay; `focusIdx` reset on load.
- **Queue-design facts from INS-10 (design Moodle-aware now, at zero cost):** rosters arrive with **No-submission rows** (queue needs a distinct non-markable state) and possibly **already-graded rows**; the durable student key is the 7-digit `sid:` (Moodle `ID number`), with a per-course `moodleIdentifier` riding alongside when FK-19 lands.
- **Evidence:** O — INS-1 findings + live probes (INSPECTION.md).
- **Dependencies:** INS-1 ✓. **Risk:** Medium (was High-if-blind) — store risk eliminated; remaining risk is session-restore completeness.
- **DoD:** from View list, marker can open any saved record into the session (all fields restored; recalculated totals match stored), edit, re-save → updates in place (no duplicate row, live-verified), re-export reflects the edit; unsaved-work guard confirmed in runtime; focus mode works on a loaded record; full runtime battery + scrolled-pin check; surprises → INS-4.
- **Column:** Safe to implement now. **Priority:** P1 (Phase-2 centerpiece). **Effort:** M (was M–L fork).

### FK-08 · Moderation-export pair: copy/affordance polish (consolidation OFF the table)
- **Rescoped 2026-06-12 per INS-2 ☑ — the pair is configure-vs-run by design, not duplication.** "Moderation Export…" opens the lecturer opt-in/settings modal (always visible; **already self-relabels to "Moderation Export settings…" when enabled**); "Export for Moderation" generates the privacy-reduced workbook (hidden unless opted in; blocks below COHORT_MIN_N=15 — live-verified); "Disable mod-export" is a confirm-guarded opt-out (hidden unless enabled). Suppression is the in-export privacy engine (row shuffle, R-labels, thresholds), not a UI state. **Do not consolidate** — the original "hiding a step moderators rely on" risk is real and the lifecycle split is correct.
- **Remaining scope (small):**
  1. Copy polish: "Disable mod-export" → sentence-cased, self-explanatory label (canon §7); title-text pass over the trio so each states its lifecycle role.
  2. Doc cross-check: `docs/fk_moderation_export_v1.md` matches observed behaviour (two-export model, min-N block, settings relabel).
  3. **Optional (recommended):** an inline hint in the settings modal about identifier-tuple sensitivity — changing the cohort label / course name / assessment title silently reverts the UI to not-opted-in (`_activeOptInRecord` matches on the slug tuple; scorer.html ~2901–2925). Looks like lost settings to a lecturer; one sentence of UI copy defuses it.
- **Evidence:** O — INS-2 findings, handlers read, state machine + min-N gate live-verified.
- **Dependencies:** INS-2 ✓. **Risk:** Low (was Medium — consolidation is off the table, so nothing can be hidden).
- **DoD:** labels distinct and self-describing in both states (runtime check both states); doc page matches behaviour; identifier-sensitivity hint decision recorded (added or explicitly declined).
- **Column:** Safe to implement now. **Priority:** P2 (was P1 — premise mostly already shipped). **Effort:** S.

### FK-09 · Harden the scoring-engine boundary (test what's extracted; wrap the DOM glue)
- **Rationale (rescoped 2026-06-11 per INS-3 ☑):** ~~the high-stakes arithmetic lives inline in the monolith~~ — INS-3 found the arithmetic core **already lives in shared.js as pure functions** (`computeScores` :325, `applyGradeOverride` :194, `scoreToGrade[FromScale]` :158/:167, `formatScore` :1188 — no DOM, no storage). What remains inline in scorer.html is orchestration: `recalculate()` reads two authoritative inputs *from the DOM* (`#grade-override` letter, `#late-penalty-select` index) and fans results out to ~20 DOM writes. FK-09 is therefore: (a) add input-validation guards at the engine boundary (INS-4 S-1 empty-scale crash, S-4 string tolerance decision, S-5 no-cap contract); (b) lift the DOM-read glue into a thin explicit-args adapter so the pipeline is callable headless; (c) edge-case test suite over the existing engine. Rounding mode is an **engine input**, not a view preference (INS-4 S-6).
- **Evidence:** O — INS-3 findings (caller table, state inventory, DOM-as-state note, two-rounding-systems doc) in INSPECTION.md.
- **Dependencies:** FK-01 ✓ (regression net in place); INS-3 ✓.
- **Risk:** Low-Medium (down from Medium) — no verbatim-extraction step for the core remains; behaviour-change risk now concentrated in the adapter lift and the guard semantics (guards change S-1/S-4 behaviour deliberately, each in its own commit with the characterization tests updated alongside).
- **DoD:** engine boundary takes explicit args (no DOM reads in the score path); guards added with tests; characterization suite green pre/post; edge-case tests added (override × penalty × each rounding mode); no behavior diff in dev server on the demo scorer. ~~Flag: D5 ±1 drift tests~~ — **decided at kickoff 2026-06-12: DROPPED formally.** Rationale: INS-3 Q4 established the D5 redistribution math exists only in the CD-side rubric-editor preview component, absent from this repo; a test here would test nothing. If that component ever integrates, its own card carries the property tests (note to add at integration time).
- **Guard contracts decided at kickoff (per review):** S-1 → **fall back to NZ default thresholds** on empty/null/invalid gradeScale (matches computeScores' fallback philosophy; never bricks a marking session; auditable via function comment + dedicated tests). S-4 → explicit `Number()` coercion, non-finite ⇒ bottom grade (deterministic boundary handling; behaviour-identical for every existing characterization case). S-5 → no-cap documented as caller's contract, no behaviour change.
- **Done 2026-06-12 (four commits):** `2748323` S-1 guard (invalid scale → NZ-defaults fallback; the two TypeError characterization tests replaced in the same commit) · `07686c1` S-4/S-5 (explicit `Number()` coercion, non-finite → bottom grade; one deliberate tightening asserted in tests: Infinity was top-grade, garbage now always bottoms; no-cap contract documented) · `9e13386` `readScoringInputs()` boundary adapter (single DOM-read site; recalc + cohort-save both consume it) · `a8372ee` headless edge suite (40 tests: rounding modes incl. rounded-row summation proof, penalties, snap-up-only override with deduction preservation, 24-case invariant matrix).
- **Validated:** Jest **140/140** (was 98); demo-scorer fixture case identical pre/post (A/B/C/B/A + crit-3 override 58 + 2-day penalty + letter-override B → 80.4 / 60.4 / B, rows [23.1, 15.9, 11.6, 15.9, 13.9]); no other characterization test needed changing (the referee held); runtime battery green incl. scrolled-pin; harness 0 violations; console clean. One test-authoring error caught by the engine (59.5 bands C not C+ — test fixed, engine right).
- **Column:** Ready to document (2026-06-12). **Priority:** P0. **Effort:** S–M (actual: S–M).

---

## Needs inspection

### FK-10 · localStorage capacity & failure-mode audit
- **Rationale:** localStorage is the sole store (53 refs in scorer.html, zero IndexedDB anywhere). Quota risk at cohort scale is plausible but unquantified — measure before deciding to migrate.
- **Evidence:** O — grep results. U — per-record payload size, quota error handling, autosave existence.
- **Dependencies:** **INS-5** (synthetic 300-record cohort measurement + error-handling audit).
- **Risk:** Acting without measuring risks either a wasted migration or dismissed real data loss.
- **DoD (this card = the audit, not the migration):** measured bytes/record and bytes/300-record cohort recorded in INSPECTION.md; quota-exceeded behavior documented (caught? silent?); go/no-go recommendation written for a possible FK-14 migration card.
- **Column:** Needs inspection. **Priority:** P2. **Effort:** S–M.

### FK-11 · Rubric-version stamping verification + mixed-version warning
- **Rationale:** `rubric_version_hash` exists in `js/moderation-schema.js:82` — but a warning at export is only meaningful if the hash is stamped per record at mark time, not computed once at export.
- **Evidence:** O — schema field. U — stamping semantics, UI surfacing.
- **Dependencies:** **INS-6**.
- **Risk:** Low — worst case the warning needs per-record stamping added first (scope grows to M).
- **DoD:** stamping semantics documented; if per-record: export warns on mixed hashes; if not: per-record stamping added then warning; covered by a unit test on the export path.
- **Column:** Needs inspection. **Priority:** P2. **Effort:** S–M (fork).

### FK-12 · Ambient drift indicators during marking
- **Rationale:** Consistency signals are destination-only (Cohort Insights). One small ambient indicator (e.g. criterion band histogram chip) could surface drift in-flow.
- **Evidence:** O — absence in screenshots; `js/cohort-insights.js` exists (610 lines). U — what stats it computes; whether ambient signals help or *cause* anchoring.
- **Dependencies:** **INS-7** (read cohort-insights.js); FK-07 helps (cohort visible during marking) but is not a hard blocker.
- **Risk:** Medium-high product risk: could bias markers toward the mean. Ship behind a toggle, default off, self-pilot first.
- **DoD:** one indicator behind a settings toggle; reuses insights stats (no duplicate computation); self-pilot notes recorded before any default-on decision.
- **Column:** Needs inspection. **Priority:** P2. **Effort:** M.

### FK-13 · ARIA/validation centralization audit
- **Rationale:** Commit history ("remove aria-invalid from out-of-band override warning") suggests per-widget ARIA tuning; thin evidence (one commit). Audit before judging.
- **Evidence:** I — single commit. U — actual aria usage breadth. INS-8 is ◐: the 2026-06-12 axe audits supplied (and FK-17/18 cleared) the *violation* inventory; the centralization questions (validation state set centrally? aria-live coverage for score updates / focus nav?) remain the open gate.
- **Dependencies:** **INS-8** (remaining questions); meaningful fix lands with/after FK-15 state model.
- **Risk:** Low — audit only.
- **DoD:** inventory of aria-invalid/aria-describedby/aria-live usage in scorer.html with a verdict: ad-hoc (→ backlog card to derive from validation model) or fine as-is (→ drop).
- **Column:** Needs inspection. **Priority:** P3. **Effort:** S.

---

## Backlog

### FK-14 · Persistent collapsed draft pane in focus mode
- **Rationale:** Student-facing draft accumulates behind "Open full draft"; tone/repetition issues surface only if the marker remembers to open it. (Backlog rather than Safe-now because the focus block is freshly merged and screen-space cost needs a prototype, not because evidence is lacking.)
- **Evidence:** O — focus block UI + "written straight into the full feedback draft" caption.
- **Dependencies:** none hard; prototype against the demo scorer. Sequencing: section layout settled by FK-05 (shipped).
- **Risk:** Medium — focus mode exists to *reduce* on-screen noise; a draft pane works against that. Collapsed-by-default with a live line-count/preview is the mitigation hypothesis.
- **DoD:** collapsed pane showing draft tail/preview, expandable inline, live-updating; keyboard reachable; self-test across a full 5-criterion mark.
- **Column:** Backlog. **Priority:** P1. **Effort:** M.

### FK-15 · Incremental scorer decomposition (ES modules + state→render)
- **Rationale:** ~5,000 lines / 20 inline script blocks / 261 functions / DOM- and text-anchored cross-feature lookups. Strangler-fig extraction, not rewrite.
- **Evidence:** O — structure + commit history; **D-07 bug tally now 1/≥2** (FK-18 sticky-containment regression, cause: structural coupling).
- **Dependencies:** FK-09 is the first extraction and the template for the rest; INS-3 informs boundaries — **INS-3 ☑ 2026-06-11: the boundary picture is better than assumed.** Module-level score state is small and single-writer-dominated (`scoreResult`/`latePenaltyIdx` written only by `recalculate`); the coupling hot-spots are (1) DOM-as-state inputs (`#grade-override`, `#late-penalty-select`) and (2) the feedback-draft splice state (`lastScoreResult`/`lastGeneratedText`). Extract-on-contact should target those two seams first; the arithmetic core needs no extraction (already shared.js). **Validation gate before committing to the full program:** tag the next ~5 scorer bugs by cause; proceed broadly only if coupling-related bugs recur (tally in DECISIONS.md D-07).
- **Risk:** Medium — refactor churn without user-visible payoff if the monolith is actually stable.
- **DoD (program-level):** each touched feature extracted as a module on contact; scorer.html line count monotonically decreasing (tracked per PR); no big-bang rewrite.
- **Column:** Backlog. **Priority:** P2. **Effort:** L (amortized).

### FK-16 · Styling consolidation onto token/Tailwind build (watch slice shipped)
- **Rationale:** Three coexisting systems (tailwind.out.css, shared.css, inline workaround styles). Consolidate on the token build the ADR work already invested in. The cascade hazard is proven: Tailwind utilities silently fail on `.btn`-classed elements (inline styles win — FK-06 discovery).
- **Evidence:** O — css/ contents; FK-06/FK-17 cascade findings.
- **Dependencies:** none hard; do opportunistically alongside FK-15 contact-extractions.
- **Risk:** Low-medium — visual drift during migration; screenshot baselines + full-coverage a11y harness mitigate.
- **DoD:** watch task ✓ (slice shipped 2026-06-12, PR #21); migration policy written (new styles → tokens/Tailwind only; shared.css frozen, shrink-on-touch; run `build:css` before committing the artifact — watch output is unminified); screenshot diffs clean.
- **Column:** Backlog. **Priority:** P3. **Effort:** M amortized.

### FK-19 · Moodle offline-grading-worksheet round-trip (batch import/export)
- **Rationale:** Moodle assignments support an offline grading worksheet (download CSV → mark → re-upload grades + feedback as a batch). Supporting that format kills the per-student copy/paste step at both ends: import pre-seeds the cohort queue from a real roster; export writes grades + feedback back in one upload. Natural extension of FK-07; perfect local-first fit (file in/out, no backend). SheetJS already in-stack.
- **Evidence:** I — Moodle worksheet flow is standard, but FK-side specifics are Unknown (see INS-10). O — cohort store keying (`sid:`) maps naturally onto Moodle's Identifier column (INS-1).
- **Dependencies:** **FK-07 core first** (re-entry + queue is the foundation; this card supersedes FK-07's class-list-import stretch). **INS-10** (worksheet format + round-trip semantics — needs one real worksheet from the user's Moodle). **FK-10/INS-5 is a soft prerequisite:** roster import means identified student data in localStorage at cohort scale on day one — the capacity audit should land first or alongside.
- **Risk:** Medium — schema/version drift across Moodle instances; grade-scale mapping (FK /100 + letter vs assignment max-grade); re-upload row-rejection semantics.
- **Hard product constraint (DoD line, not implementation detail):** the exported "Feedback comments" column carries `feedbackText` only — **never `markerNotes`** (promised private to the marker) and never moderation data.
- **INS-10 ◐ update (2026-06-12, real worksheet analysed):** schema is friendly — 14 fixed columns, only Grade + Feedback comments editable; `ID number` is the 7-digit institutional student ID on every row (**maps 1:1 onto FK's `sid:` keying**; Moodle's own `Participant NNNNNNN` Identifier stored alongside for export); this instance is numeric /100 (v1: support max=100 only, warn otherwise); feedback cell holds ≥8k chars of plain text. Remaining unknowns are Q5 only (upload rejection semantics, multi-line feedback round-trip, Moodle version) — closable with a controlled fake-data test at kickoff. **Effort narrows: M.** Sample CSV is real student data — gitignored, never commit; replace with a fake fixture at build time.
- **DoD (provisional, refine after INS-10 Q5):** import a Moodle grading worksheet → cohort queue pre-seeded keyed `sid:<ID number>` with `moodleIdentifier` retained (No-submission rows marked non-markable; pre-graded rows: explicit skip/warn decision); mark via FK-07 workbench; export a Moodle-uploadable worksheet (header/columns/BOM byte-preserved except Grade + Feedback comments; grade = stored penalisedScore, max=100 enforced); round-trip verified against a real Moodle assignment with fake data; **markerNotes exclusion tested**.
- **Column:** Backlog. **Priority:** P2. **Effort:** M (was M–L; narrowed by INS-10).

---

## In progress
*(empty)*

## Validate in runtime
*(empty)*

## Ready to document
*(empty — see Shipped)*

---

## Shipped

Full card history in git and `docs/planning-202606/` (snapshot predates FK-17/18).

| ID | Title | PR | Shipped |
|---|---|---|---|
| FK-01 | Characterization tests for scoreToGrade / scoreToGradeFromScale | [#20](https://github.com/stephendmann/feedback-kitchen/pull/20) | 2026-06-12 |
| FK-02 | De-letter sections / onboarding banner (D-02) | [#21](https://github.com/stephendmann/feedback-kitchen/pull/21) | 2026-06-12 |
| FK-03 | Copy/casing pass + canon §7 sentence-case rule | [#21](https://github.com/stephendmann/feedback-kitchen/pull/21) | 2026-06-12 |
| FK-04 | Non-color cue + legend for marker-input fields | [#21](https://github.com/stephendmann/feedback-kitchen/pull/21) | 2026-06-12 |
| FK-05 | Section reorder to marking task sequence (D-05) | [#21](https://github.com/stephendmann/feedback-kitchen/pull/21) | 2026-06-12 |
| FK-06 | Clear-cohort demote + cohort action grouping (`.btn-danger`) | [#21](https://github.com/stephendmann/feedback-kitchen/pull/21) | 2026-06-12 |
| FK-16-slice | CSS watch task wired into dev workflow (`--watch=always`, README) | [#21](https://github.com/stephendmann/feedback-kitchen/pull/21) | 2026-06-12 |
| FK-17 | WCAG AA pass — 84 nodes → 0 at full coverage (+ harness coverage fix) | [#22](https://github.com/stephendmann/feedback-kitchen/pull/22), [#23](https://github.com/stephendmann/feedback-kitchen/pull/23) | 2026-06-12 |
| FK-18 | Section-rail sticky containment fix (header boundary; pin assertion now permanent battery item) | [#24](https://github.com/stephendmann/feedback-kitchen/pull/24) | 2026-06-12 |

Residuals carried forward from shipped cards: `index.html:323` "New Student" casing · Title Case field labels → sentence case on next touch (canon §7) · dark-hero links keep slate-400 (intentional) · fk-decisions.md D8 narrowed not closed.
