# Personal Snippets Library

While rubrics establish consistent grading criteria across a teaching team, individual tutors frequently need to insert specific guidance in their own voice. Feedback Kitchen provides a **Personal Snippets Library** to store reusable feedback phrases.

### Snippet architecture and storage

Personal snippets are stored in browser `localStorage` under the `SA_SNIPPETS` key. Each snippet holds three fields:

- **id:** A generated identifier used internally.
- **label:** A short title identifying the topic (e.g. *APA7 Referencing*, *Thesis Clarity*, *Office Hours Invite*).
- **text:** The commentary inserted into student feedback.

There is no category or tagging field. A long library is managed by writing labels that sort and scan well.

### Privacy and team separation

Snippets belong to the individual marker, not to the assessment scorer:

- **Excluded from Scorer JSON:** When you export an assessment scorer (`.json`) to share with colleagues, personal snippets are never included.
- **Marker Independence:** Two tutors marking the same assessment from the same shared rubric maintain separate snippet libraries tailored to their personal teaching styles.

### Inserting snippets into drafts

To insert a saved snippet while marking:

1. Position the cursor inside the **Cooked Feedback** text box where the comment should appear.
2. Open the **Insert snippet…** dropdown.
3. Select the desired snippet by its label.

The text inserts instantly at the cursor position without replacing existing rubric commentary.

### Managing snippet entries

Select **⚙️ Manage snippets...**, the last entry in the snippet dropdown, to open the **Manage Snippets** dialog.

| Action | Control | Function |
|---|---|---|
| **Add** | **Add Snippet** | Fill in the label and text fields under *Add New Snippet*, then add it to the library. |
| **Delete** | **×** on the snippet | Remove a phrase, after a confirmation prompt. |
| **Import** | **Import CSV** | Load snippets from a `label,text` CSV file. |
| **Export** | **Export CSV** | Download the library as a CSV file. |

The dialog has no edit action and no search box. To reword a snippet, delete it and add it again, or edit the exported CSV and import it back.

### Backing up and migrating snippets

Because snippets reside in browser local storage, clearing browser site data will remove them.

- **Export CSV:** In the snippet manager dialog, click **Export CSV**. The file is named `feedback-kitchen-snippets-YYYY-MM-DD.csv` and has two columns, `label` and `text`.
- **Import CSV:** Click **Import CSV** on a new machine or browser to load your saved snippets without manual retyping.
