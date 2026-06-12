# Inspection Checklist

Each item gates one or more board cards. Resolve = answer the question, record findings
here (don't fix anything during inspection — findings only), then move the gated card.
Status: ☐ Open · ◐ Partially resolved · ☑ Resolved · ✕ Dropped

---

## INS-1 ☑ Does a cohort record round-trip back into the marking session?
- **Gates:** FK-07 (queue/re-entry) — scope forks on the answer.
- **Where to look:** scorer.html cohort-store functions (search: `cohort`, `View list` handler, whatever populates "0 students saved"); `js/moderation-schema.js` for record shape; try it live in dev server: save a student, open View list, attempt re-edit.
- **Questions:**
  1. Are saved records full-fidelity (per-criterion levels + overrides + feedback slots + notes), or flattened/export-shaped?
  2. Is there any existing load-record-into-session code path, even unexposed?
  3. Does re-saving create a duplicate row or update in place (keyed how — name? ID? timestamp)?
- **Findings:** _(2026-06-13, code-read pass — store API in shared.js:1115–1212, save site scorer.html:2566–2646)_
  - **Q1: FULL-FIDELITY — records carry everything needed to rebuild the session.** `saveCurrentStudentToCohort` (scorer.html:2566) persists: `grades` = deep copy of `studentGrades` `[{grade, override, overrideManual, autoFilled}]` per criterion (so per-criterion numeric overrides AND their manual/auto provenance survive); `penaltyIdx`; whole-student `overrideGrade` (the raw letter input); `feedbackText`; `markerNotes`; plus name/studentId/tutor/date. `scoreResult` is also stored (via `cloneScoreResultForStorage`, :2615 — functions stripped) but is *derived*: fully recomputable from grades+penaltyIdx+override through the FK-09 engine. **Gap:** rounding mode is NOT stamped per record (it's config-level), so a load-back recompute after the marker changes rounding could display differently than at save time — decide at FK-07 whether to stamp it.
  - **Q2: NO load-back path exists, exposed or not.** Repo-wide: `record.grades` is consumed only by exports (`js/excel.js:284,324`, `js/moderation-export.js:78`) and insights (reads `scoreResult` aggregates). The View-list modal (scorer.html:2684–2707) renders name/grade/score per row with a **Remove** button only. The only writes back into `studentGrades` are the bulk-fill undo snapshot (:1681) and the new-student reset (:1437, :3138) — both in-session, neither reads the cohort store. FK-07 must *build* the hydrate path, but against an already-sufficient record shape.
  - **Q3: UPDATE IN PLACE — upsert keyed `sid:<studentId>` else `name:<name>` (trimmed, case-insensitive; `studentMatchKey` shared.js:1131).** `addToCohort` (:1165) replaces the existing row, preserving original `id`/`createdAt`, and returns `{replaced}` which the UI surfaces as an "Updated …" toast. No duplicate on plain re-save. **Two identity hazards for FK-07:** (a) *key drift* — save with name only, later add a student ID → new key → silent duplicate row; (b) *name collision* — two students with the same name and no IDs → second save silently overwrites the first. A queue UI that pre-seeds IDs from a pasted class list largely neutralises both.
  - **Verdict for the FK-07 fork: the favourable branch, with one build item.** Store fidelity and upsert semantics already support re-entry (M-side), but no hydrate path exists — FK-07 = build `loadRecordIntoSession(record)` + queue/status IA, not a data-model rework (the L-branch's store rework is NOT needed). Re-export without duplication already works via the upsert, subject to hazards (a)/(b).

## INS-2 ☑ What do "Moderation Export…" and "Export for Moderation" each do?
- **Gates:** FK-08.
- **Where to look:** both button handlers in scorer.html; `js/moderation-export.js`, `js/moderation-optin.js`, `js/moderation-suppression.js`; `docs/fk_moderation_export_v1.md`.
- **Questions:**
  1. Configure-vs-run, or genuine duplication?
  2. How do opt-in/suppression interact with each ("Disable mod-export" button suggests a tri-state)?
  3. Does Clear Cohort currently confirm before destroying? (feeds FK-06 DoD)
- **Findings:** _(Q1/Q2 answered 2026-06-13, code-read pass — handlers scorer.html:2889–3074; Q3 answered 2026-06-11, Phase 0 kickoff)_
  - **Q1: CONFIGURE-VS-RUN — not duplication.** "Moderation Export…" (`showModExportOptIn`, :2962) opens the lecturer/coordinator opt-in modal (paper/cohort/assessment IDs + responsibility checkbox → `FKModOptIn.setModerationOptIn`). "Export for Moderation" (`runModExport`, :3054) generates the privacy-reduced workbook via `FKModExport.buildAndDownloadModExport` — a fully decoupled path from excel.js. The confusion is real though: nothing in the *labels* says configure-vs-run, and the run button is invisible until opt-in, so a fresh user sees one mystery button with an ellipsis. FK-08 is a relabel/grouping job, not a consolidation — the two-action split is load-bearing (opt-in is an accountability record, run is gated on it).
  - **Q2: TRI-STATE CONFIRMED, plus layered gates.** States: (1) *default/hidden* — only "Moderation Export…" visible; (2) *enabled* — an active opt-in record exists (`_activeOptInRecord`, :2921) → tutor banner + "Export for Moderation" + "Disable mod-export" appear, opt-in button relabels to "Moderation Export settings…" (:2957); (3) *disabled* — `disableModExport` (:3035, single `confirm`) clears the opt-in record → back to state 1; previously generated files unaffected. Run-time gates beyond opt-in: cohort n < 15 → blocking modal, **no file produced** (:3064); suppression (`js/moderation-suppression.js` — pure functions) then operates *inside* the produced file: row shuffle + R-labels, tutor T-labels with <5 collapsed to `T_other`, grade-band <5 suppression, |z|>3 extreme flags. So opt-in gates *whether*, n≥15 gates *if now*, suppression shapes *what*. **Caveat for FK-08:** `_activeOptInRecord`'s fallback (:2930) matches *any* enabled opt-in whose `cohort_id` slug equals the current cohort label — a renamed cohort can silently detach from (or attach to) an opt-in record; worth a mention in the relabel pass.
  - **Q3: YES — double confirmation already exists.** `confirmClearCohort()` scorer.html:2640–2652 *(2026-06-11 anchors; drifted to :2670–2682 post-FK-09 — behaviour re-verified unchanged 2026-06-13)*: two sequential `confirm()` dialogs (2647, 2648), the first naming the student count and warning "cannot be undone… export first". Caveat: when the cohort is **empty**, it clears silently with no dialog (2642–2646) — harmless but worth knowing. A separate unguarded `SA.clearCohort` call exists at 2853 — appears to be inside a modal-confirm flow; FK-06 implementation should verify that path's guard.
  - O — button markup observed: Clear Cohort is `btn-ghost text-red-600` (1175), last of 8 buttons in one flex row (1166–1176); already partially differentiated by colour but at equal visual weight. Primary candidates per BOARD: Export cohort (btn-blue, 1167), Cohort Insights (1168, hidden until data), View list (1169).
  - FK-06 scope consequence: the "add confirmation" half of the DoD is already satisfied — remaining work is visual demotion/grouping only.

## INS-3 ☑ Map the scoring calculation surface in scorer.html
- **Gates:** FK-09 (engine extraction); informs FK-15 boundaries. **Inspection only — changes no code.** Findings shape FK-09's eventual module boundary (Phase 2), not FK-01.
- **Where to look:** start from `onPenaltyChange` (scorer.html:1824), `setRounding`/`highlightRoundingBtn` (~:3153–3185), `cloneScoreResultForStorage` (~:2585); trace the weighted-total computation; cross-ref `scoreToGrade`/`scoreToGradeFromScale` call sites in shared.js (lines 394–726 region).
- **Questions:**
  1. Full list of functions that read or write score state.
  2. What shared/global state do they touch (DOM reads? module-level vars? localStorage directly?).
  3. Order of operations: override → weight → penalty → rounding? Where can they interleave?
  4. Is D5 weight-redistribution math in builder.html, scorer.html, or both (duplication risk)?
- **Execution checklist (all complete 2026-06-11, second pass — anchors re-verified post-FK-02/f1cc122; call-site lines were unchanged, `focusIdx` decl drifted 1233→1236):**
  - [x] Locate the engine core and confirm where the arithmetic actually lives.
  - [x] Resolve order of operations (Q3).
  - [x] Q1 — full `recalculate()` caller enumeration + classification (see findings).
  - [x] Q2 — module/global score-state inventory + localStorage writes in the score path (see findings).
  - [x] Q4 — D5 redistribution verdict: **absent from this repo** (see findings).
  - [x] Two-rounding-systems documentation — **they are NOT display-vs-compute as assumed; `setRounding` writes both** (see findings; surprise routed to INS-4 S-6).
- **Findings:** _(2026-06-11, Phase 0 kickoff — partial)_
  - **The engine core is ALREADY in shared.js, not inline in scorer.html.** `recalculate()` (scorer.html:1858) delegates: `SA.computeScores(config, studentGrades, latePenaltyIdx)` → `SA.applyGradeOverride(config, scoreResult, overrideGrade)` — then does pure DOM writes. Engine functions in js/shared.js: `computeScores` (325), `applyGradeOverride` (194), `scoreToGrade` (158), `scoreToGradeFromScale` (167), `bandMinimumForGrade` (178), `formatScore` (1188). **FK-09's scope shrinks substantially:** it's less "extract the engine" and more "test what's already extracted + move the remaining DOM-reading glue (override input parse, penalty index read) behind a clean interface".
  - **Q3 resolved — order of operations** (computeScores, shared.js:325–397): per-criterion numeric override ?? grade midpoint → ×weight/100 → **per-row rounding** (config.scoreRounding) → sum of *rounded* rows → round total → late penalty (flat deduction, or fail→0) → round again → grade lookup (`scoreToGrade[FromScale]`). Marker *letter* override applied afterwards in a separate pass (`applyGradeOverride`): snaps total UP to band minimum only (never down), re-applies the penalty deduction delta, attaches audit metadata.
  - **Notable behaviour (feed FK-01 test design):** weightedTotal deliberately sums the *displayed/rounded* per-row scores — comment at shared.js:373–376 calls out the trade ("sub-0.5 precision drift for perfect visual consistency"). Characterization tests must assert this, not "pure" arithmetic.
  - **Notable behaviour:** `scoreToGradeFromScale` returns the *lowest* band's grade for any score below all bands (shared.js:172–173) and will throw on an empty/missing scale (no guard on `sorted[length-1]` — `.grade` of undefined). Unknown grade keys in `computeScores` fall back to midpoint 50 / tier 'developing'. Record any further oddities in INS-4 once FK-01 tests run.
  - **Fail-penalty interaction:** `lp.fail` zeroes the score and forces the bottom grade; `onPenaltyChange` (scorer.html:1824–1847) additionally *clears* any letter override and shows a conflict banner (1833–1845).

- **Findings — second pass (2026-06-11, INS-3 completion; resolves Q1/Q2/Q4 + rounding doc):**

  **Q1 · `recalculate()` callers — 9 functions, 10 direct call sites, scorer.html only (zero references in js/* or builder.html):**
  | Caller (line of call) | Classification | What it changes before recalc |
  |---|---|---|
  | `init` (1452) | state-writer | seeds `studentGrades` (1423) on load |
  | `onGradeChange(i)` (1583) | state-writer | `studentGrades[i].grade`; wipes `.override/.overrideManual/.autoFilled`; clears override input |
  | `bulkFillUngraded` (1633) | state-writer | fills empty `studentGrades` rows; sets `.autoFilled`; snapshots for undo |
  | `undoBulkFill` (1679) | state-writer | restores `studentGrades` from snapshot |
  | `onOverrideChange(i)` (1752) | state-writer | `studentGrades[i].override/.overrideManual` from input |
  | `onOverrideGrade` (1815, 1819) | display-refresher* | mutates no module state; *the letter override lives only in the DOM input* (`#grade-override`), which `recalculate` reads at 1864 |
  | `onPenaltyChange` (1846) | display-refresher* | clears the DOM override input on fail-penalty; recalc reads `#late-penalty-select` |
  | `confirmNewStudent` (3142) | state-writer | resets `studentGrades`, `lastScoreResult`, `lastGeneratedText`, `_bulkFillSnapshot`, `focusIdx`, all inputs |
  | `setRounding` (3192) | state-writer **+ persists** | `_displayRounding`, `config.scoreRounding`, then `SA.saveConfig(config)` → **localStorage write** |
  Indirect: focus-mode handlers `focusOnGrade`/`focusOnOverride` (2301/2311) delegate to `onGradeChange`/`onOverrideChange` — additive view, no parallel write path (by design, per the focus-workspace comment block ~2150–2160).
  \* "display-refresher" here means *no module-state mutation*; both still change effective inputs via the DOM (see DOM-as-state note below).

  **Q2 · Module/global score-state inventory (scorer.html top-of-script cluster, decls 1220–1236):**
  | State (decl) | Mutated by | Read by (score path) |
  |---|---|---|
  | `studentGrades` (1220) | `init`/1423, `onGradeChange`, `bulkFillUngraded`, `undoBulkFill`, `onOverrideChange`, `_primeOverrideFromMidpoint`/1714 (spinner-seed: writes `.override` **without** recalc until change fires), `onGradeRowReviewed` (`.autoFilled` only), `confirmNewStudent`/3108 | `recalculate`→`SA.computeScores`, cohort save (deep-copied at 2561), focus cards |
  | `latePenaltyIdx` (1221) | **only** `recalculate`/1859 (parsed from DOM each pass) | the same `computeScores` call |
  | `scoreResult` (1222) | **only** `recalculate`/1860 | DOM cell writes (1871–1933), `_primeOverrideFromMidpoint`, focus cards, `saveCurrentStudentToCohort` (2539/2555), feedback pipeline |
  | `_displayRounding` (1223) | `init`/1389 (from `config.scoreRounding`), `setRounding`/3186 | ~12 `SA.formatScore` display calls (rows, totals, override audit, print, focus cards) |
  | `lastScoreResult` (1227) | feedback-diff pipeline (2003, 2029, 2143, 2440), `confirmNewStudent`/3117 | `updateFeedback` splice/diff logic |
  | `focusIdx` (1236) | `focusGoto`/2201 (clamped), criteria-count clamp/2178, `confirmNewStudent`/3141 | focus delegates (grade/override/body writes for row i) |
  **DOM-as-state (structural risk for FK-09):** two authoritative scoring inputs live *only* in the DOM until save — the marker letter override (`#grade-override`, read fresh at 1864) and the penalty selection (`#late-penalty-select`, read fresh at 1859). Any headless/module reuse of the pipeline must supply these explicitly.
  **localStorage writes in the score path:** `setRounding` → `SA.saveConfig` (3189); `saveCurrentStudentToCohort` → `SA.addToCohort`/`saveCohort` (2568, via shared.js); focus-mode preference key write on toggle (2170). `SA.computeScores`/`applyGradeOverride` themselves: pure — no DOM, no storage.

  **Q4 · D5 weight-redistribution verdict: ABSENT from this repo.** The D5 ADR (fk-decisions.md:333–361) locates the implementation in `preview/component-rubric-editor.behaviours.js` — a CD-design-folder preview component; no `preview/` dir, `behaviours.js`, or `fk-rubric-editor*` file exists in this worktree (glob verified). builder.html has **no redistribution at all**: add-criterion seeds `weight: 0` (938), weights are hand-edited (`syncAndUpdateWeight` 953), and the only enforcement is the sum-to-100 validation gate (`updateWeightCheck` 958; step-gate 544–546). Greps for `redistribut|equalis|equaliz|drift|largest|remainder` across builder/scorer/js: zero hits. **Consequence flagged (not silently fixed): FK-09's DoD line "edge-case tests added (… D5 ±1 drift)" is untestable in-repo until the rubric-editor component is integrated — see board flag.**

  **Two rounding systems — documented, and the assumed split is wrong:**
  - `config.scoreRounding` (`'none'|'half'|'whole'`, default `'none'` in `newConfig`, shared.js:261) — consumed *inside* `SA.computeScores`: rounds each per-row weighted score before summing, the summed total, and the penalised score. Changes **stored/exported arithmetic and potentially the banded grade**.
  - `_displayRounding` (scorer.html:1223) — scorer-local; feeds every `SA.formatScore` *display* call.
  - They are kept in lockstep by their only UI writer: `setRounding(val)` (3185–3193) sets **both** and persists the config. They can diverge only if the config is edited elsewhere (builder) without a scorer reload — `init` re-syncs at 1389.
  - The nav-bar UI presents this as a display choice ("Score Rounding … Scores shown at full precision"; chip "Display: exact") while it actually switches computation mode too → behavioural surprise recorded as **INS-4 S-6** (structural fact stays here; triage there).

## INS-4 ☑ Characterization-test surprises ledger
- **Gates:** none (FK-01 is safe-now); this item *collects* what FK-01 discovers.
- **Rule (operational):** test the behaviour **as it is** — the assertion captures what the code *does*, not what it *should* do. File the surprise here using the template. Fix only in a separate commit, only after triage, never inside the FK-01 test commit.
- **Surprise template (copy per entry):**
  ```
  ### S-n · <one-line title>
  - Input: <exact call, e.g. scoreToGradeFromScale(50, [])>
  - Expected: <what a reasonable reader would predict>
  - Actual: <what the code does — quote the test assertion>
  - Suspected cause: <line ref + hypothesis>
  - Triage: bug / intended / unclear
  - Action: <none | follow-up commit ref | new card>
  ```
- **Pre-seeded candidates from the Phase 0 kickoff read (verify when writing tests):**
  - `scoreToGradeFromScale(score, [])` → TypeError (no empty-scale guard, shared.js:173).
  - Score below all bands returns the lowest band's grade even for negative/NaN-ish inputs — check `NaN >= floor` is false for every band, so NaN falls through to the floor grade in both functions.
  - `scoreToGrade` with non-numeric string: `'80' >= 80` is true (string coercion) — does it band correctly for numeric strings? Capture as-is.
  - weightedTotal sums *rounded* per-row values (shared.js:376) — totals can differ from unrounded arithmetic by design.
- **Findings:** _(populated 2026-06-11 from FK-01 — `js/score-grade.test.js`, 75 tests, all green on first run; every pre-seeded candidate confirmed. Ledger reopens if later characterization work finds more.)_

  ### S-1 · Empty or null gradeScale crashes scoreToGradeFromScale
  - Input: `scoreToGradeFromScale(75, [])` and `(75, null)`
  - Expected: graceful fallback (e.g. default thresholds or null)
  - Actual: TypeError — `[]` → `sorted[sorted.length - 1]` is undefined → `.grade` throws (shared.js:173); `null` → `.slice()` throws (shared.js:168). Both asserted with `toThrow(TypeError)`.
  - Suspected cause: no guard; written assuming callers pre-validate.
  - Triage: **bug (latent, unreachable in normal flow)** — `computeScores` only calls it when `config.gradeScale` is a non-empty array (shared.js:331), and `applyGradeOverride` routes through `bandMinimumForGrade` which has its own guard.
  - Action: none now; add a guard at the FK-09 module boundary (separate commit), then update the two characterization tests.

  ### S-2 · Score below every band still earns the lowest band's grade
  - Input: `scoreToGradeFromScale(10, [{High:80},{Low:60}])` → `'Low'`
  - Expected (naive): some "no band" signal for scores under the lowest floor.
  - Actual: lowest band's grade awarded regardless of distance below its floor; negatives included.
  - Suspected cause: deliberate — code comment "If below all bands, return the lowest grade" (shared.js:172).
  - Triage: **intended.**
  - Action: none; documented so FK-09 preserves it.

  ### S-3 · null and '' band as 0; NaN/undefined/'abc' fall through to the same grade
  - Input: `scoreToGrade(null)` → 'D' (via `null >= 0` coercing true); `scoreToGrade('')` → 'D' ('' coerces to 0); `scoreToGrade(NaN)`/`(undefined)`/`('abc')` → 'D' (all comparisons false → fallback return, shared.js:162).
  - Expected: rejection of non-numeric input.
  - Actual: every malformed input lands on 'D' — by two *different* mechanisms that happen to agree on the default scale. On a custom scale both mechanisms also agree (lowest grade), per tests.
  - Triage: **intended-by-coincidence / benign.** Output is stable; the mechanism is fragile.
  - Action: none now; FK-09 boundary should validate numeric input explicitly.

  ### S-4 · Numeric strings are accepted and band correctly
  - Input: `scoreToGrade('80')` → 'A-'; `scoreToGradeFromScale('80', scale)` → 'A-'
  - Expected: type error or 'D'.
  - Actual: JS relational coercion makes string scores work transparently.
  - Triage: **unclear** — harmless today; masks upstream type bugs (e.g. an unparsed input field value would silently band).
  - Action: none now; tighten to number-only at the FK-09 boundary.

  ### S-6 · "Score Rounding" toggle changes computation, not just display *(added 2026-06-11 by INS-3 — ledger reopened per its rule, entry triaged, status stays ☑)*
  - Input: click nav-bar rounding button (Exact / Half marks / Whole marks)
  - Expected (from UI copy): display formatting only — "Scores shown at full precision", chip says "Display: …"
  - Actual: `setRounding` (scorer.html:3185–3193) also sets `config.scoreRounding` and `SA.saveConfig(config)`s it; `computeScores` then rounds per-row weighted scores, the total, and the penalised score in that mode — stored totals and even the banded grade can change with the toggle, and the choice persists to the scorer config for future sessions.
  - Suspected cause: deliberate lockstep design (one toggle drives both systems); the UI copy just undersells it.
  - Triage: **intended (code) / misleading (copy)**.
  - Action: no code change now. Copy fix candidate ("affects calculated totals, not just display") when that nav area is next touched; FK-09's interface spec must treat rounding mode as an *engine input*, not a view preference.

  ### S-5 · No upper cap: scores above 100 band as the top grade
  - Input: `scoreToGrade(105)` → 'A+'
  - Expected: cap or warning at 100.
  - Actual: any score ≥ top floor returns the top grade; no 0–100 range enforcement anywhere in either function.
  - Triage: **intended (caller's responsibility)** — penalty math clamps at 0 but nothing clamps high; overrides could exceed 100 upstream.
  - Action: none; note for FK-09 interface contract.

## INS-5 ☐ localStorage capacity and failure-mode measurement
- **Gates:** FK-10; outcome decides whether a migration card gets created at all.
- **Method:**
  1. Mark 2–3 demo students fully; measure serialized bytes per record (`JSON.stringify` length of the relevant keys).
  2. Extrapolate to 100/300-record cohorts; compare against ~5MB/origin.
  3. Grep scorer.html/shared.js for `try`/`catch` around `setItem` — is QuotaExceededError handled? Surfaced to the user or silent?
  4. Note what else shares the origin's quota (scorers, snippets, cohort).
- **Decision rule:** if a 300-record cohort projects under ~40% of quota AND quota errors are surfaced, no migration card; otherwise open FK-17 (IndexedDB behind a SessionStore interface).
- **Findings:** _(pending)_

## INS-6 ☐ When is rubric_version_hash computed?
- **Gates:** FK-11.
- **Where to look:** `js/moderation-schema.js:82` and wherever that field is populated (moderation-export.js, scorer cohort-save path).
- **Questions:**
  1. Stamped per record at mark/save time, or computed once at export from the *current* rubric?
  2. What feeds the hash (full rubric JSON? weights only?) — does editing a statement bank change it?
  3. Is `fk_version` (line 91) app version or schema version?
- **Findings:** _(pending)_

## INS-7 ☐ What does cohort-insights.js already compute?
- **Gates:** FK-12.
- **Where to look:** `js/cohort-insights.js` (610 lines).
- **Questions:**
  1. Available stats (distributions? per-criterion? per-tutor?).
  2. Are they computed on demand from the cohort store (reusable in-flow) or only inside the insights view?
- **Findings:** _(pending)_

## INS-8 ☐ ARIA usage inventory in scorer.html
- **Gates:** FK-13.
- **Method:** `grep -n "aria-invalid\|aria-describedby\|aria-live\|role=" scorer.html` + skim each cluster.
- **Questions:**
  1. Is validation state set from one place or per-widget?
  2. Any aria-live regions for score updates / focus-mode navigation announcements?
- **Verdict to record:** ad-hoc (open a backlog card) vs adequate (drop FK-13).
- **Findings:** _(pending)_

## INS-9 ☑ Pre-flight for section reorder (FK-05) — positional lookups
- **Gates:** none (FK-05 is safe-now with this as its first task, not a blocker).
- **Method (greps run 2026-06-11):**
  - `grep -n "children\[" scorer.html` → **0 hits**
  - `grep -n "nextElementSibling\|previousElementSibling" scorer.html` → **0 hits**
  - `grep -n "closest(" scorer.html` → 1 hit (1283, `closest('.hidden')` visibility check — order-independent, benign)
  - `grep -in "textContent.*===\|headerText\|matchHeader" scorer.html` → 0 positional header-matching hits (the `textContent` writes at 2757/2764 set the rail label; they don't look anything up)
- **Findings (resolved 2026-06-11):**
  1. **No DOM-positional section lookups remain.** The b00cb54/370a272-era hardening already removed them. Focus-mode navigation is criterion-index based (`focusIdx`, `getElementById('grade-sel-' + i)` etc., scorer.html:2298–2339) — independent of section order entirely.
  2. Scroll-spy rail uses an explicit ID array + IntersectionObserver (4842–4855) — functionally order-independent, but the **rail link markup order (427–434) must be manually re-sequenced** to match the new visual order, or the rail will read out of order.
  3. **Residual hazards for FK-05 (both letter-keyed, not position-keyed):** focus-mode CSS `[data-rail="B"]/[data-rail="D"]` hide rules and C/E/F/G dim rules (118–127) — these break if FK-02 de-letters `data-rail` values, so FK-02 and FK-05 must re-key them together (use href- or id-based attributes); and the focus-enter collapse logic targets `#sec-adjust` by ID (2168–2178) — safe under reorder, verify in runtime anyway.
  4. Conclusion: **FK-05 is safe to implement** — it's a markup-move plus rail re-sequence; runtime validation (Previous/Next/Exit, nav strip, expand/collapse-all) remains the DoD gate.
