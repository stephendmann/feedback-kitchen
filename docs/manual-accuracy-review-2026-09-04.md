# Manual accuracy review, 4 September 2026

A chapter-by-chapter check of the 48 files in `manual/` against the shipped application. Every claim that names a control, a file, a storage key, a number or a schema was read back against source. Claims that are pedagogical advice rather than statements about the software were left alone.

Checked against: `js/shared.js`, `js/scorer-app.js`, `js/excel.js`, `js/moodle-worksheet.js`, `js/moderation-schema.js`, `js/moderation-suppression.js`, `js/moderation-export.js`, `js/cohort-insights.js`, `js/save-file.js`, `builder.html`, `scorer.html`, `index.html`, `upload.html`, `api/garnish.js`, `dev-server.js`, `vercel.json`, `package.json`, `Demo_Scorer___Written_Response.json`.

---

## Blocking

**No images exist.** All 48 chapters open with an `![...](images/chNN-*.png)` reference. `manual/images/` is an empty directory. Every chapter renders with one broken image at the top. Either produce the 48 screenshots or strip the references.

**The manual is outside the anti-drift process.** `docs/user-guide/USER-MANUAL.md` is the manual that `docs/MANUAL-MAINTENANCE.md` governs: the surface map, the `docs-impact:` pull-request line and the screen-name rule all point at it and at its part numbers. Nothing covers `manual/`. Two manuals now describe the same application, and only one of them is protected against going stale. Decide which is canonical before correcting either. If `manual/` is the successor, the surface map's "Manual sections" column has to be rewritten against chapter numbers in the same change.

---

## Fix first

Three findings are worse than the rest, because acting on them changes what a marker does.

**Switch marker does not purge an in-progress draft.** `switchTutor()` reads `if (!_sessionHasUnsavedWork()) clearDraft()` (`js/scorer-app.js:703-709`). It clears a stale draft and deliberately keeps one holding real work. Chapter 37 states the opposite ("Destroys any uncommitted in-progress draft"), chapter 35 lists it as a shared-machine safeguard, and chapter 48 builds a lab handover policy on it. A marker following that policy leaves the previous student's marks recoverable on a shared terminal.

**The grade scale table is mostly wrong.** Chapter 32 gives midpoints for four presets. Only the NZ row matches `GRADE_PRESETS` in `builder.html:706-740`. A coordinator setting up an Australian or UK scorer from that table would expect different marks than the tool awards.

**The moderation export is described as a different artefact than the one that ships.** Chapter 24 names three sheets that do not exist, a filename format that is not used, and row pseudonyms that are not the ones written. An external examiner handed the workbook cannot find anything the chapter describes.

---

## Findings by chapter

| Ch | Claim in the manual | What ships | Source |
|---|---|---|---|
| 02 | Click "Build a New Scorer" | The control is "Build a scorer". `js/scorer-cta-label.test.js` is a static guard against exactly this variant, and FK-51 in `MANUAL-MAINTENANCE.md` names it | `index.html:147` |
| 02, 30 | Click "Save & Launch" on step 6 | The button reads "Save & Start Scoring" | `builder.html` step 6 |
| 02, 14 | Step 1 captures a default tutor or marker name | Step 1 has no such field. It has Name, Assessment Title, Course / Paper Code / Year, University / Institution, Version, Score Display, Spelling, Assignment Info. The last four are undocumented | `builder.html:191-250` |
| 03, 14, 15, 25, 31 | Four performance tiers | Five: `excellent, proficient, developing, satisfactory, unsatisfactory`. Chapter 31's JSON example omits `satisfactory` from the `rubric` object | `js/shared.js:31` |
| 05 | Card actions are Open Scorer, Edit, Export JSON, Delete | The card renders "Use Scorer", "Edit" and a delete cross. No JSON export on a card | `index.html:620-624` |
| 05, 30 | Edit opens `builder.html?edit=<id>` | The parameter is `id` | `builder.html:532` |
| 05 | Cards show a configuration summary with the grade scale preset, and a last-modified timestamp | Cards show criteria count and assessment title. Neither the preset nor a timestamp is rendered | `index.html:619-621` |
| 05 | Demo has four criteria (Argument, Evidence & Literature, Structure & Flow, Presentation & Referencing) and a standard NZ scale | Five criteria: Understanding of the topic (25), Use of evidence or examples (20), Organisation and structure (20), Critical thinking or insight (20), Writing style and mechanics (15). The scale is a custom five-band A/B/C/D/F with custom tier labels, not NZ | `index.html:481-545` |
| 06 | Inter weights `400;500;600;700;800;900` | Stops at 800 | `scorer.html:76` |
| 08, 42 | Button reads "↺ Regenerate feedback" | "↺ Regenerate" | `scorer.html:868` |
| 08, 11 | Dropdown reads "💬 Insert snippet…" | "Insert snippet…", no emoji | `scorer.html:864` |
| 10, 14, 25, 42 | Weight validation shows "✓ 100%", or "Weights total 95% — must equal 100%" | "✅ Weights total 100% — good to go!" and "⚠️ Weights must total 100%". The blocking behaviour itself is correct | `builder.html:1050-1055` |
| 11 | Snippets carry an optional category | The object is `{id, label, text}`. No category anywhere | `js/scorer-app.js:3051` |
| 11 | The manager offers Edit and a search filter | Neither exists. The manager lists snippets with a delete cross and an add form | `js/scorer-app.js:3018-3056` |
| 11 | Buttons "Export to CSV" / "Import from CSV" | "Export CSV" / "Import CSV" / "Add Snippet" | `scorer.html:1694-1712` |
| 11, 44 | Export downloads `snippets.csv` | `feedback-kitchen-snippets-YYYY-MM-DD.csv` | `js/scorer-app.js:3123` |
| 13 | Exact rounding preserves two decimal places, so 74.25 stays 74.25 | `formatScore` with `none` is `toFixed(1)`. 74.25 renders as 74.3 | `js/shared.js:1380-1386` |
| 13 | Penalty output reads "Late Submission Penalty: 2 days late (-20%)" and "Final Penalised Score: 67.0 / 100 (B-)" | "LATE SUBMISSION NOTICE: As your <assessment> was submitted 2 days late (up to 48 hrs), a further 20% (out of 100%) has been deducted from the total above." then "FINAL SCORE (after late penalty): 67.0 / 100" | `js/shared.js:517-529` |
| 14, 32 | Grades map to one of four tiers | NZ uses four of the five; AU, UK, US and custom use all five | `builder.html:745-751` |
| 14, 26, 30, 43, 44 | Click "Export JSON" in step 6 | "⬇ Export (Save / Share)" | `builder.html` step 6, Backup & Share |
| 16 | "Verify" means the student is already marked, so grades are preserved | It means ID number blank but Full name present. Name-only matching is treated as a grade-leakage risk, so the row needs Assign ID or Ignore before commit is enabled | `js/moodle-worksheet.js:165-171`, `js/scorer-app.js:2298-2302` |
| 16 | "Non-markable" omits suspended enrolments and empty submissions | It is the No-submission status bucket, shown but not marked. Enrolment status is not read | `js/moodle-worksheet.js:150-156` |
| 16 | Click "Commit Import" | The button reads "Import N students" and is disabled while any verify row is unresolved | `js/scorer-app.js:2300` |
| 17 | Summary reads "Populated 42 of 42 student records" | "Exported N grades to <filename> · M row(s) left unchanged. Upload it back to Moodle." | `js/scorer-app.js:2411-2414` |
| 17, 42 | Moodle needs the original filename preserved, and a changed filename explains a rejected upload | FK writes the file back under the name you supplied, so the advice is harmless, but nothing in Moodle or in FK keys off the filename. The real rejection causes are header and identifier mismatches. Drop the filename as a diagnosis | `js/scorer-app.js:2408` |
| 18 | Supporters enter an unlock code, stored as a local flag | Two credentials, username and password, stored at `SA_FK_USER` and `SA_FK_PASS` and sent to the proxy on every call as `FK_PROXY_USER` / `FK_PROXY_PASSWORD` | `scorer.html:1725-1751`, `api/garnish.js:79-80` |
| 18, 45 | The endpoint is `/api/garnish.js` | The route is `/api/garnish`. `api/garnish.js` is the handler file. Chapter 43 gets this right | `dev-server.js:110` |
| 22 | Single-student record is a three-sheet workbook | Four sheets: Results, Rubric, Grade Feedback, Instructions | `js/excel.js:83-148` |
| 22 | Cohort workbook is five sheets | Six: Student Feedback, Grade Matrix, Cohort Summary, Rubric, Grade Feedback, Instructions | `js/excel.js:360-419` |
| 22 | Lazy loading keeps initial page load under 100KB | No such budget exists. `scripts/check-lazy-load.js` guards one invariant, that no static SheetJS script tag reappears. The lazy-load description is otherwise accurate | `scripts/check-lazy-load.js:1-28` |
| 24 | Three sheets: README, Cohort Matrix, Rubric Reference | Four: `00_README`, `10_rows`, `20_methods`, `90_manifest` | `js/moderation-schema.js:16-21` |
| 24 | Filename `<PaperCode>_Moderation_<AssessmentId>.xlsx` | `FK_ModExport_<paper>_<cohort>_<assessment>_<YYYYMMDD>.xlsx` | `js/moderation-schema.js:120-125` |
| 24 | Submissions are labelled Student 01, Student 02 | `R001`, `R002`, and the rows are shuffled before labelling | `js/moderation-suppression.js:36-43`, `js/moderation-export.js:155-158` |
| 24 | The Cohort Matrix carries criterion letter grades, overrides and final grades, and a Rubric Reference sheet carries descriptors | `10_rows` carries numeric criterion scores and maxima, total, band and flags. No letter grades per criterion, no overrides, no descriptor sheet anywhere in the workbook | `js/moderation-export.js:170-217` |
| 24 | Marker names are completely eliminated | Markers become `T1`, `T2` or `T_other`, which is right, but the manifest carries `lecturer_name` and `lecturer_role` from the opt-in record | `js/moderation-export.js:280-292` |
| 27 | "Finalise & Export" downloads `<Student>_Marker_Record.xlsx` | `<Name>_<Course>_Feedback.xlsx` | `js/excel.js:153` |
| 31 | Config key `markedInMoodle` | `moodleEnabled` | `builder.html:691` |
| 32 | AU midpoints HD 92.5, D 79.5, C 69.5, P 57, F 24.5 | 92, 77, 67, 55, 25 | `builder.html:719-725` |
| 32 | UK midpoints 1st 85, 2:1 64.5, 2:2 54.5, 3rd 44.5, F 19.5 | 80, 65, 55, 45, 20 | `builder.html:726-732` |
| 32 | US midpoints B 84.5, C 74.5, D 64.5, F 29.5 | 85, 75, 65, 30 | `builder.html:733-739` |
| 32 | NZ D band is 0 to 49 | 40 to 49 | `builder.html:717` |
| 34 | `<main id="main">` | `<main>` carries no id | `scorer.html:578` |
| 36 | Draft key `SA_DRAFT_<scorerId>` | `SA_DRAFT_V1_<scorerId>` | `js/scorer-app.js:47` |
| 36 | Writes are debounced by 300 milliseconds | 1000 | `js/scorer-app.js:50` |
| 36 | The draft stores the active focus mode index | `_buildDraft()` stores no focus index. Focus state lives separately at `SA_FOCUS_MODE` | `js/scorer-app.js:58-71` |
| 37, 35, 04, 48 | Switch marker purges the active draft | Only when there is no unsaved work. See "Fix first" | `js/scorer-app.js:703-709` |
| 38 | Metrics appear once eight students are saved | Metrics compute from n=1. The n≥8 threshold gates Cronbach's alpha alone | `js/cohort-insights.js:26, 96, 225` |
| 38 | A live panel in the Cohort section updates on every copy or save | A modal, rendered when opened | `js/scorer-app.js:2767-2792` |
| 38 | The histogram maps students across the grade scale, A+ through D | Bars are tier bands, using the configured tier labels | `js/cohort-insights.js:180-200, 470-479` |
| 38 | Criterion difficulty analysis ranks criteria by average score | No per-criterion ranking exists. The nearest thing is within-script differentiation, a single averaged figure | `js/cohort-insights.js:138-149` |
| 39 | The favicon suite is `favicon-16x16.png`, `favicon-32x32.png`, `favicon-48x48.png` | Those files sit unused in `public/favicon/`. The pages serve `/favicon.ico`, `/fk-chef.svg`, `/favicon-32.png`, `/apple-touch-icon.png`, `/icon-192.png` | `index.html:6-10` |
| 39 | A web manifest supports standalone installation | `site.webmanifest` exists under `public/favicon/` but no page links it, so installation is not wired up | no `manifest` link in any HTML |
| 40 | Score rounding and late penalties are adjustable in Scorer Settings | Neither is in that modal. Rounding lives in builder step 1 and the section rail; penalties in builder step 6. The modal holds the Moodle declaration, advanced wording tools, the consistency indicator and clear-marker-between-students | `scorer.html:1898-1938` |
| 40 | The settings list is complete | "Show advanced wording tools" is missing. The consistency indicator is also hidden below 12 scripts, which is worth stating | `scorer.html:1911-1928` |
| 42 | Builder blocks at "Step 3" for save | Correct, and it also blocks advancing from step 3 to step 4. Worth saying both | `builder.html:624, 1263` |
| 45 | Student IDs are matched by standard university ID regex patterns | There is no ID pattern. `scrubPII` redacts the literal name and ID of the student on screen, plus individual name tokens, plus one simple email regex. Another student's ID pasted into notes passes through | `js/shared.js:559-604` |
| 45 | Email matching follows RFC-5322 | A short conventional pattern, not RFC-5322 | `js/shared.js:602` |
| 46 | GitHub Pages serves the complete core marking tool | Every page loads `/js/...` and `/css/...` as root-absolute paths, which break on a project page served under `/<repo>/`. The instructions only hold for a user or apex domain | `index.html:93, 471-473` |
| 47 | Double-clicking `index.html` runs the app, with grading, snippets and autosave working | The same root-absolute paths mean `shared.js` never loads over `file://`. The page comes up unstyled with no `SA` global. Delete the section or replace it with the local-server options already listed | `scorer.html:1430-1436` |

---

## Writing rules

The manual departs from `CLAUDE.md` and `brand-voice-canon.md` consistently enough that it reads as a different document from the rest of the repository.

Headings are Title Case throughout ("Getting Started", "The Dashboard and Kitchens", "Coming from Excel or LMS Rubrics"). The canon asks for sentence case, and applies it to table headers too, which are also Title Case here.

Rule 10 bans `**Label:** text` bullet lists unless the content is genuinely a list. Nearly every chapter is built from them, several chapters almost entirely.

AU and NZ spelling is not applied: `customization` twice, `synchronization`, `color` and `colorblind`, `behavior` twice, `rigor`, `organizing`, `centers`, `enrollment`, `defenses`, `standardized`. Note that `pseudonymous` and `standardised` appear in their correct forms elsewhere, so this is inconsistency rather than a deliberate choice.

Rule 2 bans participle tails asserting significance. `ensuring` closes five sentences. `comprehensive` appears four times and `seamless` or `seamlessly` twice, against rule 4's spirit.

Rule 7 asks for em dashes sparingly and never spaced. Seven chapters use spaced em dashes, chapter 4 eight times.

The `/writing-review` skill will pick most of this up in one pass.

---

## Verified correct

Recorded so nobody spends time re-checking it.

Keyboard shortcuts, all of them, including the modifier combinations, the `?` guard against firing while editing, and Page Up and Page Down stepping only in focus mode and only outside `#focus-body`. The 14-column Moodle header contract, column for column, along with `E_HEADER_MISMATCH`, the two editable columns and the two-decimal grade format. The k-anonymity gate at n≥15 and the 20-request-per-IP-per-minute rate limit. Storage keys `SA_CONFIGS`, `SA_ACTIVE`, `SA_SNIPPETS`, `SA_COHORT_<scorerId>`, `SA_SCORER_SETTINGS_V1`, `SA_SECTION_STATE_V1`, `fk-theme`. Feedback assembly order, including intro and outro reflecting the pre-penalty grade and the late notice landing last. Grade override snapping up to the band minimum, and being blocked or cleared when the penalty is an automatic fail. The five-block draft structure. Score rounding for half and whole. Field tint colours and the 3px amber border. `scroll-padding-top` at 8.5rem and 6.5rem. The feedback editor's monospace stack. Focus mode chip text, live regions and their element ids, `role="dialog"` with `aria-modal`, and the nav landmark labels. Dev server port, both mounted API routes and `.env.local` loading. Tailwind watch and build scripts. The Ko-fi address. The File System Access API path on Chrome and Edge with the anchor fallback elsewhere. The cohort naming prompt on first save, though the modal also asks whether the cohort is multi-marker, which no chapter mentions.

---

Reviewed by Claude Opus 5 at Stephen Mann's request, 4 September 2026. Findings are point-in-time against the working tree at commit `fcf4733`.

---

# Re-verification and corrections, 5 September 2026

Everything above this line is the original audit of 4 September, preserved verbatim. The sections below are append-only.

## Branch map, recorded before any correction

| Check | Result |
|---|---|
| `origin/main` tip | `72e4c10` (2026-09-03), "Merge pull request #125 from stephendmann/feat/marker-label-copy". Unchanged by `git fetch origin` on 5 September |
| `git merge-base main manual` | `e5eb82c`, which is the local `main` tip. `manual` descends cleanly from `main`; the branches have not diverged |
| `git log origin/main..main` | 4 commits (`81d75e1`, `c570e50`, `c362ed3`, `e5eb82c`), all manual chapters 01 to 03, unpushed |
| `git log origin/main..manual` | 50 commits, all manual chapters |
| `git diff --name-status origin/main...manual` | 48 additions, every one under `manual/`. No application file, configuration file or existing document differs from `origin/main` |

That last row is the material one. Because the branch adds only markdown, every source file this audit cites is byte-identical to the copy on the default branch, so the findings recorded on 4 September stand as findings against `origin/main` and not merely against a local checkout. `docs/MANUAL-MAINTENANCE.md` records that a wrong drift report costs as much time as real drift; this check is what rules that out.

History was not altered: no rebase, merge, reset or cherry-pick. Two duplicate commits remain in the log (chapter 01 and chapter 42 were each committed twice) and are left in place.
