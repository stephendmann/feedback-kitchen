# Importing a Moodle class list

If your students come from Moodle, do this before you mark anyone. Feedback Kitchen reads Moodle's own offline grading worksheet, so you never retype a name or an ID, and there is no plugin to install and no API token to request. It is a CSV file exchange in both directions.

## Getting the file out of Moodle

Open the assignment in Moodle and choose **Download grading worksheet** from the grading menu. Save the `.csv` somewhere you will find it again, and leave it alone. You will need this same file at the end to send grades back, and Feedback Kitchen fills in the copy you downloaded rather than building a new one.

## Starting the import

In the scorer, either use the prompt in **Student**, or **Import Moodle worksheet…** in the **Cohort** section. Both open the same dialog. Choose the file and Feedback Kitchen checks it before showing you anything.

The check is strict. Moodle's worksheet has fourteen columns in a fixed order:

```text
Identifier, Full name, ID number, Email address, Status, Group, Marker,
Grade, Maximum grade, Marking workflow state, Grade can be changed,
Last modified (submission), Last modified (grade), Feedback comments
```

Rename one, reorder them, or add a column of your own, and the import stops with `E_HEADER_MISMATCH` naming the column that broke it. This is deliberate rather than fussy: Moodle will reject the file on the way back for the same reason, and it is better to find out now than after an afternoon of marking. The usual cause is opening the CSV in Excel and saving it again.

## Reading the preview

Nothing is imported until you say so. The preview lists every row with a badge saying what will happen to it.

| Badge | What it means | What happens |
|---|---|---|
| `Import` | The row has an ID number | Queued for marking, keyed on that ID |
| `Verify` | A name, but no ID number | Held back until you resolve it |
| `Skip` | No ID and no name, or an ID already in use | Left out |
| `Non-markable` | No submission | Shown so the roster is complete, but not queued |

`Verify` is the one that stops you, and it is worth understanding why. A row with no ID number can only be matched on the student's name, and names are not unique. Attaching one student's grades to another student's record is the worst thing this tool could do, so it refuses to guess. Use **Assign ID** on the row to supply the identifier from your own records, or **Ignore** to leave that student out of the import. The commit button stays disabled while any `Verify` row is unresolved.

Students you have already marked do not appear as `Verify`. They are skipped as duplicates, and their existing grades and feedback are left untouched, so re-importing a worksheet part-way through a cohort is safe.

If the list is long, tick **Show only rows needing attention** to hide everything already sorted.

## Committing

The button reads **Import N students**, counting only the `Import` rows, so the number tells you what you are actually about to add.

The roster lands in the Cohort section, and the first imported student opens ready to mark. If you were part-way through marking someone when you imported, that draft is left alone and nothing is opened over the top of it.

When the cohort is marked, chapter 17 covers sending the grades and feedback back to Moodle, using the same file you downloaded here.
