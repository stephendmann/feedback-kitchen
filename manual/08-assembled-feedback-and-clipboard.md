# The assembled draft and the clipboard

The **Feedback** section holds the draft the tool writes for you. It rebuilds every time you change a grade, and it is ordinary editable text: nothing is locked, and nothing leaves the page until you copy it.

## What the draft is made of

Five blocks, always in this order.

The **opening paragraph** comes from the template for the student's overall grade. The **criterion breakdown** follows: for each criterion you have graded, its name, the weighted score, and the descriptor you wrote for the tier that grade fell into. Then the **total score line**, formatted to your score display setting. Then the **closing paragraph**, again from the template for the overall grade. If a late penalty applies, a **late submission notice** is appended last, giving the deduction and the final mark.

The intro and outro are chosen on the grade the work earned, before any late penalty. That is deliberate. A student who wrote an A essay and handed it in two days late should read commentary about their argument, not a paragraph pitched at the mark the deduction left them with. The penalty is stated plainly at the bottom, where it belongs, rather than colouring the academic feedback.

One thing worth knowing: if you raise the overall grade with **Grade override**, the draft says so. It adds a line telling the student their criterion scores totalled the original figure and that you rounded it up in recognition of their overall performance. That disclosure is not optional, so use the override knowing the student will see it.

## Editing the draft

Type into it. The draft is a plain textarea, and your edits survive regrading, so you can fix a sentence and carry on choosing grades without losing the fix.

Edits are also autosaved to this browser as you type, roughly a second behind you, which is what lets you close the tab mid-student and be offered the work back when you return.

If you have edited yourself into a mess, **↺ Regenerate** throws your changes away and rebuilds the draft from the current grades. There is no undo on that, so it is worth being sure.

## Snippets

A snippet is a phrase you keep because you write it every semester. Put the cursor where you want it, open **Insert snippet…**, and choose one by its label. It lands at the cursor without disturbing the text around it, adding a leading space if the character before it needs one.

Snippets belong to you rather than to the scorer, so two markers working from the same shared rubric keep their own libraries and their own voice. They are never included when you export a scorer to a colleague. Chapter 11 covers building and backing up the library.

## Copying, and what else happens

**Copy feedback** in the bar at the foot of the page, **Copy to clipboard** beside the draft, or `Ctrl + Shift + C` (`Cmd + Shift + C` on macOS) all do the same thing.

The text goes to the clipboard through the browser's clipboard API, falling back to a selection copy where permissions block it. Then, if the student has a name or an ID, the whole record is saved into the cohort for this scorer: criterion grades, overrides, the edited draft as you left it, and your marker's notes. A toast confirms both halves.

That second half is the part people miss. Copying feedback is what builds your class record, which is why the toast says whether the student was saved. If it reads `Feedback copied to clipboard · not saved to cohort — add a student name or ID`, the text is on your clipboard but nothing was recorded, and the student will be missing from the workbook you export at the end of the session.

Marker's notes are the exception to all of it. They go into the cohort record and into your Excel exports, and they never go onto the clipboard.

Paste into your LMS, then **↺ New student** and the next one. Chapter 21 covers the cohort record the copies have been quietly building.
