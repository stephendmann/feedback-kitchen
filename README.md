# Score Automator — Feedback Kitchen# Feedback Kitchen

Feedback Kitchen is a browser-based assessment feedback tool adapted from the original Feedback Kitchen Excel workbook developed and generously shared by Dr Michael Harker, University of Strathclyde. Redesigned as a static web application for use at the University of Waikato and beyond — build your rubric once, then deliver consistent, personalised feedback at scale.

> Experimental sandbox notice
> >
> >> This repository, feedback-kitchen, is a sandbox for prototyping features and alternative deployments. It is not the canonical live repository for the production application. For the live version, see:
> >> > - https://github.com/stephendmann/score-automator
> >> > - > - https://marking.stephendmann.com/
> >> >   > - > - https://www.stephendmann.com/score-automator
> >> >   >   >
> >> >   >   > - ---
> >> >   >   >
> >> >   >   > ## Table of Contents
> >> >   >   >
> >> >   >   > - [Background & Rationale](#background--rationale)
> >> >   >   > - - [How It Works — Overview](#how-it-works--overview)
> >> >   >   >   - - [Getting Started](#getting-started)
> >> >   >   >     - - [Building or Editing a Scorer](#building-or-editing-a-scorer)
> >> >   >   >       - - [Using the Scorer](#using-the-scorer)
> >> >   >   >         - - [Late Penalties](#late-penalties)
> >> >   >   >           - - [Cooked Feedback](#cooked-feedback)
> >> >   >   >             - - [Personal Snippets](#personal-snippets)
> >> >   >   >               - - [Marker's Notes](#markers-notes)
> >> >   >   >                 - - [Exporting Your Work](#exporting-your-work)
> >> >   >   >                   - - [Sharing Scorers with Colleagues](#sharing-scorers-with-colleagues)
> >> >   >   >                     - - [Technical Architecture](#technical-architecture)
> >> >   >   >                       - - [Privacy & Data Storage](#privacy--data-storage)
> >> >   >   >                         - - [Deployment](#deployment)
> >> >   >   >                           - - [Acknowledgements](#acknowledgements)
> >> >   >   >                            
> >> >   >   >                             - ---
> >> >   >   >
> >> >   >   > ## Background & Rationale
> >> >   >   >
> >> >   >   > Providing timely, detailed, and consistent feedback at scale is one of the persistent challenges in university assessment. Where marking involves multiple tutors, large cohorts, or repeat assessments across semesters, feedback quality tends to vary — not because markers lack expertise, but because the infrastructure for structuring and delivering it does not exist.
> >> >   >   >
> >> >   >   > The original Feedback Kitchen, developed by Dr Michael Harker at the University of Strathclyde, addressed this using a structured Excel workbook: markers select a grade per criterion from a dropdown, and the tool assembles a complete feedback block from pre-written rubric descriptors and tier-level intro/outro paragraphs. The approach draws on criterion-referenced assessment practice and reduces the cognitive overhead of writing feedback from scratch for every student, without sacrificing the specificity that criterion-level commentary provides.
> >> >   >   >
> >> >   >   > Feedback Kitchen extends this as a browser-based application. The core pedagogical model is unchanged — but the menu is now à la carte. Individual tutors can build their own library of feedback phrases — snippets in their own voice — and insert them into the assembled feedback, blending structured consistency with genuine personalisation.
> >> >   >   >
> >> >   >   > The result is feedback that is:
> >> >   >   >
> >> >   >   > - **Consistent** — all students in a cohort receive commentary calibrated to the same rubric and criteria
> >> >   >   > - - **Personalised** — criterion-level descriptors speak to each student's specific performance tier, and tutors can layer in their own commentary and saved phrases
> >> >   >   >   - - **Scalable** — a Scorer built once can be shared across an entire marking team via JSON export
> >> >   >   >    
> >> >   >   >     - ---
> >> >   >   >
> >> >   >   > ## How It Works — Overview
> >> >   >   >
> >> >   >   > Each Scorer corresponds to one assessment. It encapsulates the assessment's criteria, weightings, rubric descriptors, grade scale, and feedback templates. Scorers are stored locally in your browser as Kitchens — build one per course or assessment type and switch between them freely.
> >> >   >   >
> >> >   >   > At marking time, open a Scorer, enter student details, select a grade for each criterion, and the tool assembles the complete feedback block in real time. Edit the assembled text directly, insert personal snippets, and copy the final feedback to paste into Moodle, Turnitin, or your institution's grading system.
> >> >   >   >
> >> >   >   > ---
> >> >   >   >
> >> >   >   > ## Getting Started
> >> >   >   >
> >> >   >   > 1. Open the app at [marking.stephendmann.com](https://marking.stephendmann.com/) and click 🛠 Build a New Scorer
> >> >   >   > 2. 2. Work through the 6-step wizard (see [Building a Scorer](#building-or-editing-a-scorer) below)
> >> >   >   >    3. 3. Click Save & Launch — your Scorer opens immediately and is saved for future use
> >> >   >   >       4. 4. To return to a saved Scorer, find it in the Your Kitchens section on the home page
> >> >   >   >         
> >> >   >   >          5. ---
> >> >   >   >         
> >> >   >   >          6. ## Building or Editing a Scorer
> >> >   >   >         
> >> >   >   >          7. Click Build a New Scorer from the home page to open the 6-step configuration wizard. The quality of the feedback generated at marking time depends directly on the care taken here.
> >> >   >   >
> >> >   >   > | Step | What you configure |
> >> >   >   > |---|---|
> >> >   >   > | 1 — Details | Assessment name, course code, institution, default tutor name |
> >> >   >   > | 2 — Grade Scale | Choose a preset or define a fully custom scale with your own grade labels and score bands |
> >> >   >   > | 3 — Criteria | Define each criterion and its percentage weighting. Weights must total exactly 100% |
> >> >   >   > | 4 — Rubric | Write the descriptor shown in feedback for each grade tier × criterion combination. Four tiers per criterion: Excellent, Proficient, Developing, Unsatisfactory |
> >> >   >   > | 5 — Feedback | Write the intro and outro paragraphs for each individual grade level (e.g. A+, A, A–). These frame the per-criterion rubric commentary |
> >> >   >   > | 6 — Review & Save | Summary of all configuration before saving |
> >> >   >   >
> >> >   >   > To edit an existing Scorer, find it in Your Kitchens on the home page and click Edit.
> >> >   >   >
> >> >   >   > ### Grade Scale Presets
> >> >   >   >
> >> >   >   > | Preset | Grades | Typical use |
> >> >   >   > |---|---|---|
> >> >   >   > | 🇳🇿 NZ University | A+, A, A–, B+, B, B–, C+, C, C–, D | University of Waikato / standard NZ |
> >> >   >   > | 🎓 Australian Honours | HD, D, C, P, F | High Distinction scale |
> >> >   >   > | 🇬🇧 UK Degree | 1st, 2:1, 2:2, 3rd, F | Degree classification |
> >> >   >   > | 🇺🇸 US Simple | A, B, C, D, F | Standard A–F |
> >> >   >   > | ✏️ Custom | Your own | Define labels, score bands, tiers, and midpoints from scratch |
> >> >   >   >
> >> >   >   > The default NZ scale maps grades to score midpoints (A+ = 95, A = 87, A– = 82, B+ = 77 … D = 44) and to four rubric tiers: A+/A/A– → Excellent, B+/B/B– → Proficient, C+/C/C– → Developing, D → Unsatisfactory.
> >> >   >   >
> >> >   >   > ### Rubric Design
> >> >   >   >
> >> >   >   > Each criterion has one descriptor per tier (four descriptors total). Descriptors should be written in the second person and be self-contained — they will appear verbatim in the student's assembled feedback. A strong Excellent descriptor explains what distinguishes top-tier work; a strong Developing descriptor names what is missing or underdeveloped, not just that the work is below standard.
> >> >   >   >
> >> >   >   > ### Feedback Templates
> >> >   >   >
> >> >   >   > The intro and outro paragraphs are written per grade (not per tier), giving fine-grained control over tone — an A+ student gets a different opening than an A student, even though both fall in the Excellent tier. The default templates are production-ready; edit them to match your course voice or use them as-is.
> >> >   >   >
> >> >   >   > ---
> >> >   >   >
> >> >   >   > ## Using the Scorer
> >> >   >   >
> >> >   >   > ### 1. Enter Student Details
> >> >   >   >
> >> >   >   > - Student Name
> >> >   >   > - - Student ID
> >> >   >   >   - - Tutor name — persists across students in the same session
> >> >   >   >     - - Date — auto-populated
> >> >   >   >      
> >> >   >   >       - ### 2. Grade Each Criterion
> >> >   >   >      
> >> >   >   >       - For each criterion:
> >> >   >   >      
> >> >   >   >       - 1. Select the Grade from the dropdown (e.g. A, B+, C–)
> >> >   >   > 2. The Midpoint Score auto-populates from the grade scale
> >> >   >   > 3. 3. To fine-tune, enter a value manually in Override Score
> >> >   >   >   
> >> >   >   >    4. > Advisory highlight: if an override falls outside the selected grade's score band, the field turns amber. The override is still accepted — this is a prompt to review, not a block.
> >> >   >   >       >
> >> >   >   >       > ### 3. Check Weightings
> >> >   >   >       >
> >> >   >   >       > Criterion weights must total 100%. The tool displays a ✓ when correct and warns when they don't balance.
> >> >   >   >       >
> >> >   >   >       > ### 4. Review the Suggested Grade
> >> >   >   >       >
> >> >   >   >       > The weighted score is mapped to an overall grade using the scale defined in the Scorer. Use Override Score on individual criteria to fine-tune, or use the Grade Override field to set the overall grade directly where professional judgement warrants it.
> >> >   >   >       >
> >> >   >   >       > ### 5. Start a New Student
> >> >   >   >       >
> >> >   >   >       > Click ↺ New Student to reset all grades, scores, feedback, and Marker's Notes. Your tutor name is retained.
> >> >   >   >       >
> >> >   >   >       > ---
> >> >   >   >       >
> >> >   >   >       > ## Late Penalties
> >> >   >   >       >
> >> >   >   >       > | Band | Deduction |
> >> >   >   >       > |---|---|
> >> >   >   >       > | On time | 0% |
> >> >   >   >       > | Up to 1 day late | –10% |
> >> >   >   >       > | Up to 2 days late | –20% |
> >> >   >   >       > | Up to 3 days late | –30% |
> >> >   >   >       > | More than 3 days late | Grade set to lowest (fail) |
> >> >   >   >       >
> >> >   >   >       > > Intro and outro feedback paragraphs always reflect the student's pre-penalty grade — they speak to the quality of the work. The late deduction and final penalised score appear at the end of the feedback block.
> >> >   >   >       > >
> >> >   >   >       > > ---
> >> >   >   >       > >
> >> >   >   >       > > ## Cooked Feedback
> >> >   >   >       > >
> >> >   >   >       > > The Cooked Feedback panel assembles in real time:
> >> >   >   >       > >
> >> >   >   >       > > 1. Intro paragraph — matched to the student's overall grade (pre-penalty)
> >> >   >   >       > > 2. 2. Criterion-by-criterion breakdown — the rubric descriptor for each grade selected
> >> >   >   >       > >    3. 3. Total Score
> >> >   >   >       > >       4. 4. Closing paragraph (outro) — matched to the student's overall grade
> >> >   >   >       > >          5. 5. Late Submission notice and final penalised score — appended only if a penalty applies
> >> >   >   >       > >            
> >> >   >   >       > >             6. The assembled text is fully editable before copying — add a personal note, adjust phrasing, or insert a saved snippet. Click Copy to clipboard, then paste directly into Moodle, Turnitin, or your institution's grading system.
> >> >   >   >       > >            
> >> >   >   >       > >             7. ---
> >> >   >   >       > >            
> >> >   >   >       > >             8. ## Personal Snippets
> >> >   >   > 
Each tutor can build their own à la carte library of reusable feedback phrases — saved once, available in every marking session on that device.

Use the 💬 Insert snippet… dropdown in the Cooked Feedback panel to insert a saved phrase at the cursor position. To add, edit, or remove snippets, select ⚙ Manage snippets… from the same dropdown.

Snippets are stored locally in your browser — they are personal to you, not shared with colleagues or baked into the Scorer configuration. Two tutors marking from the same Scorer can each maintain their own library of phrases in their own voice, layered over the shared rubric baseline.

---

## Marker's Notes

The Marker's Notes panel is a private scratchpad — use it to record marking rationale, flag concerns, or note patterns across the cohort.

- Notes are not included in the copied student feedback
- - Notes are included in the Excel download, making them part of the formal marking record and available for moderation
 
  - ---

  ## Exporting Your Work

  | Button | Output | Best used for |
  |---|---|---|
  | Copy Feedback | Assembled feedback text to clipboard | Pasting into Moodle, Turnitin, or your grading system |
  | Marker's Record (Excel) | Workbook with scores, weightings, feedback, and Marker's Notes | Moderation, audit trails, record-keeping |
  | Print Page | Formatted print/PDF snapshot of the full session | Paper records |

  The Excel workbook contains three sheets:

  - Results — criterion grades, scores, weightings, and assembled feedback for this student
  - - Rubric — the full rubric descriptor matrix for the assessment
    - - Grade Feedback — the intro/outro templates for each grade tier
     
      - ---

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

      All data is held in `localStorage`. No student data is transmitted to any server.

      | Key | Contents |
      |---|---|
      | `SA_CONFIGS` | JSON array of all saved Scorer configuration objects |
      | `SA_ACTIVE` | ID of the currently active Scorer |
      | `SA_SNIPPETS` | JSON array of personal snippet objects (label + text) |
      | `SA_WELCOME_DISMISSED` | Flag set when the first-run welcome banner is dismissed |

      Each Scorer configuration object contains: assessment details, grade scale definition, criteria (name, weight, rubric descriptors per tier), and feedback templates (intro/outro per grade). Student session data — grades, scores, overrides, Marker's Notes — is held only in memory and is never written to storage.

      ---

      ## Privacy & Data Storage

      No data leaves your device. Feedback Kitchen runs entirely in the browser — there is no server, no account, and no telemetry. All Scorer configurations and personal snippets are stored in your browser's localStorage and remain on your machine.

      Student data (names, IDs, grades, scores, and assembled feedback) is held only in memory during a marking session and is never written to localStorage or transmitted anywhere.

      **Practical implications:**

      - Clearing browser data will remove saved Scorers and snippets — export your Scorers as JSON for backup
      - - Scorers are device-specific unless shared via JSON export
        - - Using Feedback Kitchen in a private/incognito window means nothing is saved between sessions
         
          - ---

          ## Deployment

          Feedback Kitchen is a static site — any web server or static host can serve it. No build step is required.

          **Recommended hosting options:**

          - [Vercel](https://vercel.com) — connect the repository and deploy automatically on push (current production deployment)
          - - [Netlify](https://netlify.com) — similar one-click static hosting
            - - [GitHub Pages](https://pages.github.com) — free hosting directly from this repository
              - - Any standard web server (Apache, Nginx, Caddy) — copy the files and serve
               
                - There are no environment variables, server-side processes, or database connections to configure.
               
                - ---

                ## Acknowledgements

                Feedback Kitchen is adapted from the original *Feedback Kitchen* Excel marking tool developed and generously shared by **Dr Michael Harker, University of Strathclyde** (michael.harker@strath.ac.uk). Redesigned as a browser-based application for use at the **University of Waikato**, reflecting NZ grading policy but adaptable to any institutional grade scale, course structure, or assessment context. Free to use for all educators.

                Developed with AI assistance (Claude / Anthropic · Perplexity · Microsoft Copilot · Qwen / Ollama · Google Gemini).

                ---

                *Feedback Kitchen is a static web application. It requires no server, no login, and no installation — just a modern browser.*

Score Automator is the browser-based successor to the original *Feedback Kitchen* Excel tool developed by Dr Michael Harker (University of Strathclyde), adapted and extended for use at the University of Waikato and beyond. Build your feedback kitchen once, then scale consistent, high-quality feedback across tutors, courses, and institutions.

## Experimental sandbox notice

This repository, `feedback-kitchen`, is an experimental sandbox for prototyping next-step features, including possible AI-assisted marking workflows.

It is **not** the canonical live repository for the current production Score Automator instances on stephendmann.com.

If you are looking for the live production version, go to:
- https://github.com/stephendmann/score-automator
- https://marking.stephendmann.com/
- https://www.stephendmann.com/score-automator

This sandbox may include experimental features, alternative deployments, or prototype integrations that are not present in the production application.

---

## Table of Contents

- [Background & Rationale](#background--rationale)
- [How It Works — Overview](#how-it-works--overview)
- [Getting Started](#getting-started)
- [Building or Editing a Scorer](#building-or-editing-a-scorer)
- [Using the Scorer](#using-the-scorer)
- [Late Penalties](#late-penalties)
- [Cooked Feedback](#cooked-feedback)
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

The original *Feedback Kitchen*, developed by Dr Michael Harker at the University of Strathclyde, addressed this by using a structured Excel workbook: markers select a grade per criterion from a dropdown, and the tool assembles a complete feedback block from pre-written rubric descriptors and tier-level intro/outro paragraphs. The approach draws on criterion-referenced assessment practice and reduces the cognitive overhead of writing feedback from scratch for every student, without sacrificing the specificity that criterion-level commentary provides.

Score Automator extends this approach as a browser-based application. The core pedagogical model is unchanged — but the menu is now à la carte. The Scorer configuration (rubric, criteria, grade scale, feedback templates) sets a consistent baseline across a marking team. Within that structure, individual tutors can build their own personal library of feedback phrases — snippets in their own voice and style — and insert them into the assembled feedback at the cursor, blending structured consistency with genuine personalisation.

The result is feedback that is:
- **Consistent** — all students in a cohort receive commentary calibrated to the same rubric and criteria
- **Personalised** — criterion-level descriptors speak to each student's specific performance tier, and tutors can layer in their own commentary and saved phrases
- **Scalable** — a Scorer built once can be shared across an entire marking team via JSON export

---

## How It Works — Overview

Each **Scorer** corresponds to one assessment. It encapsulates the assessment's criteria, weightings, rubric descriptors, grade scale, and feedback templates. Scorers are stored locally in your browser as **Kitchens** — you can build one per course or assessment type and switch between them freely.

At marking time, you open a Scorer, enter student details, select a grade for each criterion, and the tool assembles the complete feedback block in real time. You can edit the assembled text directly, insert personal snippets, and copy the final feedback to paste into Moodle, Turnitin, or your institution's grading system.

---

## Getting Started

1. Open the app and click **Build a New Scorer**
2. Work through the 6-step wizard (see [Building a Scorer](#building-or-editing-a-scorer) below)
3. Click **Save & Launch** — your Scorer opens immediately and is saved for future use
4. To return to a saved Scorer later, find it in the **Your Kitchens** section on the home page

---

## Building or Editing a Scorer

Click **Build a New Scorer** from the home page to open the 6-step configuration wizard. This is where the academic design decisions are made — the quality of the feedback generated at marking time depends directly on the care taken here.

| Step | What you configure |
|---|---|
| **1 — Details** | Assessment name, course code, institution, default tutor name |
| **2 — Grade Scale** | Choose a preset or define a fully custom scale with your own grade labels and score bands |
| **3 — Criteria** | Define each criterion and its percentage weighting. Weights must total exactly 100% |
| **4 — Rubric** | Write the descriptor shown in feedback for each grade tier × criterion combination. Four tiers per criterion: Excellent, Proficient, Developing, Unsatisfactory |
| **5 — Feedback** | Write the intro and outro paragraphs for each individual grade level (e.g. A+, A, A–). These frame the per-criterion rubric commentary |
| **6 — Review & Save** | Summary of all configuration before saving |

To edit an existing Scorer, find it in **Your Kitchens** on the home page and click **Edit**.

### Grade Scale Presets

| Preset | Grades | Typical use |
|---|---|---|
| 🇳🇿 NZ University | A+, A, A–, B+, B, B–, C+, C, C–, D | University of Waikato / standard NZ |
| 🎓 Australian Honours | HD, D, C, P, F | High Distinction scale |
| 🇬🇧 UK Degree | 1st, 2:1, 2:2, 3rd, F | Degree classification |
| 🇺🇸 US Simple | A, B, C, D, F | Standard A–F |
| ✏️ Custom | Your own | Define labels, score bands, tiers, and midpoints from scratch |

The default NZ scale maps grades to score midpoints (A+ = 95, A = 87, A– = 82, B+ = 77 … D = 44) and to four rubric tiers: A+/A/A– → Excellent, B+/B/B– → Proficient, C+/C/C– → Developing, D → Unsatisfactory. These midpoints drive the weighted score calculation unless overridden.

### Rubric Design

Each criterion has one descriptor per tier (four descriptors total). Descriptors should be written in the second person and be self-contained — they will appear verbatim in the student's assembled feedback. Effective descriptors are specific to the criterion's expectations rather than generic. A strong Excellent descriptor explains what distinguishes top-tier work; a strong Developing descriptor names what is missing or underdeveloped — not just that the work is below standard.

### Feedback Templates

The intro and outro paragraphs are written per grade (not per tier), giving fine-grained control over tone — an A+ student gets a different opening than an A student, even though both fall in the Excellent tier. The default templates cover A+ through D and are production-ready — edit them to match your course voice, or use them as-is.

---

## Using the Scorer

### 1. Enter Student Details

- **Student Name**
- **Student ID**
- **Tutor name** — persists across students in the same session
- **Date** — auto-populated

### 2. Grade Each Criterion

For each criterion:
1. Select the **Grade** from the dropdown (e.g. A, B+, C–)
2. The **Midpoint Score** auto-populates from the grade scale
3. To fine-tune, enter a value manually in **Override Score**

> **Advisory highlight:** if an override falls outside the selected grade's score band, the field turns amber. The override is still accepted — this is a prompt to review, not a block.

### 3. Check Weightings

Criterion weights must total 100%. The tool displays a ✓ when correct and warns when they don't balance.

### 4. Review the Suggested Grade

The weighted score is mapped to an overall grade using the scale defined in the Scorer. Use **Override Score** on individual criteria to fine-tune, or use the **Grade Override** field to set the overall grade directly where professional judgement warrants it.

### 5. Start a New Student

Click **↺ New Student** to reset all grades, scores, feedback, and Marker's Notes. Your tutor name is retained.

---

## Late Penalties

| Band | Deduction |
|---|---|
| On time | 0% |
| Up to 1 day late | –10% |
| Up to 2 days late | –20% |
| Up to 3 days late | –30% |
| More than 3 days late | Grade set to lowest (fail) |

> Intro and outro feedback paragraphs always reflect the student's *pre-penalty* grade — they speak to the quality of the work. The late deduction and final penalised score appear at the end of the feedback block.

---

## Cooked Feedback

The **Cooked Feedback** panel assembles in real time:

1. **Intro paragraph** — matched to the student's overall grade (pre-penalty)
2. **Criterion-by-criterion breakdown** — the rubric descriptor for each grade selected
3. **Total Score**
4. **Closing paragraph (outro)** — matched to the student's overall grade
5. **Late Submission notice and final penalised score** — appended only if a penalty applies

The assembled text is fully editable before copying — add a personal note, adjust phrasing, or insert a saved snippet.

Click **Copy to clipboard**, then paste directly into Moodle, Turnitin, or your institution's grading system.

---

## Personal Snippets

Each tutor can build their own à la carte library of reusable feedback phrases — saved once, available in every marking session on that device.

Use the **💬 Insert snippet…** dropdown in the Cooked Feedback panel to insert a saved phrase at the cursor position. To add, edit, or remove snippets, select **⚙ Manage snippets…** from the same dropdown.

Snippets are stored locally in your browser — they are personal to you, not shared with colleagues or baked into the Scorer configuration. This means two tutors marking from the same Scorer can each maintain their own library of turns of phrase, transitions, or frequently used commentary in their own voice, layered over the shared rubric baseline.

---

## Marker's Notes

The **Marker's Notes** panel is a private scratchpad — use it to record marking rationale, flag concerns, or note patterns across the cohort.

- Notes are **not** included in the copied student feedback
- Notes **are** included in the Excel download, making them part of the formal marking record and available for moderation

---

## Exporting Your Work

| Button | Output | Best used for |
|---|---|---|
| **Copy Feedback** | Assembled feedback text to clipboard | Pasting into Moodle, Turnitin, or your grading system |
| **Marker's Record (Excel)** | Workbook with scores, weightings, feedback, and Marker's Notes | Moderation, audit trails, record-keeping |
| **Print Page** | Formatted print/PDF snapshot of the full session | Paper records |

The Excel workbook contains three sheets:
- **Results** — criterion grades, scores, weightings, and assembled feedback for this student
- **Rubric** — the full rubric descriptor matrix for the assessment
- **Grade Feedback** — the intro/outro templates for each grade tier

---

## Sharing Scorers with Colleagues

Scorer configurations can be exported as JSON and shared. This is the primary mechanism for distributing a standardised Scorer across a marking team — ensuring all tutors work from the same rubric, weightings, and feedback templates, while each maintains their own personal snippet library.

**To export:** open the Scorer in the builder and click **Export JSON**

**To import:** click **Upload** on the home page and select the `.json` file

JSON exports contain the Scorer configuration only — criteria, rubric descriptors, grade scale, and feedback templates. Personal snippets are not included, as each tutor builds and maintains their own independently.

JSON export is also the recommended backup — browser localStorage is cleared when browser data is reset.

---

## AI Garnish — Stage 2 (Beta, Sandbox Only)

Stage 2 adds an optional one-click AI rewrite of the criterion-body section of Cooked Feedback, via a lightweight Vercel serverless proxy that forwards a prompt to Anthropic's Claude Haiku. The intro, outro, total score, and late-penalty notice remain deterministic — AI only touches the body commentary.

**How it works:**

1. A tutor clicks **✨ Garnish with AI (direct)** in the AI Garnish panel.
2. The scorer assembles a prompt (rubric descriptors + selected grades + marker's notes + snippet suggestions) and POSTs it to `/api/garnish` with a shared username and password.
3. The proxy validates credentials against Vercel environment variables, rate-limits per IP, and forwards the prompt to `claude-haiku-4-5-20251001`.
4. The reply populates the criterion-body textarea and auto-assembles the final feedback, ready for tutor review and edit.

**Credentials** are set once per browser via the **🔐 AI Login** button in the nav bar. They are stored in `localStorage` and sent only to the Feedback Kitchen proxy — never to Anthropic directly.

**Sandbox only.** This deployment is for closed-group colleague testing. The Anthropic API key lives exclusively in Vercel environment variables. If this repository is forked for wider use, testers should either (a) remove Stage 2 and rely on the Stage 0 copy-paste workflow, or (b) provision their own Anthropic key and proxy credentials.

### Deploying Stage 2

Set these environment variables in the Vercel project dashboard:

| Variable | Value |
|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key (from console.anthropic.com) |
| `FK_PROXY_USER` | Shared username for colleague access |
| `FK_PROXY_PASSWORD` | Shared password |
| `FK_ALLOWED_ORIGINS` | (Optional) comma-separated allowed CORS origins. Defaults to `*`. |

The proxy enforces a 20-call-per-minute-per-IP rate limit. Raise or lower this in `api/garnish.js` by editing `RATE_MAX_CALLS`.

---

## Technical Architecture

Score Automator is a fully static application with an optional single serverless function for Stage 2 AI Garnish. There is no database, no build step, and no framework dependency beyond CDN-loaded libraries.

```
/
├── index.html        # Home page — Your Kitchens, navigation
├── builder.html      # 6-step Scorer configuration wizard
├── scorer.html       # Live grading interface
├── upload.html       # Import a Scorer from a JSON file
├── js/
│   ├── shared.js     # Scoring engine, grade logic, localStorage helpers
│   └── excel.js      # Excel export (SheetJS / xlsx)
├── api/
│   └── garnish.js    # Stage 2 Vercel serverless AI proxy (optional)
├── vercel.json       # Vercel function config
└── README.md
```

**Dependencies (all CDN-loaded, no npm required for production):**

| Library | Purpose |
|---|---|
| [Tailwind CSS](https://tailwindcss.com) | Utility-first styling via CDN |
| [SheetJS (xlsx 0.20.3)](https://sheetjs.com) | Client-side Excel workbook generation |
| [Inter](https://fonts.google.com/specimen/Inter) | Typeface via Google Fonts |

**Storage model:**

All data is held in `localStorage`. No student data is transmitted to any server.

| Key | Contents |
|---|---|
| `SA_CONFIGS` | JSON array of all saved Scorer configuration objects |
| `SA_ACTIVE` | ID of the currently active Scorer |
| `SA_SNIPPETS` | JSON array of personal snippet objects (label + text) |
| `SA_WELCOME_DISMISSED` | Flag set when the first-run welcome banner is dismissed |

Each Scorer configuration object contains: assessment details, grade scale definition, criteria (name, weight, rubric descriptors per tier), and feedback templates (intro/outro per grade). Student session data — grades, scores, overrides, Marker's Notes — is held only in memory and is never written to storage.

---

## Data handling in this sandbox

Unlike the live `score-automator` production version, this sandbox may be used to test features with different data-handling patterns, including AI-assisted workflows.

That means the privacy assumptions for the live production app do **not automatically apply** here.

Before using this version with any real student information, review the current implementation, deployment context, and any active integrations carefully. Where experimental AI features are introduced, student data may be processed differently from the production version.

---

## Acknowledgements

Score Automator is adapted from the original *Feedback Kitchen* Excel marking tool developed and generously shared by **Dr Michael Harker, University of Strathclyde** (michael.harker@strath.ac.uk). Redesigned as a browser-based application for use at the **University of Waikato**, reflecting NZ grading policy but adaptable to any institutional grade scale, course structure, or assessment context. Free to use for all educators.

Developed with AI assistance (Claude / Anthropic · Perplexity · Microsoft Copilot · Qwen / Ollama · Google Gemini).

---

*Score Automator is a static web application. It requires no server, no login, and no installation — just a modern browser.*
