# Notices and Validation Alerts

Feedback Kitchen uses non-blocking visual notices, advisory warnings, and accessible live regions to alert you to calculation discrepancies, rubric drift, or uncommitted drafts without interrupting your marking flow.

### Criterion weight balancing

Assessment criteria weights must total exactly 100%.

- **Balanced State:** When weights equal 100%, the interface displays a green checkmark (`✓ 100%`).
- **Unbalanced Warning:** If criteria weights sum to any value other than 100%, an amber warning displays the actual total (e.g. `Weights total 95% — must equal 100%`). In the builder wizard, saving is blocked until weights are resolved.

### Out-of-band score override notices

When you manually enter a numeric point value into an **Override** field, the application checks whether the value sits inside the min/max score band of the selected letter grade.

- **Advisory Highlight:** If an override falls outside the selected grade's threshold band (for example, entering 68 on an A grade), the input field turns amber/red (`.out-of-band`).
- **Non-blocking Behavior:** The override is accepted immediately and factored into the total score. The visual cue serves as an advisory check against accidental typographical errors.

### Rubric drift indicator

If you edit an assessment's criteria or descriptors after marking has already begun, previously saved cohort records retain their original rubric descriptors.

When Feedback Kitchen detects mixed rubric versions in an open cohort:

1. An amber badge (`#cohort-drift-badge`) appears in the Cohort section header reading `Rubric drift detected`.
2. The cohort container applies a subtle amber warning outline (`.fk-cohort-drift`).
3. An advisory note warns that exporting this cohort to moderation will contain records evaluated against different rubric iterations.

### Cohort consistency indicator

When enabled in Scorer Settings, an ambient process-quality badge (`#cohort-consistency-badge`) monitors grade spread across the active cohort:

- **Compressed Scale:** Warns when marking clusters heavily in a narrow band without utilising the full rubric range.
- **Wide Scale:** Confirms broad utilisation across distinction, pass, and fail tiers.

### Draft resume and recovery banner

If your browser tab closes unexpectedly or is reloaded during an active session:

- An emerald status banner (`#draft-resume-banner`) appears at the top of the marking page reading `↺ Unsaved draft found — restore your in-progress marking?`.
- Click **Resume** to restore student details, criterion scores, manual overrides, and edited feedback.
- Click **Discard** to purge the orphaned draft from `localStorage` and start fresh.

### Screen reader live regions

Dynamic calculations and asynchronous actions broadcast updates to assistive technologies using `aria-live="polite"` regions:

- Overall score and suggested grade recalculations
- Wording assistant generation progress
- Cohort status toasts (e.g. `Feedback copied to clipboard · added to cohort`)
