# Assembled Feedback and Clipboard

The central feature of Feedback Kitchen is real-time feedback synthesis. As you select criterion grades, the application assembles a complete, multi-paragraph written evaluation in the **Cooked Feedback** panel (`#sec-feedback`).

### The feedback assembly structure

The assembled feedback draft is constructed in five structured blocks:

1. **Opening Paragraph (Intro):** Selected from the feedback templates based on the student's overall calculated or overridden letter grade (pre-penalty).
2. **Criterion Breakdown:** The specific rubric descriptor for each criterion corresponding to the selected performance tier (Excellent, Proficient, Developing, Satisfactory, or Unsatisfactory).
3. **Total Score Line:** A clear statement of the overall weighted score, formatted according to your selected rounding mode (Exact, Half, or Whole).
4. **Closing Paragraph (Outro):** Selected from the grade templates to provide forward-looking advice and next steps aligned with the student's overall achievement band.
5. **Late Submission Notice (Conditional):** If a late penalty is applied, a closing notice is appended specifying the deduction percentage and the final penalised grade/score.

### Inline draft editing

The assembled feedback renders inside an editable textarea (`#feedback-text`).

You can edit any sentence, insert specific examples from the student's submission, or adjust tone directly in the editor. Your manual edits are preserved in memory and autosaved into browser local storage.

If you make extensive edits and wish to revert to the raw rubric text, click **↺ Regenerate feedback** to re-synthesise the draft from the current grade selections.

### Inserting personal snippets

To layer your personal voice into the assembled draft:

1. Place your text cursor at the desired position inside the feedback editor.
2. Click the **💬 Insert snippet…** dropdown menu.
3. Select any saved phrase from your personal snippet library.

The snippet text is inserted immediately at the cursor position without disturbing the surrounding rubric text.

### Copying to the clipboard

Click **Copy feedback** in the Finish section or press `Ctrl + Shift + C` (`Cmd + Shift + C` on macOS).

Feedback Kitchen executes three simultaneous actions:

- **Clipboard Transfer:** Copies the complete plain-text feedback block to the system clipboard via the `navigator.clipboard` API (with a seamless fallback to selection copying if permissions are restricted).
- **Cohort Auto-Save:** If the student record contains a student name or ID, the full submission—including criterion scores, overrides, edited feedback, and marker notes—is saved into the local cohort store (`SA_COHORT_<scorerId>`).
- **Visual Notification:** Displays a toast notification confirming whether the feedback was copied and saved to the cohort.
