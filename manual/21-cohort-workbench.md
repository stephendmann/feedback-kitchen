# Cohort Workbench

The **Cohort Workbench** (`#sec-cohort`) maintains a running record of all students evaluated under the active assessment scorer. It builds automatically as you mark and stores data locally in your browser (`SA_COHORT_<scorerId>`).

### Automated cohort accumulation

Students are added to the cohort ledger automatically whenever you:

- Click **Copy feedback** (or press `Ctrl + Shift + C`)
- Click **Finalise & Export** (or press `Ctrl + Shift + E`)

Each record requires at least a student name or student ID. The first save prompts you to name the cohort (e.g. *PHIL102 — Semester 2 2026*).

### What each record stores

Every saved cohort entry captures the complete state of the evaluation:

- Student Name, Student ID, and Marker Name
- Criterion letter grades, raw scores, and point overrides
- Total calculated score, late penalty deduction, and final grade
- Full edited feedback draft and private marker notes
- Rubric version timestamp

### Reviewing and searching records

Click **View list** in the Cohort section to open the class roster dialog:

- **Instant Search:** Filter records by student name, ID number, or awarded letter grade.
- **Summary Overview:** View overall scores, percentage contributions, and submission dates at a glance.

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
