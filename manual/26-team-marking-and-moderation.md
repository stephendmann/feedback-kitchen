# Team Marking and Moderation

When an assessment is evaluated by multiple teaching assistants or tutors, maintaining consistent grading standards across the cohort is essential. Feedback Kitchen coordinates team marking through portable JSON scorer configurations and de-identified moderation exports.

![Team marking workflow](images/ch26-team-marking.png)

### The team coordination workflow

```
Coordinator builds Master Scorer ──► Exports .json ──► Distributes to Tutors
                                                           │
┌──────────────────────────────────────────────────────────┴──────────────────────────────┐
│  Tutor A (Uploads JSON)       Tutor B (Uploads JSON)        Tutor C (Uploads JSON)      │
│  • Shared rubric baseline     • Shared rubric baseline      • Shared rubric baseline    │
│  • Personal Snippets A        • Personal Snippets B         • Personal Snippets C       │
│  • Cohort A (.xlsx)           • Cohort B (.xlsx)            • Cohort C (.xlsx)          │
└──────────────────────────────────────────────────────────┬──────────────────────────────┘
                                                           │
Coordinator collects Workbooks / Moderation Exports ◄──────┘
```

### 1. Authoring and distributing the master scorer

1. The course coordinator builds the assessment scorer in the **Builder Wizard** (`builder.html`), defining criteria, percentage weightings, and rubric descriptors.
2. In Step 6 of the builder, the coordinator clicks **Export JSON** to download `<AssessmentName>.json`.
3. The coordinator distributes the JSON file to all tutors via email or shared course storage.

### 2. Tutor onboarding and personal customization

1. Each tutor navigates to `upload.html` and imports the coordinator's `.json` file.
2. The scorer opens immediately in the tutor's browser with the exact criteria, grade scales, and rubric descriptors locked in place.
3. Tutors build and maintain their own **Personal Snippets Library** in their local browser, allowing them to provide feedback in their own voice while remaining anchored to the shared rubric baseline.

### 3. Calibration and benchmark marking

Before marking their individual class streams:

- Tutors mark three sample benchmark papers using the shared scorer.
- The team compares awarded criterion tiers, numeric overrides, and private notes recorded in the **Marker's Notes** panel.
- Any ambiguities in rubric interpretation are clarified before full-cohort marking commences.

### 4. Post-marking moderation and audit

When marking is complete:

- Each tutor downloads their **Whole-Cohort Class Workbook** (`.xlsx`) and submits it to the coordinator.
- The coordinator inspects the `Cohort Summary` and `Grade Matrix` sheets to identify marker variance (e.g. comparing average scores and grade distributions between tutorial streams).
- If formal institutional moderation is required, the coordinator enables **Moderation Export** to generate a de-identified, *k*-anonymous dataset for external examiners.
