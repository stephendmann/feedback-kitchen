# Feedback Kitchen — Project Overview

**Living document.** Update the **Status** column and the **Notes / actuals** field after each phase completes. Phase 0 is signed; Phase 1 is in flight. Everything beyond Phase 1 is plan-of-record, subject to refinement as it lands.

**Last updated:** 2026-06-13
**Project owners:** Stephen Mann (this repo) · Claude Design (CD, mirror side)

---

## At-a-glance status

| Phase | Title | Status | Acceptance |
|---|---|---|---|
| **0** | Decisions (ADR) | ✅ **Complete** | D1–D4 signed by CD |
| **1** | Token foundation | ✅ **Complete** | Pass 2 cleared validation; merged into design system |
| **2** | A11y hardening | 🟡 **Unblocked** | Phase 1 merged. Sonnet draft of `fk-a11y-checklist-v0.md` next; Opus review gate before adoption |
| **3** | Marking-view interactions | ✅ **Complete** | Pass 2 cleared; v1.0.1 patch landed (`schemaVersion: "1.0"` + doc-fix + Addendum C) |
| **4** | Rubric editor polish | ✅ **Complete** | Pass 2 cleared 2026-05-16; C4 = proportional locked (D5 + Addendum D); C3 boundaries locked as-shipped |
| **5** | Landing & motion | 🟢 **Unblocked** | CD ships D1/F1/F2/F3 + `<main>` restructure; `fk-rubric-editor-v1.html` housekeeping pickup (non-gating) |
| **6** | Deferred / future | ⏸ **Parked** | Not scheduled; A2 already promoted into Phase 1 |

### Parallel tracks (non-Phase)

- **Marking Roadmap (v2.0 → v3.0)** — marking-screen ergonomics (sticky bar, AI Copilot, dashboard). See `ROADMAP.md`.
- **Builder & Brand Pass (BBP)** — wizard UX + brand voice + in-UI privacy reassurance. Scoped 2026-05-21 (D15). See ROADMAP.md.

---

## Phase 0 — Decisions (ADR) ✅

Locked decisions, signed by CD. See `fk-decisions.md` for full ADR.

| ID | Decision | Locked value |
|---|---|---|
| **D1** | Hero gradient | 3-stop: `linear-gradient(135deg, #1E3A8A 0%, #1E40AF 40%, #2563EB 100%)` |
| **D2** | Emoji vocabulary | **Resolution C (Addendum A, signed in Phase 1):** Three tiers — `wired` (12) + `appChrome` (9, with `↗` in slot 5) + `dropped` (9 — 3 semantic: `↑ ⚖ ⏱`; 6 brand: `🚀 🎉 💡 🔥 🤖 🎯`). Schema includes `tiers` block and `category` convention. Original D2 framing ("Core + App Chrome, dropped 3") superseded by Addendum A in `fk-decisions.md`. |
| **D3** | Focus ring | `--fk-focus: 0 0 0 3px rgba(37,99,235,.35)` via `.fk-focus-ring` utility, applied with `:focus-visible` |
| **D4** | Counter thresholds | hidden ≤200 · neutral 200–280 · amber 281–320 · rose 321+ — **wired + locked at Phase 4 Pass 2 ratification** (7 boundary cases: 199/200/280/281/320/321/400) |
| **D5** | C4 redistribution semantics | **Proportional** — each existing weight w reduces to `round(w × n/(n+1))`; new row gets `round(100/(n+1))`; round-off drift (±1) lands on largest existing weight so sum = 100. Locked Phase 4 Pass 2. See Addendum D. |

**Notes / actuals:**
- D1 reversed CD's preference; CD owns the live Tailwind build, retained the 3-stop.
- D2: superseded by **Addendum A — Resolution C** (signed during Phase 1; see `fk-decisions.md`). Working agreement honoured: deviations from signed ADRs require a countersigned addendum. CD signed by countersign; mirror signed by validation pass.
- D3: existing `--shadow-text-on-hero` token reused (no new mint).
- D4: counter is hidden up to 200 chars, not always-visible.

---

## Phase 1 — Token foundation ✅

**CD ships** (single PR):

- `fk-tokens.js` — `--fk-focus`, reconciled 3-stop `fk-hero`, `fk.status.{success,warn,danger,info,muted}`, `fk.slate100` adopted
- `fk-emoji.json` — 12 + 9 + dropped (with `uses` on both tiers, `reason` on dropped)
- `styles.css`, `Components.jsx`, `preview/*.html` — re-tokenised, includes `prefers-reduced-motion` system-wide block
- `brand-emoji.html` — renders from `fk-emoji.json` client-side
- `component-fk-partners.html` — new, light + dark (partner logos on midnight `#0F2335` test, promoted from Phase 6)
- `README.md` + `MANIFEST.md` — canonical values updated
- `fk-expected-changes.md` — paired with PR for visual-diff baseline
- `fk-decisions.md` — countersigned
- B5 + D3 micro-fixes folded in (per our agreement — though CD may inherit if we hand them over with the mirror PR)
- 4 axe items addressed inline: 2× `html-has-lang`, `.lvl.on .pts` contrast (full opacity), `.sub-tab > small` re-tint, icon-only button labels on `.sub-tools` + `.nav-btns`
- `.fk-drift-ignore.json` v1.1 codepoint additions (U+00B0, U+00B1, U+2696, U+23F1)

**We own** (repo-side):

- ✅ Mirror `fk-emoji.json` to `fk-emoji-registry.md` once CD publishes (Haiku, ~10 min swap from hardcoded allowlist)
- ✅ `scripts/token-drift-check.py` — 4-check drift script with JSON filter (Haiku, complete; baseline 1,212 raw → 70 actionable post-filter)
- ✅ Screenshot baselines — Playwright capture of 9 surfaces at 1440px (Haiku, complete)
- ✅ axe-core baseline run on 3 surfaces — 12 violations logged in `a11y-baseline/axe-report-pre-phase1.json` (Sonnet, complete)
- WCAG AA contrast verification on hero copy + pills against the 3-stop gradient (Haiku — pure colour math, scheduled for post-PR validation)
- A2 surface investigation (promoted from Phase 2): rubric editor flagged, marking view cleared. Density-dot mockup verified, shipping in Phase 1 PR per CD spec

**Acceptance gate:**
- Token-drift script returns 0 actionable post-PR (against the v1.1 filter)
- Visual diffs match `fk-expected-changes.md` exactly — no surprises outside the declared list
- Contrast: hero sub + pills pass AA at the lightest gradient stop
- axe-core: 6 violations cleared (the 4 above plus 2× contrast items), 2 carry to Phase 2

**Notes / actuals:**
- A2 promoted from Phase 2 to Phase 1 after surface investigation confirmed rubric editor needs density-dot indicators
- Partner-logos-on-dark promoted from Phase 6 to Phase 1 (`component-fk-partners.html` new file)
- `prefers-reduced-motion` is system-wide (single `@media` block in `styles.css`), simplifies Phase 5 validation to "confirm it works"
- B5 + D3 ownership: we own per agreement, but bundled with our mirror work post-PR
- **Pass 1.0 → 1.1 cycle:** mirror flagged 2 blockers (emoji schema drift, drift-filter schema divergence) + 1 transport-layer read artefact + minor deviations. CD applied Resolution C on emoji (12 wired + 9 appChrome + 9 dropped, `↑ ⚖ ⏱` reinstated). Mirror absorbed drift-filter schema convergence (rewriting script to CD's nested-by-check shape). Hero stop reverted from 45% → 40%. Pass 1.1 cleared.
- **Pass 2 cleared validation (2026-05-15):** see `pass-2-validation.md`. All 10 drift-baseline files swept clean, `fk-tokens.css` mirror shipped with focus utility + system-wide reduced-motion, `component-fk-partners.html` light+dark complete, `fk-emoji.json` canonical Resolution C with `tiers` block and `category` convention, `fk-expected-changes.md` enumerates every intentional diff with Phase 0 justification, `fk-decisions.md` countersigned by CD. CSS-comment lint added with 0 hits. **Phase 1 merged.**
- **`html-has-lang` win:** the flagged rubric-editor surface plus 40 sibling preview cards swept in one batch — 41 surfaces now carry `lang="en"`. Net axe Phase 1 clears substantially exceed the 6 originally bucketed.
- **appChrome stayed at 9:** CD's disk had `↗` in slot 5 throughout — Pass 1.0's drift to `↓` never landed in CD's copy. Mirror's "↗ reinstatement" expectation was based on a delta that didn't exist; decision honoured, no array growth.
- **Three Phase 2 review items logged** (non-blocking flags from Pass 2 validation): `.fk-btn-blue` + `.fk-card-link` keep `#2563EB` inline (primary token candidate), typographic `↓` in rubric editor prose (not in dropped — fine), `↑` reason wording shifted between Pass 1.1 → Pass 2 (both legitimate).
- **Phase 1 merge anchored:** CD's `fk-phase1-pass2/` is the canonical post-merge snapshot. `PHASE-1-MERGED.md` from CD anchors the moment with state-on-disk summary + the three review items inherited. Addendum A in `fk-decisions.md` formalises Resolution C as the signed amendment to D2.

---

## Phase 2 — A11y hardening ⏸

**Already absorbed by CD's Phase 1 PR:**

- A1 hero contrast (using existing `--shadow-text-on-hero`)
- A3 `.fk-focus-ring` utility wired to every interactive control
- A4 late tag `aria-label` + `<abbr>` enhancement
- A2 density-dot indicators on rubric editor (mocked + signed off; shipping in Phase 1)

**We own** (repo-side, runs after Phase 1 merge):

- Author `fk-a11y-checklist-v0.md` — manual test walkthrough (Sonnet draft, **Opus review pass required before adoption as gate**)
- Re-run axe-core post-Phase-1 to confirm regression-free; expect 6 cleared + 2 carried
- Keyboard-only walkthrough of FK landing + marking surfaces
- Validate `prefers-reduced-motion` system block (CD ships it in Phase 1; we confirm it works)

**Phase 2 carry items** (gated on later phases):

- `landmark-one-main` on landing page — needs `<main>` wrapper restructure
- `label` on rubric textareas — gated on Phase 4 C3 character-counter work (label + counter share the `<label>`)

**Acceptance gate:**
- axe-core: 0 critical, 0 serious across all surfaces
- Keyboard-only score-through completes without trap or visual loss
- A11y checklist v0 has Opus review pass before adoption as gate

**Notes / actuals:**
- Original framing ("most violations clear incidentally with focus rings") was wrong; corrected bucketing logged in `a11y-baseline/axe-expectations.md`
- Phase 2 is now lighter than originally scoped — CD absorbed most items into Phase 1

---

## Phase 3 — Marking-view interactions 🟡

**Spec v1.0-final received from CD.** Implementation pending.

**CD shipped (spec):**

- `fk-marking-interactions-v1.html` — B1 Level pick · B2 Within-band nudge · B3 Annotation · B4 Commit & advance
- All four Open Q resolutions in §04
- All seven Opus review notes folded into B1–B4 + Cross-cutting
- Changelog at foot, README walkthrough

**Opus review pass complete** (`fk-marking-interactions-v1-opus-review.md`):

| Open Q | Resolution |
|---|---|
| Q1 — anchor strategy | Bias-low (philosophy, not arithmetic) |
| Q2 — override pill vs silent reband | Keep pill (data signal for moderation + rubric author) |
| Q3 — Reopen draft user-class | Marker-self 24h then mod-only, config-flagged |
| Q4 — per-day late penalty | v1.1, with forward-reference in B4 |

**CD ships next** (after v1.0-final spec sign-off + Phase 1 merge):

- Implementation of `component-marking-view.html` against v1.0-final
- B5 1-liner fix folded into Phase 1 mirror work (our side)

**We own:**

- B5 micro-fix on our side (Haiku, ~5 min)
- Test matrix execution post-implementation:
  - Save states × network conditions (3×3) (Sonnet)
  - Keyboard score-through in <30s end-to-end (Sonnet)
  - Provisional grade state machine — 6 criterion-unscored counts (0–5) (Sonnet)
  - Late penalty arithmetic — 4 test cases (Haiku, pure math)

**Acceptance gate:**
- v1.0-final spec sign-off held until Phase 1 PR demonstrates spec tokens are live (5-min post-merge confirmation)
- All test matrix cells pass
- No regression in axe-core or visual diff

**Notes / actuals:**
- Spec was rigorous: state machines complete, ARIA model genuine, late-penalty timing correct, wired-vs-illustrative discipline held throughout
- Phase 3 now gated on Phase 1 merge, not on spec sign-off — sign-off is conditional, awaiting demonstration
- **Pass 1 → Pass 2 cycle (2026-05-15):** Pass 1 cleared on first read; Q1 (letter grade table) → Option A (institutional override config). Pass 2 shipped `letterGradeTable` + `percentToLetter()` walker + spec § B4 paragraph + paired docs, with default scale preserving Pass 1 thresholds verbatim (62.1% → "B−", zero pixel diff).
- **Pass 1 ambiguity caught:** mirror's Pass 1 validation message contained an internal contradiction (spoken instruction "default scale fine to ship" vs inline snippet using different boundaries). CD honoured the spoken instruction. Mirror-side authorship error logged, no Pass 2.1 swap needed.
- **v1.0.1 patch landed:** `schemaVersion: "1.0"` added as first field of `persistedShape()` for v1.1 folder-adapter forward-compat (Q5). `fk-expected-changes-phase3.md` line 22 doc-vs-code drift corrected. **Addendum C** added to `fk-decisions.md` documenting the schema-versioning convention.
- **Phase 3 merged.** `fk-phase3-pass2/` is the canonical post-merge snapshot; `PHASE-3-MERGED.md` anchors the moment. Phase 4 unblocked — C1 reads `__fkMarking.state.saveStatus` directly off B4's exposed state machine, no refactor.

---

## Phase 4 — Rubric editor polish ⏸

**CD will ship:**

- C1 save indicator (reuses B1 component pattern from Phase 3)
- C2 weight-sum validation with aria-live (polite)
- C3 character counter with 200/280/320 thresholds
- C4 add-criterion redistribution inline prompt

**We own:**

- Weight chip updates within 200ms across add/remove/edit (Sonnet)
- Add-criterion at exactly 100%: prompt fires, "Take 10%" reduces correctly (Sonnet)
- Counter colour transitions at 200 / 280 / 320 / 400 boundary characters (Haiku)
- Re-run axe-core (Sonnet)

**Dependency:** Phase 3 must ship first — C1 reuses the B1 save-state machine component.

**Acceptance gate:**
- All validation test cases pass
- aria-live announcement audible in NVDA/VoiceOver on weight changes

**Notes / actuals:**
- **Pass 1 cleared 2026-05-15** (`phase-4-pass-1-validation.md`). C1–C4 + rubric-textarea `label` axe carry all wired. C3 boundaries observed correct via `<=` semantics. C4 implementation = proportional (`× n/(n+1)`), not literal flat-10; flagged for spec lock.
- **Pass 2 cleared 2026-05-16** (`phase-4-pass-2-validation.md`). Paper-only pass — three doc-comment edits (banner bump, header docblock "Spec § C4 (locked Pass 2)" sub-paragraph, expanded inline comment in `handleAddAction('redistribute')`). AST identical to Pass 1. Zero pixel diff, zero telemetry change.
- **D5 + Addendum D landed** in `fk-decisions.md` — proportional redistribution is now canon. "Take 10% from each" brief language recorded as illustrative, not the contract.
- **C3 boundaries ratified** as-shipped (Pass 1 already correct); locked into D4.
- **Phase 2 carries:** rubric textarea `label` ✅ cleared by C3-paired; `landmark-one-main` still carries (gated on `<main>` restructure, Phase 5).
- **Symmetry dividend:** `__fkRubric` mirrors `__fkMarking` inspection surface — same `saveStatus` union, `Storage`/`Telemetry` shape, `schemaVersion: '1.0'` on `persistedShape()`.
- **`fk-rubric-editor-v1.html`** standalone narrative spec queued as Phase 5 housekeeping pickup (non-gating, extraction-only from `behaviours.js` header).
- **Phase 4 merged.** `PHASE-4-MERGED.md` (CD) anchors the moment.

---

## Phase 5 — Landing & motion ⏸

**CD will ship now:**

- D1 hero CTA shadow-lift only (no inversion)
- F1 card hover softened to `-1px` with `fk-card-lift`
- F2 status/tag `transition: background-color .25s, color .25s`
- F3 `.lvl` `transition: all .15s` — kept unless we report browser stutter

**CD will ship later (separate spec):**

- D2 animated dashboard preview — full motion-design pass (8s loop, hover/reduced-motion handling, keyframe timeline)

**We own:**

- D3 micro-fix on our side (Haiku, with mirror work)
- F3 repro attempt — Chromium / Firefox / WebKit `.lvl` transition checks (Haiku, scripted)
- Lighthouse CLS regression check post-F1 (Sonnet)
- `prefers-reduced-motion` validation — confirm CD's Phase 1 system block actually zeros transitions everywhere (Sonnet)

**Acceptance gate:**
- CLS ≤ 0.1 (perf gate relaxed per CD — perf score won't move on F1/F2/F3 deltas)
- `prefers-reduced-motion: reduce` cancels all non-essential transitions

**Notes / actuals:**
- Original "Lighthouse perf within 2 points" gate relaxed by CD — over-spec for the actual deltas
- `prefers-reduced-motion` validation simplified by CD's system-wide Phase 1 block

---

## Phase 6 — Deferred / future ⏸

**Originally parked, now reshuffled:**

| Item | Status |
|---|---|
| A2 density indicators | ✅ Promoted to Phase 1 |
| Partner logos on dark | ✅ Promoted to Phase 1 (`component-fk-partners.html`) |
| `↺` vs Lucide rotate-ccw | ✅ Closed in Phase 0 — keep `↺` |
| Footer credit on marking/rubric surfaces | ✅ Resolved in Phase 0 — inline in chrome with `<sup>` cross-link |
| D2 animated dashboard preview | ⏸ Still parked — separate motion spec |
| Per-day late penalty (v1.1) | ⏸ Forward-referenced in B4 as v1.1 |
| Cross-device persistence (IndexedDB / upstream) | ⏸ Surfaced in Opus review note 6 — v1.1+ |
| **In-browser document rendering** (Word/PDF read in marker pane) | ⏸ **v2 capability — needs UX research before spec.** High-risk on three axes: technical (Word in-browser is genuinely hard; Mammoth.js ~80%, MS viewer breaks no-sign-up, PDF.js fine but annotation anchors hard), UX (doubles B1–B4 interaction surface), brand (pulls against browser-only / offline / no-sign-up / free promises). Short-term workaround: drop-zone import that splits docs to text + figures for the existing reader pane, plus an "Open in tab" button using browser's built-in viewer. Do not roll into Phase 3/4/5. |
| **Folder-as-storage backend** (advanced opt-in for snippets / kitchens / drafts) | ⏸ **v1.1 enhancement — higher signal than v2 items.** Backend swap via File System Access API on Chromium browsers; localStorage stays default. Strengthens "browser-only, your data stays where you want it" brand promise. Cross-device portability solved by user-chosen sync folder (Dropbox/iCloud/OneDrive/git). Settings pane: choose default (localStorage) vs folder, show last sync, allow re-pick. Risk profile lower than v2 items — Safari/Firefox lack support but Chromium share is high in tertiary contexts. Gating: post-Phase-3, parallel with Phase 4/5. Dependency: B4 persistence interface needs one-line generalisation from "persist to localStorage key" to "persist to configured storage adapter". Open questions: (a) file format — per-entity JSON files vs single FK manifest; (b) conflict resolution when external sync writes a stale file; (c) permission-renewal UX (every tab restart needs a click). Addendum drafted for CD's v1.0-final spec to flag in Phase 3 conversation window. |
| **Grid-view rubric entry page** (new authoring surface) | ⏸ **Defer to its own design round.** Reasons: (a) current rubric editor matrix is already the matrix view; a "grid view" likely means a different *authoring* paradigm (drag-arrange criteria, drag-resize weights, visual canvas) — that's a new mental model, not a re-skin; (b) C1–C4 in Phase 4 assume the existing editor surface, restructuring during Phase 4 invalidates those specs; (c) authoring is lower-traffic than marking — markers touch the surface daily, authors quarterly. Build marking-side capability first, learn from usage, then redesign authoring with real data. Recommend: log as v2 alongside document rendering. |

---

## Scoring engine boundary and state model (2026-06, improvement-programme INS-3)

Findings from the 2026-06 scoring-surface inspection. This is the map FK-09
(engine boundary hardening) and FK-15 (incremental decomposition) work from —
do not re-derive it. Full detail: `docs/planning-202606/INSPECTION.md` (INS-3).

**Where the arithmetic lives.** The engine core is already in `js/shared.js`
as pure functions (no DOM, no storage): `computeScores`, `applyGradeOverride`,
`scoreToGrade`, `scoreToGradeFromScale`, `bandMinimumForGrade`, `formatScore`.
What remains in scorer.html is orchestration: `recalculate()` reads inputs,
delegates to the engine, fans results out to ~20 DOM writes.

**Order of operations** (computeScores): per-criterion numeric override ??
grade midpoint → ×weight/100 → per-row rounding (`config.scoreRounding`) →
sum of *rounded* rows (deliberate visual-consistency trade) → round total →
late penalty (flat deduction, or fail→0) → round → grade lookup. The marker
*letter* override is applied afterwards (`applyGradeOverride`): snaps the
total UP to the new grade's band minimum only, re-applies the penalty delta,
attaches audit metadata.

**DOM-as-state (key hazard).** Two authoritative scoring inputs live only in
the DOM until save: the letter override (`#grade-override`) and the penalty
selection (`#late-penalty-select`) — re-read fresh on every recalculate. Any
headless/module reuse of the pipeline must supply these explicitly.

**Module state is small and single-writer-dominated.** `scoreResult` and
`latePenaltyIdx` are written only by `recalculate()`; `studentGrades` has six
writers (grade/override/bulk-fill/reset paths); display state is
`_displayRounding` + `focusIdx`. The feedback-draft splice state
(`lastScoreResult` / `lastGeneratedText`) is the other coupling hot-spot —
FK-15's first extraction seams are these two clusters.

**Two rounding systems, kept in lockstep.** `config.scoreRounding` (inside
computeScores — affects stored arithmetic and can change the banded grade) and
`_displayRounding` (display formatting only). The nav "Score Rounding" toggle
sets BOTH and persists the config (`setRounding`) — the UI copy presents it as
display-only, which undersells it (ledgered as INS-4 S-6: intended in code,
misleading copy). FK-09 must treat rounding mode as an engine input, not a
view preference.

**Known engine edge behaviours** (characterized in `js/score-grade.test.js`,
ledgered as INS-4 S-1…S-5): empty/null gradeScale throws (unreachable in
normal flow — guard at the FK-09 boundary); below-all-bands returns the floor
grade by design; malformed inputs converge on the bottom grade; numeric
strings band via coercion; no upper cap above 100.

---

## Storage capacity and write-hardening (2026-06, improvement-programme INS-5 → FK-10)

Findings from the 2026-06 localStorage capacity/failure-mode inspection. This is
the basis for the FK-10 verdict and the FK-24 hardening that shipped from it — do
not re-derive it. Full detail: `docs/planning-202606/INSPECTION.md` (INS-5);
decision record: `fk-decisions.md` Addendum H.

**Capacity is not the binding constraint.** Per-record serialized footprint,
measured on fully-marked demo students and extrapolated, puts a 300-record cohort
comfortably within the ~5 MB origin budget — even sharing the origin with saved
scorers, snippets and config. Capacity alone does not force a migration.

**Failure handling was the real gap.** The quota-bearing `setItem` writes
(cohort-save, config, draft) were not wrapped in `try`/`catch`, so a
`QuotaExceededError` would propagate **uncaught** instead of being surfaced to the
marker — the worst time for a silent failure is when a cohort is at its largest.
Separately, the `downloadExcel` export path carried a **data-loss hazard**: a
failure mid-export could leave cohort state partially written rather than failing
cleanly with the prior state intact.

**Verdict — FK-10 "GO split"** (INS-5 decision rule: capacity passes the <40%
test, but quota errors were *not* surfaced, so neither clean branch applies):

- **Harden now → FK-24 (shipped, PR #36):** `try`/`catch` around the quota-bearing
  writes, a user-surfaced quota error, and the `downloadExcel` data-loss fix.
- **Defer the full IndexedDB-behind-`SessionStore` migration** — no card opened;
  capacity headroom makes it non-urgent, and a fresh ID (not the INS-5 method's
  provisional "FK-17", which collides with the axe-remediation card of that number)
  is assigned only if usage later warrants it.

---

## Critical-path summary

```
Phase 0 ✅ (signed)
   ↓
Phase 1 🟡 (CD PR in flight; we validate on landing)
   ↓
Phase 2 (lightweight — most items absorbed into Phase 1)
   ↓
Phase 3 🟡 (spec v1.0-final received; implementation post-Phase-1)
   ↓
Phase 4 (depends on Phase 3 — C1 reuses B1 component)
   ↓
Phase 5 (can start in parallel with Phase 4)
   ↓
Phase 6 (parked; reshuffled — A2 + partners promoted to Phase 1)
```

---

## Update protocol

After each phase merges:

1. Flip **Status** column from 🟡 → ✅ (or 🔴 if blocked)
2. Populate **Notes / actuals** with: what landed, what shifted from plan, any defects or scope creep, link to PR
3. Bump **Last updated** at top
4. If a deferred item gets promoted forward or further parked, update Phase 6 table accordingly
5. If acceptance gate fails, log under Notes with a remediation plan and keep the Status 🟡 until resolved
