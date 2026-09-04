# Troubleshooting

This chapter details diagnostic resolutions for common operational questions, calculation warnings, and export discrepancies.

![Troubleshooting diagnostic flow](images/ch42-troubleshooting.png)

### Common issues and resolutions

| Symptom | Underlying Cause | Corrective Action |
|---|---|---|
| **My saved scorer has disappeared from the dashboard.** | Browser cache was cleared, site data was reset, or the page was opened in a different browser profile or incognito window. | Navigate to `upload.html` and re-import your `.json` scorer backup file. |
| **Builder will not let me save (Step 3 blocked).** | Criterion percentage weights do not total exactly 100%. | Adjust individual criterion percentages until the green checkmark (`✓ 100%`) displays. |
| **A score override field turned amber/red.** | The entered point value sits outside the score band of the selected letter grade (e.g. entering `62` on an `A` grade). | Check if you intended that score. The value is accepted and calculated, but the advisory cue highlights potential typos. |
| **Rubric drift badge appeared on my cohort.** | The rubric was edited mid-marking, causing earlier students to have different descriptors from later students. | Re-open earlier students to re-mark against the current rubric, or document the mixed rubric in your moderation notes. |
| **Moodle rejected my exported CSV worksheet.** | The filename was changed, or the file used during export was not the original CSV downloaded from that specific assignment. | Download a fresh worksheet from Moodle, re-run **Export Moodle worksheet…**, and upload without altering the filename. |
| **Moderation export button is disabled.** | The active cohort contains fewer than 15 marked students, or moderation opt-in was not configured by the coordinator. | Moderation export enforces *k*-anonymity (*n* ≥ 15) to protect student privacy. Use standard cohort Excel exports for smaller classes. |
| **Feedback draft is out of sync with selected grades.** | Extensive manual edits were typed into the feedback box, overriding dynamic template updates. | Click **↺ Regenerate feedback** to discard manual edits and rebuild the draft from current grade choices. |
| **Browser displays a storage quota error.** | Local storage has reached browser capacity (usually 5MB–10MB) due to multiple historical cohorts. | Download all completed cohorts via **Export cohort (Excel)**, then click **Clear cohort** on old assessments to free storage. |
