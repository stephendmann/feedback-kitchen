# Privacy Architecture

Feedback Kitchen is built on a **zero-cloud architecture**. Student assessment data, marks, feedback transcripts, and marker notes remain strictly on your local computer.

![Zero-cloud privacy architecture](images/ch35-privacy-architecture.png)

### The client-side storage boundary

Feedback Kitchen executes entirely inside your browser tab:

- **No User Accounts:** There is no registration, password login, or cloud user profile.
- **No Central Database:** Student submissions and marks are never stored in a central cloud database.
- **Local Persistence:** Assessment scorers, personal snippets, and cohort records reside exclusively in your browser's private `localStorage` partition.

### Institutional privacy compliance (FERPA, GDPR, NZ Privacy Act)

University grading policies and international student data regulations require strict control over student identifiable information:

| Regulatory Requirement | Feedback Kitchen Compliance Mechanism |
|---|---|
| **Data Sovereignty** | No student records cross national borders or third-party cloud servers. |
| **Data Minimisation** | Only assessment metadata required for grading is processed in browser memory. |
| **Audit Trails** | Complete assessment records export to secure institutional formats (Excel/Moodle CSV). |
| **Data Purging** | Local cohort data can be wiped immediately at the conclusion of marking. |

### Analytics and telemetry boundaries

Feedback Kitchen collects anonymous pageview and performance metrics to monitor site availability:

- **Aggregated Counts Only:** Telemetry tracks anonymised events (e.g. number of times feedback is copied).
- **Zero PII Exposure:** Student names, student ID numbers, grades, criteria feedback, and marker notes are strictly excluded from all telemetry payloads.
- **Developer Flag:** Visiting with `?fk-internal=1` flags local development browsers to exclude test sessions from analytics.

### Managing shared-machine risks

On shared office or university lab computers, student records stored in browser storage could be inspected by subsequent users if not cleared.

Feedback Kitchen provides three safeguards:
1. **Switch Marker:** Clears the active marker name and drops uncommitted session drafts.
2. **Post-Export Wipe:** Prompts you to clear local cohort storage immediately after downloading class Excel workbooks.
3. **Private Browsing:** Marking in incognito mode automatically destroys all stored data when the browser window closes.
