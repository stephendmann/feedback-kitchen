# Backups and Data Preservation

Because Feedback Kitchen stores data locally in your browser's `localStorage` partition rather than on a remote database, adopting a deliberate backup routine ensures your work is preserved across device resets and browser maintenance.

![Backup and preservation routine](images/ch44-backup-strategy.png)

### The three-tier backup strategy

To prevent accidental data loss, maintain backups across three distinct asset types:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       THREE-TIER BACKUP ROUTINE                         │
│                                                                         │
│  1. Assessment Rubrics  ──►  Export .json      ──►  Course Cloud Drive  │
│  2. Class Mark Records  ──►  Export .xlsx      ──►  Department Archive  │
│  3. Personal Snippets   ──►  Export .csv       ──►  Personal Storage    │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1. Assessment scorer backups (`.json`)

Whenever you build a new rubric or edit an existing assessment:

- Advance to Step 6 of the **Builder Wizard** (`builder.html`) and click **Export JSON**.
- Save `<AssessmentName>.json` into your course materials folder on your institutional cloud drive (OneDrive, Google Drive, or network share).
- The JSON file contains the complete rubric schema, criteria weights, grade bands, and feedback templates.

### 2. Cohort mark archives (`.xlsx`)

At the conclusion of every marking block:

- Scroll to the **Cohort** section in the marking workspace and click **Export cohort (Excel)**.
- This produces a comprehensive five-sheet spreadsheet containing all individual feedback transcripts, criteria mark matrices, and summary statistics.
- Store this workbook in your formal departmental grade repository. This workbook is your permanent audit record if browser storage is cleared.

### 3. Personal snippets library (`.csv`)

Once you have built a library of personal feedback phrases:

- Open the **Manage snippets…** dialog from the feedback editor dropdown.
- Click **Export to CSV** to download `snippets.csv`.
- If you migrate to a new computer or switch browsers, click **Import from CSV** to restore your saved phrases instantly.

### Disaster recovery procedure

If a computer reset or browser cleanup empties your dashboard:

1. Open Feedback Kitchen at [marking.stephendmann.com](https://marking.stephendmann.com/).
2. Click **Upload** on the home dashboard and select your backed-up `.json` scorer file.
3. Open the scorer, navigate to the Snippet Manager, and import your `snippets.csv`.
4. Your complete marking workspace is restored in seconds.
