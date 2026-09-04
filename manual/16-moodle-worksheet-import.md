# Moodle Worksheet Import

Feedback Kitchen integrates with Moodle without requiring administrative plugins or API tokens. It uses Moodle's native **Offline Grading Worksheet** format to import class rosters and participant identifiers.

![Moodle worksheet import modal](images/ch16-moodle-import.png)

### Downloading the worksheet from Moodle

1. Navigate to your assignment in Moodle.
2. In the grading navigation menu, select **Download grading worksheet**.
3. Save the resulting `.csv` file to your computer. Do not edit or rename the file.

### Initiating the import in Feedback Kitchen

You can trigger the import from two locations in the marking interface:

- **Student Section:** Click the prompt in the Student details panel (`#sec-student`).
- **Cohort Section:** Click **Import Moodle worksheet…** in the Cohort manager (`#sec-cohort`).

Select the downloaded CSV file. Feedback Kitchen executes an automated validation pass before any data is loaded.

### Structural validation and schema verification

Feedback Kitchen enforces strict validation against Moodle's canonical 14-column header contract:

```text
Identifier, Full name, ID number, Email address, Status, Group, Marker,
Grade, Maximum grade, Marking workflow state, Grade can be changed,
Last modified (submission), Last modified (grade), Feedback comments
```

If columns have been modified, added, or deleted, a file-blocking error (`E_HEADER_MISMATCH`) is displayed to prevent corrupted imports.

### Import preview and row dispositions

Before committing the import, Feedback Kitchen presents a preview table detailing the action planned for every row:

| Status Badge | Disposition | Action Taken |
|---|---|---|
| `Import` (`.mw-import`) | New Student | Adds the student to the cohort queue ready for marking. |
| `Verify` (`.mw-verify`) | Already Marked | Student exists in local cohort storage. Preserves existing grades and feedback without overwriting. |
| `Skip` (`.mw-skip`) | Duplicate / Invalid | Omits rows lacking valid identifiers. |
| `Non-markable` (`.mw-nonmarkable`) | Ineligible | Omits students with suspended enrollment or empty submissions. |

### Committing the class roster

Click **Commit Import** in the preview dialog.

- The class roster is loaded directly into the Cohort workbench.
- The first ungraded student opens automatically in the marking workspace.
- If you were actively marking a draft when importing, Feedback Kitchen preserves your active draft on screen rather than discarding uncommitted work.
