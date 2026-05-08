# FK Moderation Export v1
**Status:** Locked for implementation.
**Date:** 2026-05-08
**Schema version:** modexport-v1

---

## Purpose

This document defines the privacy-reduced Moderation Export feature for Feedback Kitchen (FK).
The Moderation Export is a separate, lecturer-facing export intended to support pooled,
cross-tutor moderation for a single paper / cohort / assessment.

It is deliberately privacy-reduced:
- No student names, IDs, NSNs, or email addresses
- No tutor names
- No marker notes, feedback text, or verbatim snippet wording
- No exact timestamps
- No reversible lookup keys
- No composite tutor-quality scores

The Moderation Export complements; it does not replace; the existing Identified Cohort Export.

---

## Two-export model

| Export | Purpose | Audience | Identifiers |
|---|---|---|---|
| Identified Cohort (existing) | Operational course admin | Tutors, coordinators | Student name/ID, tutor name |
| Moderation Export (new, v1) | Pooled cross-tutor moderation | Lecturer/coordinator for moderation meeting | row_label R001–Rnnn, tutor_label T1–Tn |

They are independent code paths. The Moderation Export is never built by stripping
the identified export.

---

## Canonical filename

```
FK_ModExport_<PaperCode>_<CohortID>_<AssessmentID>_<YYYYMMDD>.xlsx
```

All docs, tests, UI text, and downstream tooling must use this exact pattern.

---

## Workbook structure

| Sheet | Purpose |
|---|---|
| 00_README | Plain-language purpose, exclusions, privacy note, suppression rules, provenance, opt-in info |
| 10_rows | One row per marked script |
| 20_methods | Schema version, FK version, data dictionary, suppression rules applied |
| 90_manifest | Paper/cohort/assessment metadata, rubric hash, opt-in record |

Sheets are created in the order above.

---

## Row grain and fields

**Row grain:** one row per marked script within the current cohort.

### Required v1 fields

- `row_label` — R001 to Rnnn, regenerated on every export
- `paper_code`
- `cohort_id`
- `assessment_id`
- `rubric_version_hash` — stable hash of rubric criterion order and maxima
- `tutor_label` — T1 to Tn within cohort, or T_other if that tutor's n < 5
- `criterion_<k>_score`
- `criterion_<k>_max`
- `total_score`
- `total_max`
- `grade_band`
- `suppression_flag` — semicolon-separated suppression codes (see below)
- `extreme_row_flag` — 1 if total_score > 3 SD from cohort mean, else 0
- `fk_version`
- `export_timestamp` — rounded to the hour

### Optional in v1 only if already easy in FK

- `submission_window` — on-time, 1–3d late, >3d late
- `edit_count` — number of score revisions by the marker

### Deferred to v1.1

- `time_to_mark_bucket` — <5, 5–15, 15–30, >30 min
- `snippet_category_counts` — JSON counts per snippet category, no verbatim text

### Explicit exclusions

- Student names, student IDs / NSNs, student email addresses
- Tutor names
- Marker notes
- Feedback text
- Verbatim snippet wording
- Exact timestamps
- Reversible keys / lookup tables
- Composite tutor-quality scores
- Longitudinal tracking fields

---

## Suppression rules

### Cohort minimum
- If cohort n < 15: no Moderation Export file is produced.
- User sees a clear blocking message in FK.
- Suppression code: `COHORT_LT_15_BLOCK`

### Tutor subset minimum
- If a tutor's marked-scripts count in the cohort is < 5:
  - relabel that tutor's rows as `T_other`
  - rows are shuffled before row_label assignment
- Suppression code: `TUTOR_LT_5_COLLAPSED`

### Grade-band small cells
- Any grade-band aggregate with n < 5 is reported as `<5` in lecturer-facing views.
- Not applicable to 10_rows (row-level data is never suppressed there).
- Suppression code: `GRADE_BAND_LT_5_SUPPRESSED`

### Extreme rows
- Rows with total_score > 3 SD from cohort mean are retained.
- Flagged via `extreme_row_flag` on 10_rows.
- Suppression code: `EXTREME_ROW_FLAGGED`

### Display convention
- Aggregates with suppressed counts display `<5`, not `5`.
- `20_methods` includes human-readable descriptions of all suppression rules.

---

## Behavioural rules

- Rows are shuffled before row_label assignment so output position carries no identifying information.
- `row_label` values are regenerated on every export and must differ between repeated exports of the same cohort.
- Rows with total_score > 3 SD from cohort mean are retained and flagged, not dropped.
- The Moderation Export is built from a clean projection of the in-memory cohort object; it is never derived by stripping the identified export.
- No network calls are introduced by this feature.

---

## Governance and opt-in

### Opt-in model
- Moderation Export is hidden by default.
- Lecturer/coordinator opt-in is required and stored locally (localStorage).
- Tutors receive a one-line notice when moderation export is enabled for a paper.
- Lecturer can disable at any time; future exports are blocked; existing files are unaffected.

### Opt-in record (stored locally)
- `lecturer_name`
- `lecturer_role` (optional)
- `paper_code`
- `cohort_id`
- `assessment_id`
- `fk_version`
- `opt_in_timestamp`
- `opt_in_version` — the version of opt-in text the lecturer confirmed
- `opt_in_recorded` — true once confirmed
- `enabled` — toggled on/off by the lecturer

### Manifest inclusion
90_manifest includes:
- opt_in_recorded
- opt_in_version
- opt_in_text_version
- lecturer_name
- fk_version
- export_timestamp

### Tutor notice (UI)
When a paper has moderation export opted in, tutors see a single non-blocking banner:
> "Moderation Export is enabled for this paper. Exports omit student and tutor names."

---

## Privacy note (for 00_README)

> This file is privacy-reduced, not fully anonymised. It must still be treated as
> personal information under the Privacy Act 2020 and your institution's privacy policy.
> Handle files per institutional policy and retain only for the moderation cycle.
> There is no central re-identification mechanism. The legitimate re-identification
> path is via the responsible lecturer's identified export inside FK.

---

## Non-goals

- Not for student lookup or grade appeals.
- Not a tutor performance-management tool.
- Not a longitudinal student or tutor record.
- Not a hosted analytics product.

---

## Design constraints

- No composite tutor-quality score, ever.
- No reversible token or lookup key in v1.
- No free-text fields in the Moderation Export.
- FK: single-cohort, tutor-facing views (Cohort Insights).
- Outside FK: pooled, lecturer-facing moderation pack built locally from the Moderation Export.

---

## Implementation status

| Area | Status |
|---|---|
| Spec frozen | Yes |
| Filename pattern locked | Yes |
| Schema version locked | Yes |
| Sheet names locked | Yes |
| Suppression codes locked | Yes |
| v1 field scope locked | Yes |
| Behavioural rules locked | Yes |
| Governance model locked | Yes |
| Opt-in storage design | Yes |
| UI entry points defined | Yes |
| Workbook text locked | Yes |

---

## Changelog

| Date | Change |
|---|---|
| 2026-05-08 | v1 spec created and frozen. Filename: FK_ModExport_<PaperCode>_<CohortID>_<AssessmentID>_<YYYYMMDD>.xlsx. Schema: modexport-v1. Sheets: 00_README, 10_rows, 20_methods, 90_manifest. Suppression codes: COHORT_LT_15_BLOCK, TUTOR_LT_5_COLLAPSED, GRADE_BAND_LT_5_SUPPRESSED, EXTREME_ROW_FLAGGED. Behavioural and governance rules recorded. |
