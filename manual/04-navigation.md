# Navigation

The Feedback Kitchen marking interface is structured for high-speed, top-to-bottom assessment. Two persistent navigation surfaces—the primary top bar and the secondary section rail—keep essential controls and section jumps accessible regardless of document scroll depth.

### The primary top bar

The primary top bar sticks to the top of the viewport (`sticky top-0 z-50`). It provides global session identity and persistent actions.

| Control | Position | Function |
|---|---|---|
| **Feedback Kitchen Brand** | Left | Links back to the home dashboard (`index.html`). |
| **Marking As Readout** | Center-Left | Displays the active marker name. Click **Switch marker** to clear the marker name and drop uncommitted session state for the next user. |
| **Theme Toggle** | Right | Toggles between light and dark display modes. |
| **Wording Key** | Right | Opens AI wording assistant credentials and access settings. |
| **↺ New Student** | Right | Resets grading selections, feedback drafts, and notes while preserving the active marker name. |

### The secondary section rail

Positioned directly below the primary top bar (`sticky top-14 z-30`), the section rail acts as a persistent table of contents for the marking workspace.

Clicking any rail link jumps immediately to that section:

- **Student:** `#sec-student` — Student name, ID, submission date, and Moodle class list import entry point.
- **Rubric:** `#sec-rubric` — Criteria table, letter grade selectors, and point overrides.
- **◎ Focus marking:** `#focus-workspace` — Criterion-by-criterion isolated marking mode.
- **Penalty & grade override:** `#sec-adjust` — Late submission penalty tiers, final grade overrides, and score rounding.
- **Feedback:** `#sec-feedback` — Synthesised feedback draft editor and personal snippet insertion.
- **Notes:** `#sec-notes` — Private marker scratchpad.
- **Finish:** `#sec-export` — Copy feedback, download single-student Marker's Record (Excel), and print page.
- **Cohort:** `#sec-cohort` — Cohort student records, cohort Excel export, moderation exports, and insights.

### Rail controls and tools

The right side of the section rail hosts workspace layout and scoring controls:

- **Score Rounding:** Segmented buttons (**Exact**, **Half**, **Whole**) apply live rounding to the calculated weighted score. A helper preview displays the computed result.
- **◎ Focus mode:** Switches the workspace between full-page view and single-criterion focus mode.
- **⤢ Expand all:** Opens all `<details>` disclosure panels across the page.
- **⤡ Collapse all:** Closes all disclosure panels except the active section to minimise vertical scroll distance.

### Scroll-spy and anchor offsets

As you scroll through a student assessment, the section rail tracks your position and highlights the active section link.

The layout uses CSS `scroll-padding-top` on the root document (8.5rem on mobile, 6.5rem on desktop). When you click a rail link or navigate via keyboard focus, section titles land cleanly below the stacked sticky bars rather than hiding underneath them.
