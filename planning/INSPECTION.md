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
- **Findings (☑ 2026-06-12, code read + live verification):**
  1. **Full-fidelity.** `saveCurrentStudentToCohort` (scorer.html ~2550) stores: name/studentId/tutor/date, deep-copied `grades` (per-criterion grade + numeric override + flags), `penaltyIdx`, full `scoreResult` via `cloneScoreResultForStorage` (~2598: totals, penalty, override-audit object, per-row grade/midpoint/override/finalScore/weightedScore/tier/descriptor), `feedbackText`, `markerNotes`, `overrideGrade`. Only reduction: each row's `criterion` is `{name, weight}` — rubric text lives in config; rows align with `config.criteria` by index. Live-verified field list on a stored record.
  2. **No load path exists, even unexposed.** View-list rows offer only Remove (~2686); the only readers of `cohort.students` are export, insights, list render, counts/warnings, and clear paths. Greps for any load/restore/reopen pattern and any non-export reader of `record.grades`: zero hits.
  3. **Update in place.** `addToCohort` (shared.js ~1143) keys by `studentMatchKey` (shared.js:1102): `sid:<studentId>` lowercased, fallback `name:<name>`; same key → replace, else push. Live-verified: re-save with same studentId → `replaced:true`, count stable, content updated. **Edge:** a no-ID student whose name is edited gets a new key → sibling record, not an update (FK-07 known-edge).
- **Consequence:** FK-07's fork lands between its arms, on the cheap side — the store needs zero rework; the gap is one inverse function + a View-list "Open" action + an unsaved-work guard. Card rescoped (M), moved to Safe to implement now.

## INS-2 ☑ What do "Moderation Export…" and "Export for Moderation" each do?
- **Gates:** FK-08.
- **Where to look:** both button handlers in scorer.html; `js/moderation-export.js`, `js/moderation-optin.js`, `js/moderation-suppression.js`; `docs/fk_moderation_export_v1.md`.
- **Questions:**
  1. Configure-vs-run, or genuine duplication?
  2. How do opt-in/suppression interact with each ("Disable mod-export" button suggests a tri-state)?
  3. Does Clear Cohort currently confirm before destroying? (feeds FK-06 DoD)
- **Findings:** _(Q1/Q2 pending — Q3 answered 2026-06-11, Phase 0 kickoff)_
  - **Q3: YES — double confirmation already exists.** `confirmClearCohort()` scorer.html:2640–2652: two sequential `confirm()` dialogs (2647, 2648), the first naming the student count and warning "cannot be undone… export first". Caveat: when the cohort is **empty**, it clears silently with no dialog (2642–2646) — harmless but worth knowing. A separate unguarded `SA.clearCohort` call exists at 2853 — appears to be inside a modal-confirm flow; FK-06 implementation should verify that path's guard.
  - O — button markup observed: Clear Cohort is `btn-ghost text-red-600` (1175), last of 8 buttons in one flex row (1166–1176); already partially differentiated by colour but at equal visual weight. Primary candidates per BOARD: Export cohort (btn-blue, 1167), Cohort Insights (1168, hidden until data), View list (1169).
  - FK-06 scope consequence: the "add confirmation" half of the DoD is already satisfied — remaining work is visual demotion/grouping only. ~~Q1/Q2 still gate FK-08 and stay open.~~
- **Findings — Q1/Q2 (☑ 2026-06-12, handlers + modules + doc read; state machine live-verified):**
  - **Q1: configure-vs-run, NOT duplication.** Three lifecycle verbs on one feature: "Moderation Export…" = `showModExportOptIn` (lecturer opt-in/settings modal; always visible; **self-relabels to "Moderation Export settings…" when enabled** — `refreshModExportUI` ~2941); "Export for Moderation" = `runModExport` (builds the privacy-reduced workbook; hidden unless an active opt-in record exists); "Disable mod-export" = `disableModExport` (confirm-guarded opt-out; hidden unless enabled). **Do not consolidate.**
  - **Q2: two persistent states + an in-run privacy gate — not a tri-state.** Opt-in records live in `FK_MOD_EXPORT_OPTINS` keyed `paper::cohort::assessment` (js/moderation-optin.js). Not-opted-in → only the opt-in button shows; opted-in → banner + run + disable appear. Within the enabled state, `runModExport` blocks below `COHORT_MIN_N` (15) with a modal and **no file** — live-verified (block modal shown, count 0). "Suppression" (js/moderation-suppression.js) is the **in-export privacy engine** — pure functions: row shuffling, R-labels, threshold suppression — not a UI state. Doc (`docs/fk_moderation_export_v1.md`, locked 2026-05-08) matches observed behaviour: two-export model, no student/tutor identifiers, complements (not replaces) the identified export.
  - **UX observation (→ FK-08 optional scope):** `_activeOptInRecord` (~2905) matches on the *slug tuple* of cohort label / course name / assessment title — editing any of these silently reverts the UI to not-opted-in. Reads as lost settings to a lecturer; one inline hint in the settings modal defuses it.
- **Consequence:** FK-08 rescoped to copy/affordance polish (S, P2); consolidation explicitly off the table. D-06 validation outcome recorded.

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

## INS-5 ◐ localStorage capacity and failure-mode measurement
- **Gates:** FK-10; outcome decides whether a migration card gets created at all.
- **Method:**
  1. Mark 2–3 demo students fully; measure serialized bytes per record (`JSON.stringify` length of the relevant keys).
  2. Extrapolate to 100/300-record cohorts; compare against ~5MB/origin.
  3. Grep scorer.html/shared.js for `try`/`catch` around `setItem` — is QuotaExceededError handled? Surfaced to the user or silent?
  4. Note what else shares the origin's quota (scorers, snippets, cohort).
- **Decision rule:** if a 300-record cohort projects under ~40% of quota AND quota errors are surfaced, no migration card; otherwise open a migration/hardening card (IndexedDB behind a SessionStore interface). **⚠ ID-collision correction (2026-06-13):** the original rule said "open FK-17" — but FK-17 was reused for the WCAG/axe remediation (shipped PR #22/#23). The card this rule spawns is **FK-24** (see BOARD). Old "FK-17 = IndexedDB" wording is dead; do not revive it.

- **Findings (◐ 2026-06-13, Phase-3 kickoff — Method steps 1–4 worked; step-1 bytes/record is analytical from the exact stored schema, live confirmation is the one item left to ☑):**

  **Step 3 · Failure-mode audit — DISPOSITIVE, fully resolved by code-read.** The three heavy writers persist with a bare `localStorage.setItem` and **no try/catch**:
  | Writer | Line | Guarded? |
  |---|---|---|
  | `saveCohort` (every cohort add/update/remove routes here) | shared.js:1149 | **No** |
  | `saveAllConfigs` (rubric configs; `saveConfig`→here; `setRounding` persists each toggle) | shared.js:309 | **No** |
  | `saveSnippets` (feedback snippet bank) | scorer.html:3244 | **No** |

  Only the *small* auxiliary writers are guarded (draft 1273, focus 2196, section-state 4001, AI-explainer 4034, AI-log shared.js:1105, theme 366, demo-onboarding 366) — i.e. exactly the low-byte keys are protected while the unbounded-growth keys are not. **QuotaExceededError on a cohort/config/snippet write throws uncaught and is never surfaced.** This alone fails the decision rule's second conjunct regardless of cohort size.
  - **Concrete data-loss path (not hypothetical):** `downloadExcel` (scorer.html:2544–2548) calls `saveCurrentStudentToCohort` *after* `SAExcel.exportToExcel`. On quota exhaustion the marker sees a **successful .xlsx download**, then an uncaught throw, and the student is **silently absent from the cohort** — the export they trust as the canonical save did not persist the record. `getCohort` (shared.js:1140) also swallows a corrupt/oversized blob to `null` (catch → null), which downstream reads as "empty cohort".

  **Steps 1–2 · Capacity model — analytical, derived from the exact stored record shape** (`saveCurrentStudentToCohort` scorer.html:2586–2597 + `cloneScoreResultForStorage` 2615–2646; `studentGrades` row shape `{grade,override,overrideManual,autoFilled}` 1437):
  - Structural (everything except free text), 8-criterion rubric: metadata ~0.25 KB + `grades` 8×~55 B ~0.44 KB + `scoreResult` scalars/penalty/override ~0.42 KB + `rows` 8×~0.3 KB (each carries `criterion{name,weight}` + grade/midpoint/override/finalScore/weightedScore/tier/**descriptor**, the level-descriptor text being the biggest row contributor) ~2.4 KB ≈ **~3.4 KB/record structural**.
  - Free text dominates: `feedbackText` is multi-paragraph (INS-10 measured real values to **7,975 chars**); `markerNotes` 0–~1.5 KB.
  - Per-record: light ~4.5 KB · **typical ~6–7 KB** · heavy ~13 KB.
  - Extrapolation (chars ≈ bytes; note localStorage stores **UTF-16 internally**, so true footprint and several browsers' quota accounting run ~2×): **100 records** ~0.6–1.3 MB · **300 records ~1.9–3.9 MB**.

  **Step 4 · Shared-origin load:** the cohort is **not alone** under the ~5 MB origin cap. Same-origin keys (all `SA_*` / `scorer.usage.*`): `SA_CONFIGS` (rubric configs — unbounded), `SA_SNIPPETS`, `SA_AI_LOG` (capped at `AI_LOG_MAX`), per-scorer `SA_COHORT_<id>` (**one per rubric** — a marker with several rubrics carries several cohorts), plus credentials/usage/section/focus/draft/theme. Configs + multiple cohorts are the two unbounded consumers competing for the same budget.

  **Quota basis (the decisive uncertainty):** spec floor ~5 MB/origin, but Chromium-family accounting counts UTF-16 bytes (~2 B/char ⇒ effective ~2.5M chars). Against that conservative basis a 300-record **typical** cohort (~2.0M chars) is **~80%** of quota and a **heavy** one (~3.9M) **exceeds it and throws**; against the optimistic 5M-char basis, typical ≈ 40% (right on the threshold) and heavy ≈ 78%. Either way the 40% line is at-or-over once feedback is long and a second cohort/config load is present.

  **Verdict (feeds FK-10):** decision rule → **GO on a card**, but the dispositive trigger is the *unhandled-quota* half, and the right remedy is **split** to avoid INS-5's own "wasted migration" risk:
  - **FK-24 (new, P1, S) — storage-write quota hardening, now.** Wrap the three heavy writers in try/catch; on `QuotaExceededError` surface a blocking, actionable message ("Storage full — export your cohort to free space") and an escape hatch; fix the `downloadExcel` ordering so a save failure is reported, not masked by the just-completed download. Independent of cohort size — fixes a present data-loss bug.
  - **IndexedDB migration — deferred/conditional, NOT carded yet.** Only justified if real cohorts approach the size band; revisit if/when a live cohort crosses ~150 records or a quota event is observed in the field. Behind a `SessionStore` interface if taken (FK-15 extract-on-contact seam).

  **One item left to ☑ (does not block the FK-10 verdict):** live bytes/record confirmation. 60-second harness — on the demo scorer with a few students saved, paste into devtools console:
  ```js
  const k = Object.keys(localStorage).find(k => k.startsWith('SA_COHORT_'));
  const c = JSON.parse(localStorage.getItem(k));
  const total = localStorage.getItem(k).length;
  console.log({records: c.students.length, totalChars: total, perRecord: Math.round(total / c.students.length)});
  ```
  Expect perRecord ≈ 6–7k for realistic feedback. If it lands far from the model, reopen the verdict; the failure-mode half stands regardless.

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

## INS-8 ◐ ARIA usage inventory in scorer.html
- **Gates:** FK-13.
- **Method:** `grep -n "aria-invalid\|aria-describedby\|aria-live\|role=" scorer.html` + skim each cluster.
- **Questions:**
  1. Is validation state set from one place or per-widget?
  2. Any aria-live regions for score updates / focus-mode navigation announcements?
- **Verdict to record:** ad-hoc (open a backlog card) vs adequate (drop FK-13).
- **Findings:** _(◐ 2026-06-12 — external production axe audit supplies the violation inventory; the ARIA-centralization questions above remain open)_
  - Full-coverage axe 4.10.2 run against production post-PR-#21 (demo-loaded scorer, `?id=demo-written-response-v2`): **4 rule IDs / 78 nodes** — color-contrast 55 (mostly `text-slate-400` hint/label text, plus `btn-blue`/`btn-green`/`bg-emerald-600` white-on-#059669 ≈3.9:1, amber-600 builder hint, footer styles), label-title-only 5 (student fields + penalty select: visible labels lack `for=`), region 17 (no `<main>`/landmark structure), link-in-text-block 1 (Ko-fi). Report + raw JSON: `planning/Axe test after PR20/`.
  - **Triage: all pre-existing — zero introduced by PR #20/#21.** The PRs changed labels/structure on some flagged elements but no colours; everything the PRs *added* passes (`.btn-danger`, FK-04 legend and cue). The external report's §2 guess that footer/citation hits came from PR #21 is wrong — those files weren't in either PR's diff.
  - **Harness coverage gap found:** bbp-a11y-tests.mjs tests `/scorer.html` with no `?id=` — the no-config page — so all prior local baselines covered only a fraction of the real marking UI. Fixing the harness URL is step 1 of any remediation (→ FK-17).
  - Remediation scoped as **FK-17** on the board. INS-8 stays open for the centralization questions, which still gate FK-13's verdict.

## INS-10 ◐ Moodle grading-worksheet format + round-trip semantics
- **Gates:** FK-19. Scope/effort can't be set until this resolves.
- **Method:** user downloads one real offline grading worksheet from their Moodle instance (assignment with "offline grading worksheet" enabled) + notes the Moodle version. Then map and answer:
- **Questions:**
  1. Exact column set and formats (Identifier, Full name, Email?, Status, Grade, Maximum grade, Last modified, Feedback comments — confirm against the real file; encoding; CSV vs xlsx acceptance on upload).
  2. Round-trip key: is the Identifier (`Participant NNNN`) stable per student per assignment, and how should it map onto cohort `studentMatchKey` (likely a new `moodle:` key prefix vs reusing `sid:`)?
  3. Grade mapping: assignment max-grade vs FK's /100 + letter — scale, round, or both? Where do FK's display-rounding settings interact (INS-4 S-6: rounding changes stored totals)?
  4. Re-upload semantics: how does Moodle treat rows whose "Last modified" predates a Moodle-side change — silent skip, error, overwrite? What must FK preserve verbatim for the upload to be accepted?
  5. Feedback comments cell: plain text vs HTML; length limits; newline handling (FK feedback is multi-paragraph).
- **Findings (◐ 2026-06-12 — Q1–Q4 answered from a real worksheet; structural analysis only, no student data quoted; the CSV itself is gitignored and must never be committed):**
  - **Artefact:** real MRKTG101-26A assignment worksheet (a /100, completed+released assignment; 55 rows, all graded). UTF-8 **with BOM**, comma-delimited, quoted fields. The user's draft question set (`Draft INS10 copy.md` in the same folder) was used as the checklist.
  - **Q1 · Schema (14 columns, exact order):** `Identifier · Full name · ID number · Email address · Status · Group · Marker · Grade · Maximum grade · Marking workflow state · Grade can be changed · Last modified (submission) · Last modified (grade) · Feedback comments`. Editable on upload: **Grade + Feedback comments only**; everything else must be preserved verbatim (incl. header row, column order, BOM). `Status` is composite text (submission state · lateness phrase · release state); `Last modified (grade)` is long-form locale text ("Thursday, NN June NNNN, NN:NN PM").
  - **Q2 · Key mapping:** `Identifier` = `Participant NNNNNNN` (per-course participant id) on every row — that's Moodle's upload key and must round-trip untouched. **`ID number` is a 7-digit institutional student ID, populated on 55/55 rows — exactly FK's `sid:` convention** (the scorer's own placeholder is 7-digit). Mapping rule: import sets FK `studentId` = `ID number` (key `sid:<id>`), and stores `Identifier` on the record (e.g. `moodleIdentifier`) so export rebuilds rows by Moodle's key regardless of FK's. Edge cases: blank `ID number` → fall back to Identifier-as-studentId; **anonymous-marking variant unverified** (would blank names and possibly ID number) — confirm only if that mode is ever used.
  - **Q3 · Grades:** numeric `NN.NN` (2dp), `Maximum grade` = 100.00 on this assignment → FK's `penalisedScore` maps 1:1. Letter grades not in play on this instance's worksheet. **v1 recommendation: support max=100 only; refuse/warn on other maxima** (scaling deferred). Export writes the stored `penalisedScore` (the computed value — display rounding S-6 must not alter it further). Moodle enforces 0..max on upload.
  - **Q4 · Feedback column:** single CSV cell, plain text in all 55 real values (no HTML tags), longest **7,975 chars** (so FK-length feedback fits), **no embedded newlines in the sample** — whether Moodle round-trips multi-paragraph cell content is the key untested behaviour for FK's multi-paragraph `feedbackText`; test with fake data at FK-19 build. **Privacy DoD confirmed: export populates `feedbackText` only — never `markerNotes`, never moderation data.**
  - **Queue-design facts for FK-07 (free findings):** worksheets can arrive with `No submission` rows (queue needs a distinct non-markable state) and with already-graded/released rows (import must decide: skip, import-as-marked, or warn — product question for FK-19). Lateness lives in `Status` as text — tempting as a late-penalty auto-fill, explicitly **out of scope v1** (penalty stays marker-chosen).
  - **Q5 · Upload/rejection semantics: still open** — not answerable from the artefact. Needs: Moodle version (ask user), institution upload docs, and a controlled fake-data upload test at FK-19 kickoff (file-type acceptance, malformed-row behaviour: whole-file reject vs row skip, multi-line cell round-trip).
- **Remaining to ☑:** Q5 controlled test + Moodle version + anonymous-marking variant check.
- **Artefact hygiene (closed 2026-06-12):** user anonymised the original (synthetic names/emails, feedback wiped; verified) — it stays gitignored regardless, since its 7-digit ID numbers may still be real. **`fixture-moodle-worksheet-fake.csv` is the committed test fixture**: 12 fully synthetic rows preserving the exact header/BOM/CRLF/quoting, covering — ungraded submitted rows · a late-submission Status variant · a No-submission row · a blank-ID-number row (key-fallback edge) · two pre-graded rows, one with **multi-paragraph quoted feedback** (the Q5 round-trip probe) and one with ~2.3k-char feedback. Q5's controlled upload test = upload this fixture to a sandbox Moodle assignment and observe acceptance/rejection per row.

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
