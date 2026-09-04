# Accessibility and Keyboard Navigation

Feedback Kitchen is engineered to meet **WCAG 2.1 Level AA** accessibility standards. The interface supports assistive screen readers, non-mouse keyboard navigation, high-contrast visual environments, and accessible modal dialogs.

### Semantic structure and landmarks

Every page uses standard HTML5 structural elements and ARIA landmarks to support screen reader navigation:

- `<header>`: Page chrome and product positioning announcements.
- `<nav aria-label="Primary">`: Global brand and session actions.
- `<nav aria-label="Sections">`: Persistent in-page section navigation.
- `<main>`: Main assessment and marking content.
- `<details open>`: Accessible collapsible sections with `<summary>` headings.

### Screen reader announcements (WCAG 4.1.3)

Dynamic updates are communicated to assistive technologies through off-screen `aria-live="polite"` regions:

| Live Region Target | Element ID | Announcement Content |
|---|---|---|
| **Score Recalculation** | `#score-result-live` | Announces updated weighted percentage scores and suggested grade letters when marks change. |
| **Focus Mode Navigation** | `#focus-live` | Announces active criterion index, name, and percentage weighting upon stepping. |
| **Toast Notifications** | `#fk-dispatch-toast` | Announces clipboard status, cohort save confirmations, and quota warnings. |
| **Grade Override Status** | `#grade-override-status` | Informs screen reader users whether an override is active or conflicting with a late penalty. |

### Accessible modal dialogs

All dialog windows (Keyboard Shortcuts, Cohort Roster, Snippet Manager, Settings) implement standard accessible dialog patterns:

- Attributes `role="dialog"` and `aria-modal="true"` isolate background content.
- Keyboard focus moves automatically to the first interactive element inside the modal upon opening.
- Pressing `Escape` closes the dialog and returns keyboard focus to the triggering button.

### Non-color visual cues (FK-04)

To accommodate colorblind users and low-contrast viewing conditions:

- **Marker Input Highlight:** Interactive fields (`.cell-yellow`) feature a distinct 3px solid amber left border (`#d97706`) alongside the background tint.
- **Out-of-Band Warnings:** Score override alerts combine a red background with high-contrast text and explicit descriptive notices.
