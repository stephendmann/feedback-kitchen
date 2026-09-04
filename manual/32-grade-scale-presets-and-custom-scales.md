# Grade Scale Presets and Custom Scales

Feedback Kitchen adapts to any institutional grading policy through built-in regional presets and a fully customisable grade scale engine configured in Step 2 of the **Builder Wizard** (`builder.html`).

![Grade scale configuration](images/ch32-grade-scales.png)

### Built-in regional presets

| Preset | Region / Policy | Grade Levels | Score Bands & Midpoints |
|---|---|---|---|
| **NZ University** *(Default)* | New Zealand (Waikato, Auckland, Otago) | `A+`, `A`, `A-`, `B+`, `B`, `B-`, `C+`, `C`, `C-`, `D` | `A+` (90–100, mid 95), `A` (85–89, mid 87), `A-` (80–84, mid 82), `B+` (75–79, mid 77), `B` (70–74, mid 72), `B-` (65–69, mid 67), `C+` (60–64, mid 62), `C` (55–59, mid 57), `C-` (50–54, mid 52), `D` (0–49, mid 44). |
| **Australian Honours** | Australia | `HD`, `D`, `C`, `P`, `F` | `HD` (85–100, mid 92.5), `D` (75–84, mid 79.5), `C` (65–74, mid 69.5), `P` (50–64, mid 57), `F` (0–49, mid 24.5). |
| **UK Degree** | United Kingdom | `1st`, `2:1`, `2:2`, `3rd`, `F` | `1st` (70–100, mid 85), `2:1` (60–69, mid 64.5), `2:2` (50–59, mid 54.5), `3rd` (40–49, mid 44.5), `F` (0–39, mid 19.5). |
| **US Simple** | North America | `A`, `B`, `C`, `D`, `F` | `A` (90–100, mid 95), `B` (80–89, mid 84.5), `C` (70–79, mid 74.5), `D` (60–69, mid 64.5), `F` (0–59, mid 29.5). |

### Mapping grades to rubric performance tiers

Each letter grade maps to one of four or five rubric tiers:

- **Excellent:** Distinction or top-tier band (e.g. `A+`, `A`, `A-`, `HD`, `1st`).
- **Proficient:** Secure, competent achievement (e.g. `B+`, `B`, `B-`, `D`, `2:1`).
- **Developing:** Borderline or partially met criteria (e.g. `C+`, `C`, `C-`, `C`, `2:2`).
- **Satisfactory / Unsatisfactory:** Minimum pass or fail bands (e.g. `D`, `F`, `3rd`).

When a marker selects a grade during assessment, this mapping determines which rubric descriptor is injected into the student's assembled feedback draft.

### Defining custom grade scales

To configure a non-standard institutional scale (such as a 7-point scale, percentage-only bands, or competency scales):

1. In Step 2 of the builder, select **Custom Scale**.
2. Define custom letter labels (e.g. *Distinction*, *Merit*, *Pass*, *Resubmit*).
3. Set lower (`bandLow`) and upper (`bandHigh`) numeric thresholds for each level.
4. Specify the default **Midpoint Score** populated upon selection.
5. Map each custom grade to its corresponding rubric tier.
6. Customise the display labels for each tier under `tierLabels`.

### Midpoint scoring mechanics

When you select a grade from a dropdown during marking, Feedback Kitchen automatically fills the criterion's numeric score with the configured midpoint.

To award a specific mark within that band (for example, awarding 88 on an A grade with a midpoint of 87), type the exact number into the **Override** input.
