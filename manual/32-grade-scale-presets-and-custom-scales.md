# Grade Scale Presets and Custom Scales

Feedback Kitchen adapts to any institutional grading policy through built-in regional presets and a fully customisable grade scale engine configured in Step 2 of the **Builder Wizard** (`builder.html`).

### Built-in regional presets

| Preset | Region / Policy | Grade Levels | Score Bands & Midpoints |
|---|---|---|---|
| **NZ University** *(Default)* | New Zealand | `A+`, `A`, `A-`, `B+`, `B`, `B-`, `C+`, `C`, `C-`, `D` | `A+` (90–100, mid 95), `A` (85–89, mid 87), `A-` (80–84, mid 82), `B+` (75–79, mid 77), `B` (70–74, mid 72), `B-` (65–69, mid 67), `C+` (60–64, mid 62), `C` (55–59, mid 57), `C-` (50–54, mid 52), `D` (40–49, mid 44). |
| **Australian Honours** | Australia | `HD`, `D`, `C`, `P`, `F` | `HD` (85–100, mid 92), `D` (75–84, mid 77), `C` (65–74, mid 67), `P` (50–64, mid 55), `F` (0–49, mid 25). |
| **UK Degree** | United Kingdom | `1st`, `2:1`, `2:2`, `3rd`, `F` | `1st` (70–100, mid 80), `2:1` (60–69, mid 65), `2:2` (50–59, mid 55), `3rd` (40–49, mid 45), `F` (0–39, mid 20). |
| **US Simple** | North America | `A`, `B`, `C`, `D`, `F` | `A` (90–100, mid 95), `B` (80–89, mid 85), `C` (70–79, mid 75), `D` (60–69, mid 65), `F` (0–59, mid 30). |

The NZ `D` band starts at 40, not 0. A weighted score below 40 still resolves to `D`, because `D` is the lowest grade in the scale, but the band itself is defined as 40 to 49.

### Mapping grades to rubric performance tiers

Feedback Kitchen has five rubric tiers. Which of them a preset uses varies:

- **Excellent:** top band (`A+`, `A`, `A-`; `HD`; `1st`; US `A`).
- **Proficient:** secure, competent achievement (`B+`, `B`, `B-`; AU `D`; `2:1`; US `B`).
- **Developing:** partially met criteria (`C+`, `C`, `C-`; AU `C` and `P`; `2:2` and `3rd`; US `C` and `D`).
- **Satisfactory:** available to every preset except NZ, and to custom scales.
- **Unsatisfactory:** fail band (`D`; `F`).

The NZ preset maps its grades across four tiers and leaves satisfactory unused. The Australian, UK, US and custom scales offer all five. A scorer built before the satisfactory tier existed is upgraded when it is next loaded, so its descriptor starts empty and needs writing.

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
