# Feedback Wording Assistant and Supporter Features

Feedback Kitchen includes an optional AI-powered **Feedback Wording Assistant** to assist with rephrasing, clarifying, and polishing written feedback drafts.

### Strict pedagogical boundaries

The wording assistant operates under strict structural boundaries:

- **Prose Only:** The assistant works exclusively on feedback text.
- **Marks are Immutable:** It cannot change criterion grades, numeric overrides, percentage weightings, or overall scores.
- **Rubric Integrity:** It cannot alter your underlying rubric descriptors.
- **Human Control:** Suggestions are presented in a diff preview; nothing is applied to the draft until you click **Accept**.

### Client-side PII scrubbing

Before any text is transmitted to the AI proxy endpoint (`/api/garnish.js`), a client-side PII scrubbing engine sanitises the payload:

- Strips student full names and ID numbers from the feedback draft and marker's notes.
- Unicode-aware processing handles macrons (e.g. *Ngāti*), diacritics, apostrophes, and hyphenated surnames (e.g. *Smith-Jones*).
- Transmits only anonymised assessment criteria, rubric descriptors, score bands, and feedback prose.

### Deterministic banned-phrase guards

To prevent formulaic AI clichés, the assistant enforces a deterministic banned-phrase guard. Phrases such as *"In conclusion"*, *"It is important to remember"*, or generic praise are filtered out in favour of concise, actionable feedback.

### Supporter access and Ko-fi trust unlock

Feedback Kitchen's core grading, rubric building, snippet management, cohort tracking, Excel exports, and Moodle integration workflows are completely free.

Two convenience features are reserved for project supporters on [Ko-fi](https://ko-fi.com/smann):

1. **AI Feedback Wording Assistant**
2. **PDF Rubric Converter** (`convert.html`)

### Zero-database trust model (Decision D17)

To uphold the core architectural principle that **your data never leaves your browser**, Feedback Kitchen maintains no central user database, login accounts, or payment tracking servers.

- Supporters receive an unlock code on Ko-fi.
- Clicking **Wording key** in the navigation bar lets you enter your code.
- The unlock flag is stored locally in your browser (`localStorage`).
- Trusting supporters eliminates the need for privacy-invasive user accounts and tracking telemetry.
