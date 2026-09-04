# Getting Started

Feedback Kitchen runs directly in any modern web browser without user registration or software installation. You can configure a new assessment rubric, mark a student, and export a formal grading record in under thirty minutes.

### Launching the application

Open [marking.stephendmann.com](https://marking.stephendmann.com/) in Google Chrome, Microsoft Edge, Mozilla Firefox, or Apple Safari.

The home page displays your saved assessment scorers under **Your Kitchens**, alongside shortcuts to create a new scorer, import a JSON configuration, or load a pre-configured demo assessment.

### The three-step marking loop

Using Feedback Kitchen centers on three core actions:

1. **Build a Scorer:** Configure assessment criteria, percentage weights, grade bands, and rubric descriptors once per assignment.
2. **Mark Students:** Select a grade per criterion for each student while the application synthesises formatted feedback in real time.
3. **Export Records:** Save individual feedback to the clipboard, download structured Excel gradebooks, or export batch Moodle worksheets.

### Building your first scorer

Click **Build a New Scorer** on the home page to launch the six-step configuration wizard.

| Step | Configuration Target | Purpose |
|---|---|---|
| 1 | Assessment Details | Paper code, assessment title, institution, and default tutor name. |
| 2 | Grade Scale | Select a regional preset (NZ, AU, UK, US) or define custom grade thresholds. |
| 3 | Criteria & Weights | Specify assessment dimensions and ensure percentage weights sum to 100%. |
| 4 | Rubric Descriptors | Write second-person performance statements across each grade tier. |
| 5 | Feedback Templates | Define introductory and concluding remarks keyed to overall letter grades. |
| 6 | Settings & Review | Configure late penalty deduction schedules and export a JSON backup. |

Click **Save & Launch** on Step 6. The newly created scorer opens immediately in the marking workspace.

### Marking your first student

The marking interface arranges grading controls in a top-to-bottom sequence.

1. **Enter Student Details:** Type the student name and student ID. The date fills automatically, and your marker name persists across submissions.
2. **Assign Criterion Grades:** Select a letter grade from the dropdown for each criterion. The midpoint score populates instantly. Enter a custom value in **Override** to adjust the points directly.
3. **Check Suggested Grade:** Review the calculated weighted score and suggested overall letter grade. Set a late submission penalty band if the assignment was submitted past the deadline.
4. **Edit Feedback Draft:** Review the real-time generated feedback in the **Cooked Feedback** panel. Edit sentences directly or insert saved snippets.
5. **Add Private Notes:** Record borderline rationale or moderation notes in the **Marker's Notes** area.
6. **Copy and Advance:** Click **Copy feedback** to place the finished text on your system clipboard for pasting into your LMS grading portal. Click **New student** to reset the form while preserving your marker name.

### Exporting your cohort

Every time you copy feedback or click **Finalise & Export**, the student record is automatically saved to the local cohort storage.

At the end of your marking session, scroll to the **Cohort** section at the bottom of the page and click **Export cohort (Excel)**. This downloads a multi-sheet spreadsheet containing:

- Individual student feedback transcripts
- Complete grade and score matrices
- Cohort performance summaries
- Full rubric matrices and feedback templates for moderation audits

### Immediate safety practice

Feedback Kitchen stores all active data in your browser's local storage. If you clear browser cache or use an ephemeral private browsing window, stored scorers and unexported cohort records will be deleted.

Export your scorer configuration as a `.json` file from Step 6 of the builder immediately after creation, and export your cohort Excel workbook at the end of every marking block.
