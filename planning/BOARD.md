# FK Improvement Board

Working board. Card IDs are stable — refer to them in commits/notes as `[FK-xx]`.
Evidence types: **O** = Observed (screenshot/repo), **I** = Inferred, **U** = Unknown.
Inspection refs point to `INSPECTION.md` items (INS-x).

Column counts (2026-06-13, + FK-25 split: PR #39 shipped a **rubric-version** drift indicator that was built under the label "FK-12" but is a *different* feature from FK-12's card — carded as **FK-25 · Rubric-version drift indicator → Shipped**; FK-12 remains the unbuilt cohort-consistency/anchoring indicator (D-10)): Safe to implement now: 2 (FK-12 ambient *consistency* indicator · FK-13 score-result live region) · Needs inspection: 0 · Backlog: 5 (FK-15 · FK-16 · FK-19 · FK-21 · FK-22) · Ready to document: 1 (FK-10) · Shipped: 18 · others: 0. Next free card ID: FK-26.

> Board pruned 2026-06-12 at the Phase-1 refresh: shipped cards are one-line
> tombstones in **Shipped** below. Full card history: git log of this file and
> `docs/planning-202606/` on main.

---

## Safe to implement now

### FK-12 · Ambient drift indicators during marking
> **Disambiguation (2026-06-13):** this card is the **cohort-consistency / anchoring** indicator (reuse `cohortMetrics`; decision **D-10**). Do **not** confuse it with the **rubric-version** drift indicator that shipped in PR #39 — that was a separate feature (decision **D-09**, built on FK-11's per-record stamp) and is carded as **FK-25 (Shipped)** below. PR #39's "FK-12" label was a misnomer; this card remains **unbuilt**.
- **Rationale:** Consistency signals are destination-only (Cohort Insights modal). One small ambient indicator could surface drift in-flow. INS-7 (☑ 2026-06-13) confirmed the metrics engine is reusable: `cohortMetrics`/`detectState` are **pure functions on `window.CohortInsights`**, but their only in-app caller is `renderInsights` from the insights modal (scorer.html:3104) — destination-only in practice, not by design.
- **Evidence:** O — `js/cohort-insights.js:110–252` (`cohortMetrics` returns 23 cohort-level fields: spread/distribution + behaviour + Cronbach α); sole consumer at scorer.html:3104; INS-7 Q1/Q2 findings. U (now bounded): whether an ambient signal helps or *causes* anchoring — answerable only by the self-pilot, not by inspection.
- **Dependencies:** ~~INS-7~~ ☑ resolved — **technical gate cleared.** FK-07 (cohort visible during marking) helps but is not a hard blocker. Adjacent to the Cohort Insights modal code in scorer.html.
- **Scope (two forks, decide in the feature worktree):**
  1. **Indicator-source fork.** Reuse an *existing* aggregate (scale-use badge / `grade_bands` sparkline / `total_score_sd` / `within_student_sd_pct` / running mean) → **S, no engine change**; OR add the per-criterion tally the original "criterion band histogram chip" example needs → **M** — a small additive pass on rows already iterated for SD/α (`:142–150`, `:218–224`). The card's example is the *one* signal `cohortMetrics` does **not** already emit (it reads per-criterion rows but only folds them into within-student SD and α).
  2. **Dataset fork.** Saved-cohort-only (trivial — `cohortMetrics(config, cohort.students)`) vs live-augmented (append a synthetic record from the in-progress `scoreResult` before computing, touching the recalculate path). The in-progress student is **not** in `cohort.students` until save, so saved-only shows nothing for the student being marked.
- **Out of scope:** per-tutor ambient signals — INS-7 free finding: `renderInsights` is hard-wired `currentTutor=''`, so the State-B tutor-subset path is dead in the app today; per-tutor would need that wiring first. Cross-cohort / role labels stay deferred to the "Coordinator Dashboard" (not in this repo).
- **Risk:** Medium-high **product** risk: an always-visible running-mean/distribution chip can bias markers toward the mean — the exact vector the existing module hedges against in every rendered string (`:582` disclaimer). Mitigation unchanged: behind a settings toggle, **default off**, self-pilot first.
- **DoD:** one indicator behind a settings toggle; reuses `CohortInsights.cohortMetrics` (no duplicate computation); small-N suppression honoured (engine already blanks shape stats below n≈12); self-pilot notes recorded **before any default-on decision**. **Implementation belongs in a feature worktree/branch → main via PR, not frosty-babbage.**
- **Column:** Safe to implement now (INS-7 cleared the technical gate; the anchoring question rides as a default-off + self-pilot DoD, not an inspection blocker). **Priority:** P2. **Effort:** S (existing-aggregate fork) – M (per-criterion fork).

### FK-13 · Score-result live region + validation-convention note *(was: ARIA/validation centralization audit)*
- **Rationale:** INS-8 (☑ 2026-06-13) resolved the centralization questions and **retired the "centralize all ARIA" framing.** The per-widget `aria-invalid` tuning is *deliberate*, not sprawl: `#grade-override` signals a HARD invalid (not-in-scale → `aria-invalid='true'`, scorer.html:1788–1815) while the per-criterion `override-<i>` inputs treat out-of-band as a SOFT warning (`.out-of-band` class only, `aria-invalid` forced `'false'`, 1916–1931) — that *is* the commit FK-13 was named after, and flattening it into one model would be a regression. The one real user-facing gap: **the recomputed total/grade is never announced** (`weighted-total-cell`/`penalised-score-display` are plain `.textContent`, 1949/1952, outside any live region) ⇒ a screen-reader marker changing a grade hears nothing about the result. Focus-mode nav, by contrast, *is* announced (`#focus-live`, 570 → 2256–2260).
- **Evidence:** O — INS-8 Q1/Q2 ARIA grep + JS setter read (two divergent validation setters; score writes outside live regions; `#focus-live` healthy; 11 modals + 2 landmark regions + toast all wired). Maps to **WCAG 2.1 AA 4.1.3 Status Messages**.
- **Dependencies:** ~~INS-8~~ ☑ resolved. The validation-*model* centralization is **folded into FK-15** (the override inputs are already on FK-15's DOM-as-state seam list — INS-3); do not build a separate validation card.
- **Scope:** (1) add an sr-only `aria-live='polite'` (or `role='status'`) region announcing the recomputed weighted total + banded grade (and fail/penalty outcome) on `recalculate()`; (2) optional ride-alongs same card — `aria-describedby` linking each override input to its status text, and a note flagging the inline-hex-vs-class border inconsistency for FK-16. (3) document the deliberate hard-invalid / soft-warn convention (one paragraph / code comment) so the intentional `aria-invalid='false'` on out-of-band overrides isn't "fixed" later.
- **Out of scope:** any validation-model refactor (→ FK-15); re-announcing focus-mode nav (already covered); colour/contrast (FK-17 cleared).
- **Risk:** Low — additive sr-only region + a doc note; no refactor, no arithmetic, no visual change. Verify the announcement isn't chatty (debounce/throttle if `recalculate` fires rapidly).
- **DoD:** a grade change announces the new total + grade to AT; the override-status association is programmatic (if ride-along taken); hard/soft validation convention written down; axe battery (demo scorer `?id=demo-written-response-v2`) stays clean + a regression assertion for the new live region. **Implementation belongs in a feature worktree/branch → main via PR, not frosty-babbage.**
- **Column:** Safe to implement now (INS-8 cleared the gate; rescoped to the concrete a11y fix). **Priority:** P2 (WCAG 4.1.3-adjacent). **Effort:** S.

*(Phase-3 kickoff done 2026-06-13: INS-5 run → FK-10 audit verdict (GO, split) → **FK-24** spawned. INS-6 run → FK-11 ungated, M fork confirmed. INS-7 run → FK-12 ungated (metrics engine is pure/reusable; per-criterion histogram is the one signal not pre-computed; anchoring risk handled by default-off toggle + self-pilot). **FK-23 (PR #35), FK-24 (PR #36), FK-11 (PR #37) all merged to main 2026-06-13 → Shipped.** INS-8 run → FK-13 ungated, **rescoped from "centralization audit" to "score-result aria-live region + validation-convention note"** (the per-widget hard-invalid/soft-warn split is intentional; the validation-*model* centralization folds into FK-15; the real gap is the unannounced recomputed score — WCAG 4.1.3). **Phase-3 inspection sweep now complete (INS-5/6/7/8).** FK-12 + FK-13 are the two open Safe-to-implement cards, both for a feature worktree, not this one. One live bytes/record confirmation left to flip INS-5 ◐→☑ — non-blocking. **Next: the 2nd promotion checkpoint** (planned milestone — see ROADMAP-PHASES.md §3 / Promotion checkpoint). See ROADMAP-PHASES.md §3.)*


---

## Needs inspection
*(empty — all Phase-3 inspection gates resolved 2026-06-13: INS-5/6/7/8 ☑/◐-non-blocking; FK-13 rescoped + moved to Safe-to-implement. INS-10 remains ◐ but gates FK-19 in Backlog, not this column.)*

---

## Backlog

### FK-21 · Draft persistence v2 (re-implement PR #12's intent)
- **Rationale:** Closing or refreshing the tab mid-mark silently loses the in-progress student. PR #12 solved this pre-programme but its branch predates FK-02…09/17/18/FK-07 scorer.html — decided 2026-06-13 (user + external review): re-implement from intent, never rebase. Its `saveDraft`/`clearDraft`/`FK_DRAFT_KEY` scaffolding sits dead in main — remove or absorb on contact.
- **Evidence:** O — dead scaffolding in scorer.html; PR #12 acceptance criteria (preserved in the closed PR + git history) are the intent spec.
- **Dependencies:** ~~INS-5/FK-10 first~~ ☑ — audit done **and FK-24 shipped (PR #36)**, so the `safeSetItem` write-hardening seam now exists on main; this card's new localStorage writer must **route through it** rather than re-`setItem` raw. Must reconcile with FK-07's session fingerprint + unsaved-work guard and the `beforeunload` handler (fire only when a draft has ≥1 graded criterion).
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

### FK-10 · localStorage capacity & failure-mode audit ✅ AUDIT COMPLETE (verdict recorded)
- **Rationale:** localStorage is the sole store (53 refs in scorer.html, zero IndexedDB anywhere). Quota risk at cohort scale is plausible but unquantified — measure before deciding to migrate.
- **Evidence:** O — INS-5 code-read (writers + record schema). The three heavy writers (`saveCohort` shared.js:1149, `saveAllConfigs` shared.js:309, `saveSnippets` scorer.html:3244) all `setItem` with **no try/catch**; capacity model ~6–7 KB/record typical ⇒ 300-record cohort ~1.9–3.9 MB against a shared, conservatively-accounted ~5 MB origin.
- **Dependencies:** **INS-5 ◐ 2026-06-13** — failure-mode half fully resolved (dispositive); capacity half analytical, one live-confirmation item open (doesn't block this verdict).
- **Risk:** Acting without measuring risks either a wasted migration or dismissed real data loss.
- **DoD (this card = the audit, not the migration):** ☑ bytes/record + 300-record projection recorded in INSPECTION.md INS-5; ☑ quota-exceeded behavior documented (**unhandled/silent** — uncaught throw, masked by the prior Excel download in `downloadExcel` scorer.html:2544–2548 ⇒ silent cohort omission); ☑ go/no-go written.
- **Verdict:** **GO on a card — split.** Trigger is the unhandled-quota half, not raw size. (1) **FK-24** (write-hardening, P1/S) — **shipped 2026-06-13 (PR #36)**; fixes a present data-loss bug independent of scale. (2) **Full IndexedDB migration deferred/conditional — not carded** (honours INS-5's "wasted migration" caution); revisit only if a live cohort crosses ~150 records or a quota event is seen in the field.
- **Next step to fully close:** promotion-checkpoint fold (INS-5 finding → fk-project-overview.md; this verdict → fk-decisions.md addendum) at the Phase-3 checkpoint. **Priority:** P2. **Effort:** S–M. *(Reopen only if the live bytes/record check contradicts the model.)*

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
| FK-23 | Wire Jest + lazy-load grep guard into CI (`ci.yml`, `package.json`, `scripts/check-lazy-load.js`; scope-A only — Lighthouse/bundle-budget stayed deferred) | [#35](https://github.com/stephendmann/feedback-kitchen/pull/35) | 2026-06-13 |
| FK-24 | Storage-write quota hardening — `safeSetItem` on the 3 heavy writers; QuotaExceeded surfaced; `downloadExcel` ordering fixed (+129 tests) | [#36](https://github.com/stephendmann/feedback-kitchen/pull/36) | 2026-06-13 |
| FK-11 | Rubric per-record version stamping (`SA.rubricVersionHash`) + mixed-version warning at export (legacy live-config fallback; manifest `rubric_versions`; 12 new tests) | [#37](https://github.com/stephendmann/feedback-kitchen/pull/37) | 2026-06-13 |
| FK-25 | Rubric-version drift indicator — ambient in-app badge (`SA.detectRubricDrift`) when the open cohort's stamped rubric (FK-11) ≠ the loaded rubric; mirrors the export manifest's `mixed`/fallback semantics so badge and `90_manifest` can't disagree; 15 new tests (*PR #39 was titled "FK-12" — provenance; in-app surface of D-09*) | [#39](https://github.com/stephendmann/feedback-kitchen/pull/39) | 2026-06-13 |

Residuals carried forward from shipped cards: `index.html:323` "New Student" casing · Title Case field labels → sentence case on next touch (canon §7) · dark-hero links keep slate-400 (intentional) · fk-decisions.md D8 narrowed not closed · **FK-11 doc-drift NOT fixed in PR #37** — `docs/fk_moderation_export_v1.md:71` still says the hash covers "criterion order and maxima" (wrong: it's names+weights+all tier descriptors; correct gloss at `js/moderation-readme.js:123`); fold into the next moderation-touching PR.
