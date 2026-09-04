# Coming from Excel or LMS Rubrics

Feedback Kitchen bridges the gap between spreadsheet-based marking workflows and built-in Learning Management System (LMS) grading tools. Understanding how its architecture differs from traditional marking software will help you structure your assessment workflow efficiently.

![Comparison of marking workflows](images/ch03-marking-workflows.png)

### Coming from Excel marking workbooks

The original Feedback Kitchen was created as an Excel workbook by Dr Michael Harker at the University of Strathclyde. In that spreadsheet model, markers selected grades from dropdown cells, and Excel formulas assembled strings into a feedback block.

While effective, spreadsheet workbooks present specific operational hurdles:

- **Formula fragility:** Accidental cell edits or pasted text can break worksheet formulas or calculation logic across a marking team.
- **Marker customisation:** Individual tutors cannot easily maintain personal libraries of reusable commentary without altering the shared workbook structure.
- **Device compatibility:** Spreadsheet macros and cell formatting behave inconsistently across desktop Excel, mobile apps, and third-party spreadsheet viewers.

Feedback Kitchen preserves the pedagogical strengths of the Harker workbook—criterion-referenced descriptors, midpoint scoring, and tiered opening and closing framing—while moving the engine to the web browser. In Feedback Kitchen, formulas cannot be corrupted, personal snippet libraries persist independently on each tutor's machine, and formal Excel workbooks are generated cleanly on export.

### Coming from native LMS rubrics (Moodle, Canvas, Blackboard)

Most LMS platforms provide built-in rubric grids where markers click cells to assign criteria scores.

| LMS Rubric Workflow | Feedback Kitchen Workflow |
|---|---|
| Rigid cell selection tied directly to institutional cloud infrastructure. | Standalone client-side application running locally in any browser tab. |
| In-browser page loads between student submissions introduce grading latency. | Instant keyboard and click transitions between criteria and students. |
| Repetitive advice must be manually retyped or copied from external documents. | Integrated personal snippet library inserts saved commentary with one click. |
| Rubrics are locked to a single LMS course shell. | Portable `.json` scorers can be shared, archived, and reused across platforms. |
| Requires continuous network connectivity to LMS servers. | Fully functional offline without an active network connection. |

### Coming from Turnitin GradeMark or Word comments

Marking directly in document viewers such as Turnitin GradeMark or Microsoft Word margin comments often leads to inconsistent feedback depth across large cohorts. Markers frequently provide extensive comments on early submissions, then shorten their remarks as fatigue sets in.

Feedback Kitchen establishes a calibrated baseline:

1. **Criterion-level rigor:** Every student receives detailed, second-person commentary calibrated to the exact performance tier achieved.
2. **Separation of concerns:** Rubric descriptors define core standards, while inline editing and personal snippets let you address individual student idiosyncrasies.
3. **Private moderation records:** Internal grading notes are stored in a dedicated **Marker's Notes** scratchpad, ensuring private marker reasoning is captured in the archive without exposing unmoderated remarks to the student.

### Migration strategy

To transition an existing assessment into Feedback Kitchen:

1. **Extract your rubric criteria:** Identify the four to six core dimensions of your assignment and their respective percentage weights.
2. **Map performance tiers:** Write self-contained descriptors for each performance tier (Excellent, Proficient, Developing, Unsatisfactory).
3. **Load student rosters:** If you use Moodle, download the offline grading worksheet to import the full student list in a single operation.
4. **Distribute to marking teams:** Export the completed scorer as a `.json` configuration file and email it to your marking team, ensuring all markers evaluate against identical standards.
