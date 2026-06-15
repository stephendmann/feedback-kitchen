# FK Improvement Board

Working board. Card IDs are stable — refer to them in commits/notes as `[FK-xx]`.
Evidence types: **O** = Observed (screenshot/repo), **I** = Inferred, **U** = Unknown.
Inspection refs point to `INSPECTION.md` items (INS-x).

Column counts (2026-06-16): Safe to implement now: 0 · Needs inspection: 0 · Backlog: 2 (FK-15 · FK-16) · Ready to document: 1 (FK-10, fully closed) · In progress: 0 · Shipped: 36 · others: 0. Next free card ID: FK-38. *(Latest: FK-37 #61 (rounding control single-line + dynamic helper) shipped 2026-06-16. FK-36 superseded; FK-35 #59, FK-34 #58 this cycle.)*

> Board pruned 2026-06-12 at the Phase-1 refresh: shipped cards are one-line
> tombstones in **Shipped** below. Full card history: git log of this file and
> `docs/planning-202606/` on main.

---

## Safe to implement now

*(empty — FK-12 moved to **In progress / In review** (PR #44). Full card history in git log of this file.)*

*(Phase-3 kickoff done 2026-06-13: INS-5 run → FK-10 audit verdict (GO, split) → **FK-24** spawned. INS-6 run → FK-11 ungated, M fork confirmed. INS-7 run → FK-12 ungated (metrics engine is pure/reusable; per-criterion histogram is the one signal not pre-computed; anchoring risk handled by default-off toggle + self-pilot). **FK-23 (PR #35), FK-24 (PR #36), FK-11 (PR #37) all merged to main 2026-06-13 → Shipped.** INS-8 run → FK-13 ungated, **rescoped from "centralization audit" to "score-result aria-live region + validation-convention note"** (the per-widget hard-invalid/soft-warn split is intentional; the validation-*model* centralization folds into FK-15; the real gap is the unannounced recomputed score — WCAG 4.1.3). **Phase-3 inspection sweep now complete (INS-5/6/7/8).** FK-12 is **in review (PR #44)** and FK-13 **shipped (PR #43)** — both 2026-06-14. Safe-to-implement is now empty; remaining feature-worktree work is the Backlog cards (FK-15/16/19/21/22), not this one. INS-5 ☑ as of 2026-06-14 (live bytes/record check done — typical 7,178 / heavy 13,797 chars/record confirmed the model). **2nd promotion checkpoint ✅ EXECUTED 2026-06-13 (PR #38 — Addendum H + INS-5 fold on main; confirmed 2026-06-14).** With both checkpoints done, the open work is purely the FK-12/FK-13 implementation cards. See ROADMAP-PHASES.md §3 / Promotion checkpoint.)*


---

## Needs inspection
*(empty — all Phase-3 inspection gates resolved 2026-06-13: INS-5/6/7/8 ☑/◐-non-blocking; FK-13 rescoped + moved to Safe-to-implement. INS-10 remains ◐ but gates FK-19 in Backlog, not this column.)*

---

## Backlog

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

---

## In progress

*(empty)*

## Validate in runtime
*(empty)*

## Ready to document

### FK-10 · localStorage capacity & failure-mode audit ✅ AUDIT COMPLETE (verdict recorded)
- **Rationale:** localStorage is the sole store (53 refs in scorer.html, zero IndexedDB anywhere). Quota risk at cohort scale is plausible but unquantified — measure before deciding to migrate.
- **Evidence:** O — INS-5 code-read (writers + record schema). The three heavy writers (`saveCohort` shared.js:1149, `saveAllConfigs` shared.js:309, `saveSnippets` scorer.html:3244) all `setItem` with **no try/catch**; capacity model ~6–7 KB/record typical ⇒ 300-record cohort ~1.9–3.9 MB against a shared, conservatively-accounted ~5 MB origin.
- **Dependencies:** **INS-5 ☑ 2026-06-14** — failure-mode half resolved by code-read (dispositive); capacity half analytical and now **live-confirmed** (typical 7,178 / heavy 13,797 chars/record — model verified, ran marginally heavier).
- **Risk:** Acting without measuring risks either a wasted migration or dismissed real data loss.
- **DoD (this card = the audit, not the migration):** ☑ bytes/record + 300-record projection recorded in INSPECTION.md INS-5; ☑ quota-exceeded behavior documented (**unhandled/silent** — uncaught throw, masked by the prior Excel download in `downloadExcel` scorer.html:2544–2548 ⇒ silent cohort omission); ☑ go/no-go written.
- **Verdict:** **GO on a card — split.** Trigger is the unhandled-quota half, not raw size. (1) **FK-24** (write-hardening, P1/S) — **shipped 2026-06-13 (PR #36)**; fixes a present data-loss bug independent of scale. (2) **Full IndexedDB migration deferred/conditional — not carded** (honours INS-5's "wasted migration" caution); revisit only if a live cohort crosses ~150 records or a quota event is seen in the field.
- **✅ FULLY CLOSED 2026-06-14:** promotion-checkpoint fold done (PR #38 — INS-5 finding → fk-project-overview.md; verdict → fk-decisions.md **Addendum H**) **and** the live bytes/record check done (INS-5 ☑, model confirmed). Nothing left on this card — move to Shipped on next board prune. **Priority:** P2. **Effort:** S–M (audit only; FK-24 was the code.)

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
| FK-26 | Moderation Export characterization tests (= GitHub issue #4): `moderation-suppression.test.js` + `moderation-privacy.test.js` (SENTINEL-PII cohort → real export → `writeFile` intercept → cell-level leak guard via vendored SheetJS; 44 tests, exporter confirmed non-leaking; no new dep) | [#42](https://github.com/stephendmann/feedback-kitchen/pull/42) | 2026-06-14 |
| FK-13 | Score-result `aria-live` region (`#score-result-live`, debounced + de-duped announce of recomputed score/grade on `recalculate()`; WCAG 2.1 AA 4.1.3) + hard-invalid/soft-warn validation-convention note at both setters; regression guard `js/score-result-live-region.test.js`; axe Scorer 0/51 | [#43](https://github.com/stephendmann/feedback-kitchen/pull/43) | 2026-06-14 |
| FK-12 | Ambient cohort scale-use consistency indicator (D-10): pure `CohortInsights.scaleUseSignal()` (reuses `cohortMetrics`, small-N suppressed) → `#cohort-consistency-badge` behind a **default-off** Scorer-settings toggle; saved-cohort-only, no `recalculate()` touch; 8 unit tests; axe 0/51. *(Docs maintenance note + code cross-ref in follow-up PR #45.)* | [#44](https://github.com/stephendmann/feedback-kitchen/pull/44) | 2026-06-14 |
| FK-21 | Draft persistence v2: debounced autosave (1s) + pagehide flush of the in-progress student to per-scorer `SA_DRAFT_V1_<id>` via `safeSetItem` (quota-safe); FK-07 `_sessionHasUnsavedWork()` gate; non-blocking `#draft-resume-banner` (Resume/Discard, `_draftReady` clobber-guard); clears on save-to-cohort + New-student; 8 structural tests; quota-full runtime-verified | [#46](https://github.com/stephendmann/feedback-kitchen/pull/46) | 2026-06-14 |
| FK-19 | Moodle offline-grading-worksheet **round-trip**. Import: `validateWorksheet` (narrow file gate, two-tier taxonomy) → `planImport` (dispositions: import/verify/skip/non-markable) → `buildCohortImport` (skip-if-marked guard, identity-only placeholders) + scorer import UI (state machine, collision-guarded verify). Export: `buildExportWorksheet` (fill Grade + `feedbackText`-only into the re-supplied original, BOM/CRLF preserved, `markerNotes` never read) + "Export Moodle worksheet" UI. Synthetic fixture generator (BOM+CRLF byte-faithful); ~61 tests; axe 0. *(Live-Moodle upload check pending — not code-blocking.)* | [#47](https://github.com/stephendmann/feedback-kitchen/pull/47), [#48](https://github.com/stephendmann/feedback-kitchen/pull/48) | 2026-06-14 |
| FK-22 | Homepage/dark-mode residuals: index.html gstatic preconnect + partner-logo intrinsic `width`/`height` (CLS); scorer `renderLineDiff` inline hex → `.fk-diff-del`/`.fk-diff-add` classes w/ dark variants; removed dead `?cinematic=1`→`dark-scorer.css` (404) easter egg; dark-mode sweep of light tint chips (rounding label/buttons, kbd/code → dark slate). axe 0; Jest 302/302 | [#49](https://github.com/stephendmann/feedback-kitchen/pull/49) | 2026-06-14 |
| FK-27 | Post-Moodle-import selection fix: `mwCommit()` auto-opens the first imported student (`loadCohortRecordIntoSession` on its key + scroll), guarded on `!_sessionHasUnsavedWork()` so importing mid-marking keeps the current student; toast "· now marking &lt;name&gt;". Fixes the empty "(no name)"/focus-only post-import state. Runtime-verified both paths; axe 0 | [#50](https://github.com/stephendmann/feedback-kitchen/pull/50) | 2026-06-15 |
| FK-28 | Dynamic active-section scroll highlight + scroll-spy a11y: extends the existing rail `IntersectionObserver` to set `aria-current="true"` on the active rail link (was colour-only) + mirror the active state onto the section content as an emerald inset rail (`.fk-active-section`, `#059669` light / `#34d399` dark, no layout shift); `prefers-reduced-motion` + focus-mode suppression. Dynamic active-only (D-02 lesson); emerald, not orange. axe 0 | [#52](https://github.com/stephendmann/feedback-kitchen/pull/52) | 2026-06-15 |
| FK-29 | Rail anchor offset + click sync (FK-28 follow-on): `html { scroll-padding-top: 8.5rem; md 6.5rem }` so anchor jumps + keyboard focus land below the two stacked sticky bars (topbar + rail), not under them; rail click now syncs the active highlight + `aria-current` immediately (700ms lock so the IO doesn't override mid-scroll). Runtime-verified (lands at 136px offset; instant switch); axe 0 | [#53](https://github.com/stephendmann/feedback-kitchen/pull/53) | 2026-06-15 |
| FK-30 | Slim the scorer footer (de-duplicate the redundant footer): `footer.js` renders `COMPACT` vs `FULL` from `el.dataset.footer`; scorer opts into a ~92px one-line trust row (browser-only privacy summary + About/credits + Ko-fi), homepage keeps the full block (full footer preserved verbatim incl. `#acknowledgements`). `.site-footer--compact` flex row, muted ≥4.5:1 on `#0f172a`. jest 302/302; axe 0 | [#54](https://github.com/stephendmann/feedback-kitchen/pull/54) | 2026-06-15 |
| FK-31 | Brand mark refresh — self-contained chef badge: new `fk-chef.svg` (rounded navy `#1e3a5f` tile + white chef knockout, authored Inkscape path used **verbatim** to dodge a relative/absolute coord-corruption bug; clipped rounded rect). Header `<img src>` → `/fk-chef.svg` on index/scorer/builder/upload/convert (sizes/classes/`alt=""` kept). Self-contained ⇒ identical on light + dark headers, no theme CSS. White-on-navy chosen after comparing 9 Canva candidates (line-art 5–9 vanish at 22px). +13-test regression guard (`header-brand-mark.test.js`) per live PR review. **Favicons/og/how-to rasters still old blue → FK-32 follow-on.** jest 315/315; axe 0 | [#55](https://github.com/stephendmann/feedback-kitchen/pull/55) | 2026-06-15 |
| FK-32 | Favicon/PWA icon regen from the new chef badge (FK-31 follow-on): new reproducible `scripts/render-icons.mjs` (puppeteer renders `fk-chef.svg` → `favicon-32`/`icon-192`/`icon-512` rounded transparent-corner + full-bleed-square `apple-touch-icon` for iOS; ImageMagick builds multi-res `favicon.ico` 16/32/48). Added `<link rel="icon" type="image/svg+xml" href="/fk-chef.svg">` to all 5 pages (crisp vector; ICO/PNG fallback). `og-image.png` untouched (FK wordmark card, no chef). +15-test guard (`favicon-links.test.js`). jest 330/330; axe 0 | [#56](https://github.com/stephendmann/feedback-kitchen/pull/56) | 2026-06-15 |
| FK-33 | Tutor-name shared-machine safety (layers 1–2): always-visible "Marking as: <name>" topbar readout (`updateMarkingAs`) + "Switch tutor" button (`switchTutor`, clears field + drops stale draft) + opt-in "Clear tutor between students" setting (`clearTutorBetweenStudents`, **default OFF**) clearing the field on New Student and excluding `studentTutor` from the draft. Layer 3 (cohort records keep `tutor`) untouched — needed by moderation/merge. GPT-5 review's default-ON rejected with reasons (advertised convenience; not cleanly implementable; visibility > friction). +8-test guard (`tutor-privacy.test.js`); muted readout `text-slate-500` AA. jest 338/338; axe 0 | [#57](https://github.com/stephendmann/feedback-kitchen/pull/57) | 2026-06-16 |
| FK-34 | Move Score Rounding from the top bar into the section rail: removed rounding group from top-bar nav; inserted compact `#rail-rounding` into rail RHS before Focus mode. Button ids (`rnd-none/half/whole`) + handlers unchanged. `#rounding-example` kept hidden. Tooltip bug found post-merge → FK-35. +4-test guard (`rounding-rail.test.js`). jest 342/342; axe 0 | [#58](https://github.com/stephendmann/feedback-kitchen/pull/58) | 2026-06-16 |
| FK-35 | Fix rounding tooltip — replaced dynamic per-mode `wrap.title = ex.textContent` with a static all-modes `title` attribute on `#rail-rounding` div; removed JS lines; updated `rounding-rail.test.js` assertion. 342/342; axe 0 | [#59](https://github.com/stephendmann/feedback-kitchen/pull/59) | 2026-06-16 |
| FK-37 | Rework Score Rounding control from FK-36's two-line button design (too tall) to compact single-line segmented buttons (Exact/Half/Whole) with desktop-only dynamic helper line below. Helper initially shows "Examples appear once a score is calculated"; updates live with computed rounded values: "Examples for 77.4: Exact 77.4 · Half 77.5 · Whole 77". Values computed from current `penalisedScore` via updated `highlightRoundingBtn()`. IDs + click handlers unchanged. 343/343; axe 0. *(FK-36 two-line design superseded.)* | [#61](https://github.com/stephendmann/feedback-kitchen/pull/61) | 2026-06-16 |

Residuals carried forward from shipped cards: `index.html:323` "New Student" casing · Title Case field labels → sentence case on next touch (canon §7) · dark-hero links keep slate-400 (intentional) · fk-decisions.md D8 narrowed not closed · ~~FK-11 doc-drift~~ **fixed (PR #41)** — `docs/fk_moderation_export_v1.md:71` gloss corrected. **FK-19 follow-ups:** (1) live-Moodle upload round-trip check (export a generated fixture → upload to a non-prod course; confirms the institution's build matches core — only outstanding FK-19 item, not code-blocking); (2) v1.1 nicety — cache the original worksheet at import for one-click export (today the marker re-supplies it).
