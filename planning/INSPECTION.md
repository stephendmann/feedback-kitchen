# Inspection Checklist

Each item gates one or more board cards. Resolve = answer the question, record findings
here (don't fix anything during inspection — findings only), then move the gated card.
Status: ☐ Open · ◐ Partially resolved · ☑ Resolved · ✕ Dropped

---

## INS-1 ☐ Does a cohort record round-trip back into the marking session?
- **Gates:** FK-07 (queue/re-entry) — scope forks on the answer.
- **Where to look:** scorer.html cohort-store functions (search: `cohort`, `View list` handler, whatever populates "0 students saved"); `js/moderation-schema.js` for record shape; try it live in dev server: save a student, open View list, attempt re-edit.
- **Questions:**
  1. Are saved records full-fidelity (per-criterion levels + overrides + feedback slots + notes), or flattened/export-shaped?
  2. Is there any existing load-record-into-session code path, even unexposed?
  3. Does re-saving create a duplicate row or update in place (keyed how — name? ID? timestamp)?
- **Findings:** _(pending)_

## INS-2 ☐ What do "Moderation Export…" and "Export for Moderation" each do?
- **Gates:** FK-08.
- **Where to look:** both button handlers in scorer.html; `js/moderation-export.js`, `js/moderation-optin.js`, `js/moderation-suppression.js`; `docs/fk_moderation_export_v1.md`.
- **Questions:**
  1. Configure-vs-run, or genuine duplication?
  2. How do opt-in/suppression interact with each ("Disable mod-export" button suggests a tri-state)?
  3. Does Clear Cohort currently confirm before destroying? (feeds FK-06 DoD)
- **Findings:** _(pending)_

## INS-3 ☐ Map the scoring calculation surface in scorer.html
- **Gates:** FK-09 (engine extraction); informs FK-15 boundaries.
- **Where to look:** start from `onPenaltyChange` (scorer.html:1824), `setRounding`/`highlightRoundingBtn` (~:3153–3185), `cloneScoreResultForStorage` (~:2585); trace the weighted-total computation; cross-ref `scoreToGrade`/`scoreToGradeFromScale` call sites in shared.js (lines 394–726 region).
- **Questions:**
  1. Full list of functions that read or write score state.
  2. What shared/global state do they touch (DOM reads? module-level vars? localStorage directly?).
  3. Order of operations: override → weight → penalty → rounding? Where can they interleave?
  4. Is D5 weight-redistribution math in builder.html, scorer.html, or both (duplication risk)?
- **Findings:** _(pending)_

## INS-4 ☐ Characterization-test surprises ledger
- **Gates:** none (FK-01 is safe-now); this item *collects* what FK-01 discovers.
- **Rule:** any unexpected behavior found while writing tests is recorded here as a finding and triaged — never silently "fixed" inside the test PR.
- **Findings:** _(pending)_

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

## INS-9 ☐ Pre-flight for section reorder (FK-05) — positional lookups
- **Gates:** none (FK-05 is safe-now with this as its first task, not a blocker).
- **Method:** grep scorer.html for index-anchored section/header lookups (the pattern hardened in commit b00cb54/370a272 era — search `children[`, `nextElementSibling`, header-text matching).
- **Findings:** _(pending)_
