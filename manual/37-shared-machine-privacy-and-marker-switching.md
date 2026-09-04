# Shared-Machine Privacy and Marker Switching

When multiple tutors mark from shared departmental workstations or hot-desking lab computers, Feedback Kitchen provides safeguards to prevent attribution errors and student data leakage between markers.

### The persistent marker readout (FK-33)

To ensure the correct marker is recorded on student gradebooks, the primary top bar displays a persistent status readout:

```text
Marking as: Dr Stephen Mann  [Switch marker]
```

This indicator remains visible across all section scrolls, making stale marker names immediately obvious before marking begins.

### The switch marker protocol

When completing a marking shift or handing over a computer to a colleague:

1. Click **Switch marker** in the primary navigation bar.
2. Feedback Kitchen clears the Marker field and the "Marking as" readout returns to `not set`.
3. It then drops the stored draft **only if there is no unsaved work in the session**. A draft holding real marking is deliberately kept, so that switching marker cannot destroy work someone has not finished.
4. The incoming marker enters their name in the Student details section (`#sec-student`), which becomes the active marker for all subsequent submissions.

That third step is the one to understand before you rely on this button on a shared machine. **Switch marker is a handover control, not a wipe.** If the outgoing marker left a part-marked student on screen, that student's details, scores and feedback remain in `SA_DRAFT_V1_<scorerId>` and the next person will be offered them by the resume banner. To leave nothing behind, use **↺ New student** first, which discards the draft outright, and then **Switch marker**.

### Auto-clear marker preferences

In **Scorer Settings**, you can configure marker persistence behaviour:

- **Persist Marker Name (Default):** Retains your marker name across consecutive submissions during a single marking session.
- **Auto-Clear Between Students:** Clears the Marker field on every **↺ New student** action, requiring explicit marker confirmation for each paper (useful for multi-marker round-robin marking).

### End-of-shift sanitisation checklist

Before leaving a shared university computer:

1. **Export Final Records:** Download the **Whole-Cohort Class Workbook** (`.xlsx`) and any required Moodle CSV worksheets.
2. **Discard the working draft:** Click **↺ New student**. This is the step that actually clears an unfinished student from the device.
3. **Clear Local Cohort:** In the Cohort section, click **Clear cohort** (confirm twice) or accept the post-export wipe prompt to delete cached student records from the browser.
4. **Switch Marker:** Click **Switch marker** to leave the terminal unassigned for the next marker.
