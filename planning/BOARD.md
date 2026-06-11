# FK Improvement Board

Working board. Card IDs are stable — refer to them in commits/notes as `[FK-xx]`.
Evidence types: **O** = Observed (screenshot/repo), **I** = Inferred, **U** = Unknown.
Inspection refs point to `INSPECTION.md` items (INS-x).

Column counts (2026-06-12, post-FK-17): Safe to implement now: 1 (FK-09) · Needs inspection: 6 · Backlog: 3 (FK-16 watch slice done) · Ready to document: 7 (6 shipped + FK-17 awaiting promotion) · others: 0

---

## Safe to implement now

### FK-17 · WCAG AA pass: contrast, programmatic labels, landmarks (from 2026-06-12 production axe audit)
- **Rationale:** Full-coverage production axe run (demo-loaded scorer — see INS-8 findings) surfaced 4 rule IDs / 78 nodes, all pre-existing: `text-slate-400` hint/label text fails 4.5:1 across all three pages; `btn-blue`/`btn-green`/`bg-emerald-600` are white-on-#059669 ≈3.9:1; 5 form fields are `title`-labelled only (`for=` missing); no landmark structure (`region` ×17); Ko-fi link colour-only. Evidence + per-node selectors: `planning/Axe test after PR20/` (report + raw JSON).
- **Evidence:** O — axe 4.10.2 vs production 2026-06-12; triaged zero-new vs PR #20/#21.
- **Dependencies:** none hard. **Step 1 is the harness fix:** point bbp-a11y-tests.mjs's Scorer entry at `/scorer.html?id=demo-written-response-v2` (requires seeding the demo config in the test browser context) and capture a fresh local baseline — otherwise the remediation can't be diffed. Brand interaction: button/emerald changes touch brand colours (fk-tokens, D1/D3 territory) — darken within the token family (e.g. emerald-600→700) rather than inventing new colours; canon/tokens note on touch.
- **Risk:** Low-Medium — broad cosmetic surface (55 contrast nodes), but fixes are mechanical: slate-400→slate-600 for informational text (reserve slate-400 for decorative/disabled), amber-600→amber-700, darken button backgrounds one step, add `for=` to the 5 labels, wrap pages in `<header>`/`<main>` landmarks, always-underline the Ko-fi link. The landmark wrap overlaps fk-decisions.md D8 (`region` full-surface restructure, parked P2) — **correction at promotion review 2026-06-12: it *narrows* D8, not closes it** (D8's scope is the CD preview-component surfaces and its decision block is unsigned); cross-ref note added on the PR branch.
- **DoD:** harness tests the demo-loaded scorer; axe (full coverage) shows 0 violations of the four rule IDs on Home/Builder/Scorer, or each remaining node is explicitly waived with a reason; no visual regressions per screenshot pass; Jest green; sentence-case/canon respected on any copy touched.
- **Done 2026-06-12 (three commits: `dfab1a7` harness · `6f99c72` contrast · `41e48d7` labels/landmarks):** harness now scans the demo-loaded scorer (seeded from index.html's own DEMO_SCORER, no clicks); bulk slate-400→600 in scorer+builder, buttons #059669→#047857, builder amber-600→700, dark-footer text lightened to #94a3b8, index CTA emerald-700, Ko-fi links always-underlined; `for=` on all five title-only fields; scorer chrome wrapped in `<header>` with rail as `<nav aria-label="Sections">`, sr-only h1 into `<main>`, named-section landmarks for both onboarding banners, region roles on sticky/utility bars; `#snippet-select` aria-label (select-name, critical) and `#framework-label-chip` aria→title (aria-prohibited-attr) — **scope addition:** those two rules were local-only finds beyond the audit's four.
- **Validated:** full-coverage harness **0 violations / 0 waivers on all three pages** (was 84 nodes, 6 rules); keyboard 15/15; runtime battery green (focus nav, rail scroll-spy, expand/collapse-all, grade→penalty→recalc→sticky); light+dark screenshots clean; Jest 98/98; `main details` selectors verified intact.
- **Recorded exceptions/notes:** dark-hero demo/import links keep slate-400 (dark bg, unflagged — darkening would worsen contrast); utility bar uses `role="region"` not `<footer>` (footer.js owns the page's single contentinfo); builder landmark edits rode the contrast commit; **fk-decisions.md D8 closure note is deferred to promotion time** — the planning-branch copy of fk-decisions.md predates Addendum F, so the note must be added on the PR branch cut from main, same pattern as the Addendum F promotion.
- **SHIPPED 2026-06-12:** PR [#22](https://github.com/stephendmann/feedback-kitchen/pull/22) merged (`ec1ea09`), production verified (labels, landmarks, emerald-700 CTA, underlined Ko-fi all live). The deployed app is at **0 axe violations at full coverage**.
- **Column:** Ready to document (2026-06-12). **Priority:** P1. **Effort:** M (actual: M).

### FK-02 · Fix section-lettering / onboarding-banner mismatch
- **Rationale:** Banner teaches A·Student, B·Rubric, C·Penalty, D·Feedback, E·Notes; the page has decayed further than first observed. First-run users are directed by an incomplete map.
- **Evidence:** O (refined 2026-06-11, code read) — banner lists A–E only (scorer.html:344–348); page actually has **nine** lettered/badged blocks: A Student (465), B Rubric (498), C Penalty (547), ◎ Focus (610), D Feedback draft (705), E Notes (869), **F Wording assistant (883) AND F Finish (1115) — duplicate letter F**, G Cohort (1139). B/D are hidden *in focus mode only* (CSS 118–120), not gone. Focus-mode CSS keys off letters: `[data-rail="B"]/[data-rail="D"]` (120–122) — load-bearing, must be re-keyed when de-lettering.
- **Dependencies:** D-02 **resolved 2026-06-11: de-letter** (see DECISIONS.md for grep evidence). Coordinate with FK-05 (section reorder) to avoid touching the rail twice; re-key the focus-mode CSS selectors in the same change.
- **Risk:** Low. Banner copy, section badges, rail labels, and four CSS selectors.
- **DoD:** Banner list matches on-page sections 1:1 (including Focus, wording assistant, Finish, Cohort); nav strip matches; `data-rail` selectors re-keyed (no letter-valued `data-rail` left); README "Section F" wording (lines 164, 231) reworded; REVIEW.md:21 stale rail checklist updated; no stale letter references (`grep -n "· Student\|· Rubric\|· Penalty\|· Feedback\|· Notes" scorer.html` returns nothing letter-prefixed); checked in dev server.
- **DoD deviation (recorded per conflict rule):** banner matches *visible* sections 1:1 — the wording-assistant section is omitted from the banner because `sec-ai` is legacy and hidden by default behind "Show advanced wording tools" (scorer.html:880, `display:none`); teaching a hidden section in onboarding would mislead. All other DoD lines met as written.
- **Done 2026-06-11:** focus CSS re-keyed to section slugs (`data-rail="rubric"` etc.) before markup changes; all nine step-badges de-lettered (◎ Focus glyph kept); banner rewritten to 8 visible sections in page order; rail labels plain names; JS cohort rail label writer updated; unused badge colour variant CSS removed; README/REVIEW.md reworded. Runtime-validated in dev server: focus enter/exit hides Rubric+Feedback rail entries and dims secondaries, Previous/Next navigates criteria, console clean. A11y baseline diff: **zero new violations, one pre-existing color-contrast violation removed.**
- **Column:** Ready to document (2026-06-11). **Priority:** P0. **Effort:** S (actual: S).

### FK-03 · Copy/casing consistency pass
- **Rationale:** "New Student" (header) vs "New student" (footer); duplicate "Exact" rounding badges. Minor, but the repo has a brand-canon process this drifts from.
- **Evidence:** O — both screenshots.
- **Dependencies:** none. Cheap rider on FK-02's PR.
- **Risk:** Negligible.
- **DoD:** One casing rule applied; brand-voice-canon.md consulted for the rule; visual check in dev server.
- **Done 2026-06-11:** canon had **no** casing rule — added "§7 UI Control Casing — Sentence Case" to brand-voice-canon.md, then applied: "New Student" → "New student" (header button, banner closing line, modal comment, README §5); duplicate "Exact" disambiguated — the read-only status chip now reads "Display: exact" (markup + the JS writer at ~3166 that overwrites it), nav-bar button unchanged. Visual check in dev server (screenshot).
- **Residuals (recorded, not scope-crept):** `index.html:323` "New Student" (outside this session's agreed file scope); field labels still Title Case ("Student Name", "Late Submission Penalty", "Grade Override", "Score Rounding") — normalise on next touch per the canon rule's "on next touch" convention.
- **Column:** Ready to document (2026-06-11). **Priority:** P3. **Effort:** S (actual: S).

### FK-04 · Non-color signal + legend for yellow "awaiting input" fields
- **Rationale:** Empty/required state appears to be conveyed by yellow fill alone; colorblind/low-vision markers lose the signal. (Meaning of yellow is inferred — confirm while implementing.)
- **Evidence:** O (refined 2026-06-11) — yellow is the static class `.cell-yellow` (`background:#fefce8 !important`, scorer.html:51) applied to exactly 5 inputs: student-name (473), student-id (478), student-tutor (483), late-penalty-select (555), grade-override (594). It is **always-on for marker-input fields**, not a dynamic empty/awaiting state — i.e. yellow means "you type here", which still fails colour-only signalling. I — that markers read it as "awaiting input". Note: the existing "Wording key" button (408) is the AI-assistant *credentials* dialog, NOT a legend — the legend in this card's DoD must be new UI, do not overload that term.
- **Dependencies:** none.
- **Risk:** Low. If yellow means something else, the fix is renamed, not removed.
- **DoD:** Each `.cell-yellow` field also carries a non-color cue (icon/text/border treatment) and the state is explained once on screen in a small legend (named something other than "wording key"); axe run shows no new violations.
- **Done 2026-06-11:** meaning re-confirmed (static marker-input convention, all 5 fields, no dynamic usage). Cue: 3px amber left border on `.cell-yellow` (inline CSS, `!important` so it survives `:focus` recolouring — verified). Legend: "✎ Tinted fields are marker inputs." appended to the Student section's intro line (amber text, ✎ aria-hidden). Dark mode verified: existing `.fk-dark` overrides keep tint + legend visible; the amber border persists.
- **Observation (recorded, no action):** `.grade-select` / `.override-input` in rubric rows share the yellow convention but already carry full amber borders of their own — covered by the legend's wording, no extra cue added.
- **Validated:** computed-style checks (cue 3px solid #d97706, survives focus), a11y baseline diff zero new violations on all pages, Jest 98/98.
- **Column:** Ready to document (2026-06-11). **Priority:** P3. **Effort:** S (actual: S).

### FK-05 · Reorder sections to task sequence (Student → Rubric/Focus → Penalty → Feedback → Notes → Wording assistant → Finish → Cohort)
- **Rationale:** Penalty & override currently renders above the marking block; marker task order is score-then-penalise. Forces a per-student visual skip and risks anchoring.
- **Scope note 2026-06-11:** earlier order shorthand ("Student → Marking → Penalty → Notes → Finish → Cohort") omitted the Feedback-draft and Wording-assistant sections, which exist on the page. Full target order recorded above; the only *move* is Penalty (`#sec-adjust`) from before the rubric/focus blocks to after them — everything else already sits in task order.
- **Evidence:** O — screenshot 1 order + code read (section `<details>` blocks at 463/496/545/~600/703/867/~880/~1110/1134). Impact magnitude unmeasured (Medium confidence).
- **Dependencies:** INS-9 **resolved 2026-06-11 — no positional lookups remain**; focus nav is criterion-index based and order-independent. Remaining coupled items: rail markup order (~427–434) must be re-sequenced manually. ~~Letter-keyed focus CSS is FK-02's re-key job~~ — **done 2026-06-11: FK-02 re-keyed `data-rail` to section slugs (`student`/`rubric`/`focus`/`adjust`/…), so the focus CSS is now order- and letter-independent; FK-05's only remaining rail task is re-sequencing the link markup.**
- **Risk:** Downgraded to Low-Medium per INS-9 — runtime validation still mandatory.
- **DoD:** New order live; focus-mode Previous/Next/Exit, expand/collapse-all, and nav strip all work in dev server; lettering/naming (FK-02) consistent with new order.
- **Done 2026-06-11:** `#sec-adjust` block (58 lines incl. comment) moved below the focus-workspace section; DOM order now student → rubric → focus → adjust → feedback → notes → (hidden ai) → export → cohort. **The rail needed no re-sequencing** — FK-02 had left it pre-ordered for exactly this layout (verified, not edited). Banner bullets swapped to match (Focus before Penalty), preserving FK-02's banner-matches-page-order DoD. Rider: three leftover letter comments FK-02's grep pattern missed (`─ C.`, `─ D.`, "sections B + D") de-lettered.
- **Validated:** INS-9 re-greps still zero positional lookups; dev server: focus Previous/Next (criterion 1↔2), exit/re-enter focus, collapse-all/expand-all, grade→penalty→recalculate→sticky-bar chain (A → 23.1, −10 penalty → 13.1, chip "1 of 5 graded"); console clean; Jest 98/98; a11y baseline diff: zero new violations on all three pages.
- **Column:** Ready to document (2026-06-11). **Priority:** P1. **Effort:** S–M (actual: S).

### FK-06 · Demote/guard "Clear Cohort"; group cohort actions visually
- **Rationale:** Destructive action sits at equal weight among 8 peer buttons. *Partial* fix only — merging/renaming the "Moderation Export…" / "Export for Moderation" pair stays gated on INS-2.
- **Evidence:** O (refined 2026-06-11) — screenshot 2 button row; **Clear Cohort already double-confirms** (`confirmClearCohort()` scorer.html:2640–2652, two `confirm()` dialogs naming the student count). Empty-cohort path clears silently (2642–2646, harmless). One other `SA.clearCohort` call at 2853 inside a modal flow — verify its guard during implementation. See INS-2 findings (Q3).
- **Dependencies:** none for the demote/guard portion.
- **Risk:** Low. Scope is now visual-only: demote/group; the guard exists and just needs runtime verification.
- **DoD:** Clear Cohort visually separated (danger styling or overflow), existing double-confirmation verified in runtime (incl. the 2853 path); primary actions (Export, Insights, View list) visually primary; runtime check.
- **Done 2026-06-11:** button row regrouped — primaries first, moderation trio behind a divider (labels/behaviour untouched, INS-2 still gates semantics), Clear cohort right-isolated (`ml-auto`) with new `.btn-danger` class. **Discovery:** the old `text-red-600` utility never actually applied — the inline `.btn-ghost` rules load after Tailwind and win the cascade, so the button was plain grey all along; `.btn-danger` lives in the same inline block so it wins deterministically. Label sentence-cased "Clear cohort" per canon §7 (the on-next-touch moment). "2853 path" identified as `wipeCohortAfterExport` — export-gated (only offered after a successful export, scorer.html:2632) and confirmed via a proper modal (4546–4560); safe by design.
- **Validated (runtime, stubbed `confirm`):** empty cohort → 0 dialogs, non-destructive no-op; cancel at first dialog → nothing deleted; accept-then-cancel → nothing deleted; accept both → cohort cleared. Danger styling computed-verified (red-50 bg / red-700 text / red-200 border); Clear cohort focusable and last in tab order; a11y baseline diff: zero new violations; Jest 98/98.
- **Column:** Ready to document (2026-06-11). **Priority:** P1. **Effort:** S (actual: S).

---

## Needs inspection

### FK-07 · Class-list queue + record re-entry (the workbench upgrade)
- **Rationale:** Largest workflow gap vs ideal: no visible way to see who's marked, jump to a student, or re-open a record. Converts "form you reset" into "workbench you work through".
- **Evidence:** O — single-record model in screenshots ("0 of 5 graded", New Student reset). U — whether cohort records already round-trip (View list may allow re-edit).
- **Dependencies:** **INS-1** (cohort store round-trip). Scope forks on the answer: re-edit exists → IA/discoverability work (M); append-only → data-model + UI work (L).
- **Risk:** High if started blind — could rebuild a path that exists, or underestimate a store rework.
- **DoD (provisional, re-write after INS-1):** marker can import/paste a class list, see per-student status, open any record back into the marking session, and re-export without duplicate cohort rows.
- **Column:** Needs inspection. **Priority:** P1. **Effort:** M–L (fork).

### FK-08 · Resolve the moderation-export button pair
- **Rationale:** "Moderation Export…" and "Export for Moderation" read as duplicates; may be configure-vs-run. Consolidate or relabel.
- **Evidence:** O — both buttons in screenshot 2. U — behaviors.
- **Dependencies:** **INS-2** (read both handlers + `docs/fk_moderation_export_v1.md`).
- **Risk:** Medium — hiding a step moderators rely on.
- **DoD:** Either one button + clear secondary, or two distinctly-named actions whose labels state the difference; doc page matches.
- **Column:** Needs inspection. **Priority:** P1. **Effort:** S–M after inspection.

### FK-09 · Harden the scoring-engine boundary (test what's extracted; wrap the DOM glue)
- **Rationale (rescoped 2026-06-11 per INS-3 ☑):** ~~the high-stakes arithmetic lives inline in the monolith~~ — INS-3 found the arithmetic core **already lives in shared.js as pure functions** (`computeScores` :325, `applyGradeOverride` :194, `scoreToGrade[FromScale]` :158/:167, `formatScore` :1188 — no DOM, no storage). What remains inline in scorer.html is orchestration: `recalculate()` reads two authoritative inputs *from the DOM* (`#grade-override` letter, `#late-penalty-select` index) and fans results out to ~20 DOM writes. FK-09 is therefore: (a) add input-validation guards at the engine boundary (INS-4 S-1 empty-scale crash, S-4 string tolerance decision, S-5 no-cap contract); (b) lift the DOM-read glue into a thin explicit-args adapter so the pipeline is callable headless; (c) edge-case test suite over the existing engine. Rounding mode is an **engine input**, not a view preference (INS-4 S-6).
- **Evidence:** O — INS-3 findings (caller table, state inventory, DOM-as-state note, two-rounding-systems doc) in INSPECTION.md.
- **Dependencies:** FK-01 ✓ (regression net in place); INS-3 ✓. Unblocked — ready to schedule (Phase 2 per roadmap).
- **Risk:** Low-Medium (down from Medium) — no verbatim-extraction step for the core remains; behaviour-change risk now concentrated in the adapter lift and the guard semantics (guards change S-1/S-4 behaviour deliberately, each in its own commit with the characterization tests updated alongside).
- **DoD:** engine boundary takes explicit args (no DOM reads in the score path); guards added with tests; characterization suite green pre/post; edge-case tests added (override × penalty × each rounding mode); no behavior diff in dev server on the demo scorer. **Flag — not silently dropped:** the original DoD's "D5 ±1 drift" test item is untestable in this repo (D5 lives in the CD-side rubric-editor preview component, absent here — INS-3 Q4); decide at FK-09 kickoff whether to drop it formally or gate it on that component's integration.
- **Column:** Needs inspection → **Safe to implement now** (gating inspection resolved). **Priority:** P0. **Effort:** S–M (down from M).

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
- **Evidence:** I — single commit. U — actual aria usage breadth.
- **Dependencies:** **INS-8**; meaningful fix lands with/after FK-15 state model.
- **Risk:** Low — audit only.
- **DoD:** inventory of aria-invalid/aria-describedby/aria-live usage in scorer.html with a verdict: ad-hoc (→ backlog card to derive from validation model) or fine as-is (→ drop).
- **Column:** Needs inspection. **Priority:** P3. **Effort:** S.

---

## Backlog

### FK-14 · Persistent collapsed draft pane in focus mode
- **Rationale:** Student-facing draft accumulates behind "Open full draft"; tone/repetition issues surface only if the marker remembers to open it. (Backlog rather than Safe-now because the focus block is freshly merged and screen-space cost needs a prototype, not because evidence is lacking.)
- **Evidence:** O — focus block UI + "written straight into the full feedback draft" caption.
- **Dependencies:** none hard; prototype against the demo scorer. Sequencing: after FK-05 settles section layout.
- **Risk:** Medium — focus mode exists to *reduce* on-screen noise; a draft pane works against that. Collapsed-by-default with a live line-count/preview is the mitigation hypothesis.
- **DoD:** collapsed pane showing draft tail/preview, expandable inline, live-updating; keyboard reachable; self-test across a full 5-criterion mark.
- **Column:** Backlog. **Priority:** P1. **Effort:** M.

### FK-15 · Incremental scorer decomposition (ES modules + state→render)
- **Rationale:** 4,975 lines / 20 inline script blocks / 261 functions / DOM- and text-anchored cross-feature lookups (per the index-anchored hardening commit). Strangler-fig extraction, not rewrite.
- **Evidence:** O — structure + commit history (one hardening commit = thin trend evidence; see validation gate).
- **Dependencies:** FK-09 is the first extraction and the template for the rest; INS-3 informs boundaries — **INS-3 ☑ 2026-06-11: the boundary picture is better than assumed.** Module-level score state is small and single-writer-dominated (`scoreResult`/`latePenaltyIdx` written only by `recalculate`); the coupling hot-spots are (1) DOM-as-state inputs (`#grade-override`, `#late-penalty-select`) and (2) the feedback-draft splice state (`lastScoreResult`/`lastGeneratedText`). Extract-on-contact should target those two seams first; the arithmetic core needs no extraction (already shared.js). **Validation gate before committing to the full program:** tag the next ~5 scorer bugs by cause; proceed broadly only if coupling-related bugs recur.
- **Risk:** Medium — refactor churn without user-visible payoff if the monolith is actually stable.
- **DoD (program-level):** each touched feature extracted as a module on contact; scorer.html line count monotonically decreasing (tracked per PR); no Date-of-big-bang rewrite.
- **Column:** Backlog. **Priority:** P2. **Effort:** L (amortized).

### FK-16 · Styling consolidation onto token/Tailwind build + CSS watch task
- **Rationale:** Three coexisting systems (tailwind.out.css, shared.css, inline workaround styles — the stale-build footgun is documented in working memory). Consolidate on the token build the ADR work already invested in.
- **Evidence:** O — css/ contents; memory note on build staleness.
- **Dependencies:** none hard; do opportunistically alongside FK-15 contact-extractions. The watch task is a same-day standalone win — **and is already half-done: `watch:css` exists in package.json:7** (2026-06-11 read). The slice reduces to wiring it into the dev workflow: a combined `dev` script (watch:css + `node dev-server.js` concurrently) and a README/dev-notes line, killing the stale-build footgun.
- **Risk:** Low-medium — visual drift during migration; existing screenshot baselines mitigate.
- **DoD:** watch task running with dev server ✓ (slice done 2026-06-11); migration policy written (new styles → tokens/Tailwind only; shared.css frozen, shrink-on-touch); screenshot diffs clean.
- **Watch-task slice done 2026-06-11:** `npm run dev` script added (dev-server.js); `watch:css` hardened to `--watch=always` (the bare `--watch` exits when stdin closes — non-TTY contexts silently got no watcher); README gained a "Local Development" section documenting the two-terminal workflow and the stale-build footgun explicitly. Verified: watcher rebuilds tailwind.out.css on source change while the dev server runs. **Residual noted:** watch output is unminified (only `build:css` passes `--minify`) — run `npm run build:css` before committing the artifact; folded into the future migration-policy text.
- **Column:** Backlog (watch-task slice: **done**; remaining scope is the styling migration). **Priority:** P3. **Effort:** M amortized.

---

## In progress
*(empty)*

## Validate in runtime
*(empty)*

## Ready to document

*FK-02, FK-03, FK-04, FK-05, and FK-06 are also in this column as of 2026-06-11 — their full cards (with Done/Residual notes) remain in place under "Safe to implement now" above; the **Column** field on each card is authoritative.*

> **SHIPPED 2026-06-12:** everything in this column (FK-01…FK-06 + FK-16 watch slice) merged to main via PR [#20](https://github.com/stephendmann/feedback-kitchen/pull/20) and PR [#21](https://github.com/stephendmann/feedback-kitchen/pull/21); production verified. Decisions promoted to fk-decisions.md Addendum F; planning snapshot at `docs/planning-202606/` on main. These cards are candidates for pruning at the Phase-1 board refresh (per README promotion rule).

### FK-01 · Characterization tests for scoreToGrade / scoreToGradeFromScale — DONE 2026-06-11
- **Outcome:** `js/score-grade.test.js` — 75 characterization tests; full suite 98/98 green. Zero source changes needed (both functions already exported on `window.SA`, shared.js:1201). Surprises S-1…S-5 recorded in INS-4; none fixed in the test commit (no-silent-fixes rule held). D-01 validation outcome recorded.
- **DoD check:** all grade-band boundaries (±0.01 each floor) ✓ · both functions ✓ · default thresholds + custom scale (shuffled NZ-mirror, sparse 3-band, floored) ✓ · malformed input (null, undefined, NaN, negative, >100, numeric/non-numeric/empty strings, empty/null scale) ✓ · suite green ✓ · surprises → INS-4 ✓.
- **Column note:** skipped *Validate in runtime* — test-only card, no runtime surface; suite green is the validation.
- **Was:** Safe to implement now. **Priority:** P0. **Effort:** S (actual: S).

*(promotion rule in README.md applies)*
