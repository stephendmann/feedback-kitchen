# Moderation Export

The **Moderation Export** generates a privacy-reduced, de-identified Excel workbook for paper coordinators, second markers, and external moderation panels.

### Purpose and privacy governance

Institutional moderation requires reviewing grading consistency and rubric alignment without exposing student personal information or marker identities.

The moderation export guarantees:

- **Complete PII Stripping:** Student names, student ID numbers, and marker names are completely eliminated from the dataset.
- **Pseudonymisation:** Each submission is assigned an anonymous sequential identifier (`Student 01`, `Student 02`, ...).
- **Rubric Audit Baseline:** The workbook embeds the exact rubric descriptors and version hash used during grading.

### The k-anonymity guard (n ≥ 15)

To prevent re-identification through elimination in small classes, Feedback Kitchen enforces a strict threshold:

```text
Cohort Size < 15 Students   ──►   Moderation Export BLOCKED
Cohort Size ≥ 15 Students   ──►   Moderation Export ENABLED
```

If a cohort contains fewer than 15 marked students, the **Export for Moderation** button remains disabled with an advisory notice explaining the privacy threshold.

### Coordinator opt-in setup

Moderation export operates on an opt-in basis configured per course:

1. The paper coordinator configures the institutional paper code, assessment ID, and cohort identifier in the scorer settings.
2. Tutors marking on that paper see a blue informational banner in the Cohort section confirming that moderation export is active.
3. If moderation export has not been configured by the coordinator, tutors are directed to use standard whole-cohort exports.

### Moderation workbook structure (Schema v1)

The downloaded moderation workbook (`<PaperCode>_Moderation_<AssessmentId>.xlsx`) contains three structured sheets:

| Sheet Name | Contents |
|---|---|
| `README` | Formal metadata record containing schema version (`v1`), date of export, anonymisation rules applied, and the 8-character rubric version hash. |
| `Cohort Matrix` | De-identified assessment records showing criterion-by-criterion letter grades, raw scores, manual overrides, weighted totals, and final grades. |
| `Rubric Reference` | Complete rubric criteria definitions and performance tier descriptors for audit validation. |

### Decoupled architecture

The moderation engine (`js/moderation-export.js`) runs independently of standard Excel export functions. It operates entirely in memory using client-side JavaScript, ensuring no de-identified student data is logged or cached across browser sessions.
