# fix/accessible-modals

Implementation branch for PR 3 of the Feedback Kitchen roadmap.

## Scope
- `scorer.html` only (~100 lines added/modified)
- All 12 modal dialogs brought to WCAG 2.1 AA

## Requirements per modal
- `role="dialog"` and `aria-modal="true"` on wrapper element
- `aria-labelledby` pointing to the modal's heading
- Focus moves to first focusable element (or modal heading) on open
- Focus trap: Tab/Shift+Tab cycles only within modal
- Escape key closes modal
- Focus returns to the trigger element on close

## Key touch-points (from CC parallel-reader pass)
- All modal IDs enumerated by the parallel-reader pass
- `renderCriteriaRows` — any dynamically generated modal content must also get these attributes
- A shared `openModal(id, triggerEl)` / `closeModal(id)` utility recommended to DRY the pattern

## See also
ROADMAP.md — PR Sequence table, PR 3
