# The Builder Wizard

The **Builder Wizard** (`builder.html`) is the authoring environment for creating and editing assessment scorers. A scorer defines the complete evaluation framework: grading scales, criteria weights, rubric descriptors, and feedback templates.

![Scorer builder wizard](images/ch14-builder-wizard.png)

### The six configuration steps

The wizard guides you through six sequential steps:

```
[1. Details] ── [2. Scale] ── [3. Criteria] ── [4. Rubric] ── [5. Templates] ── [6. Settings & Save]
```

You can navigate back and forth between completed steps at any time without losing entered data.

### Step 1: Assessment details

Capture core institutional metadata:

- **Assessment Name:** The descriptive assignment title (e.g. *Research Essay 1*).
- **Course / Paper Code:** The departmental course code (e.g. *PHIL102*).
- **Institution:** University, polytechnic, or school name.
- **Default Marker Name:** The name populated by default when opening the scorer.

### Step 2: Grade scale

Select an institutional grading preset or define a custom scale:

- **Presets:** NZ University (10 bands: `A+` to `D`), Australian Honours (`HD` to `F`), UK Degree (`1st` to `Fail`), or US Simple (`A` to `F`).
- **Midpoint Mapping:** Each grade letter maps to a numeric midpoint (e.g. `A` = 87) used when selecting grades during marking.
- **Tier Mapping:** Maps each grade to one of four rubric tiers: Excellent, Proficient, Developing, or Unsatisfactory.

### Step 3: Criteria and weights

Define the dimensions of student assessment:

- Click **+ Add Criterion** to create a new dimension (four to six criteria recommended).
- Assign an integer percentage weight to each criterion.
- **Weight Verification:** The total percentage must equal exactly 100% (`✓ 100%`). The wizard blocks advancement to Step 4 if weights do not balance.

### Step 4: Rubric descriptors

For each criterion, write performance descriptors across each tier:

- **Excellent:** What distinguishes top-tier execution and conceptual mastery.
- **Proficient:** Clear demonstration of required standards and analytical competence.
- **Developing:** Partial achievement naming specific gaps or missing elements.
- **Unsatisfactory:** Fundamental requirements not met.

Descriptors must be written in the second person (*"Your analysis..."*) and be self-contained, as students see only the single descriptor matching their awarded tier.

### Step 5: Grade feedback templates

Configure opening (intro) and closing (outro) paragraphs for every individual grade level.

- Unlike rubric descriptors (which are written per tier), feedback templates are written per individual letter grade (e.g. `A+`, `A`, `A-`).
- Pre-populated default templates are provided; edit them to match your pedagogical voice.

### Step 6: Settings, backup, and launch

Finalise configuration and export backups:

- **Late Submission Penalties:** Customise deduction percentages per day late or accept default university bands.
- **Moodle Integration Toggle:** Enable or disable Moodle worksheet import/export controls.
- **Backup and Share:** Click **Export JSON** to save a permanent `.json` backup file.
- **Save and Launch:** Saves the configuration to browser local storage (`SA_CONFIGS`) and opens the live marking workspace (`scorer.html`).
