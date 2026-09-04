# Draft Persistence and Autosave

To prevent work loss from accidental browser closures, tab discards, or power interruptions, Feedback Kitchen continuously persists in-progress marking drafts to browser storage.

### The autosave engine

As you grade a student, a background autosave handler records changes into browser local storage under `SA_DRAFT_V1_<scorerId>`. A draft is written only once at least one criterion has been graded and something has changed since the last save, so an untouched form leaves nothing behind:

- Student Name, Student ID, and Date
- Selected criterion grades, midpoint values, and manual overrides
- Late submission penalty selections and overall grade overrides
- Live edits inside the feedback draft editor
- Private text inside the **Marker's Notes** scratchpad

Writes are debounced by one second, and flushed immediately when the page is hidden or closed so the last edits survive a hard close. If browser storage is full the write is abandoned silently rather than interrupting marking.

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

Clicking **Switch marker** also purges it, but only when there is no unsaved work; see [chapter 37](37-shared-machine-privacy-and-marker-switching.md).

This ensures previous student data does not contaminate the next submission.
