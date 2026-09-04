# Troubleshooting

This chapter details diagnostic resolutions for common operational questions, calculation warnings, schema validation errors, and export discrepancies.

### Common issues and diagnostic matrix

| Symptom | Underlying Cause | Corrective Action |
|---|---|---|
| **My saved scorer has disappeared from the dashboard.** | Browser cache was cleared, site data was reset, or the page was opened in a different browser profile or incognito window. | Navigate to `upload.html` and re-import your `.json` scorer backup file. |
| **Builder will not let me save (Step 3 blocked).** | Criterion percentage weights do not total exactly 100%. | Adjust individual criterion percentages until the green checkmark (`✓ 100%`) displays. |
| **A score override field turned amber/red (`.out-of-band`).** | The entered point value sits outside the score band of the selected letter grade (e.g. entering `62` on an `A` grade). | Check if you intended that score. The value is accepted and calculated, but the advisory cue highlights potential typos. |
| **Rubric drift badge appeared on my cohort (`#cohort-drift-badge`).** | The rubric was edited mid-marking, causing earlier students to have different descriptors from later students. | Re-open earlier students to re-mark against the current rubric, or document the mixed rubric in your moderation notes. |
| **Moodle rejected my exported CSV worksheet.** | The filename was changed, or the file used during export was not the original CSV downloaded from that specific assignment. | Download a fresh worksheet from Moodle, re-run **Export Moodle worksheet…**, and upload without altering the filename. |
| **Moderation export button is disabled.** | The active cohort contains fewer than 15 marked students, or moderation opt-in was not configured by the coordinator. | Moderation export enforces *k*-anonymity (*n* ≥ 15) to protect student privacy. Use standard cohort Excel exports for smaller classes. |
| **Feedback draft is out of sync with selected grades.** | Extensive manual edits were typed into the feedback box, overriding dynamic template updates. | Click **↺ Regenerate feedback** to discard manual edits and rebuild the draft from current grade choices. |
| **Browser displays a storage quota error (`QuotaExceededError`).** | Local storage has reached browser capacity (usually 5MB–10MB) due to multiple historical cohorts. | Download all completed cohorts via **Export cohort (Excel)**, then click **Clear cohort** on old assessments to free storage. |

### Resolving Moodle import schema errors

If Feedback Kitchen rejects a Moodle worksheet during import with an `E_HEADER_MISMATCH` or parsing error:

1. **Verify Header Columns:** Ensure the CSV file has not been opened and re-saved in third-party software that alters column headers or removes the UTF-8 BOM marker.
2. **Preserve Moodle Layout:** Feedback Kitchen requires all 14 canonical columns (`Identifier`, `Full name`, `ID number`, `Email address`, `Status`, `Group`, `Marker`, `Grade`, `Maximum grade`, `Marking workflow state`, `Grade can be changed`, `Last modified (submission)`, `Last modified (grade)`, `Feedback comments`).
3. **Re-Download Source:** Download a clean copy of the grading worksheet directly from Moodle assignment settings.

### Recovering lost drafts

If a browser tab crashes during active marking:

- Re-open the assessment scorer in the same browser.
- Inspect the top of the workspace for the emerald **↺ Unsaved draft found** status banner.
- Click **Resume** to restore your student details, scores, and uncommitted text.
