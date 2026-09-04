# Moodle Worksheet Import

Feedback Kitchen integrates with Moodle without requiring administrative plugins or API tokens. It uses Moodle's native **Offline Grading Worksheet** format to import class rosters and participant identifiers.

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

| Status Badge | What it means | Action taken |
|---|---|---|
| `Import` (`.mw-import`) | The row has an ID number | Keyed on that ID and queued for marking. |
| `Verify` (`.mw-verify`) | The row has a name but no ID number | Held back. Matching on a name alone risks attaching one student's grades to another, so the row is never imported automatically. Use **Assign ID** to supply the missing identifier, or **Ignore** to drop the row. |
| `Skip` (`.mw-skip`) | Unusable or duplicate | No ID and no name, or an ID already claimed by another row or by a student already in the cohort. |
| `Non-markable` (`.mw-nonmarkable`) | No submission | Listed so the roster is complete, but not queued for marking. |

Students you have already marked are not shown as `Verify`. They are skipped as duplicates, and their existing grades and feedback are left untouched.

### Committing the class roster

The commit button reads **Import N students**, counting only the rows in the `Import` disposition. It stays disabled while any `Verify` row is unresolved, with the tooltip "Resolve every verify row first".

- The class roster is loaded directly into the Cohort workbench.
- The first imported student opens automatically in the marking workspace.
- If you were part-way through marking someone when you imported, that draft is left on screen and no student is opened over the top of it.
