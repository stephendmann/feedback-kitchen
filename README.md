# 📊 Score Automator — Feedback Kitchen

A browser-based marking tool for university tutors, lecturers, and course markers looking to standardise their marking and feedback processes. Build a custom scorer once, then grade students quickly and consistently — with auto-generated, tier-appropriate feedback ready to copy into Moodle, Turnitin, or your institution's grading system.

**No login. No installation. No data leaves your device.**

---

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Using the Scorer](#using-the-scorer)
- [Late Penalties](#late-penalties)
- [Cooked Feedback](#cooked-feedback)
- [Marker's Notes](#markers-notes)
- [Exporting Your Work](#exporting-your-work)
- [Building or Editing a Scorer](#building-or-editing-a-scorer)
- [Privacy & Data Storage](#privacy--data-storage)
- [Acknowledgements](#acknowledgements)

---

## Overview

Score Automator is the web successor to the original Excel-based Feedback Kitchen. It works the same way — enter grades per criterion, get a weighted total, copy polished feedback — but runs entirely in your browser with no spreadsheet required.

Each **Scorer** you build is specific to one assessment. You can have as many as you like saved on your device (your **Kitchens**), each with its own criteria, weightings, rubric descriptors, grade scale, and feedback templates.

---

## Getting Started

1. Open the app and click **Build a New Scorer**
2. Work through the 6-step wizard (details below)
3. Click **Save & Launch** — your scorer opens immediately and is saved for future use
4. To return to a saved scorer later, find it in the **Your Kitchens** section on the home page

---

## Using the Scorer

Once a scorer is open:

### 1. Enter Student Details

Fill in the fields at the top of the page:
- **Student Name**
- **Student ID**
- **Tutor name** — this persists when you start a new student, so you only need to enter it once per marking session
- **Date** (auto-populated)

These are recommended for record-keeping and to assist with any student query.

### 2. Grade Each Criterion

For each criterion listed:
1. Select the **Grade** from the dropdown (e.g. A, B+, C-)
2. The **Midpoint Score** auto-populates based on the selected grade
3. If you want to fine-tune, enter a number manually in **Override Score**

> ⚠️ **Advisory highlight:** if an override falls outside the selected grade's score band, the field turns amber. This is advisory only — the override is still accepted — but review it before finalising.

### 3. Check the Weighting

Criterion weights must total 100%. The tool displays a ✓ when correct and flags a warning if they don't balance. In most cases the weighting is already configured correctly and does not need adjusting.

### 4. Review the Suggested Grade

The tool maps your final weighted score to a grade using the scale defined when the scorer was built (default: NZ University scale). Review the suggested grade and use Override Score on individual criteria if you want to fine-tune the result.

You can also use the **Grade Override** field to manually set the overall grade if the calculated result doesn't reflect your professional judgement. Leave it blank to use the calculated grade.

### 5. Start a New Student

When you're ready to move on, click **↺ New Student**. A confirmation modal will appear — clicking **Yes, clear & continue** resets all grades, scores, feedback, and Marker's Notes. Your tutor name is kept for the next student.

---

## Late Penalties

If a submission is late (check the **Status** field in Moodle — it will say *"Submitted late"*):

1. Use the **Late Submission** dropdown to select the lateness band
2. The appropriate deduction is automatically applied
3. The **Final Score** updates to reflect the penalty

| Band | Deduction |
|---|---|
| On time | 0% |
| Up to 1 day late | –10% |
| Up to 2 days late | –20% |
| Up to 3 days late | –30% |
| More than 3 days late | Grade set to lowest (fail) |

> **Note:** Intro and outro feedback text always reflects the student's *actual work quality* (pre-penalty grade), not the penalised score. The late notice and final penalised score appear at the end of the feedback block.

---

## Cooked Feedback

The **🍳 Cooked Feedback** panel automatically assembles:

1. An **intro paragraph** matched to the student's overall tier (based on pre-penalty grade)
2. A **criterion-by-criterion breakdown** with the relevant rubric descriptor for each grade selected
3. The **Total Score**
4. A **closing paragraph** (outro) matched to the student's tier
5. A **Late Submission notice** and final penalised score (if applicable)

Click **📋 Copy to clipboard** to copy the full text, then paste directly into Moodle, Turnitin, or your institution's grading system.

---

## Marker's Notes

The **📝 Marker's Notes** panel (below the Cooked Feedback section) is a private scratchpad for the marker. Use it to note concerns, patterns, or the reasoning behind your grade.

- These notes are **not** included in the copied student feedback
- They **are** included in the Excel download under a "Marker's Notes" section — making them part of your formal record and useful for moderation

---

## Exporting Your Work

Three export options are available from the action bar at the bottom of the scorer:

| Button | Purpose | Best used for |
|---|---|---|
| **📋 Copy Feedback** | Copies the Cooked Feedback to your clipboard | Pasting into Moodle, Turnitin, or your grading system |
| **📥 Marker's Record (Excel)** | Downloads a detailed workbook with criterion scores, weightings, feedback, and Marker's Notes | Moderation, audit trails, and record-keeping |
| **🖨 Print Page** | Prints a formatted snapshot of the full scoring session | Paper records or saving as PDF |

> The Excel workbook includes three sheets: **Results** (grades and feedback for this student), **Rubric** (your full rubric descriptors), and **Grade Feedback** (the intro/outro templates for each tier).

---

## Building or Editing a Scorer

Click **Build a New Scorer** from the home page to open the 6-step wizard:

| Step | What you configure |
|---|---|
| **1 — Details** | Assessment name, course code, tutor name |
| **2 — Grade Scale** | Choose a preset (NZ University, UK/Australian, US, or Custom) and edit bands if needed |
| **3 — Criteria** | Define each criterion and its percentage weighting (must total 100%) |
| **4 — Rubric** | Write the descriptor shown in feedback for each grade × criterion combination |
| **5 — Feedback** | Write the intro and outro paragraphs for each grade tier |
| **6 — Settings** | Review a summary and save |

To edit an existing scorer, find it in **Your Kitchens** on the home page and click **Edit**.

### Grade Scale Presets

| Preset | Grades | Typical use |
|---|---|---|
| 🇳🇿 NZ University | A+, A, A–, B+, B, B–, C+, C, C–, D | University of Waikato / standard NZ |
| 🇦🇺 UK / Australian | HD, D, C, P, F | High Distinction scale |
| 🇺🇸 US Simple | A, B, C, D, F | Standard A–F |
| ✏️ Custom | Your own | Define labels, bands, and tiers from scratch |

### Sharing a Scorer with a Colleague

Use **Export JSON** inside the builder to save your scorer configuration as a file. Your colleague can import it via the **Upload** button on the home page. This is also the recommended way to back up your scorers.

---

## Privacy & Data Storage

- **Everything stays on your device.** No data is sent to any server.
- Scorers and all configuration are saved in your **browser's localStorage**.
- Clearing your browser data or using a different browser or device will not show your saved scorers — export a JSON backup if you want to preserve them.
- Student scores and feedback are **never saved** — the scorer resets for each new student session.

---

## File Structure

```
/
├── index.html        # Home page — Your Kitchens, navigation
├── builder.html      # 6-step scorer wizard
├── scorer.html       # Live grading interface
├── upload.html       # Import a scorer from a JSON file
├── js/
│   ├── shared.js     # Shared scoring engine, grade logic, storage helpers
│   └── excel.js      # Excel export logic (SheetJS)
└── README.md
```

---

## Acknowledgements

Score Automator is adapted from the original *Feedback Kitchen* Excel marking tool developed and generously shared by **Dr Michael Harker, University of Strathclyde** (michael.harker@strath.ac.uk). Redesigned as a browser-based application for use at the **University of Waikato**, reflecting UW grading policy but adaptable to any institutional context and free to use for all educators.

Developed with AI assistance (Claude / Anthropic · Perplexity · Microsoft Copilot).

---

*Score Automator is a static web application. It requires no server, no login, and no installation — just a modern browser.*

