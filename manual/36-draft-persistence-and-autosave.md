# Draft Persistence and Autosave

To prevent work loss from accidental browser closures, tab discards, or power interruptions, Feedback Kitchen continuously persists in-progress marking drafts to browser storage.

### The autosave engine

As you grade a student, a background autosave handler records changes into browser local storage under `SA_DRAFT_<scorerId>`:

- Student Name, Student ID, and Date
- Selected criterion grades, midpoint values, and manual overrides
- Late submission penalty selections and overall grade overrides
- Live edits inside the feedback draft editor
- Private text inside the **Marker's Notes** scratchpad
- Active Focus Mode index

Writes are debounced by 300 milliseconds to maintain smooth typing performance without disk thrashing.

### Resuming an uncommitted draft

If you reload the page, close the browser, or navigate away while marking:

1. On your return, an emerald status banner (`#draft-resume-banner`) appears at the top of the workspace:
   ```text
   ↺ Unsaved draft found — restore your in-progress marking?
   [Resume]  [Discard]
   ```
2. **Click Resume:** Restores all student metadata, criteria selections, numeric overrides, feedback edits, and marker notes exactly as you left them.
3. **Click Discard:** Purges the orphaned draft from `localStorage` and resets the workspace for a new student.

### Draft clearance lifecycle

The temporary draft record is cleared automatically when you complete an assessment action:

- Clicking **Copy feedback** (saves student into the cohort and clears the active draft)
- Clicking **Finalise & Export** (generates Marker's Record and clears the draft)
- Clicking **↺ New student** (resets inputs and purges the draft)

This ensures previous student data does not contaminate the next submission.
