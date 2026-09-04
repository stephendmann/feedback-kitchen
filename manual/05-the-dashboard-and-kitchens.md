# The Dashboard and Kitchens

The home dashboard is the central hub for managing your assessment configurations. In Feedback Kitchen, each configured assessment is called a **Kitchen** (or **Scorer**). All kitchens are stored locally in your browser's `localStorage` under the `SA_CONFIGS` key.

### The Kitchens manager

When you open [marking.stephendmann.com](https://marking.stephendmann.com/), the dashboard scans local storage and renders your saved assessment cards under **Your Kitchens**.

Each kitchen card displays:

- **Assessment Name:** The descriptive assignment title (e.g. *Case Study Analysis*).
- **Course Code:** The institutional paper or module code (e.g. *MKTG201*).
- **Configuration Summary:** Total number of weighted criteria and the selected grade scale preset.
- **Last Modified Timestamp:** Date and time of the most recent configuration edit.

### Card actions

Every kitchen card provides direct operational controls:

| Action | Target Destination | Purpose |
|---|---|---|
| **Open Scorer** | `scorer.html?id=<id>` | Launches the live marking workspace for evaluating student submissions. |
| **Edit** | `builder.html?edit=<id>` | Opens the six-step wizard to update criteria, weights, rubric descriptors, or grade templates. |
| **Export JSON** | Direct browser download | Downloads a standalone `.json` configuration file containing the complete rubric and scoring schema. |
| **Delete** | Modal confirmation | Permanently removes the scorer configuration from local storage. |

### First-run orientation and demo loading

If you open Feedback Kitchen in a fresh browser with no saved scorers, the dashboard displays a first-run orientation banner.

Click **Or try the demo scorer →** to load a pre-configured short written response assessment (`DEMO101`). The demo includes:

- Four weighted criteria (Argument, Evidence & Literature, Structure & Flow, Presentation & Referencing)
- Standard NZ University grade scale mapping
- Pre-populated tier-level rubric descriptors and feedback templates

Using the demo lets you test criterion selection, override mechanics, and Excel exports without entering assessment data from scratch.

### Quick actions and navigation

The dashboard header and action strips provide access to auxiliary tools:

- **+ Build a scorer:** Launches `builder.html` to configure a new assessment from scratch.
- **⬆ Upload:** Navigates to `upload.html` to import a `.json` scorer file received from a colleague or restored from backup.
- **Convert Rubric:** Navigates to `convert.html` to convert unstructured PDF or text rubrics into structured scorers.
- **How-to Guide:** Opens `how-to-feedback-kitchen.html` for an audio-narrated walkthrough of core marking workflows.
