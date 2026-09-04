# Scorer JSON Format

Feedback Kitchen exports assessment scorers as portable `.json` files. This format contains the complete assessment specification—rubrics, grading scales, criteria weights, and feedback templates—without containing any student-identifiable data.

![JSON schema diagram](images/ch31-json-schema.png)

### Top-level metadata

The root JSON object defines the assessment identity and version:

```json
{
  "id": "mo6ljpr2ihn8yd",
  "created": "2026-04-20T02:49:35.006Z",
  "name": "Short Written Response",
  "assessmentTitle": "Short Written Response",
  "courseName": "DEMO101 / 2026",
  "universityName": "University of Waikato",
  "version": "1.0",
  "appVersion": "2.5.1"
}
```

### Grade scale definition (`gradeScale`)

The `gradeScale` array maps letter grades to numeric score bands, calculation midpoints, and rubric performance tiers:

```json
"gradeScale": [
  {
    "grade": "A",
    "midpoint": 92.5,
    "bandLow": 85,
    "bandHigh": 100,
    "tier": "excellent"
  },
  {
    "grade": "B",
    "midpoint": 79.5,
    "bandLow": 75,
    "bandHigh": 84,
    "tier": "proficient"
  }
]
```

### Criteria and rubric descriptors (`criteria`)

The `criteria` array defines each evaluation dimension and its four or five tier descriptors:

```json
"criteria": [
  {
    "id": "crit_arg_01",
    "name": "Argument & Analysis",
    "weight": 30,
    "rubric": {
      "excellent": "Your argument demonstrates exceptional critical analysis...",
      "proficient": "Your argument is clear, well-supported, and logical...",
      "developing": "Your argument is present but relies heavily on description...",
      "unsatisfactory": "A central argument is absent or poorly articulated."
    }
  }
]
```

### Feedback templates (`gradeFeedback`)

The `gradeFeedback` array defines opening and closing narrative paragraphs for each letter grade:

```json
"gradeFeedback": [
  {
    "grade": "A+",
    "intro": "This is genuinely outstanding work. Your submission sets a benchmark...",
    "outro": "This is the standard to aspire to. Your work is exemplary in depth."
  }
]
```

### Penalties and operational settings

The configuration concludes with deduction schedules and UI preference flags:

```json
"latePenalties": [
  { "label": "On time — no penalty", "deduction": 0 },
  { "label": "1 day late (up to 24 hrs)", "deduction": 10 },
  { "label": "More than 3 days late", "deduction": 0, "fail": true }
],
"enableLatePenalties": true,
"markedInMoodle": true,
"scoreRounding": "none"
```

### Privacy guarantee

Scorer JSON files contain configuration parameters only. Personal feedback snippets, marker notes, and student names/IDs are never exported into this schema, ensuring scorers can be shared publicly or distributed across institutions.
