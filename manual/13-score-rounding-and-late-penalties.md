# Score Rounding and Late Penalties

Feedback Kitchen provides dedicated calculation controls in the **Penalty & Grade Override** section (`#sec-adjust`) to manage decimal precision, late submission deductions, and borderline grade adjustments.

![Rounding and penalty controls](images/ch13-rounding-penalties.png)

### Score rounding modes

The section rail provides segmented buttons to control how weighted scores are formatted and displayed:

| Rounding Mode | Calculation Rule | Example (Raw: 74.25) |
|---|---|---|
| **Exact** | Preserves floating-point precision up to two decimal places. | `74.25` |
| **Half** | Rounds to the nearest half-point (`0.5`). | `74.5` |
| **Whole** | Rounds to the nearest integer. | `74` |

A dynamic helper line beneath the buttons previews the computed result across all three formats. The selected rounding mode applies across the top-bar score badge, the assembled feedback score line, and exported Excel workbooks.

### Late submission penalties

Late penalties are configured per assessment in Step 6 of the builder wizard.

The default institutional deduction bands follow standard university policy:

- **On time — no penalty:** 0% deduction
- **1 day late (up to 24 hrs):** –10% deduction
- **2 days late (up to 48 hrs):** –20% deduction
- **3 days late (up to 72 hrs):** –30% deduction
- **More than 3 days late:** Automatic fail (grade set to lowest tier)

### Pedagogical framing of penalised feedback

Feedback Kitchen enforces a strict separation between academic commentary and administrative penalties:

1. **Pre-Penalty Narrative Framing:** The introductory and concluding feedback paragraphs always reflect the student's unpenalised grade. If a student produces A-grade work but submits two days late, the written commentary celebrates their analytical strength rather than opening with a punitive tone.
2. **Clear Penalty Accounting:** The late penalty deduction and final penalised mark are appended clearly at the bottom of the feedback block:
   ```text
   Late Submission Penalty: 2 days late (-20%)
   Final Penalised Score: 67.0 / 100 (B-)
   ```

### Overall grade override

If your professional academic judgement warrants overriding the automated weighted calculation (for example, lifting a 74.8% borderline submission into the B+ band):

- Enter the target letter grade in the **Grade Override** field (`#grade-override`).
- The overall grade letter updates immediately, and the final percentage score is elevated to the minimum threshold of that band (e.g. 75.0%).
- Individual criterion scores and rubric commentary remain untouched.

If a late penalty resulting in an automatic fail is active, grade overrides are disabled to prevent policy violations.
