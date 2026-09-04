# Score Rounding and Late Penalties

Feedback Kitchen provides dedicated calculation controls in the **Penalty & Grade Override** section (`#sec-adjust`) to manage decimal precision, late submission deductions, and borderline grade adjustments.

### Score rounding modes

The section rail provides segmented buttons to control how weighted scores are formatted and displayed:

| Rounding Mode | Calculation Rule | Example (Raw: 74.25) |
|---|---|---|
| **Exact** | Rounds to one decimal place. This is the default. | `74.3` |
| **Half** | Rounds to the nearest half point. | `74.5` |
| **Whole** | Rounds to the nearest integer. | `74` |

A dynamic helper line beneath the buttons previews the computed result across all three formats. The selected rounding mode applies across the top-bar score badge, the assembled feedback score line, and exported Excel workbooks.

### Late submission penalties

Late penalties are configured per assessment in Step 6 of the builder wizard.

The default institutional deduction bands follow standard university policy:

- **On time — no penalty:** 0% deduction
- **1 day late (up to 24 hrs):** –10% deduction
- **2 days late (up to 48 hrs):** –20% deduction
- **3 days late (up to 72 hrs):** –30% deduction
- **More than 3 days late:** Automatic fail. The final score becomes 0 and the grade is set to the lowest grade in the scale.

### Pedagogical framing of penalised feedback

Feedback Kitchen enforces a strict separation between academic commentary and administrative penalties:

1. **Pre-Penalty Narrative Framing:** The introductory and concluding feedback paragraphs always reflect the student's unpenalised grade. If a student produces A-grade work but submits two days late, the written commentary celebrates their analytical strength rather than opening with a punitive tone.
2. **Clear Penalty Accounting:** The late penalty deduction and final penalised mark are appended clearly at the bottom of the feedback block:
   ```text
   LATE SUBMISSION NOTICE: As your research essay was submitted 2 days
   late (up to 48 hrs), a further 20% (out of 100%) has been deducted
   from the total above.
   FINAL SCORE (after late penalty): 67.0 / 100
   ```

### Overall grade override

If your professional academic judgement warrants overriding the automated weighted calculation (for example, lifting a 74.8% borderline submission into the B+ band):

- Choose the target letter grade in the **Grade Override** field (`#grade-override`).
- The overall grade letter updates immediately, and the score is raised to the minimum of that band (e.g. 75.0). An override only ever raises a mark: choosing a lower grade than the calculation produced leaves the score where it is.
- Individual criterion scores and rubric commentary remain untouched.

If a late penalty resulting in an automatic fail is active, grade overrides are disabled to prevent policy violations.
