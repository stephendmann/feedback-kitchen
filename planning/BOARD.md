# FK Improvement Board

Working board. Card IDs are stable — refer to them in commits/notes as `[FK-xx]`.
Evidence types: **O** = Observed (screenshot/repo), **I** = Inferred, **U** = Unknown.
Inspection refs point to `INSPECTION.md` items (INS-x).

Column counts (2026-06-13, post-FK-20 promotion checkpoint): Safe to implement now: 0 · Needs inspection: 4 · Backlog: 5 (FK-15 · FK-16 · FK-19 · FK-21 · FK-22) · Shipped: 14 · others: 0. Next free card ID: FK-23.

> Board pruned 2026-06-12 at the Phase-1 refresh: shipped cards are one-line
> tombstones in **Shipped** below. Full card history: git log of this file and
> `docs/planning-202606/` on main.

---

## Safe to implement now

*(empty — FK-14 ✓ and FK-20 ✓ both closed 2026-06-13; next session = Phase-3 kickoff: design + run INS-5, then FK-10 audit verdict. See ROADMAP-PHASES.md.)*


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

### FK-21 · Draft persistence v2 (re-implement PR #12's intent)
- **Rationale:** Closing or refreshing the tab mid-mark silently loses the in-progress student. PR #12 solved this pre-programme but its branch predates FK-02…09/17/18/FK-07 scorer.html — decided 2026-06-13 (user + external review): re-implement from intent, never rebase. Its `saveDraft`/`clearDraft`/`FK_DRAFT_KEY` scaffolding sits dead in main — remove or absorb on contact.
- **Evidence:** O — dead scaffolding in scorer.html; PR #12 acceptance criteria (preserved in the closed PR + git history) are the intent spec.
- **Dependencies:** **INS-5/FK-10 first** — this card adds another localStorage writer; the storage capacity/failure-mode audit must inform key design and quota handling. Must reconcile with FK-07's session fingerprint + unsaved-work guard and the `beforeunload` handler (fire only when a draft has ≥1 graded criterion).
- **Risk:** Medium — autosave interacting with FK-07's load/merge ordering (generate-baseline-then-restore) and the cohort store's `sid:`/`name:` keying; quota exhaustion at cohort scale.
- **DoD:** mid-mark refresh offers Resume/Discard restoring all fields exactly; export and New-student clear the draft; no interference with FK-07 re-entry or existing localStorage keys; quota-exceeded path per FK-10 findings; runtime-validated against the demo scorer.
- **Column:** Backlog (sequenced after INS-5/FK-10). **Priority:** P1. **Effort:** M.

### FK-22 · Homepage/dark-mode residuals (re-implement PR #16's intent + accumulated theme escapes)
- **Rationale:** Small, real, user-visible residuals with no inspection dependency; batched to one S-effort card. PR #16 closed 2026-06-13 (stale base; re-implement from intent).
- **Scope (from PR #16):** fonts.gstatic preconnect; logo `img` width/height (layout shift); hero-CTA clickable affordance; `renderLineDiff` hardcoded hex (`#fee2e2`/`#dcfce7`) → tokens/classes per the FK-16 migration policy.
- **Scope (added post-PR #31, 2026-06-13):** (a) remove/resolve scorer.html's dead `?cinematic=1` easter-egg link to `/css/dark-scorer.css` (file doesn't exist — 404s when enabled); (b) sweep remaining light Tailwind tint chips in dark mode (amber `Display: exact` rounding label, `bg-slate-100` rounding buttons, kbd/code chips) — PR #31 scoped its remaps to `.grade-badge`/`.tier-pill` only.
- **Dependencies:** none hard. Honour FK-16 policy: new styles → tokens/Tailwind only; run `build:css` before committing the artifact.
- **Risk:** Low — cosmetic; screenshot baselines + a11y harness cover regressions.
- **DoD:** PR #16's four items landed in current markup; cinematic link resolved; dark-mode sweep shows no near-white computed backgrounds outside deliberate accents; axe battery clean.
- **Column:** Backlog. **Priority:** P2. **Effort:** S.

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

Full card history in git and `docs/planning-202606/` (snapshot refreshed 2026-06-13 at the FK-20 promotion checkpoint — covers Phases 0–2).

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
| FK-09 | Scoring-engine boundary hardening: guards, adapter, 40-test edge suite (140/140 green) | [#25](https://github.com/stephendmann/feedback-kitchen/pull/25) | 2026-06-12 |
| FK-08 | Moderation-export button trio: label/title polish + identifier-tuple hint in settings modal | [#28](https://github.com/stephendmann/feedback-kitchen/pull/28) | 2026-06-13 |
| FK-07 | Record re-entry: `loadCohortRecordIntoSession` + View-list Open + unsaved-work guard + drift cross-check (production-verified; name-rename sibling edge ledgered to FK-19) | [#29](https://github.com/stephendmann/feedback-kitchen/pull/29) | 2026-06-13 |
| FK-14 | Persistent collapsed draft pane in focus mode (D-04 GO; collapsed-by-default contract; + PR #31 night-mode dark-variant follow-up) | [#30](https://github.com/stephendmann/feedback-kitchen/pull/30), [#31](https://github.com/stephendmann/feedback-kitchen/pull/31) | 2026-06-13 |
| FK-20 | ROADMAP truth pass + stalled-PR triage = Phase-2 promotion checkpoint (Addendum G; snapshot refresh; #12/#16 closed → FK-21/FK-22) | [#32](https://github.com/stephendmann/feedback-kitchen/pull/32), [#33](https://github.com/stephendmann/feedback-kitchen/pull/33) | 2026-06-13 |

Residuals carried forward from shipped cards: `index.html:323` "New Student" casing · Title Case field labels → sentence case on next touch (canon §7) · dark-hero links keep slate-400 (intentional) · fk-decisions.md D8 narrowed not closed.
