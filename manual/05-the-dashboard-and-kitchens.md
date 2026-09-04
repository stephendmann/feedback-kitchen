# The Dashboard and Kitchens

The home dashboard is the central hub for managing your assessment configurations. In Feedback Kitchen, each configured assessment is called a **Kitchen** (or **Scorer**). All kitchens are stored locally in your browser's `localStorage` under the `SA_CONFIGS` key.

### The Kitchens manager

When you open [marking.stephendmann.com](https://marking.stephendmann.com/), the dashboard scans local storage and renders your saved assessment cards under **Your Kitchens**.

Each kitchen card displays:

- **Scorer Name:** The name you gave the rubric (e.g. *MRKTG101 5Cs Analysis Scorer*).
- **Course and Institution:** The course code and year, followed by the institution name where one is set (e.g. *MKTG201 2026 · University of Waikato*).
- **Configuration Summary:** The number of criteria and the assessment title.
- **Active Badge:** A green *Active* chip on the scorer you last opened.

### Card actions

Every kitchen card provides direct operational controls:

| Action | Target Destination | Purpose |
|---|---|---|
| **Use Scorer** | `scorer.html?id=<id>` | Launches the live marking workspace for evaluating student submissions. |
| **Edit** | `builder.html?id=<id>` | Opens the six-step wizard to update criteria, weights, rubric descriptors, or grade templates. |
| **×** | Modal confirmation | Permanently removes the scorer configuration from local storage. |

There is no export control on the card. To back a scorer up, open it with **Edit** and use **Export (Save / Share)** on Step 6.

### First-run orientation and demo loading

If you open Feedback Kitchen in a fresh browser with no saved scorers, the dashboard displays a first-run orientation banner.

Click **Or try the demo scorer →** to load *Demo Scorer — Written Response*, a pre-configured short written response assessment on course `DEMO101 / 2026`. The demo includes:

- Five weighted criteria: Understanding of the topic (25%), Use of evidence or examples (20%), Organisation and structure (20%), Critical thinking or insight (20%), and Writing style and mechanics (15%)
- A custom five-band scale (`A`, `B`, `C`, `D`, `F`) rather than one of the regional presets, with the tiers relabelled Excellent, Very good, Good, Satisfactory, and Needs Work
- Pre-populated tier-level rubric descriptors and feedback templates

Using the demo lets you test criterion selection, override mechanics, and Excel exports without entering assessment data from scratch.

### Quick actions and navigation

The dashboard header and action strips provide access to auxiliary tools:

- **+ Build a scorer:** Launches `builder.html` to configure a new assessment from scratch.
- **⬆ Upload:** Navigates to `upload.html` to import a `.json` scorer file received from a colleague or restored from backup.
- **Convert Rubric:** Navigates to `convert.html` to convert unstructured PDF or text rubrics into structured scorers.
- **How-to Guide:** Opens `how-to-feedback-kitchen.html` for an audio-narrated walkthrough of core marking workflows.
