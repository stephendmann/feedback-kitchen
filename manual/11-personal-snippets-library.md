# Personal Snippets Library

While rubrics establish consistent grading criteria across a teaching team, individual tutors frequently need to insert specific guidance in their own voice. Feedback Kitchen provides a **Personal Snippets Library** to store reusable feedback phrases.

![Personal snippets manager](images/ch11-snippets-manager.png)

### Snippet architecture and storage

Personal snippets are stored in browser `localStorage` under the `SA_SNIPPETS` key as a list of text objects containing:

- **Label:** A short title identifying the topic (e.g. *APA7 Referencing*, *Thesis Clarity*, *Office Hours Invite*).
- **Text:** The multi-sentence commentary inserted into student feedback.
- **Category (Optional):** Grouping tag for organizing large snippet libraries.

### Privacy and team separation

Snippets belong to the individual marker, not to the assessment scorer:

- **Excluded from Scorer JSON:** When you export an assessment scorer (`.json`) to share with colleagues, personal snippets are never included.
- **Marker Independence:** Two tutors marking the same assessment from the same shared rubric maintain separate snippet libraries tailored to their personal teaching styles.

### Inserting snippets into drafts

To insert a saved snippet while marking:

1. Position the cursor inside the **Cooked Feedback** text box where the comment should appear.
2. Click the **💬 Insert snippet…** dropdown menu.
3. Select the desired snippet by its label.

The text inserts instantly at the cursor position without replacing existing rubric commentary.

### Managing snippet entries

Select **⚙ Manage snippets…** from the snippet dropdown menu to open the manager dialog.

| Action | Control | Function |
|---|---|---|
| **Add Snippet** | `+ New Snippet` | Create a new phrase with a label, category, and text body. |
| **Edit Snippet** | `Edit` button | Modify the label or body of an existing snippet. |
| **Delete Snippet** | `Delete` button | Remove a phrase from your local library. |
| **Search** | Filter input | Search snippets by label or body content in real time. |

### Backing up and migrating snippets

Because snippets reside in browser local storage, clearing browser site data will remove them.

- **Export CSV:** In the snippet manager dialog, click **Export to CSV** to download a structured spreadsheet backup (`snippets.csv`).
- **Import CSV:** Click **Import from CSV** on a new machine or browser to load your saved snippets without manual retyping.
