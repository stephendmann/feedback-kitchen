# PDF Rubric Converter

The **PDF Rubric Converter** (`convert.html`) converts legacy assessment briefs, syllabus PDFs, and plain-text rubric tables into structured Feedback Kitchen scorer configurations.

### Purpose and supporter access

Manually typing an extensive rubric matrix with multiple criteria across five performance tiers can take significant time. The converter automates rubric extraction from existing institutional documents.

This convenience feature is available to [Ko-fi](https://ko-fi.com/smann) supporters. Access is unlocked with the supporter username and password, entered once and stored in this browser.

### The conversion workflow

```
[Step 1 — Upload your manual] ──► [Step 2 — Select an assessment] ──► [Step 3 — Review and edit]
```

1. **Step 1 — Upload your manual:** Upload the course outline or assessment brief. The converter reads a whole document rather than a single rubric table.
2. **Step 2 — Select an assessment:** A document often describes several assessments. The converter lists what it found and you pick the one to build a scorer for.
3. **Step 3 — Review and edit:** An editable preview renders the extracted schema: assessment title, criteria, percentage weights, and tier descriptors. Adjust the weights until they total 100%, refine the descriptor text, then tick the rubric confirmation box.

The two finishing actions sit below the review panel:

- **Import directly to FK** adds the configuration straight to **Your Kitchens** in local storage (`SA_CONFIGS`). If a scorer with the same assessment title already exists, it asks before replacing it.
- **Download scorer JSON** saves a `.json` configuration file for backup or team distribution.
- **Start over** clears the uploaded document and the draft.

**Download scorer JSON** stays disabled until the weights total 100%, every criterion has an assessment title and filled descriptors, and you have ticked the rubric confirmation box.

The converter fills four tiers: excellent, proficient, developing, and unsatisfactory. Feedback Kitchen scorers carry a fifth, satisfactory, which the converter leaves empty. Open the new scorer in the builder and write that tier before you mark anyone, or students who land in it receive no criterion commentary.

### The review imperative

Automated extraction is designed to produce a rapid first draft of your assessment configuration.

Always read through the generated rubric descriptors in the review grid before marking students. Verify that percentage weights total exactly 100%, that tier boundaries accurately reflect course learning outcomes, and that second-person phrasing (*"Your analysis..."*) is consistently maintained.
