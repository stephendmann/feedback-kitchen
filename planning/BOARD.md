# FK Improvement Board

Working board. Card IDs are stable — refer to them in commits/notes as `[FK-xx]`.
Evidence types: **O** = Observed (screenshot/repo), **I** = Inferred, **U** = Unknown.
Inspection refs point to `INSPECTION.md` items (INS-x).

Column counts (2026-06-11): Safe to implement now: 6 · Needs inspection: 7 · Backlog: 3 · others: 0

---

## Safe to implement now

### FK-01 · Characterization tests for scoreToGrade / scoreToGradeFromScale
- **Rationale:** Grade arithmetic is the correctness core; current Jest suite covers only AI-wording post-processing. These two functions are already in an importable module (`js/shared.js`) with a harness present — testable today with zero refactoring.
- **Evidence:** O — `js/shared.test.js` contents (no score-math tests); functions at `js/shared.js:158,167`.
- **Dependencies:** none.
- **Risk:** Low. Worst case: tests confirm correctness (still valuable as a regression net).
- **DoD:** Tests cover all grade-band boundaries for both functions, both scale variants, and malformed input; suite green; any surprising behavior logged as a finding in INSPECTION.md (INS-4) rather than "fixed" silently.
- **Column:** Safe to implement now. **Priority:** P0. **Effort:** S.

### FK-02 · Fix section-lettering / onboarding-banner mismatch
- **Rationale:** Banner teaches A·Student, B·Rubric, C·Penalty, D·Feedback, E·Notes; page shows A, C, Focus, E, F, G. First-run users are directed to sections that don't exist.
- **Evidence:** O — both screenshots; nav strip confirms B and D are gone.
- **Dependencies:** Decide re-letter vs de-letter first (DECISIONS.md D-02). Coordinate with FK-05 (section reorder) to avoid lettering twice.
- **Risk:** Low. Banner copy and section badges only.
- **DoD:** Banner list matches on-page sections 1:1; nav strip matches; no stale letter references elsewhere in scorer.html (`grep -n "B · Rubric\|D · Feedback"` returns nothing); checked in dev server.
- **Column:** Safe to implement now. **Priority:** P0. **Effort:** S.

### FK-03 · Copy/casing consistency pass
- **Rationale:** "New Student" (header) vs "New student" (footer); duplicate "Exact" rounding badges. Minor, but the repo has a brand-canon process this drifts from.
- **Evidence:** O — both screenshots.
- **Dependencies:** none. Cheap rider on FK-02's PR.
- **Risk:** Negligible.
- **DoD:** One casing rule applied; brand-voice-canon.md consulted for the rule; visual check in dev server.
- **Column:** Safe to implement now. **Priority:** P3. **Effort:** S.

### FK-04 · Non-color signal + legend for yellow "awaiting input" fields
- **Rationale:** Empty/required state appears to be conveyed by yellow fill alone; colorblind/low-vision markers lose the signal. (Meaning of yellow is inferred — confirm while implementing.)
- **Evidence:** O — yellow fills in screenshots; I — that yellow means "empty/awaiting".
- **Dependencies:** none.
- **Risk:** Low. If yellow means something else, the fix is renamed, not removed.
- **DoD:** Each yellow-state field also carries a non-color cue (icon/text/border treatment) and the state is explained once on screen or in the wording key; axe run shows no new violations.
- **Column:** Safe to implement now. **Priority:** P3. **Effort:** S.

### FK-05 · Reorder sections to task sequence (Student → Marking → Penalty → Notes → Finish → Cohort)
- **Rationale:** Penalty & override currently renders above the marking block; marker task order is score-then-penalise. Forces a per-student visual skip and risks anchoring.
- **Evidence:** O — screenshot 1 order. Impact magnitude unmeasured (Medium confidence).
- **Dependencies:** **Pre-flight check, not full inspection:** grep scorer.html for index-anchored section lookups before moving DOM (known fragility per commit "make Focus block lookup index-anchored"). If lookups are positional, fix them as part of this card.
- **Risk:** Medium — breaking focus-mode navigation. Mitigated by the pre-flight grep + runtime validation.
- **DoD:** New order live; focus-mode Previous/Next/Exit, expand/collapse-all, and nav strip all work in dev server; lettering (FK-02) consistent with new order.
- **Column:** Safe to implement now. **Priority:** P1. **Effort:** S–M.

### FK-06 · Demote/guard "Clear Cohort"; group cohort actions visually
- **Rationale:** Destructive action sits at equal weight among 8 peer buttons. *Partial* fix only — merging/renaming the "Moderation Export…" / "Export for Moderation" pair stays gated on INS-2.
- **Evidence:** O — screenshot 2 button row. U — whether Clear Cohort already confirms.
- **Dependencies:** none for the demote/guard portion.
- **Risk:** Low.
- **DoD:** Clear Cohort visually separated (danger styling or overflow), confirmation step verified or added; primary actions (Export, Insights, View list) visually primary; runtime check.
- **Column:** Safe to implement now. **Priority:** P1. **Effort:** S.

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

### FK-09 · Extract scoring engine (penalty, rounding, weighted total, override precedence) into pure module
- **Rationale:** The high-stakes arithmetic lives inline in the 4,975-line monolith (`onPenaltyChange` scorer.html:1824, `setRounding` ~:3185) and is untestable as structured. D5 redistribution math (fk-decisions.md) needs property tests.
- **Evidence:** O — file structure, function locations, absence of tests.
- **Dependencies:** FK-01 first (cheap regression net); **INS-3** (enumerate calculation functions + call sites + shared state).
- **Risk:** Medium — behavior change during extraction. Mitigated by characterization-tests-first discipline: extract verbatim, test, only then fix bugs as separate commits.
- **DoD:** `js/rubric-engine.js` (name TBD) exports pure functions; scorer.html consumes it; characterization suite green pre/post; edge-case tests added (override × penalty × each rounding mode; D5 ±1 drift); no behavior diff in dev server on the demo scorer.
- **Column:** Needs inspection. **Priority:** P0 (decision) / execution after INS-3. **Effort:** M.

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
- **Dependencies:** FK-09 is the first extraction and the template for the rest; INS-3 informs boundaries. **Validation gate before committing to the full program:** tag the next ~5 scorer bugs by cause; proceed broadly only if coupling-related bugs recur.
- **Risk:** Medium — refactor churn without user-visible payoff if the monolith is actually stable.
- **DoD (program-level):** each touched feature extracted as a module on contact; scorer.html line count monotonically decreasing (tracked per PR); no Date-of-big-bang rewrite.
- **Column:** Backlog. **Priority:** P2. **Effort:** L (amortized).

### FK-16 · Styling consolidation onto token/Tailwind build + CSS watch task
- **Rationale:** Three coexisting systems (tailwind.out.css, shared.css, inline workaround styles — the stale-build footgun is documented in working memory). Consolidate on the token build the ADR work already invested in.
- **Evidence:** O — css/ contents; memory note on build staleness.
- **Dependencies:** none hard; do opportunistically alongside FK-15 contact-extractions. The watch task (`build:css --watch` wired into dev-server) is a same-day standalone win — could be split out as Safe-now.
- **Risk:** Low-medium — visual drift during migration; existing screenshot baselines mitigate.
- **DoD:** watch task running with dev server; migration policy written (new styles → tokens/Tailwind only; shared.css frozen, shrink-on-touch); screenshot diffs clean.
- **Column:** Backlog (watch-task slice: Safe to implement now). **Priority:** P3. **Effort:** M amortized.

---

## In progress
*(empty)*

## Validate in runtime
*(empty)*

## Ready to document
*(empty — see promotion rule in README.md)*
