# FK Improvement Board

Working board. Card IDs are stable — refer to them in commits/notes as `[FK-xx]`.
Evidence types: **O** = Observed (screenshot/repo), **I** = Inferred, **U** = Unknown.
Inspection refs point to `INSPECTION.md` items (INS-x).

Column counts (2026-06-13, post-FK-07): Safe to implement now: 0 · Needs inspection: 4 · Backlog: 4 (incl. FK-14, the Phase-2 remainder) · Shipped: 12 · others: 0

> Board pruned 2026-06-12 at the Phase-1 refresh: shipped cards are one-line
> tombstones in **Shipped** below. Full card history: git log of this file and
> `docs/planning-202606/` on main.

---

## Safe to implement now

*(empty — next candidates come from FK-14 (Backlog, Phase-2 remainder) or the Needs-inspection gates)*


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
| FK-09 | Scoring-engine boundary hardening: guards, adapter, 40-test edge suite (140/140 green) | [#27](https://github.com/stephendmann/feedback-kitchen/pull/27) | 2026-06-12 |
| FK-08 | Moderation-export button trio: label/title polish + identifier-tuple hint in settings modal | [#28](https://github.com/stephendmann/feedback-kitchen/pull/28) | 2026-06-13 |
| FK-07 | Record re-entry: `loadCohortRecordIntoSession` + View-list Open + unsaved-work guard + drift cross-check (production-verified; name-rename sibling edge ledgered to FK-19) | [#29](https://github.com/stephendmann/feedback-kitchen/pull/29) | 2026-06-13 |

Residuals carried forward from shipped cards: `index.html:323` "New Student" casing · Title Case field labels → sentence case on next touch (canon §7) · dark-hero links keep slate-400 (intentional) · fk-decisions.md D8 narrowed not closed.
