# Draft INS-10 · Moodle offline grading worksheet (format & round-trip)

Goal: understand the **real worksheet format and round‑trip rules** for your Moodle instance, so FK‑19 (Moodle round‑trip) and FK‑07’s queue UI can be designed against facts, not guesses. [lead.mic.ul](https://lead.mic.ul.ie/moodle/download-the-grading-worksheet)

Artefact in "C:\Users\GGPC\feedback-kitchen\.claude\worktrees\frosty-babbage-f2755d\planning\Example Moodle Worksheet\Grades-MRKTG101-26A (TGA)-Marketing Proposal Report - 32%--2217743.csv"   

Scope: **inspection only** — read the file, cross‑check against docs, no FK code changes.

***

### INS-10 · Moodle offline grading worksheet (format & round-trip)

- **Rationale:** Before FK‑19 (“Moodle offline‑grading‑worksheet round‑trip”) and any queue UI that’s Moodle‑aware, we need to know what the **real worksheet file looks like** in your instance: columns, keys, grade scale, feedback column semantics, and upload/rejection rules. Moodle help sites are clear that the worksheet is a CSV with specific columns (student identifiers, a `Grade` column, a `Feedback comments` column) and that column headings/structure must not be changed for upload to work. This is exactly the kind of unknown the board treats as INS work, not guesswork. [lead.mic.ul](https://lead.mic.ul.ie/moodle/download-the-grading-worksheet)

- **Scope:** Inspection only — read the file, compare against online guides, and record answers. No FK code changes.

***

#### Q1 — Column schema and “do not touch” rules

1.1. What columns does your worksheet actually contain, and in what order?  
- Identify which columns are **student identifiers** (e.g. name, ID/username, “Identifier”) and which are **grade/feedback** fields (e.g. `Grade`, `Feedback comments`). [ucldata.atlassian](https://ucldata.atlassian.net/wiki/spaces/MoodleResourceCentre/pages/1100283910)
- Note any technical columns (status, last modified, hidden IDs).

1.2. Which columns are documented as **must not be moved, renamed, or deleted** for upload to succeed?  
- Many guides say “leave other data untouched” and warn that adding or changing columns/headers can cause upload failure. [support.lanecc](https://support.lanecc.edu/moodle-faculty-gradebook/how-to-import-grades)

**Output:** A schema table: column name, role (ID/grade/feedback/other), editable? (yes/no), notes on any warnings.

***

#### Q2 — Identifier → `studentMatchKey` mapping

2.1. Which column(s) clearly function as the **key** Moodle uses when matching rows on upload (e.g. “Identifier”, username, email, participant number)? [digi-ed](https://digi-ed.uk/support/article/how-to-upload-exam-grades-using-moodle-assignment/)

2.2. How cleanly can that map to FK’s cohort keys (`sid:<studentId>`, with `name:<name>` fallback)?  
- Does the worksheet contain the same ID you’d want to store as `sid:` (e.g. student ID / username), or will you need a mapping/derivation step?  
- Note any ambiguous or many‑to‑one cases (e.g. anonymised IDs, name‑only rows).

**Output:** A proposed mapping rule from worksheet identifier column(s) → FK `studentMatchKey`, including known edge cases.

***

#### Q3 — Grade scale and rounding

3.1. How does the worksheet represent **grades** for this assignment — numeric (0–max), letter grades (via a scale), or both?  
- Guides show numeric `Grade` columns and, in some setups, letter‑grade scales where values must match exactly (case‑sensitive). [lead.mic.ul](https://lead.mic.ul.ie/moodle/how-to-upload-letter-grades-using-offline-grading)

3.2. What constraints does Moodle enforce on uploaded grades?  
- E.g. must values be between 0 and the assignment’s max; must letter grades match the defined Scale exactly; what do docs say happens if a value is out of range? [teachinghub.bath.ac](https://teachinghub.bath.ac.uk/guide/mark-moodle-assignments-offline/)

3.3. Given FK’s `/100 + letter` model, what is the obvious mapping into the worksheet’s grade column for a typical /100 assignment on your instance?  
- Note any rounding or conversion questions (e.g. S‑6 rounding, how to handle non‑100 max grades).

**Output:** A description of the grade column(s) and a first‑pass mapping from FK’s grade model → Moodle worksheet grades, with open questions listed.

***

#### Q4 — Feedback text format and privacy constraint

4.1. Confirm the column that Moodle uses to update **feedback comments** on upload (typically `Feedback comments`). [city-uk-ett.libguides](https://city-uk-ett.libguides.com/staff/moodle/assignment-feedback/excel)

4.2. What format does Moodle accept/round‑trip in that column — plain text only, or are HTML tags and line breaks preserved?  
- Note any guidance on formatting, HTML, or length limits from your institution’s docs.

4.3. Based on this, confirm the FK‑19 privacy/product constraint:  
- Exported worksheet feedback must include **`feedbackText` only**, never `markerNotes` or moderation data, and must be formatted in a way Moodle safely round‑trips.

**Output:** A short note on feedback column behaviour and a DoD line for FK‑19 about what FK will and will not populate there.

***

#### Q5 — Upload/rejection semantics and environment quirks

5.1. What upload requirements does your instance document — file type, encoding, delimiter, and options?  
- Most guides emphasise **CSV**, preserving filename/filetype, and not adding columns; some mention UTF‑8 and leaving default upload settings unchanged. [hml.yorksj.ac](https://hml.yorksj.ac.uk/assoc_files/49348585.pdf)

5.2. How does Moodle behave when the worksheet is malformed or partially incorrect — reject entire file, skip bad rows, or partially import?  
- Use your docs and (if safe) a controlled test with fake data to understand error messages and how strict the import is. [moodle](https://moodle.org/mod/forum/discuss.php?d=222762)

5.3. Are there any **local customisations** called out in your institution’s guides (extra columns, different column names, special workflows with other systems like UNIT‑e / S4, etc.)? [ucldata.atlassian](https://ucldata.atlassian.net/wiki/spaces/MoodleResourceCentre/pages/31864407/2.+Moodle+Assignment)

**Output:** A short summary of upload requirements, common failure modes, and any site‑specific quirks that FK‑19 must respect.

***

- **Dependencies:** One real worksheet file from your Moodle + version info.  
- **Risk:** Low (inspection only); high leverage for FK‑19 and for designing FK‑07’s queue rows in a Moodle‑aware way.