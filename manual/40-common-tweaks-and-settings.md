# Common Tweaks and Settings

Feedback Kitchen allows markers and course coordinators to tailor the grading workspace, calculation precision, and UI layout to specific assessment workflows.

### Scorer settings configuration

The following operational preferences can be configured in the **Builder Wizard** or adjusted via **Scorer Settings** in the marking workspace:

| Setting | Default | Purpose |
|---|---|---|
| **Moodle Marking Integration** | Enabled | Controls visibility of Moodle offline worksheet import prompts and export buttons. Disable for non-LMS assessments. |
| **Score Rounding Mode** | `Exact` | Selects default rounding precision (`Exact`, `Half`, `Whole`) for score badges, feedback text, and spreadsheet exports. |
| **Late Submission Deductions** | Enabled | Controls whether late penalty dropdowns and calculation rules appear in the workspace. |
| **Cohort Consistency Signal** | Disabled | Toggles the ambient scale-use indicator (`#cohort-consistency-badge`) in the Cohort section header. |
| **Auto-Clear Marker Name** | Disabled | When enabled, clears the marker name on every **↺ New student** action instead of persisting it. |

### Layout and density tweaks

- **Section Disclosure Memory (`SA_SECTION_STATE_V1`):** Feedback Kitchen remembers which `<details>` disclosure panels you have opened or closed across page reloads.
- **⤢ Expand All:** Opens all sections simultaneously for comprehensive document review.
- **⤡ Collapse All:** Closes secondary panels, leaving only the active section open to minimise vertical scrolling.
- **Focus Mode Default:** If you leave an assessment in **Focus Mode** (`#focus-workspace`), the workspace restores directly into focus mode on your next visit.

### Theme customization

- **Dark Mode:** Click the sun/moon icon in the primary top bar to switch between clean slate light mode and dark slate-navy mode (`fk-dark`).
- **OS Theme Sync:** If no explicit theme toggle is clicked, the application automatically synchronises with your operating system dark/light mode preference.

### Resetting preferences and onboarding banners

If you wish to restore dismissed onboarding banners:

- Dismissed demo onboarding flags (`SA_DEMO_ONBOARDING_DISMISSED`) and first-run hints can be reset by clearing the corresponding key in browser developer tools (`localStorage.removeItem('SA_DEMO_ONBOARDING_DISMISSED')`).
