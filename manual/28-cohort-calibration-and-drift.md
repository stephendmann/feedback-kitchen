# Cohort Calibration and Drift

Maintaining grading consistency across dozens or hundreds of submissions requires ongoing self-calibration. Feedback Kitchen monitors rubric version integrity and cohort scale distribution in real time to alert markers to rubric drift and score compression.

![Cohort calibration signals](images/ch28-cohort-calibration.png)

### Understanding rubric drift

**Rubric drift** occurs when an assessment scorer is edited mid-cohort—such as tweaking a criterion weighting, rewording a descriptor, or changing a score threshold—after some students have already been marked and saved.

When this occurs:

- Earlier students retain the rubric descriptors and calculation weights active at the moment they were marked.
- Later students are marked against the modified scorer.
- The cohort dataset now contains mixed rubric standards.

### Version hash stamping and detection

Feedback Kitchen prevents silent rubric drift by computing a deterministic 32-bit hash (`SA.rubricVersionHash`) over all criteria names, percentage weights, and tier descriptors.

This 8-character hex signature (e.g. `a3f9e2b1`) is stamped onto each student record when saved.

When you open the Cohort section:

1. Feedback Kitchen compares the version hash of every saved student against the active scorer configuration.
2. If discrepancies are found, an amber **Rubric drift detected** badge (`#cohort-drift-badge`) appears in the cohort header.
3. The cohort container applies an amber warning outline (`.fk-cohort-drift`).

### Handling a rubric drift warning

When a drift warning appears, decide deliberately between two corrective paths:

- **Re-mark affected students:** Open the earlier student records from the cohort list, review their marks against the updated rubric, and re-save. The updated version hash is stamped onto their record, clearing the drift flag.
- **Document for moderation:** If the rubric change was approved mid-marking (e.g. relaxing an ambiguous criterion), accept the mixed cohort and use **Marker's Notes** to document the rationale for the moderation panel.

### Cohort scale-use consistency signal

When enabled in Scorer Settings, an ambient process-quality indicator (`#cohort-consistency-badge`) monitors grade spread:

| State | Indicator | Diagnostic Meaning |
|---|---|---|
| **Compressed** | Amber Badge | Marks are tightly clustered in a narrow band (e.g. only `B` and `B+` awarded across 40 students). Prompts the marker to consider whether distinction or developing tiers are being underutilised. |
| **Wide** | Soft Blue Badge | Broad distribution across high, middle, and low performance tiers reflecting full rubric utilisation. |

The consistency signal is purely diagnostic. It never modifies student grades or enforces artificial grading quotas.
