# Feedback Kitchen: quick start for new lecturers

*Two pages. Everything here is free and needs no account, no install, and no sign-up.*

Feedback Kitchen is a marking tool that runs entirely in your browser tab. You build a rubric once, then mark each student by picking a grade for every criterion. The tool assembles the written feedback as you go. You stay in charge of the grades; it does the typing.

Nothing you enter is sent anywhere. Student names, IDs, grades, and feedback stay on the machine you are sitting at.

---

## The whole loop in three moves

**Build** a scorer (once per assessment) → **Mark** each student → **Export** the record.

---

## 1. Build a scorer

Go to [marking.stephendmann.com](https://marking.stephendmann.com/) and click **Build a scorer**. The wizard has six steps:

1. **Assessment details.** Assessment name, paper code, institution, and your name as default tutor.
2. **Grade scale.** Pick NZ University, Australian Honours, UK Degree, US Simple, or define your own labels and score bands.
3. **Criteria and weights.** Name each criterion and give it a percentage. The weights must total exactly 100%.
4. **Rubric descriptors.** For each criterion, write the sentence a student sees at each of four tiers: Excellent, Proficient, Developing, Unsatisfactory. Write them in second person ("You have..."), because they appear verbatim in the student's feedback.
5. **Grade feedback templates.** The opening and closing paragraph for each individual grade (A+, A, A−, and so on). The supplied defaults are usable as they stand.
6. **Settings and save.** Late penalty bands, a summary, then **Save and launch**.

Your scorer is saved in this browser and opens straight away.

> **Do this once, now:** on step 6, use **Backup and share** to export the scorer as a `.json` file and keep it somewhere durable (your OneDrive, H: drive, or a course folder). Clearing your browser data deletes saved scorers, and the JSON file is the only backup. It is also how you hand the rubric to a co-marker.

If you would rather not start from scratch, open **Upload** on the home page and load the demo scorer or a colleague's `.json` file.

## 2. Mark a student

Work down the page; the rail on the left jumps between sections.

1. **Student.** Name, ID, tutor, date. Your tutor name persists between students.
2. **Rubric scores.** Choose a grade per criterion. The midpoint score fills in automatically. Type in **Override** to fine-tune. An amber field means the override sits outside the grade's band; it is a prompt to check, not a block.
3. **Penalty and grade override.** Set a late penalty band, or set the overall grade directly where your judgement warrants it.
4. **Editable feedback draft.** The assembled feedback appears here and updates live. Edit it freely, and use **Insert snippet** to drop in a phrase from your own saved library.
5. **Notes.** A private scratchpad. Never shown to the student, but included in the Excel record for moderation.
6. **Finish.** Use **Copy feedback**, then paste into Moodle, Canvas, or Turnitin. Then **New student** and repeat.

Copying feedback or finishing a student also saves that student into the **Cohort**, so the class record builds itself as you mark.

## 3. Export the record

At the bottom of the page, the **Cohort** section holds everything you have marked:

- **Export cohort (Excel).** One workbook for the whole class, with feedback, a grade matrix, a summary, and the rubric for reference. Do this at the end of each marking session.
- **View list → Open.** Reload any saved student to re-mark or correct them. Saving again updates that record rather than duplicating it.
- **Cohort Insights.** Grade distribution and marking patterns, once you have enough students saved.

> **Changed September 2026:** the marker column in every exported workbook is now headed **Marker** rather than **Tutor**, matching the field name in the scorer. Workbooks you exported before this change still say Tutor. If you have a spreadsheet formula or script reading that column by name, point it at the new heading.

---

## Marking a Moodle cohort

If your students come from Moodle, do this before you mark anyone. Download the offline grading worksheet from the Moodle assignment, then in Feedback Kitchen choose **Import Moodle worksheet…** and select that file. Feedback Kitchen checks it, shows you what it will import, and pre-loads the class list, so you never retype a name or an ID. It will not overwrite a student you have already marked.

When you have finished marking, choose **Export Moodle worksheet…** and re-supply the same file you downloaded. Feedback Kitchen fills your grades and feedback into it and hands it back, ready to upload to Moodle. Keep the original filename so Moodle accepts it.

---

## Three things worth knowing on day one

**Your data never leaves the browser.** There is no server holding student work. The flip side is that clearing your browser data, or marking in a private window, wipes your saved scorers and cohort records. Export regularly.

**Downloads go to your browser's download folder.** Feedback Kitchen cannot yet save into a folder you choose. To get files into a course folder instead, turn on "Ask where to save each file" in your browser settings, or move them afterwards. See the full manual for the exact steps.

**Nearly all of it is free.** Two features are reserved for Ko-fi supporters: the AI wording assistant, and importing a rubric from a PDF. Both are conveniences. The entire marking loop from building a rubric to exporting a cohort works without paying anything.

---

*Full manual: [USER-MANUAL.md](USER-MANUAL.md). Last checked against the live app on 2026-07-24.*
