# Marking Without an LMS

Feedback Kitchen operates as a completely standalone assessment application. It does not require an active connection to Moodle, Canvas, Blackboard, or any Learning Management System.

![Standalone marking setup](images/ch27-non-lms-marking.png)

### Common standalone use cases

Standalone marking workflows are commonly used for:

- **Physical Submissions & Exams:** Evaluating printed essays, blue-book exams, or handwritten assessment scripts.
- **Oral Presentations & Vivas:** Rapid live evaluation during student presentations, debates, or dissertation defenses.
- **Laboratory Practical Assessments:** Real-time scoring on a tablet or laptop at lab benches.
- **Studio & Design Critiques:** Structured rubric evaluation for visual, architectural, or creative portfolio submissions.
- **Independent & Private Courses:** Delivering high-quality structured feedback in professional workshops or non-institutional courses.

### Disabling LMS controls

To keep the interface clean when an LMS is not in use:

1. Open the assessment scorer in the **Builder Wizard** (`builder.html`) or open **Scorer Settings** in the marking workspace.
2. Toggle **This assessment is marked in Moodle** to **OFF**.
3. The Moodle worksheet import prompts and export buttons are hidden, leaving a streamlined marking interface.

This setting is stored inside the scorer configuration and travels with the `.json` file when shared.

### Delivering feedback without an LMS

Feedback Kitchen provides multiple methods for delivering feedback directly to students:

| Delivery Method | Action | Typical Application |
|---|---|---|
| **Printed Feedback Slip** | Click **Print page** | Generates a clean, formatted feedback summary suitable for physical handout or stapling to returned scripts. |
| **Individual PDF Attachment** | Print dialog → **Save as PDF** | Generates a professional single-page PDF feedback document to email directly to the student. |
| **Email Body Text** | Click **Copy feedback** | Copies plain-text feedback to the clipboard for pasting directly into an individual email message. |
| **Individual Excel Record** | Click **Finalise & Export** | Downloads `<Student>_Marker_Record.xlsx` for student distribution or department archiving. |

### Cohort record keeping

Even without an LMS gradebook, the **Cohort Workbench** tracks the entire class.

At the conclusion of marking, click **Export cohort (Excel)** to download a complete, permanent class archive containing individual feedback transcripts, criteria score matrices, and statistical grade distributions.
