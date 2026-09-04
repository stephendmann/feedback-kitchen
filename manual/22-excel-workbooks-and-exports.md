# Excel Workbooks and Exports

Feedback Kitchen generates formal Excel spreadsheets (`.xlsx`) directly in your browser using SheetJS. Workbooks are built completely on the client side without transmitting student marks to an external server.

### The two primary export workbooks

Feedback Kitchen produces two distinct Excel formats:

```
┌──────────────────────────────────────────────────────────────┐
│  Single-Student Record (.xlsx)                               │
│  [Results] ─ [Rubric] ─ [Grade Feedback] ─ [Instructions]    │
└──────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────────────────────┐
│  Whole-Cohort Class Workbook (.xlsx)                                                      │
│  [Student Feedback] ─ [Grade Matrix] ─ [Cohort Summary] ─ [Rubric] ─ [Grade Feedback]     │
│  ─ [Instructions]                                                                         │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

### Single-student Marker's Record

Click **Finalise & Export** in the Finish section (`#sec-export`) or press `Ctrl + Shift + E`.

This downloads a four-sheet workbook, named `<Student>_<Course>_Feedback.xlsx`, for individual student archiving:

| Sheet Name | Contents |
|---|---|
| `Results` | Student details, criterion grades, midpoint scores, overrides, weighted points, overall score, late penalty deduction, complete assembled feedback text, and private marker notes. |
| `Rubric` | Complete assessment rubric descriptor matrix (criteria × performance tiers) establishing the audit baseline. |
| `Grade Feedback` | Master intro and outro feedback templates across all grade levels. |
| `Instructions` | What each sheet holds, plus the scorer name, assessment, course, institution and generation date. |

### Whole-cohort class workbook

Click **Export cohort (Excel)** in the Cohort section (`#sec-cohort`) or press `Ctrl + Shift + X`.

This downloads a six-sheet spreadsheet, named `<Course>_<CohortLabel>_Cohort.xlsx`, aggregating the entire class:

- **Student Feedback:** Tabular roster with one row per student containing student name, ID number, marker name, submission date, total score, final grade, complete feedback text, and marker notes.
- **Grade Matrix:** Side-by-side matrix displaying criterion-by-criterion letter grades and scores for every student in the cohort.
- **Cohort Summary:** Statistical summary reporting total headcount, mean score, score range, and grade band distribution counts.
- **Rubric:** The active rubric reference matrix.
- **Grade Feedback:** The active grade template reference matrix.
- **Instructions:** A sheet-by-sheet guide to the workbook, with the scorer and generation details.

### Lazy-loading architecture

The SheetJS binary (`xlsx.full.min.js`) is close to a megabyte, so it is kept off the critical path and loaded on demand. A CI guard (`scripts/check-lazy-load.js`) fails the build if a static script tag for it reappears in any page.

When you click an export button for the first time in a session, Feedback Kitchen fetches the local script asynchronously, displays a brief `Loading…` indicator, and generates the workbook. Subsequent exports execute instantly from memory.

### Formatted print and PDF exports

Click **Print page** in the Finish section to generate a formatted snapshot of the current assessment.

The dedicated print stylesheet (`@media print`):
- Hides interactive buttons, navigation rails, and modal dialogs
- Formats student details, criteria scores, and assembled feedback into a clean, printable assessment report suitable for physical archiving or saving as a PDF.
