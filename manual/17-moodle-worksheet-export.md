# Moodle Worksheet Export

When cohort marking is complete, Feedback Kitchen writes student grades and assembled feedback back into the Moodle **Offline Grading Worksheet** for bulk upload to your course gradebook.

![Moodle worksheet export modal](images/ch17-moodle-export.png)

### The round-trip requirement

Moodle requires uploaded worksheets to contain specific participant keys (`Participant <id>`) and identical column ordering to accept the file.

To ensure compatibility, Feedback Kitchen performs an in-place merge:

1. You supply the original, unedited CSV worksheet originally downloaded from the Moodle assignment.
2. Feedback Kitchen matches students against the local cohort store using their student ID or full name.
3. It populates the editable columns while leaving all institutional metadata untouched.
4. It downloads the updated CSV, ready for immediate upload to Moodle.

### Column injection rules

Feedback Kitchen modifies only two columns in the 14-column Moodle schema:

| Column | Data Source | Output Format |
|---|---|---|
| `Grade` | Calculated Final Score | Numeric score out of 100 formatted to two decimal places (e.g. `78.50`). Factors in late penalty deductions if applied. |
| `Feedback comments` | Assembled Feedback Draft | Complete plain-text feedback block containing intro, criterion descriptors, score line, outro, and late notices. Properly RFC-4180 escaped. |

All other twelve columns—including group allocations, marker assignments, workflow states, and submission timestamps—remain byte-identical to the original Moodle export.

**Marker's Notes are never written to the Moodle worksheet.** Internal notes remain strictly in your local archive and Excel workbooks.

### Exporting the completed worksheet

1. Scroll to the **Cohort** section (`#sec-cohort`) in the marking workspace.
2. Click **Export Moodle worksheet…**.
3. Select the original Moodle CSV file when prompted.
4. Feedback Kitchen displays a summary of matched and populated rows (e.g. `Populated 42 of 42 student records`).
5. The processed CSV downloads automatically to your computer.

### Uploading grades back to Moodle

1. Open your assignment in Moodle.
2. In the grading navigation menu, select **Upload grading worksheet**.
3. Choose the exported CSV file. Ensure the original filename is preserved.
4. Confirm the upload preview in Moodle to publish grades and feedback to your students.
