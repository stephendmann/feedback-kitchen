# PDF Rubric Converter

The **PDF Rubric Converter** (`convert.html`) converts legacy assessment briefs, syllabus PDFs, and plain-text rubric tables into structured Feedback Kitchen scorer configurations.

### Purpose and supporter access

Manually typing an extensive rubric matrix with multiple criteria across four performance tiers can take significant time. The converter automates rubric extraction from existing institutional documents.

This convenience feature is available to [Ko-fi](https://ko-fi.com/smann) supporters and is unlocked using your supporter key.

### The conversion workflow

```
[1. Upload PDF or Text] ──► [2. Automated Extraction] ──► [3. Review & Edit] ──► [4. Save / Export JSON]
```

1. **Upload Document:** Drag and drop your course outline PDF or paste plain-text rubric tables into the conversion area.
2. **Automated Parsing:** The extraction engine identifies:
   - Assignment title, paper code, and institutional details
   - Assessment criteria and percentage weightings
   - Performance tier descriptors (mapped into Excellent, Proficient, Developing, Unsatisfactory)
   - Suggested grade scale mappings
3. **Interactive Review:** An editable preview table renders the extracted schema. You can edit criterion names, adjust percentage weights to ensure they equal 100%, and refine descriptor text.
4. **Save or Export:**
   - Click **Save as Scorer** to add the configuration directly to **Your Kitchens** in local storage (`SA_CONFIGS`).
   - Click **Export JSON** to download a `.json` configuration file for backup or team distribution.

### The review imperative

Automated extraction is designed to produce a rapid first draft of your assessment configuration.

Always read through the generated rubric descriptors in the review grid before marking students. Verify that percentage weights total exactly 100%, that tier boundaries accurately reflect course learning outcomes, and that second-person phrasing (*"Your analysis..."*) is consistently maintained.
