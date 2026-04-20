# Feedback Kitchen

Feedback Kitchen is a browser-based assessment feedback tool adapted from the original Feedback Kitchen Excel workbook developed and generously shared by Dr Michael Harker, University of Strathclyde. Redesigned as a static web application for use at the University of Waikato and beyond — build your rubric once, then deliver consistent, personalised feedback at scale.

> Experimental sandbox notice
>
> This repository, feedback-kitchen, has been a sandbox for prototyping features and alternative deployments. The older version is available at: https://github.com/stephendmann/score-automator and https://www.stephendmann.com/score-automator, where-as this update can be tested at https://marking.stephendmann.com/

---

## Table of Contents

- [Background & Rationale](#background--rationale)
- [How It Works — Overview](#how-it-works--overview)
- [Getting Started](#getting-started)
- [Building or Editing a Scorer](#building-or-editing-a-scorer)
- [Using the Scorer](#using-the-scorer)
- [Late Penalties](#late-penalties)
- [Cooked Feedback](#cooked-feedback)
- [Feedback Wording Assistant](#feedback-wording-assistant)
- [Personal Snippets](#personal-snippets)
- [Marker's Notes](#markers-notes)
- [Exporting Your Work](#exporting-your-work)
- [Sharing Scorers with Colleagues](#sharing-scorers-with-colleagues)
- [Technical Architecture](#technical-architecture)
- [Privacy & Data Storage](#privacy--data-storage)
- [Deployment](#deployment)
- [Acknowledgements](#acknowledgements)

---

## Background & Rationale

Providing timely, detailed, and consistent feedback at scale is one of the persistent challenges in university assessment. Where marking involves multiple tutors, large cohorts, or repeat assessments across semesters, feedback quality tends to vary — not because markers lack expertise, but because the infrastructure for structuring and delivering it does not exist.

The original Feedback Kitchen, developed by Dr Michael Harker at the University of Strathclyde, addressed this using a structured Excel workbook: markers select a grade per criterion from a dropdown, and the tool assembles a complete feedback block from pre-written rubric descriptors and tier-level intro/outro paragraphs. The approach draws on criterion-referenced assessment practice and reduces the cognitive overhead of writing feedback from scratch for every student, without sacrificing the specificity that criterion-level commentary provides.

Feedback Kitchen extends this as a browser-based application. The core pedagogical model is unchanged — but the menu is now à la carte. Individual tutors can build their own library of feedback phrases — snippets in their own voice — and insert them into the assembled feedback, blending structured consistency with genuine personalisation.

The result is feedback that is:

- **Consistent** — all students in a cohort receive commentary calibrated to the same rubric and criteria
- **Personalised** — criterion-level descriptors speak to each student's specific performance tier, and tutors can layer in their own commentary and saved phrases
- **Scalable** — a Scorer built once can be shared across an entire marking team via JSON export

---

## How It Works — Overview

Each Scorer corresponds to one assessment. It encapsulates the assessment's criteria, weightings, rubric descriptors, grade scale, and feedback templates. Scorers are stored locally in your browser as Kitchens — build one per course or assessment type and switch between them freely.

At marking time, open a Scorer, enter student details, select a grade for each criterion, and the tool assembles the complete feedback block in real time. Edit the assembled text directly, insert personal snippets, and copy the final feedback to paste into Moodle, Turnitin, or your institution's grading system.

---

## Getting Started

1. Open the app at [marking.stephendmann.com](https://marking.stephendmann.com/) and click 🛠 Build a New Scorer
2. Work through the 6-step wizard (see [Building a Scorer](#building-or-editing-a-scorer) below)
3. Click Save & Launch — your Scorer opens immediately and is saved for future use
4. To return to a saved Scorer, find it in the Your Kitchens section on the home page

---

## Building or Editing a Scorer

Click Build a New Scorer from the home page to open the 6-step configuration wizard. The quality of the feedback generated at marking time depends directly on the care taken here.

| Step | What you configure |
|---|---|
| 1 — Details | Assessment name, course code, institution, default tutor name |
| 2 — Grade Scale | Choose a preset or define a fully custom scale with your own grade labels and score bands |
| 3 — Criteria | Define each criterion and its percentage weighting. Weights must total exactly 100% |
| 4 — Rubric | Write the descriptor shown in feedback for each grade tier × criterion combination. Four tiers per criterion: Excellent, Proficient, Developing, Unsatisfactory |
| 5 — Feedback | Write the intro and outro paragraphs for each individual grade level (e.g. A+, A, A–). These frame the per-criterion rubric commentary |
| 6 — Review & Save | Summary of all configuration before saving |

To edit an existing Scorer, find it in Your Kitchens on the home page and click Edit.

### Grade Scale Presets

| Preset | Grades | Typical use |
|---|---|---|
| 🇳🇿 NZ University | A+, A, A–, B+, B, B–, C+, C, C–, D | University of Waikato / standard NZ |
| 🎓 Australian Honours | HD, D, C, P, F | High Distinction scale |
| 🇬🇧 UK Degree | 1st, 2:1, 2:2, 3rd, F | Degree classification |
| 🇺🇸 US Simple | A, B, C, D, F | Standard A–F |
| ✏️ Custom | Your own | Define labels, score bands, tiers, and midpoints from scratch |

The default NZ scale maps grades to score midpoints (A+ = 95, A = 87, A– = 82, B+ = 77 … D = 44) and to four rubric tiers: A+/A/A– → Excellent, B+/B/B– → Proficient, C+/C/C– → Developing, D → Unsatisfactory.

### Rubric Design

Each criterion has one descriptor per tier (four descriptors total). Descriptors should be written in the second person and be self-contained — they will appear verbatim in the student's assembled feedback. A strong Excellent descriptor explains what distinguishes top-tier work; a strong Developing descriptor names what is missing or underdeveloped, not just that the work is below standard.

### Feedback Templates

The intro and outro paragraphs are written per grade (not per tier), giving fine-grained control over tone — an A+ student gets a different opening than an A student, even though both fall in the Excellent tier. The default templates are production-ready; edit them to match your course voice or use them as-is.

---

## Using the Scorer

### 1. Enter Student Details

- Student Name
- Student ID
- Tutor name — persists across students in the same session
- Date — auto-populated

### 2. Grade Each Criterion

For each criterion:

1. Select the Grade from the dropdown (e.g. A, B+, C–)
2. The Midpoint Score auto-populates from the grade scale
3. To fine-tune, enter a value manually in Override Score

> Advisory highlight: if an override falls outside the selected grade's score band, the field turns amber. The override is still accepted — this is a prompt to review, not a block.

### 3. Check Weightings

Criterion weights must total 100%. The tool displays a ✓ when correct and warns when they don't balance.

### 4. Review the Suggested Grade

The weighted score is mapped to an overall grade using the scale defined in the Scorer. Use Override Score on individual criteria to fine-tune, or use the Grade Override field to set the overall grade directly where professional judgement warrants it.

### 5. Start a New Student

Click ↺ New Student to reset all grades, scores, feedback, and Marker's Notes. Your tutor name is retained.

---

## Late Penalties

| Band | Deduction |
|---|---|
| On time | 0% |
| Up to 1 day late | –10% |
| Up to 2 days late | –20% |
| Up to 3 days late | –30% |
| More than 3 days late | Grade set to lowest (fail) |

> Intro and outro feedback paragraphs always reflect the student's pre-penalty grade — they speak to the quality of the work. The late deduction and final penalised score appear at the end of the feedback block.

---

## Cooked Feedback

The Cooked Feedback panel assembles in real time:

1. Intro paragraph — matched to the student's overall grade (pre-penalty)
2. Criterion-by-criterion breakdown — the rubric descriptor for each grade selected
3. Total Score
4. Closing paragraph (outro) — matched to the student's overall grade
5. Late Submission notice and final penalised score — appended only if a penalty applies

The assembled text is fully editable before copying — add a personal note, adjust phrasing, or insert a saved snippet. Click Copy to clipboard, then paste directly into Moodle, Turnitin, or your institution's grading system.

---

## Feedback Wording Assistant

Section F provides an optional AI-powered wording assistant to help polish or rephrase your assembled feedback before copying. It is distinct from the core marking workflow — the Scorer and rubric operate entirely independently of it.

Before any prompt is sent, a PII scrubber automatically strips student names and IDs from the text — Unicode-aware, handling diacritics, macrons (e.g. Ngāti), apostrophes, and hyphenated names (e.g. Smith-Jones). Student identity never leaves your device via this route.

The panel uses a stepwise button hierarchy with collapsible explainers. Explainer state is persisted to localStorage so your preferred panel layout is remembered between sessions.

---

## Personal Snippets

Each tutor can build their own à la carte library of reusable feedback phrases — saved once, available in every marking session on that device.

Use the 💬 Insert snippet… dropdown in the Cooked Feedback panel to insert a saved phrase at the cursor position. To add, edit, or remove snippets, select ⚙ Manage snippets… from the same dropdown.

Snippets are stored locally in your browser — they are personal to you, not shared with colleagues or baked into the Scorer configuration. Two tutors marking from the same Scorer can each maintain their own library of phrases in their own voice, layered over the shared rubric baseline.

---

## Marker's Notes

The Marker's Notes panel is a private scratchpad — use it to record marking rationale, flag concerns, or note patterns across the cohort.

- Notes are not included in the copied student feedback
- Notes are included in the Excel download, making them part of the formal marking record and available for moderation

---

## Exporting Your Work

| Button | Output | Best used for |
|---|---|---|
| Copy Feedback | Assembled feedback text to clipboard | Pasting into Moodle, Turnitin, or your grading system |
| Marker's Record (Excel) | Workbook with scores, weightings, feedback, and Marker's Notes | Moderation, audit trails, record-keeping |
| Print Page | Formatted print/PDF snapshot of the full session | Paper records |

The Excel workbook contains three sheets:

- Results — criterion grades, scores, weightings, and assembled feedback for this student
- Rubric — the full rubric descriptor matrix for the assessment
- Grade Feedback — the intro/outro templates for each grade tier

---

## Sharing Scorers with Colleagues

Scorer configurations can be exported as JSON and shared — the primary mechanism for distributing a standardised Scorer across a marking team, ensuring all tutors work from the same rubric, weightings, and feedback templates while each maintains their own personal snippet library.

To export: open the Scorer in the builder and click Export JSON

To import: click Upload on the home page and select the .json file

JSON exports contain the Scorer configuration only — criteria, rubric descriptors, grade scale, and feedback templates. Personal snippets are not included. JSON export is also the recommended backup — browser localStorage is cleared when browser data is reset.

---

## Technical Architecture

Feedback Kitchen is a fully static application. There is no database, no build step, and no framework dependency beyond CDN-loaded libraries.

| Library | Purpose |
|---|---|
| [Tailwind CSS](https://tailwindcss.com) | Utility-first styling via CDN |
| [SheetJS (xlsx 0.20.3)](https://sheetjs.com) | Client-side Excel workbook generation |
| [Inter](https://fonts.google.com/specimen/Inter) | Typeface via Google Fonts |

**Storage model:**

All data is held in `localStorage`. No student data is transmitted to any server. Explainer and assistant panel preferences (for example, whether Section F explainers are expanded or collapsed) are also stored in localStorage, so your preferred layout is remembered on that device only. These settings never include student-identifiable data and can be safely reset by clearing your browser data.

| Key | Contents |
|---|---|
| `SA_CONFIGS` | JSON array of all saved Scorer configuration objects |
| `SA_ACTIVE` | ID of the currently active Scorer |
| `SA_SNIPPETS` | JSON array of personal snippet objects (label + text) |
| `SA_WELCOME_DISMISSED` | Flag set when the first-run welcome banner is dismissed |

Each Scorer configuration object contains: assessment details, grade scale definition, criteria (name, weight, rubric descriptors per tier), and feedback templates (intro/outro per grade). Student session data — grades, scores, overrides, Marker's Notes — is held only in memory and is never written to storage.

---

## Privacy & Data Handling Disclosure

No data leaves your device. Feedback Kitchen runs entirely in the browser — there is no server, no account, and no telemetry. All Scorer configurations and personal snippets are stored in your browser's localStorage and remain on your machine. If the Feedback Wording Assistant is used, the assembled feedback text is sent to an external AI provider with all student names and IDs automatically stripped before transmission. No student-identifiable data leaves your device.

Student data (names, IDs, grades, scores, and assembled feedback) is held only in memory during a marking session and is never written to localStorage or transmitted anywhere.

**Practical implications:**

- Clearing browser data will remove saved Scorers and snippets — export your Scorers as JSON for backup
- Scorers are device-specific unless shared via JSON export
- Using Feedback Kitchen in a private/incognito window means nothing is saved between sessions

---

## Deployment

Feedback Kitchen is a static site — any web server or static host can serve it. No build step is required.

**Recommended hosting options:**

- [Vercel](https://vercel.com) — connect the repository and deploy automatically on push (current production deployment)
- [Netlify](https://netlify.com) — similar one-click static hosting
- [GitHub Pages](https://pages.github.com) — free hosting directly from this repository
- Any standard web server (Apache, Nginx, Caddy) — copy the files and serve

There are no environment variables, server-side processes, or database connections to configure.

---

## Acknowledgements

Feedback Kitchen is adapted from the original *Feedback Kitchen* Excel marking tool developed and generously shared by **Dr Michael Harker, University of Strathclyde** (michael.harker@strath.ac.uk). Redesigned as a browser-based application for use at the **University of Waikato**, reflecting NZ grading policy but adaptable to any institutional grade scale, course structure, or assessment context. Free to use for all educators.

Developed with AI assistance (Claude / Anthropic · Perplexity · Microsoft Copilot · Qwen / Ollama · Google Gemini).

---

*Feedback Kitchen is a static web application. It requires no server, no login, and no installation — just a modern browser.*
