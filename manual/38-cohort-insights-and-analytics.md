# Cohort Insights and Analytics

Feedback Kitchen includes an in-app statistical diagnostics engine—**Cohort Insights**—located in the Cohort section (`#sec-cohort`). It transforms accumulated marking data into real-time visual distributions and formative diagnostic prompts.

![Cohort insights dashboard](images/ch38-cohort-insights.png)

### Live statistical metrics

Once at least eight students are saved to the cohort ledger, the insights engine computes core cohort metrics:

| Metric | Calculation | Pedagogical Utility |
|---|---|---|
| **Cohort Headcount (*n*)** | Total marked student records. | Sample size validity check. |
| **Mean Score** | Pre-penalty and post-penalty average percentage scores. | Identifies overall cohort performance against historical benchmarks. |
| **Standard Deviation** | Spread of final weighted scores around the mean. | Measures grading discrimination across the class. |
| **Score Range** | Difference between highest and lowest marks. | Verifies whether the full rubric range is being utilised. |
| **Late Penalty Rate** | Percentage of submissions incurring late deductions. | Highlights assignment deadline pacing and workload friction. |

### Visual grade distribution histogram

The panel renders a live horizontal bar chart mapping student numbers across the configured grade scale (e.g. `A+` through `D`).

The histogram updates automatically every time a student feedback draft is copied or saved, giving markers immediate visual feedback on their grading distribution.

### Diagnostic formative prompts

Cohort Insights evaluates statistical moments (skewness, kurtosis, and criterion variance) to surface diagnostic prompts:

- **Scale Compression:** Warns when marks cluster within a narrow band (e.g. 80% of students receiving `B`), prompting the marker to consider whether distinction criteria are being under-awarded.
- **Bimodal Distribution:** Detects split-class performance (two distinct grade peaks), suggesting a divide between students who grasped foundational concepts and those who encountered conceptual roadblocks.
- **Criterion Difficulty Analysis:** Ranks criteria by average score to identify specific assignment dimensions where the cohort struggled most.

### Formative teaching feedback loops

Cohort analytics allow teaching teams to close the feedback loop before the next assessment:

1. **Targeted Review Lectures:** Use criterion difficulty breakdowns to design post-assessment review workshops focusing on the weakest dimensions (such as referencing conventions or literature synthesis).
2. **Rubric Calibration:** Identify ambiguous criteria where high override rates suggest descriptor boundaries need sharpening for next semester.
3. **Early Intervention:** Flag struggling students in the lower tail for academic support and office hours guidance.
