# Cohort Workbench

The **Cohort Workbench** (`#sec-cohort`) maintains a running record of all students evaluated under the active assessment scorer. It builds automatically as you mark and stores data locally in your browser (`SA_COHORT_<scorerId>`).

### Automated cohort accumulation

Students are added to the cohort ledger automatically whenever you:

- Click **Copy feedback** (or press `Ctrl + Shift + C`)
- Click **Finalise & Export** (or press `Ctrl + Shift + E`)

A record needs at least a student name or student ID, and the save has to complete: if you dismissed the cohort setup earlier in the session, or the browser refuses the write because storage is full, nothing is added and an amber notice says so. Chapter 36 covers what that means for the draft. The first save opens a short setup dialog asking for a cohort label (e.g. *PHIL102 Semester 2 2026*) and whether more than one marker will work on it. The multi-marker answer is what Cohort Insights uses to decide whether its consistency figures describe one marker or several.

### What each record stores

Every saved cohort entry captures the complete state of the evaluation:

- Student Name, Student ID, and Marker Name
- Criterion letter grades, raw scores, and point overrides
- Total calculated score, late penalty deduction, and final grade
- Full edited feedback draft and private marker notes
- The 8-character rubric version hash in force when the record was saved

### Reviewing saved records

Click **View list** in the Cohort section to open the class roster dialog. It shows the cohort label and a running count, then one numbered line per student: the name and ID, then the awarded grade, the score out of 100, and when you saved it. That timestamp is when you marked the student, not when they submitted.

There is no search box. The list is the order you saved in, so on a large cohort use your browser's own find on the page.

Each line carries two controls. **Open** loads that record back into the marking workspace, covered below. **Remove** deletes the record from the cohort after one confirmation, and it deletes only that student, leaving the rest untouched.

### Re-opening students for correction

If you need to adjust a grade or amend written feedback:

1. Open the cohort list and click **Open** next to the student's name.
2. If you have an unsaved draft on screen, Feedback Kitchen prompts you before replacing active inputs.
3. The student's criterion grades, overrides, feedback text, and marker notes are restored into the marking workspace.
4. Make your corrections. Saving or copying feedback updates the existing record in place without creating duplicate entries.

### Clearing cohort records

Because cohort data resides in browser local storage, clearing your browser cache will delete unexported records.

- **Export First:** Always download the full class spreadsheet via **Export cohort (Excel)** before ending a marking block.
- **Clear Cohort:** Click **Clear cohort** (requires double confirmation) to permanently delete local records for this scorer. On shared lab computers, use the post-export wipe prompt to clear student data immediately after downloading the workbook.
