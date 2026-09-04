# Focus Marking Mode

When marking complex assessments with multiple criteria, scrolling back and forth between a large rubric table and the full feedback box can create visual fatigue. **Focus Marking Mode** isolates one criterion at a time, pairing its grading controls directly with its individual feedback paragraph.

### Activating focus mode

Click the **◎ Focus mode** button in the section rail or primary navigation bar.

When enabled:

- The full rubric table (`#sec-rubric`) and the main feedback textarea (`#sec-feedback`) are hidden from view.
- The **Focus Workspace** (`#focus-workspace`) activates in their place.
- The section rail dims non-essential sections to reduce visual distractions.

Focus mode is an alternative view over the same underlying data model. Switching between standard mode and focus mode preserves all scores, overrides, and feedback edits.

### The split-card workspace

The focus workspace organizes the active criterion into a two-column card grid:

| Surface | Component | Function |
|---|---|---|
| **Left Card** | Grade & Override Controls | Displays the criterion name, percentage weighting, grade dropdown selector, and numeric point override. Shows the raw score, weighted contribution, and rubric tier badge. |
| **Right Card** | Criterion Feedback Editor | Displays the generated rubric descriptor for this specific criterion. Edits typed into this textarea write directly into the full feedback draft. |

### Live draft synchronisation

As you edit feedback inside the criterion box (`#focus-body`):

- A status chip (`#focus-save-chip`) displays `✓ Saved to draft` in green before fading to a subtle idle state.
- Changes update the central assembled draft in memory without overwriting other criteria paragraphs or overall intro/outro text.

### Navigating between criteria

You can move through the assessment using on-screen buttons or keyboard shortcuts:

- **Next Criterion:** Click **Next →** or press `PageDown`.
- **Previous Criterion:** Click **← Previous** or press `PageUp`.
- **Progress Counter:** The header displays the active index and total criteria count (e.g. `Criterion 2 of 5`).

Keyboard pagination is automatically bypassed when your cursor is inside the feedback editor so that standard text navigation functions normally.

### The persistent full draft pane

Below the navigation buttons, a collapsed **Full draft** strip (`#focus-draft-pane`) monitors overall draft progress:

- **Live Metrics:** Displays running line and word counts for the complete assembled feedback.
- **Tail Preview:** Shows an inline snippet of the most recently written feedback paragraph.
- **Inline Expansion:** Click the summary strip to expand a read-only mirror of the full feedback draft to check overall flow, tone, and repetition without exiting focus mode.
