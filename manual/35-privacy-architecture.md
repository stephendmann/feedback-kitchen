# Privacy Architecture

Feedback Kitchen is built on a **zero-cloud architecture**. Student assessment data, marks, feedback transcripts, and marker notes remain strictly on your local computer.

### The client-side storage boundary

Feedback Kitchen executes entirely inside your browser tab:

- **No account holding your marking:** There is no registration and no cloud profile. Supporters do enter a Ko-fi username and password to unlock the wording assistant and the PDF converter, which is a key to a paid feature rather than an account holding student data; chapter 45 covers how those are stored.
- **No Central Database:** Student submissions and marks are never stored in a central cloud database.
- **Local Persistence:** Assessment scorers, personal snippets, and cohort records reside in your browser's `localStorage` partition for this origin, which is the persistent store. Supporter credentials are additionally copied into `sessionStorage` so the upload page can hand them to the convert page in the same tab; that copy is scoped to the tab and goes when it closes.

### How the architecture bears on institutional privacy obligations

Whether a given deployment satisfies FERPA, the GDPR, the NZ Privacy Act or your own institution's policy is a determination for your privacy officer, not something software can assert. What can be stated is the behaviour those determinations usually turn on:

| Consideration | What Feedback Kitchen does |
|---|---|
| **Data sovereignty** | Student records are not transmitted to Feedback Kitchen servers and do not cross a border, because they are never sent anywhere. The exception is the optional wording assistant, covered in the next section. |
| **Data minimisation** | Only what you type for grading is held, in browser memory and local storage. |
| **Audit trails** | Complete assessment records export to Excel and to the Moodle worksheet format. |
| **Data purging** | Local cohort data can be wiped from the browser at the conclusion of marking. |

### Analytics and telemetry boundaries

Feedback Kitchen collects anonymous pageview and performance metrics to monitor site availability:

- **Aggregated Counts Only:** Telemetry tracks anonymised events (e.g. number of times feedback is copied).
- **No student data in what the application sends:** Student names, student ID numbers, grades, criteria feedback and marker notes appear in no analytics event the application builds. What those events carry is counts, flags, a model identifier and a prompt length. Standard pageview collection is the analytics provider's own, and behaves as that provider is configured to behave.
- **The local usage counter stays local:** the per-feature counts under `scorer.usage.v1` are written to this browser and never sent.
- **Developer Flag:** Visiting with `?fk-internal=1` flags local development browsers to exclude test sessions from analytics.

### Managing shared-machine risks

On shared office or university lab computers, student records stored in browser storage could be inspected by subsequent users if not cleared.

Feedback Kitchen provides three safeguards:
1. **Switch Marker:** Clears the active marker name, and drops the stored draft only when there is no unsaved work. Use **↺ New student** first if a part-marked student is on screen.
2. **Post-Export Wipe:** Prompts you to clear local cohort storage immediately after downloading class Excel workbooks.
3. **Private Browsing:** Marking in incognito mode automatically destroys all stored data when the browser window closes.
