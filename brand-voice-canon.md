# Feedback Kitchen — Brand Voice Canon

**Status:** v1.0 — live canon (BBP v0.1 strings shipped 2026-05-21)
**Owner:** Stephen Mann
**Purpose:** Canonical reference for all user-facing copy (builder, marking, homepage, docs)

## Rule-of-three pattern (signature voice)

Three short, parallel sentences emphasising user ownership. This is the canonical brand-voice shape — use it for headlines, taglines, and major closing lines. Don't dilute by overuse.

| Surface | Canonical line |
|---|---|
| Homepage hero (live) | "Your rubric. Your judgement. Done in clicks." |
| Three-step overview (tutorial video Scene 2) | "Build · Mark · Export." |
| Personalisation card (tutorial video Scene 5) | "Your phrases. Your voice. Your judgement." |
| Sharing card (tutorial video Scene 6) | "One rubric. Every marker. Consistent feedback." |
| Privacy close (tutorial video Scene 7) | "Student data never leaves the room." |

**Structural rule:** three units, parallel grammar, each ≤5 words. Either `Your X. Your Y. Your Z.` (ownership emphasis) or three nouns/verbs in series (`Build · Mark · Export.`).

**Do not invent new rule-of-three lines without recording them here.** New lines require D-record only if they replace one above; additions are free.

---

## BBP v0.1 shipped strings (2026-05-21)

| # | Surface | Status |
|---|---|---|
| 1 | scorer.html override-audit — calm wording | ✅ Shipped |
| 2 | "Not an autograder" sub-headline (homepage already live; added to builder.html + scorer.html) | ✅ Shipped |
| 3 | builder.html persistent privacy/sharing micro-copy | ✅ Shipped |
| 4 | builder.html Steps 3–6 simplified subtitles | ✅ Shipped |
| 5 | Rule-of-three pattern codified (this section) | ✅ Documented |

**Note on #1:** Per-criterion out-of-band banner from Scene 4 mockup ("Score 78 sits in the Proficient band but you graded Developing…") is a new feature, not a string swap. Deferred to BBP v1.0 or later. v0.1 covered only the existing whole-grade override-audit text.

---

## Voice Principles

### 1. Academic-Friendly
Respect educators' expertise. Avoid patronising or oversimplified language.

**Good:**
"You choose the grades. The tool drafts the feedback based on your rubric."

**Bad:**
"Let our AI do the grading for you!"

---

### 2. Plain Language
Accessibility over jargon. Follow WCAG plain-language guidelines where possible.

**Good:**
"Names and IDs are stripped before anything is sent to the AI."

**Bad:**
"PII is redacted via client-side sanitisation prior to LLM invocation."

---

### 3. "You" Voice
Direct address, active voice. The user is in control.

**Good:**
"You can export the scorer as JSON to share with your team."

**Bad:**
"The scorer may be exported as JSON for team distribution."

---

### 4. Transparent About AI
Never claim to "know" what's fair. Position as a drafting tool, not a decision-maker.

**Good:**
"Feedback Kitchen drafts feedback based on your rubric. You review and adjust before students see anything."

**Bad:**
"Our AI knows exactly what grade each student deserves."

---

### 5. Privacy-First
Explicit, visible reassurance wherever data leaves the browser.

**Good:**
"Everything stays in this browser. [Lock icon] Names and IDs are stripped before anything is sent."

**Bad:**
(Silent — no privacy message at all)

---

### 6. AU/NZ Spelling
In prose and user-facing copy: behaviour, colour, artefacts, utilise.
In code identifiers: stick to original (e.g., `color-contrast`, `behaviours.js`).

**Exception:** Technical terms follow established conventions (e.g., "color tokens" in design systems documentation).

### 7. UI Control Casing — Sentence Case
Buttons, labels, section headings, chips, and menu items use sentence case: capitalise the first word and proper nouns only.
- ✅ "New student" · "Export cohort (Excel)" · "Penalty & grade override" · "Clear Cohort" → "Clear cohort" (on next touch)
- ❌ "New Student" · "Export Cohort (Excel)"
Product names and proper nouns keep their capitals (Feedback Kitchen, Moodle, Turnitin, Excel).
(Added 2026-06-11, FK-03 — the header/footer "New Student"/"New student" split was the trigger.)

---

## Canonical Copy Examples

### Homepage Hero
**Headline:** Feedback Kitchen
**Sub-headline:** Not an autograder — you choose the grades, the tool drafts the feedback.

### Builder Footer (Persistent)
"Everything stays in this browser. You can export the scorer as JSON to share with your team."

### Override Banner (scorer.html)
"You've manually adjusted this score. The tool will respect your override."
(Calm, factual — no "Warning!" or alarm language)

### Wizard Helper Copy
**Step 3:** "Add criteria — what aspects of the work are you assessing?"
**Step 4:** "Describe each level — what does excellent vs. adequate look like?"
**Step 6:** "Review your rubric — you can adjust weights and levels before scoring."

### Rule-of-Three Pattern
"Your rubric. Your grades. Your feedback."
(Parallel structure, emphasises user ownership)

---

## Updating This Canon

Changes require D-record if they alter voice principles (e.g., switching from "you" to "we").
Copy examples can be updated directly as new surfaces are added — log changes in git commit messages.

**Last updated:** 2026-05-21 (v1.0 baseline with BBP v0.1)
