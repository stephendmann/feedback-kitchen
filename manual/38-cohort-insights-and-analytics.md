# Cohort Insights and Analytics

Feedback Kitchen includes an in-app statistical diagnostics engine, **Cohort Insights**, opened from the Cohort section (`#sec-cohort`). It turns the cohort you have marked so far into distributions and diagnostic prompts.

### Live statistical metrics

Insights opens as a dialog and calculates from whatever is saved at the moment you open it. There is no minimum for the core figures, though small cohorts are annotated: below 20 students the wording softens, and below 12 the distribution shape is marked as too small to read reliably. The one figure with a hard floor is Cronbach's alpha, which needs at least eight students and at least two criteria, and otherwise reports `Not computed`.

The core metrics are:

| Metric | Calculation | Pedagogical Utility |
|---|---|---|
| **Cohort Headcount (*n*)** | Total marked student records. | Sample size validity check. |
| **Mean Score** | Pre-penalty and post-penalty average percentage scores. | Identifies overall cohort performance against historical benchmarks. |
| **Standard Deviation** | Spread of final weighted scores around the mean. | Measures grading discrimination across the class. |
| **Score Range** | Difference between highest and lowest marks. | Verifies whether the full rubric range is being utilised. |
| **Late Penalty Rate** | Percentage of submissions incurring late deductions. | Highlights assignment deadline pacing and workload friction. |

### Grade distribution bars

The dialog renders a horizontal bar chart counting students per **rubric tier**, using your scorer's tier labels, not per individual letter grade. A cohort on the NZ preset therefore shows four bars, and one on a five-tier scale shows five.

The chart is drawn when you open the dialog. Close and reopen it to take in newly saved students.

### Diagnostic formative prompts

Cohort Insights evaluates statistical moments (skewness, kurtosis, and criterion variance) to surface diagnostic prompts:

- **Scale Compression:** Warns when marks cluster within a narrow band (e.g. 80% of students receiving `B`), prompting the marker to consider whether distinction criteria are being under-awarded.
- **Bimodal Distribution:** Detects split-class performance (two distinct grade peaks), suggesting a divide between students who grasped foundational concepts and those who encountered conceptual roadblocks.
- **Within-script differentiation:** Reports how much a student's criterion marks vary from each other, averaged across the cohort. A very flat figure, under 3%, suggests the rubric is behaving as one overall judgement rather than as independent criteria, or that one criterion is anchoring the rest.

### Formative teaching feedback loops

Cohort analytics allow teaching teams to close the feedback loop before the next assessment:

1. **Targeted Review Lectures:** Use the Grade Matrix sheet of the cohort workbook to find the criteria the cohort scored lowest on, and design post-assessment review workshops around them. Insights itself does not rank criteria by difficulty.
2. **Rubric Calibration:** Identify ambiguous criteria where high override rates suggest descriptor boundaries need sharpening for next semester.
3. **Early Intervention:** Flag struggling students in the lower tail for academic support and office hours guidance.
