# feat/draft-persistence

Implementation branch for PR 1 of the Feedback Kitchen roadmap.

## Scope
- `scorer.html` only (~65 lines added, ~10 modified)
- Adds `FK_DRAFT_KEY = 'fk-scorer-draft'` constant
- New `saveDraft()` and `clearDraft()` helpers
- Resume banner on page load when stale draft detected
- `beforeunload` guard tightened to draft-key + graded-criterion check
- `try/catch` around all `localStorage.setItem` calls

## Key touch-points (from CC parallel-reader pass)
- `localStorage` calls: add in `saveDraft()`, `clearDraft()`, init block, `beforeunload`
- `onGradeChange(i)` — wire `saveDraft()` before `recalculate()`
- `recalculate()` — wire `saveDraft()` at end
- `confirmNewStudent()` — wire `clearDraft()` before field reset
- `downloadExcel()` — wire `clearDraft()` after `saveAs`/anchor-click
- Input listeners: `#feedback-text`, `#additional-comments`, `#student-name`, `#student-id`, `#student-tutor`, `#grade-override`

## See also
ROADMAP.md — PR Sequence table, PR 1 full artefacts section
