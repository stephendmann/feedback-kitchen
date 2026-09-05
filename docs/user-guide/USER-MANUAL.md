# Feedback Kitchen: a manual for lecturers and tutors

---

## Contents

1. [What Feedback Kitchen is](#1-what-feedback-kitchen-is)
2. [Before you start](#2-before-you-start)
3. [Building a scorer](#3-building-a-scorer)
4. [Marking a student](#4-marking-a-student)
5. [Writing in your own voice: snippets and notes](#5-writing-in-your-own-voice-snippets-and-notes)
6. [Working with Moodle](#6-working-with-moodle)
7. [The cohort record and exports](#7-the-cohort-record-and-exports)
8. [Where your files are saved](#8-where-your-files-are-saved)
9. [Sharing a scorer with your marking team](#9-sharing-a-scorer-with-your-marking-team)
10. [Privacy, storage, and what can go wrong](#10-privacy-storage-and-what-can-go-wrong)
11. [Supplement: supporter features](#11-supplement-supporter-features)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. What Feedback Kitchen is

Feedback Kitchen assembles written assessment feedback from a rubric you define. You set up the assessment once, then for each student you pick a grade against each criterion. The tool builds the feedback paragraph by paragraph from your own descriptors, and you edit whatever you want before it goes out.

It is not an autograder and it does not read student work. Every grade is yours. What it removes is the retyping: the same four sentences about referencing, rewritten slightly differently for the ninetieth time at eleven at night.

The whole application runs inside your browser tab. There is no account, no installation, and no server holding student work. That shapes almost everything else in this manual, particularly part 10.

The design comes from Dr Michael Harker's original Feedback Kitchen Excel workbook at the University of Strathclyde, rebuilt as a web application for the University of Waikato and generalised since to other grading scales.

### Vocabulary

A **scorer** is one assessment's configuration: its criteria, weightings, grade scale, rubric descriptors, and feedback templates. You build one scorer per assessment and reuse it every time that assessment is marked.

A **cohort** is the running record of students you have marked with a given scorer. It builds itself as you work.

A **snippet** is a reusable phrase you have saved in your own words. Snippets belong to you, not to the scorer.

---

## 2. Before you start

Open [marking.stephendmann.com](https://marking.stephendmann.com/) in a current browser. Chrome and Edge get the fullest experience; Firefox and Safari work, with one difference noted in part 8.

Three things are worth understanding before you invest an hour in building a rubric.

**Everything is stored in this browser, on this machine.** Not in an account, not in the cloud. If you build a scorer on your office desktop, it is not on your laptop until you export it and open it there.

**Clearing your browser data deletes your work.** Saved scorers, snippets, and cohort records all live in browser storage. A browser cleanup, a managed-device reset, or marking in a private window will lose them. Exporting is the backup, and part 9 covers it.

**Nothing here costs money.** Parts 3 to 10 describe the complete marking workflow and every feature in them is free. Part 11 covers the two features reserved for Ko-fi supporters, and neither is on the path between a rubric and a marked cohort.

If you want to try the tool before committing to your own rubric, the home page offers a demo scorer. Open it, mark an imaginary student, and export a workbook. Nothing you do there affects anything real.

---

## 3. Building a scorer

From the home page, choose **Build a scorer**. The wizard has six steps and you can move back and forth between them.

The care you take here is the whole game. Every student's feedback is assembled from what you write in steps 4 and 5, so an hour spent on good descriptors pays back across the entire cohort, and a rushed rubric produces feedback that reads as though it was rushed.

### Step 1: Assessment details

Assessment name, paper code, institution, and the default marker name. The paper code matters later if your team uses moderation export, so use the real one.

### Step 2: Grade scale

Choose a preset or build your own.

| Preset | Grades | Typical use |
|---|---|---|
| NZ University | A+, A, A−, B+, B, B−, C+, C, C−, D | University of Waikato and standard NZ |
| Australian Honours | HD, D, C, P, F | High Distinction scale |
| UK Degree | 1st, 2:1, 2:2, 3rd, F | Degree classification |
| US Simple | A, B, C, D, F | Standard A–F |
| Custom | Yours | Your own labels, score bands, tiers, and midpoints |

Each grade carries a **midpoint** (on the NZ scale, A+ is 95, A is 87, A− is 82, down to D at 44) and maps to one of four **rubric tiers**: Excellent, Proficient, Developing, Unsatisfactory. The midpoint is what gets entered automatically when you pick a grade while marking, and the tier decides which rubric descriptor appears.

Changing the grade scale after you have written rubric descriptors will prompt you before it replaces anything, but it is much less painful to settle the scale now.

### Step 3: Criteria and weights

Name each criterion and give it a percentage weight. The weights must total exactly 100% and the wizard shows a tick when they do.

Keep criteria to the number you can genuinely distinguish while marking. Four to six is common. Twelve criteria produce twelve dropdowns per student and feedback that reads like a checklist.

### Step 4: Rubric descriptors

For every criterion, write four descriptors, one per tier. This is the bulk of the work and the part that shows up verbatim in student feedback.

Two rules make the difference. Write in second person, because the student is the reader: "Your analysis moves beyond description to interpretation", not "The analysis moves beyond description". And make each descriptor self-contained, because the student sees only the one that matched their grade, never the four side by side.

A good Excellent descriptor says what distinguishes top work, not just that it was excellent. A good Developing descriptor names what is missing or underdeveloped and implies the next step. "Below the required standard" tells a student nothing they did not already know from the grade.

### Step 5: Grade feedback templates

The opening and closing paragraphs, written per individual grade rather than per tier. An A+ student and an A− student both sit in the Excellent tier but can be greeted differently, which is where the tool earns its keep on tone.

The supplied defaults are usable as they stand. Edit them to match how you actually talk to your students, or leave them and revisit after the first marking run, when you will know what you keep wanting to change.

### Step 6: Settings and save

Set the **late submission penalty** bands here. The default policy is a flat deduction per day late, in bands:

| Band | Deduction |
|---|---|
| On time | 0% |
| Up to 1 day late | −10% |
| Up to 2 days late | −20% |
| Up to 3 days late | −30% |
| More than 3 days late | Grade set to the lowest grade |

Penalties apply to the score, not to the written feedback. The intro and closing paragraphs always speak to the pre-penalty grade, because they are about the quality of the work. The deduction and the final penalised score appear at the end of the feedback block.

This step also holds **Backup and share**, where you export the scorer as a `.json` file. Do that now, before you mark anyone. Part 9 explains why.

Then **Save and launch** opens the scorer.

### Editing a scorer later

Find it under **Your kitchens** on the home page and choose **Edit**. Be careful editing a rubric mid-cohort: students you have already marked keep the descriptors they were marked against, and Feedback Kitchen will warn you at export time if a cohort contains records marked against different versions of the rubric. That warning is doing its job, not malfunctioning. It exists so a moderation pack cannot quietly mix two rubrics.

---

## 4. Marking a student

Open the scorer. The rail on the left jumps between sections; the page is designed to be worked top to bottom.

### Student

Name, ID, marker, and date. The date fills in automatically. Your marker name persists between students, and **Marking as** in the top bar always shows whose name is going on the record. On a shared marking machine, **Switch marker** clears the active marker name but does not discard unfinished marking. After saving or exporting any needed record, use **↺ New student** to clear the current student's in-progress fields and draft, then use **Switch marker** to leave the machine unassigned.

### Rubric scores

For each criterion, pick a grade. The midpoint score fills in automatically. If your judgement is finer than the grade bands allow, type a value into **Override**.

An override that falls outside the selected grade's band turns the field amber. That is advisory. The tool accepts the number and asks you to look again, on the assumption that you are more likely to have mistyped than to have meant it.

**Focus marking** collapses the page to one criterion at a time, which helps on long rubrics.

### Penalty and grade override

Apply the late penalty band if one applies. **Grade override** sets the overall grade directly where professional judgement warrants overriding the weighted calculation.

**Score rounding** offers Exact, Half, or Whole, with a live example showing what the current score becomes under each.

### Editable feedback draft

The assembled feedback appears here and updates as you change grades. It contains, in order: the opening paragraph for the overall grade, the rubric descriptor for each criterion, the total score, the closing paragraph, and a late submission notice if one applies.

Edit it freely. It is a draft, not a locked output. Your work is autosaved as you type, and if the tab closes on you, a banner offers to resume the draft when you come back.

### Notes

A private scratchpad for your marking rationale, borderline calls, or anything to raise at moderation. Notes never appear in the student's feedback. They **are** included in the Excel record, which is deliberate: they are part of the formal marking record.

### Finish

**Copy feedback** puts the assembled text on your clipboard, ready to paste into Moodle, Canvas, Turnitin, or wherever your institution collects it. **Print page** produces a PDF snapshot.

Then **New student** clears the grades, feedback, and notes, keeps your marker name, and starts the next one.

Copying feedback or finishing a student also saves that student to the cohort. The first time, you are asked to name the cohort. Records need at least a name or an ID.

---

## 5. Writing in your own voice: snippets and notes

The rubric gives every student in the cohort the same baseline. Snippets are how you layer your own voice on top of it without retyping.

A snippet is a phrase you save once and reuse forever: the paragraph you always write about referencing conventions, the encouragement you give students who are close to the next grade, the sentence pointing at the writing centre.

In the feedback draft panel, **Insert snippet** drops a saved phrase in at the cursor. **Manage snippets** from the same menu is where you add, rename, and delete them.

Snippets are personal and local. They are stored on your device, they are not part of the scorer, and they do not travel when you share a scorer with a colleague. Two tutors marking the same assessment from the same rubric each keep their own library in their own voice, which is the point. If you want a phrase to reach the whole team, it belongs in the rubric descriptor, not in a snippet.

You can export your snippets to CSV as a backup, which is worth doing once you have built up a library you would be annoyed to lose.

---

## 6. Working with Moodle

Feedback Kitchen does not connect to Moodle. There is no integration to authorise and no plugin to install. It exchanges files with Moodle using Moodle's own offline grading worksheet, which means it works with any Moodle instance without your institution having to enable anything.

The round trip has two halves, and the first one belongs at the start of marking.

### Importing the class list

In your Moodle assignment, choose to download the **offline grading worksheet**. Moodle gives you a CSV containing the participant list.

In Feedback Kitchen, the Student section carries a line reading "Marking a Moodle cohort? Import the worksheet to load the class list before you start marking." Use that, or **Import Moodle worksheet…** in the Cohort section lower down; both do the same thing. Select the file you downloaded. Feedback Kitchen checks it is genuinely a Moodle worksheet, then shows you a preview of what it will do with each row before anything is imported. Students already marked in this cohort are protected: the import will not overwrite them.

Once you commit the import, the class list is loaded and the first student opens ready to mark. From then on you are marking against real names and IDs that came from Moodle, so nothing is mistyped and nothing is missed.

Importing mid-cohort is safe. If you are part-way through marking a student when you import, Feedback Kitchen leaves your current student alone rather than jumping away from unsaved work.

### Sending grades and feedback back

When the marking is done, choose **Export Moodle worksheet…**. Feedback Kitchen asks you to re-supply the original worksheet you downloaded from Moodle. It needs the original because Moodle's file carries participant identifiers that must come back unchanged for the upload to be accepted.

Feedback Kitchen fills in the grade and the feedback text for each student, leaves everything else exactly as Moodle wrote it, and hands the file back. Upload it to the same Moodle assignment. Keep the original filename.

Your marker's notes are never written into the Moodle file. They stay in the Excel record where they belong.

### If you would rather not use the worksheet

Nothing forces you to. Marking a student and using **Copy feedback**, then pasting into Moodle's grading interface by hand, works exactly as well. The worksheet route saves time on large cohorts and removes transcription errors; on twelve students it may not be worth the round trip.

### Turning the Moodle tools off

If an assessment is not marked in Moodle at all, you can keep these tools out of the way. Step 6 of the builder has a setting, "This assessment is marked in Moodle", switched on by default. Turn it off and the Moodle import and export controls disappear from the scorer for that assessment. The same setting is in scorer settings if you want to change it later.

It is saved with the scorer rather than with your browser, so it travels when you share the scorer with your marking team. That is deliberate: an assessment either is or is not delivered through Moodle, and that is the same answer for everyone marking it. Someone at another institution who imports your scorer can switch it back on.

One safeguard worth knowing: if you have already imported a Moodle worksheet into the cohort, the export control stays visible even with the setting off, so you can always finish a round trip you have started.

---

## 7. The cohort record and exports

The **Cohort** section is the running record of everyone you have marked with this scorer. It builds itself as you mark, so there is nothing to remember to do.

**View list** shows every saved student. **Open** reloads one back into the session with grades, overrides, feedback edits, and notes restored, so you can re-mark or correct. Saving again updates that record rather than creating a second one. If you have unsaved work on screen, you get a warning before it is replaced.

**Export cohort (Excel)** produces one workbook for the whole class: student feedback, a grade matrix, a cohort summary, and the rubric and grade templates for reference. This is the export to run at the end of every marking session, because it is the only copy that survives your browser being cleared.

**Cohort insights** shows the grade distribution and marking patterns across the cohort once enough students are saved. It is a calibration aid: it tells you that you have given eleven B+ grades and no A grades, and leaves the interpretation to you. Some of it is off by default, because a tool that tells you what you have been awarding can nudge what you award next.

**Export for moderation** is a separate, opt-in export for paper-level moderation. It strips student and marker names, and it requires a minimum of fifteen students so individuals cannot be identified by elimination. A lecturer or coordinator configures it per paper; tutors then see a banner telling them it is enabled. If you are a tutor and the option is blocked, that is the paper's configuration, not a fault.

**Clear cohort** deletes every locally stored record for this scorer. It asks twice. There is no undo, and no copy anywhere else, so export first.

For a single student rather than a cohort, the **Marker's record (Excel)** download on the Finish section produces a workbook containing that student's scores, weightings, feedback, and your notes, plus the rubric and grade templates.

---

## 8. Where your files are saved

Every file Feedback Kitchen produces goes to your browser's download folder. The application cannot currently choose a folder for you, so a scorer JSON, a cohort workbook, and a Moodle worksheet all land wherever your browser puts downloads, usually `Downloads`.

For most people the useful change is a browser setting rather than anything in Feedback Kitchen. Turning on "ask where to save each file" makes the browser prompt for a destination on every download, so you can send a cohort workbook straight into the course folder on OneDrive or a network drive instead of fishing it out of `Downloads` afterwards.

In **Chrome** and **Edge**: Settings, then Downloads, then turn on "Ask where to save each file before downloading".

In **Firefox**: Settings, then General, then under Files and Applications choose "Always ask you where to save files".

In **Safari**: Settings, then General, then set "File download location" to "Ask for each download".

The setting is per browser and per machine, and it applies to all your downloads, not only Feedback Kitchen. If you would rather not change it globally, the alternative is to let files land in `Downloads` and move them afterwards, which is safer than it sounds as long as you actually do it: a cohort workbook sitting in a downloads folder is a backup that nobody will find in six months when the moderation query arrives.

> **Planned.** Letting Feedback Kitchen offer a save destination directly, and a fuller design in which a scorer works from a folder you nominate, are both on the roadmap. Neither has shipped. Until one does, the browser setting above is the only route.

---

## 9. Sharing a scorer with your marking team

A scorer exports as a single `.json` file. That file is both your backup and the way a marking team works from one rubric.

To export, open the scorer in the builder and use **Backup and share** on step 6. To import, choose **Upload** on the home page and select the file.

The export contains the assessment configuration only: criteria, weights, grade scale, rubric descriptors, and feedback templates. It does not contain any student data, and it does not contain your snippets. Sending a colleague your scorer sends them your rubric, not your marking.

For a team, the pattern that works is for one person to own the scorer, export it, and distribute the file; everyone imports the same file, and each tutor builds their own snippet library on top. When the rubric changes, the owner re-exports and redistributes, and the version stamping described in part 3 catches anyone still marking against the old one.

Treat the JSON as the real artefact. Browser storage is convenient but disposable; the file is what you still have next semester. Keep it wherever your course materials live, and export again whenever you change the rubric.

---

## 10. Privacy, storage, and what can go wrong

### What leaves your device

For the free features described in parts 3 to 10: nothing. No student name, ID, grade, or comment is transmitted anywhere, because there is no server to transmit it to. The application is a static page and your marking happens in the tab.

The one exception is the wording assistant in part 11, which sends text to an AI provider. Student names and IDs are stripped before anything is sent, and the assistant is off unless you have unlocked it.

### What is stored, and where

Saved scorers, your snippets, cohort records, and in-progress drafts are all held in your browser's local storage, on that device, in that browser profile. Student names and IDs are part of cohort records, so cohort data is real student data sitting in your browser.

That has consequences worth being deliberate about. A shared marking machine means a shared cohort record, which is why **Switch marker** exists and why there is an optional setting to clear the marker name between students. Browser storage is not encrypted, so a device holding cohort data should be one you would be comfortable holding a marked script pile on. And storage is finite: very large cohorts can fill it, in which case Feedback Kitchen will tell you rather than fail silently.

### The failure mode to plan for

Losing browser storage loses everything not exported. Browser cleanup tools, IT reimaging a managed device, "clear cookies and site data" while troubleshooting something unrelated, or simply marking in a private window all do it.

The defence is the export habit: the scorer JSON after any rubric change, the cohort workbook at the end of every marking session. Both take seconds. Neither can be reconstructed afterwards.

---

## 11. Supplement: supporter features

Almost all of Feedback Kitchen is free, permanently, with no trial period and no feature that stops working. Two features are reserved for people who support the project on [Ko-fi](https://ko-fi.com/smann).

By feature area, roughly nine in ten of the tool is free. More usefully: **the entire marking workflow is free**. Building a rubric, marking a cohort, assembling feedback, snippets, notes, cohort records, insights, Excel exports, moderation export, the Moodle round trip, and scorer sharing are all in the free tier. Nothing in parts 3 to 10 of this manual requires payment.

The two supporter features are time-savers and specialised conveniences. Neither adds a marking capability you would otherwise lack.

### The feedback wording assistant

An AI assistant that rephrases or polishes assembled feedback: shortening an over-long paragraph, softening a blunt one, or drafting an alternative wording for a criterion comment.

It works on the feedback text, never on the grades. It cannot change a score, a weighting, or a rubric descriptor, and the panel says so on screen. You see its suggestion and choose whether to use it; nothing is applied automatically.

Before any text is sent, a scrubber removes student names and IDs, handling macrons, diacritics, apostrophes, and hyphenated names. What reaches the provider is the feedback prose without the identity attached.

This is the feature to weigh against your institution's position on AI use in assessment. It is opt-in, it is off until you unlock it, and marking without it is the default experience rather than a degraded one.

### Importing a rubric from a PDF

Upload an existing rubric as a PDF and have it converted into a scorer, instead of typing the criteria and descriptors into the builder by hand.

This is a migration convenience. It saves an hour once, when you bring an existing paper rubric into the tool for the first time. The output is a normal scorer that you should read through and correct before using: the conversion is a first draft of your rubric, not an authority on it.

### How access works

Support the project on Ko-fi and you receive an unlock code. Enter it once and both features unlock on that browser.

The honesty system is the whole mechanism, deliberately. Feedback Kitchen holds no record of who has paid, because building one would mean accounts, a database, and a stored mapping of people to payments, the first thing that would make "your data never leaves your browser" untrue. Trusting supporters is cheaper than surveilling them. That reasoning is recorded in decision D17.

---

## 12. Troubleshooting

**My scorer has disappeared.** Browser storage was cleared, or you are in a different browser, profile, or machine from the one you built it on. Re-import your JSON backup through **Upload**. If there is no backup, it is gone; export from now on.

**The weights will not add up.** Criterion weights must total exactly 100%. The builder shows the running total; a rounding leftover like 33/33/33 needs one criterion at 34.

**A score field has turned amber.** An override sits outside the band for the grade you selected. It is advisory. Check whether you meant it, then carry on.

**A rubric drift warning appeared on my cohort.** Some records were marked against a different version of the rubric from the one now loaded, because the rubric was edited mid-cohort. Decide deliberately: re-mark the affected students against the current rubric, or accept the mix and note it for moderation. Do not ignore it in a pack going to moderation.

**Moodle rejected my uploaded worksheet.** Usually the filename changed, or the file exported was not the original one downloaded from that assignment. Download a fresh worksheet from Moodle, run the export against it, and upload without renaming.

**Moderation export is blocked.** Either the cohort has fewer than fifteen students, or moderation export has not been enabled for this paper by the coordinator.

**Feedback is not updating as I change grades.** The draft panel is editable, and heavy manual editing can leave it out of step with the grades. **Regenerate** rebuilds it from the current grades, discarding your edits to that draft.

**I am marking on a shared machine.** First save or export the current record, then click **↺ New student** to clear the unfinished student state and draft. Click **Switch marker** to clear the marker name. **Switch marker alone does not remove an in-progress draft.** At the end of the session, export as needed and clear the cohort so student records are not left in browser storage.

---

*Maintenance: [`docs/MANUAL-MAINTENANCE.md`](../MANUAL-MAINTENANCE.md) records which part of this manual each area of the application owns, and the review that runs when any of them changes.*
