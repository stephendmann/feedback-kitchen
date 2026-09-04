# Getting started

Open [marking.stephendmann.com](https://marking.stephendmann.com/) in any current browser and you are ready to mark. There is no account to create, nothing to install, and no administrator to ask. Building the scorer for a new assessment takes 10 to 20 minutes. After that, each student takes as long as your judgement takes.

The home page lists the scorers you have already built under **Your Kitchens**, with **+ Build a scorer** and **⬆ Upload** beside them. If the list is empty, **Or try the demo scorer →** loads a worked example you can take apart without setting anything up.

## The loop

Three moves, and the first one happens once per assessment rather than once per student.

You **build a scorer**: the criteria, their weights, the grade scale, and the sentence a student sees at each tier of each criterion. You **mark** each student by choosing a grade per criterion, while the draft feedback assembles itself from your descriptors. You **export** the record when the pile is done.

Most of the work sits in the first move, and it is worth doing carefully, because every student after it inherits the care.

## Building your first scorer

Click **Build a scorer**. The wizard has six steps, and the stepper across the top names them.

**Details** takes the scorer name, the assessment title, your course code and year, and your institution. It also sets **Score display**, which decides whether marks read as 73.3, 73.5 or 73 throughout. Full precision is the default, and you can change it live while marking, so it is not a decision to agonise over now.

**Scale** offers NZ University, Australian Honours, UK Degree and US Simple, or a custom scale of your own labels and bands. Settle this before you reach step 5: changing the scale afterwards resets the feedback templates keyed to it, and the wizard warns you about that on the step itself.

**Criteria** is where you name what you are assessing and weight each one. The weights must total exactly 100%, and the wizard will not let you past this step until they do. Four to six criteria is a comfortable range.

**Rubric** is the step that earns its time. For each criterion you write the sentence a student sees at each tier, and students see only the one sentence that matched their grade, never the set side by side. Write in second person, and make each descriptor stand on its own. "Below the required standard" tells a student nothing their grade did not already tell them.

**Feedback** holds the opening and closing paragraph for each individual grade. Defaults are supplied and are usable as they stand, so you can leave them alone on a first pass and come back once you have seen how they read against real work.

**Settings** carries the late penalty bands and the Moodle declaration, and it is where you back the scorer up. Use **Export (Save / Share)** to save a `.json` file somewhere durable before you mark anyone. That file is the only backup: scorers live in this browser, and clearing site data deletes them. It is also how you hand the rubric to a co-marker.

Then **Save & Start Scoring** opens the scorer.

## Marking your first student

The marking page runs top to bottom, and the rail under the header jumps between sections.

Enter the student's name and ID in **Student**. The date fills itself, and your name in **Marker** persists between students, so you type it once a session. The **Marking as** readout in the top bar shows whose name is going on the record.

In **Rubric**, choose a grade for each criterion. The midpoint for that grade drops into the score automatically, and the weighted total updates as you go. To award something other than the midpoint, type the mark into **Override**. If the number you type falls outside the band for the grade you chose, the field turns amber. That is advisory, not a block: the score is accepted and counted, on the assumption that a typo is more likely than a deliberate mismatch.

**Penalty & grade override** holds the late penalty bands and, separately, an override for the overall grade. An overall override only ever raises a mark to the bottom of the band you choose; it will not lower one.

**Feedback** shows the assembled draft, updating as you grade. Edit it freely. Use **Insert snippet…** to drop in a phrase from your own library, and **↺ Regenerate** if you have edited yourself into a corner and want the draft rebuilt from the current grades.

**Notes** is a private scratchpad. It never reaches the student and never reaches Moodle, but it does travel into your Excel records, which is what makes it the right place for the reasoning behind a borderline call.

Then **Copy feedback** puts the finished text on the clipboard for pasting into your LMS, and **↺ New student** clears the form for the next one while keeping your marker name.

## The cohort builds itself

Copying feedback or using **✓ Finalise & Export** also saves that student into the **Cohort** section at the foot of the page. You do not have to maintain it, and the first save asks you to name the cohort and say whether more than one person is marking it.

At the end of a marking block, **Export cohort (Excel)** downloads the whole class as one workbook named `<Course>_<CohortLabel>_Cohort.xlsx`. It holds the feedback text for every student, a grade matrix, a summary, and the rubric and templates for reference, which is what a moderator asks for.

## The thing to do today

Everything lives in this browser. Clearing site data, or working in a private window that you then close, takes the scorers and any unexported cohort with it.

So export the scorer as `.json` the moment you finish building it, and export the cohort workbook at the end of every session rather than at the end of the marking. Neither takes ten seconds, and both are the difference between a bad afternoon and a lost one.

Chapter 3 is worth reading next if you are arriving from an Excel marking workbook or an LMS rubric grid, since the habits transfer unevenly.
