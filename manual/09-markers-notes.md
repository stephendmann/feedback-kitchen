# Marker's Notes

The **Marker's Notes** section (`#sec-notes`) is a private scratchpad designed to capture marking rationale, moderation remarks, and borderline decisions without exposing them in student-facing feedback.

### The student privacy boundary

Marker's Notes are strictly separated from student communication:

- **Never copied to clipboard:** Clicking **Copy feedback** excludes marker notes entirely.
- **Never sent to the LMS:** Moodle offline worksheet exports omit marker notes from student feedback columns.
- **Never displayed in student feedback:** Notes do not appear in the assembled feedback draft.

### Record keeping and moderation

While excluded from student feedback, notes are preserved in your administrative records:

| Record Destination | Location | Purpose |
|---|---|---|
| **Single-Student Marker's Record (`.xlsx`)** | `Results` sheet | Documents marker reasoning for formal grade audits and student appeals. |
| **Cohort Workbook (`.xlsx`)** | `Student Feedback` tab | Aggregates private notes across the entire cohort for second markers and external examiners. |
| **Local Cohort Store** | Browser `localStorage` | Re-loads notes automatically when you re-open a student record from the cohort list. |

### Practical use cases

Marker's Notes are designed for recording internal assessment context:

- **Borderline grade justification:** Explaining why an overall mark of 49% or 79% was rounded or overridden.
- **Academic integrity observations:** Noting unusual phrasing, uncited passages, or AI-generated structures for subsequent investigation.
- **Moderation flags:** Highlighting submissions for the course coordinator or external moderator to review.
- **Tutor reflections:** Noting common misconceptions or rubric ambiguities to address during post-assessment review lectures.

### Integration with the wording assistant

If you use the optional AI Feedback Wording Assistant, the text in your Marker's Notes is supplied as contextual guidance to help shape the rephrased feedback.

Because external AI processing is involved, never paste direct student identifiers (such as national identity numbers or private medical details) into the notes field.
