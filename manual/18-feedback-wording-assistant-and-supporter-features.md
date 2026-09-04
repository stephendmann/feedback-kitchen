# Feedback Wording Assistant and Supporter Features

Feedback Kitchen includes an optional AI-powered **Feedback Wording Assistant** to assist with rephrasing, clarifying, and polishing written feedback drafts.

### Strict pedagogical boundaries

The wording assistant operates under strict structural boundaries:

- **Prose Only:** The assistant works exclusively on feedback text.
- **Marks are Immutable:** It cannot change criterion grades, numeric overrides, percentage weightings, or overall scores.
- **Rubric Integrity:** It cannot alter your underlying rubric descriptors.
- **Human Control:** Suggestions are presented in a diff preview; nothing is applied to the draft until you click **Accept**.

### Client-side PII scrubbing

Before any text is transmitted to the AI proxy endpoint (`/api/garnish`, served by `api/garnish.js`), a client-side PII scrubbing engine sanitises the payload:

- Strips the name and ID of the student currently on screen, including each part of the name on its own, from the prompt.
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

- Supporters receive a username and password on Ko-fi.
- Clicking **Wording key** in the navigation bar opens **Wording Assistant Login**, where you enter them once.
- They are stored in this browser only (`SA_FK_USER` and `SA_FK_PASS`) and sent with each assistant request so the proxy can authorise it. Nothing about who you are is stored on a server.
- Trusting supporters eliminates the need for privacy-invasive user accounts and tracking telemetry.
