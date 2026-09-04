# Common Tweaks and Settings

Feedback Kitchen allows markers and course coordinators to tailor the grading workspace, calculation precision, and UI layout to specific assessment workflows.

### Scorer settings configuration

**Scorer Settings** in the marking workspace holds the settings below. The first belongs to the scorer and travels with its JSON; the rest are device settings and stay in this browser.

| Setting | Default | Purpose |
|---|---|---|
| **This assessment is marked in Moodle** | Enabled | Shows the Moodle worksheet import and export tools. Saved with the scorer and included when you export it, so your marking team gets the same setting. |
| **Show advanced wording tools** | Disabled | Adds the manual fallback, prompt builder and local run log to the wording assistant. |
| **Show cohort consistency indicator** | Disabled | Toggles the ambient scale-use badge (`#cohort-consistency-badge`) in the Cohort section header. Hidden anyway for fewer than 12 scripts. |
| **Clear marker name between students** | Disabled | Clears the Marker field on every **↺ New student**, and keeps the marker name out of the on-device draft. |

Two settings live elsewhere. **Score display** (`Exact`, `Half`, `Whole`) is set on Step 1 of the builder and can be changed live from the section rail while marking. **Late submission penalties** are configured on Step 6 of the builder.

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
