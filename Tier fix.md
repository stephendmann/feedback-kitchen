## Tier Label & Structure Audit — Feedback Kitchen Builder

Here's a detailed breakdown of all the issues and what needs to be fixed.

***

### The Core Problem: "Leak" Summary

When you added the 5-tier custom demo, the **5-tier structure leaked into the NZ base model** in three places:

1. **`TIER_ORDER` in `shared.js`** — has 5 tiers including `satisfactory`
2. **`newConfig()` rubric skeleton** — each criterion's rubric object has 5 keys
3. **Tier label UI in `builder.html`** — renders all 5 tier inputs regardless of which preset is active

The **NZ model only assigns 4 tiers** (`excellent`, `proficient`, `developing`, `unsatisfactory`) — `satisfactory` is never used by any NZ grade row. But the 5th tier (`satisfactory`) is now baked into the shared constants and UI.

***

### Issue 1: `TIER_ORDER` in `shared.js` — has 5 entries

```js
const TIER_ORDER = ['excellent', 'proficient', 'developing', 'satisfactory', 'unsatisfactory'];
```

The NZ `GRADE_TIERS` map only uses 4 of these — `satisfactory` is **never assigned** to any NZ grade (A+→D). `D` maps to `unsatisfactory`, and there's no grade that maps to `satisfactory`. [raw.githubusercontent](https://raw.githubusercontent.com/stephendmann/feedback-kitchen/main/js/shared.js)

**Fix needed:** `TIER_ORDER` should either:
- Stay at 5 (and be documented as the *global maximum* for any preset), OR
- The NZ preset explicitly declares only 4 active tiers and the UI/rubric should respect that per-preset tier count

***

### Issue 2: `newConfig()` rubric skeleton — 5 keys baked in

In `shared.js`, `newConfig()` creates each criterion's rubric with 5 keys: [raw.githubusercontent](https://raw.githubusercontent.com/stephendmann/feedback-kitchen/main/js/shared.js)

```js
rubric: {
  excellent: '',
  proficient: '',
  developing: '',
  satisfactory: '',   // ← always present, even for NZ 4-tier
  unsatisfactory: ''
}
```

This means every NZ scorer gets a `satisfactory` rubric slot that is **never triggered** by any NZ grade, but it shows up in the rubric editor (Step 4) as a 5th column. This is the main visual/functional leak.

***

### Issue 3: Tier Labels UI — Header copy says "four" but shows 5 inputs

In `builder.html`, the copy reads: [raw.githubusercontent](https://raw.githubusercontent.com/stephendmann/feedback-kitchen/main/builder.html)

> *"Rename the **four** performance tiers if your school uses different language..."*

But the HTML immediately below renders **5 input fields**:
- TOP (`excellent`)
- UPPER (`proficient`)
- MIDDLE (`developing`)
- LOWER (`satisfactory`) ← the leaked tier
- BOTTOM (`unsatisfactory`)

The description text is factually wrong and the input count doesn't match the NZ model.

***

### Issue 4: `populateTierLabelInputs()` always iterates all 5

```js
function populateTierLabelInputs() {
  SA.TIER_ORDER.forEach(k => { ... });
}
```

This loops over all 5 tiers from `TIER_ORDER` regardless of whether the active preset uses 4 or 5 tiers — so the NZ preset always populates (and shows) the `satisfactory` label field. [raw.githubusercontent](https://raw.githubusercontent.com/stephendmann/feedback-kitchen/main/builder.html)

***

### Issue 5: `renderGradeScale()` always shows 5 tier options in dropdowns

The grade row tier dropdown always includes all 5 options: [raw.githubusercontent](https://raw.githubusercontent.com/stephendmann/feedback-kitchen/main/builder.html)

```js
const tierOptions = [
  { key: 'excellent', ... },
  { key: 'proficient', ... },
  { key: 'developing', ... },
  { key: 'satisfactory', ... },  // ← shown for NZ rows too
  { key: 'unsatisfactory', ... }
];
```

NZ grade rows would never need to select `satisfactory`, but it appears in every dropdown.

***

### Recommended Fix Strategy

The cleanest fix is a **per-preset `activeTiers` array** rather than one global `TIER_ORDER`. Here's the approach:

#### In `GRADE_PRESETS` (builder.html), add a `tiers` property per preset:
```js
nz: {
  tiers: ['excellent', 'proficient', 'developing', 'unsatisfactory'],  // 4 only
  grades: [ /* A+→D rows */ ]
},
custom_five: {
  tiers: ['excellent', 'proficient', 'developing', 'satisfactory', 'unsatisfactory'],
  grades: []
}
```

#### In `renderGradeScale()` — filter tierOptions by preset's active tiers
```js
const activeTiers = getCurrentPresetTiers(); // returns 4 or 5
const tierOptions = SA.TIER_ORDER
  .filter(k => activeTiers.includes(k))
  .map(k => ({ key: k, label: SA.getTierLabel(config, k), ... }));
```

#### In `populateTierLabelInputs()` — show/hide the `satisfactory` row
```js
const activeTiers = getCurrentPresetTiers();
document.getElementById('tier-label-row-satisfactory')
  .style.display = activeTiers.includes('satisfactory') ? '' : 'none';
```

#### In `newConfig()` rubric skeleton — keep 5 keys (safe), but:
The `migrateConfig()` function already handles adding missing keys lazily, so the rubric skeleton being 5-wide is safe. The real fix is just **not rendering** the `satisfactory` column in the rubric editor (Step 4) for NZ presets. [raw.githubusercontent](https://raw.githubusercontent.com/stephendmann/feedback-kitchen/main/js/shared.js)

#### Fix the UI copy in `builder.html`:
Change the description from hardcoded *"four performance tiers"* to dynamically reflect the preset:
```
"Rename the performance tiers if your school uses different language..."
```
(Remove the word "four" so it's accurate for both 4- and 5-tier presets.)

***

### Summary Table

| Location | Issue | Fix |
|---|---|---|
| `shared.js` → `TIER_ORDER` | 5-entry array drives NZ UI | Keep as global max; filter by preset at render time |
| `shared.js` → `newConfig()` rubric | 5 keys including unused `satisfactory` | Fine to keep; hide `satisfactory` column in rubric editor for NZ |
| `builder.html` → Tier label section description | Says "four" but shows 5 inputs | Remove hardcoded "four" from copy |
| `builder.html` → Tier label inputs | Always renders 5 fields | Hide `satisfactory` field when NZ/4-tier preset is active |
| `builder.html` → `renderGradeScale()` | 5 tier options in every row dropdown | Filter by active preset's tier list |
| `builder.html` → `populateTierLabelInputs()` | Iterates all 5 from `TIER_ORDER` | Filter by active preset's tier list |

The NZ preset and the 5-tier Custom demo are currently sharing the same global `TIER_ORDER` and UI rendering path with no branching — the fix is making the render functions **preset-aware** rather than changing any shared data structures.


## Roo Code vs Claude Code fix?

Yes — this is a good Roo Code task, not something that **must** be done in Claude Code. The issue looks like a contained UI/data-structure refactor in `builder.html` plus likely `js/shared.js`, and Roo Code with Gemini 2.5 should handle it well if you give it a tight, constraint-heavy prompt that stops it from “helpfully” rewriting unrelated parts of the file. The main risk with Gemini-style coding agents is over-editing, so the prompt should explicitly require a minimal diff, preservation of behavior, and no unrelated cleanup. [github](https://github.com/stephendmann/feedback-kitchen/blob/main/builder.html)

## Recommendation

Use Roo Code for this fix if you want a practical repo edit inside VS Code, but frame it as a **behavior-preserving refactor** with a required plan first. Guidance for coding agents consistently recommends locking behavior first, planning before implementation, and keeping refactors small rather than broad rewrites. [quantumbyte](https://quantumbyte.ai/articles/claude-code-prompts)

Claude Code is still a good option when you want stronger repo-wide reasoning or a safer multi-file audit, but this specific bug does not look inherently beyond Roo Code. Based on the page content, the leak is local and understandable: `GRADE_PRESETS` are defined in `builder.html`, while tier label rendering and grade-scale rendering currently iterate global tier structures rather than preset-specific ones. [github](https://github.com/stephendmann/feedback-kitchen/blob/main/builder.html)

## Why this happened

In the current `builder.html`, the NZ preset is a 4-tier grading model in practice, but the tier label customiser and grade-scale renderer still expose five tiers, including `satisfactory`, because they iterate `SA.TIER_ORDER` or a hardcoded 5-tier options list. The copy also still says “Rename the four performance tiers” while the HTML renders five inputs, which confirms the UI and preset structure are out of sync. [github](https://github.com/stephendmann/feedback-kitchen/blob/main/builder.html)

The same file shows `syncRubric()` only syncing `excellent`, `proficient`, `developing`, and `unsatisfactory`, while `addCriterion()` still initializes a five-key rubric including `satisfactory`; that mismatch is another sign the 5-tier demo logic was partially layered on top of the older NZ flow rather than separated cleanly. [github](https://github.com/stephendmann/feedback-kitchen/blob/main/builder.html)

## Roo Code prompt

Paste this into Roo Code in VS Code:

```text
You are editing my Feedback Kitchen codebase.

Task:
Fix the tier system so the NZ base model remains a true 4-tier model, while a separate custom/demo 5-tier model can still exist without leaking into NZ.

Context:
I changed an older model that was effectively locked to 4 tiers, then added a 5-tier demo/custom version. That change appears to have leaked into the NZ base model UI and structure.

Files to inspect first:
- builder.html
- js/shared.js

What I need:
1. Audit the current tier architecture before changing code.
2. Identify exactly where 5-tier assumptions are leaking into the NZ preset.
3. Refactor so tier visibility and tier options are preset-aware.
4. Keep NZ as 4 tiers:
   - excellent
   - proficient
   - developing
   - unsatisfactory
5. Allow a separate 5-tier preset/model to use:
   - excellent
   - proficient
   - developing
   - satisfactory
   - unsatisfactory

Implementation requirements:
- Do NOT do a broad rewrite.
- Do NOT restyle the UI.
- Do NOT rename unrelated functions.
- Do NOT reformat large sections of the file.
- Preserve existing behaviour outside tier handling.
- Make the smallest safe diff possible.

Expected architecture:
- Keep a global canonical tier order if useful, but treat it as the maximum possible set, not the active set for every preset.
- Add a per-preset active tier list, e.g. tiers: [...]
- Ensure all rendering logic uses the active tiers for the selected preset.
- Ensure the NZ preset does not show or use "satisfactory" anywhere in normal operation.
- Ensure the 5-tier custom/demo preset can still show and use all five tiers.

Places likely needing fixes:
- GRADE_PRESETS structure
- preset loading logic
- tier label inputs
- renderGradeScale()
- populateTierLabelInputs()
- updateTierTabLabels()
- any rubric rendering for step 4
- any feedback-tier tabs or filters in step 5
- shared config initialization / migration if needed

Copy/content requirements:
- Fix the copy that currently says “four performance tiers” if the UI can be 4 or 5 depending on preset.
- Make the wording accurate for both cases.

Rubric/data requirements:
- It is acceptable for internal storage to keep all 5 rubric keys if migration simplicity requires it.
- But the UI for NZ must not render the extra satisfactory tier.
- If migration logic exists, preserve backward compatibility with existing saved configs.

Process:
1. First give me a short plan listing:
   - the leak points you found
   - the files/functions you will change
   - the minimal refactor approach
2. Then implement the fix.
3. After editing, provide:
   - a concise summary of exactly what changed
   - any assumptions made
   - any backward compatibility notes
   - a short manual test checklist

Manual test checklist must include:
- NZ preset shows only 4 tiers
- NZ tier labels section hides satisfactory
- NZ grade dropdowns do not offer satisfactory
- NZ rubric editor does not show satisfactory
- NZ feedback tabs do not show satisfactory
- 5-tier custom/demo preset shows all 5 tiers
- switching between presets updates the UI correctly
- existing saved configs still load safely

Important:
Before changing code, inspect the current code and work from what is actually there, not from assumptions.
```

That prompt is shaped to force a plan-first workflow and small-scope refactor, which is the safest way to use coding agents on an existing UI file. [claude5](https://claude5.com/news/best-claude-prompts-for-coding-2026)

## Best mode to use

For Roo Code, use a lower-creativity, more deterministic setup for this kind of refactor, because Roo’s Gemini integration defaults to a more expressive temperature unless you change it. Lower temperature is better for controlled code edits and less likely to produce extra “helpful” restructuring. [docs.roocode](https://docs.roocode.com/providers/gemini)

A good working pattern is:
- Ask for the audit and plan first.
- Approve the plan.
- Then ask it to edit only the identified functions/files.
- Then review the diff before accepting.

If you want, I can also turn that into a **shorter, sharper Roo prompt** optimized for one-shot editing, or a **Claude Code prompt** optimized for a safer multi-file refactor.