# Moderation Export

The **Moderation Export** generates a privacy-reduced, de-identified Excel workbook for paper coordinators, second markers, and external moderation panels.

### Purpose and privacy governance

Institutional moderation requires reviewing grading consistency and rubric alignment without exposing student personal information or marker identities.

The moderation export guarantees:

- **PII Stripping:** Student names, student ID numbers and marker names are removed from the data rows.
- **Row Pseudonymisation:** Rows are shuffled, then labelled `R001`, `R002` and so on, so row order carries no information about marking order.
- **Marker Pseudonymisation:** Each marker becomes `T1`, `T2` and so on. A marker with fewer than five students in the cohort is collapsed into `T_other` rather than given their own label.
- **Rubric Audit Baseline:** The workbook records the 8-character rubric version hash each record was scored against, and says so explicitly when a cohort carries more than one.

One identity is deliberately retained. The manifest records the `lecturer_name` and `lecturer_role` captured when the coordinator opted the paper in, because the pack has to say who authorised its release. No student identity is retained anywhere.

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

The downloaded workbook is named `FK_ModExport_<PaperCode>_<CohortId>_<AssessmentId>_<YYYYMMDD>.xlsx` and contains four sheets, in this order:

| Sheet Name | Contents |
|---|---|
| `00_README` | The metadata record: schema version, export date, the opt-in details, and a plain description of every suppression rule applied. |
| `10_rows` | One row per submission. Row label, paper, cohort and assessment identifiers, rubric version hash, marker label, then a score and a maximum for each criterion, then the total, the grade band, the submission window, an edit count, and the suppression and extreme-row flags. |
| `20_methods` | How the figures were derived, including the schema version, the application version, and the suppression thresholds in force. |
| `90_manifest` | A two-column key and value summary: student and criterion counts, criterion names, rubric version or versions, suppressed bands, and the opt-in record. |

Two things the workbook deliberately does not contain. There are no per-criterion letter grades and no override values, only the resulting numeric scores. And there is no rubric descriptor sheet: the pack identifies the rubric by hash rather than reproducing it, so a moderator comparing rubric wording needs the scorer JSON or the whole-cohort workbook alongside it.

### Decoupled architecture

The moderation engine (`js/moderation-export.js`) runs independently of standard Excel export functions. It operates entirely in memory using client-side JavaScript, ensuring no de-identified student data is logged or cached across browser sessions.
