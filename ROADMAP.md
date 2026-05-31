# Feedback Kitchen — Engineering Roadmap

Feedback Kitchen is a browser-based rubric scoring tool for university educators that runs entirely client-side, exporting completed evaluations as Excel files via SheetJS.

## PR Sequence

| PR | Branch | Description | Status |
|----|--------|-------------|--------|
| 1 | `feat/draft-persistence` | Persist in-progress student work to localStorage; resume prompt on load | [ ] Open |
| 2 | `perf/lazy-load-sheetjs` | Remove 930 KB SheetJS from critical path; load on first export | [ ] Open |
| 3 | `fix/accessible-modals` | role=dialog, aria-modal, focus trap, Esc close for all 12 modals | [ ] Open |
| 4 | `fix/aria-rubric-table` | scope="col", aria-label on grade selects, aria-invalid on overrides | [ ] Open |
| 5 | `perf/homepage-and-dark-mode` | Homepage perf quick wins + dark-mode gap fixes | [ ] Open |

---

## ⚙️ Engineering Sprint — Claude Code PR Sequence (May 2026)

> **Workflow:** These 5 PRs are being implemented via Claude Code (Sonnet 4.5). Use the prompt pack in `CC-PROMPT-PACK.md` to work through each PR in sequence. Merge in order — PRs 3 and 4 share `renderCriteriaRows` so PR 3 must land before PR 4.

| PR | Branch | Description | Status |
|----|--------|-------------|--------|
| [#12](https://github.com/stephendmann/feedback-kitchen/pull/12) | `feat/draft-persistence` | Persist in-progress student work to localStorage; resume prompt on load | 🔵 Open |
| [#13](https://github.com/stephendmann/feedback-kitchen/pull/13) | `perf/lazy-load-sheetjs` | Remove 930 KB SheetJS from critical path; load on first export | 🔵 Open |
| [#14](https://github.com/stephendmann/feedback-kitchen/pull/14) | `fix/accessible-modals` | role=dialog, aria-modal, focus trap, Esc close for all 12 modals | 🔵 Open |
| [#15](https://github.com/stephendmann/feedback-kitchen/pull/15) | `fix/aria-rubric-table` | scope="col", aria-label on grade selects, aria-invalid on overrides | 🔵 Open |
| [#16](https://github.com/stephendmann/feedback-kitchen/pull/16) | `perf/homepage-and-dark-mode` | Homepage perf quick wins + dark-mode gap fixes | 🔵 Open |

**Merge order:** #12 → #13 → #14 → #15 → #16

---

## PR 1 — `feat/draft-persistence`

### Goals
Prevent silent data loss when a marker accidentally closes or refreshes the tab mid-session.

### Files affected
- `feedback-kitchen/scorer.html`

### Key changes
- Add `DRAFT_KEY` constant and `saveDraft()` helper that writes `studentGrades`, the feedback textarea, additional-comments, student name/ID/tutor, and grade-override to `localStorage` as a single JSON blob.
- Call `saveDraft()` at the end of `onGradeChange()`, `recalculate()`, and whenever feedback/name inputs fire `input` events.
- On page load (inside the existing init block), detect a stale draft and show a non-blocking banner offering "Resume" or "Discard".
- In `confirmNewStudent()`, call `clearDraft()` to wipe the key so a fresh student starts clean.
- In `downloadExcel()`, call `clearDraft()` after the file is generated — successful export is the canonical save.
- Tighten the `beforeunload` handler: fire the native prompt only when a draft exists AND contains at least one graded criterion (currently it fires for any non-empty cohort regardless of whether the current student has unsaved work).

### Acceptance criteria
- [ ] Refreshing the page mid-grade shows a "Resume draft?" banner; clicking Resume restores all fields exactly.
- [ ] Clicking Discard clears the banner and starts a blank form with no console errors.
- [ ] After clicking "Finalise & Export", refreshing the page does NOT show the resume banner.
- [ ] Starting a new student via the New Student modal clears the draft key.
- [ ] `beforeunload` prompt fires only when there is at least one graded criterion, not on a blank form.
- [ ] No existing localStorage keys (snippets, settings, cohort, credentials) are overwritten.
- [ ] Works in Chrome, Firefox, and Safari private-browsing modes (quota exceeded is caught and silently skipped).

---

## PR 2 — `perf/lazy-load-sheetjs`

### Goals
Eliminate ~930 KB of synchronous script parse time on every page load; SheetJS is only needed at export time.

### Files affected
- `feedback-kitchen/scorer.html`

### Key changes
- Remove `<script src="/js/xlsx.full.min.js"></script>` from `<head>` (line 45).
- In `downloadExcel()`, guard the export body behind a dynamic loader: if `window.XLSX` is already defined proceed immediately; otherwise inject a `<script>` tag for `/js/xlsx.full.min.js`, await its `onload`, then continue.
- Show a brief spinner or disable the Finalise button while the script loads (first click only; subsequent clicks are instant).
- Add an `onerror` handler that restores the button and shows an `alert` if the local file is missing.

### Acceptance criteria
- [ ] Lighthouse TTI improves (SheetJS no longer blocks main thread on load).
- [ ] First click on "Finalise & Export" still produces a valid .xlsx file.
- [ ] Second click on "Finalise & Export" in the same session does not reload the script.
- [ ] If `/js/xlsx.full.min.js` is unreachable, the user sees a clear error message rather than a silent failure.

---

## PR 3 — `fix/accessible-modals`

### Goals
Make all 12 modals usable by keyboard and screen reader users.

### Files affected
- `feedback-kitchen/scorer.html`

### Key changes
- Add `role="dialog"`, `aria-modal="true"`, and `aria-labelledby="<heading-id>"` to all 12 modal `<div>` elements.
- Write a shared `trapFocus(modalEl)` / `releaseFocus()` utility (~25 lines) that constrains Tab/Shift-Tab to focusable descendants.
- Call `trapFocus` in every modal-open function (e.g. `showCohortList()`, `showAISettings()`, `showNewStudentModal()`); call `releaseFocus` on close and store the triggering element to restore focus.
- Add the 6 missing modal IDs (`new-student-modal`, `modexport-optin-modal`, `modexport-block-modal`, `bulk-fill-threshold-modal`, `snippets-modal`, `scorer-settings-modal`) to `closeAnyOpenModal()`.
- Ensure the Esc handler in `bindKeyboardShortcuts()` does not interfere with text input (currently fires unconditionally).

### Acceptance criteria
- [ ] Tab key cycles only within the open modal's focusable elements.
- [ ] Escape closes every modal regardless of which one is open.
- [ ] Focus returns to the triggering button when a modal closes.
- [ ] VoiceOver/NVDA announces modal role and title on open.
- [ ] `closeAnyOpenModal()` closes all 12 modal variants.

---

## PR 4 — `fix/aria-rubric-table`

### Goals
Make the rubric scoring table and grade controls operable and understandable via assistive technology.

### Files affected
- `feedback-kitchen/scorer.html`

### Key changes
- Add `scope="col"` to all 8 `<th>` elements in the rubric `<thead>`.
- In `renderCriteriaRows()`, add `aria-label="Grade for <criterion name>"` to each `<select id="grade-sel-${i}">`.
- In `recalculate()`, toggle `aria-invalid="true/false"` on each `.override-input` element alongside the existing `out-of-band` class assignment.
- In `_renderOverrideStatus()`, mirror `aria-invalid` changes on `#grade-override` alongside `classList.add/remove('out-of-band')`.

### Acceptance criteria
- [ ] Screen reader announces column headers when navigating rubric table cells.
- [ ] Each grade dropdown is announced with its criterion name, not just "select".
- [ ] An out-of-band override input is announced as invalid by screen readers.
- [ ] No regression in visual styling of the `out-of-band` state.

---

## PR 5 — `perf/homepage-and-dark-mode`

### Goals
Fix the three homepage performance gaps and patch dark-mode visual regressions; defer the full CSS token refactor.

### Files affected
- `feedback-kitchen/index.html`
- `feedback-kitchen/scorer.html`

### Key changes
- **index.html**: Add `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` after the existing fonts.googleapis.com preconnect. Add explicit `width` and `height` attributes to both university logo `<img>` elements. Give the "Try the Demo Scorer" hero button an underline or pill treatment to signal it is interactive.
- **scorer.html**: Replace hardcoded hex colours in `renderLineDiff()` (`#fee2e2`, `#dcfce7`) with CSS custom properties or `data-` driven classes so dark mode inverts them correctly. Add `.fk-hero` class to the hero `<section>` for theme targeting. Fix badge contrast in dark mode.

### Acceptance criteria
- [ ] Lighthouse flags no missing `fonts.gstatic.com` preconnect warning.
- [ ] University logo images have explicit width/height (no layout shift).
- [ ] "Try the Demo Scorer" button is visually distinct as a clickable affordance.
- [ ] `renderLineDiff` removed/added lines remain readable in dark mode.
- [ ] No new Tailwind purge warnings from added classes.

---

## Tooling / CI

Recommended additions (not blocked on any PR above):

- **Axe-core smoke test** — add a Playwright or Cypress step that runs `axe()` against scorer.html and index.html and fails CI on any critical violation. This will gate PRs 3 and 4 automatically.
- **Lighthouse CI** — run `lhci autorun` on index.html in CI to track TTI regression; PR 2 should show a measurable improvement.
- **Bundle size check** — a simple `wc -c` assertion that the initial page weight (excluding `/js/xlsx.full.min.js`) stays below a threshold confirms the lazy-load invariant is maintained.
That order prioritizes improvements to the live marking loop first...

