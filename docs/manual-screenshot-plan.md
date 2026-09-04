# Screenshot plan for the offline manual

Planning only. No images have been captured, no dependencies installed, no capture script changed, and no fixture created.

The draft manual arrived with 48 image references, one per chapter, against an empty directory. Those references have been removed. This document proposes what should replace them, starting with the four pilot chapters.

## The test applied

An image earns its place when the subject is itself visual, or when recognising something on screen is the task. It does not earn its place by decorating the top of a chapter, and it does not earn its place by restating a sentence that already works.

That test comes from the manual this draft was modelled on. Most Omarchy manual pages carry no images at all. The theme chapter is a gallery, because themes are the thing you are choosing between and no description substitutes for seeing them. The screenshot chapter, which is entirely about a visual workflow, has none: it describes every step in words. A screenshot is used there for what a screenshot is uniquely good at, and nowhere else.

Applied to the four pilots, that yields **two images, not four**. The gap between two and 48 is the finding, not an oversight.

There is a second reason to keep the number low. `docs/MANUAL-MAINTENANCE.md` commits this project to keeping documentation true as the interface changes, and every screenshot is a second copy of the interface that can silently go stale. Forty-eight of them would be a standing liability. Two, tied to states that rarely change, are maintainable.

## Proposed images

### 1. The assembled draft, annotated

| | |
|---|---|
| **Chapter** | 08, the assembled draft and the clipboard |
| **Task supported** | Recognising the five blocks in a draft, so a marker knows which part came from which setting when they want to change one |
| **Why it passes** | The chapter describes a structure the reader is looking at while they read. Seeing one real draft with the blocks named connects the abstraction to the screen faster than the paragraph does |
| **UI state** | Scorer open on the demo scorer, one student fully graded, late penalty set to a band that deducts, so the late notice block is present. Feedback section expanded, draft scrolled to show the opening paragraph through to the late notice. Light theme |
| **Filename** | `ch08-draft-blocks.png` |
| **Annotation** | Yes, and it is the point of the image. Five callouts naming the blocks: opening paragraph, criterion breakdown, total score line, closing paragraph, late submission notice |
| **PII** | Synthetic student only. Proposed values: name `A. Student`, ID `000000`. No real name, no real ID, no real submission text anywhere in frame |
| **Feasible today?** | Not without new work. Requires a marked student, and no marked-student fixture exists |

### 2. The Moodle import preview, showing all four dispositions

| | |
|---|---|
| **Chapter** | 16, importing a Moodle class list |
| **Task supported** | Reading the preview and acting on it, specifically recognising a `Verify` row and knowing that **Assign ID** or **Ignore** is required before the import can proceed |
| **Why it passes** | The dispositions are colour-coded badges the reader must recognise under time pressure, and the `Verify` row carries actions that appear nowhere else. This is the one screen in the manual where recognition is the task |
| **UI state** | Import preview dialog open, with at least one row of each disposition visible: `Import`, `Verify`, `Skip`, `Non-markable`. The commit button visible in its disabled state, reading `Import N students`, since that is what an unresolved `Verify` row produces |
| **Filename** | `ch16-import-preview.png` |
| **Annotation** | Light. One callout on the `Verify` row pointing at **Assign ID** and **Ignore**. The badges label themselves |
| **PII** | **High risk, and the reason to be careful.** This screen displays a class list: names, ID numbers, submission status. It must never be captured from a real Moodle worksheet. A synthetic CSV only, with invented names and IDs that cannot be confused with a real cohort |
| **Feasible today?** | Close. `scripts/gen-moodle-fixture.js` already generates synthetic Moodle CSVs; it would need to be checked or extended to guarantee one row of each disposition in a single file |

### Chapters 02 and 45: no image

**Chapter 02, getting started.** Nothing here fails for want of a picture. The controls are named as they appear, the wizard steps are listed in order, and a screenshot of a form the reader is looking at adds nothing. The chapter in the Omarchy manual that this one corresponds to is also entirely text.

**Chapter 45, what protects student information.** The subject is a boundary, not a screen: what the scrubber removes, what it does not, and why the moderation floor exists. A diagram would restate the prose in a form that is harder to correct when the code changes. If anything here needed illustrating it would be the `[REDACTED]` substitution, and the chapter already shows that inline.

## What capture would require

None of this has been done, and none of it should be until the images are agreed.

The environment is not ready. `node_modules/` is absent, so nothing runs until `npm ci`. The one capture script, `scripts/capture-ui.mjs`, uses Puppeteer, whose bundled Chrome is not downloaded here. Playwright's Chromium is cached at `~/.cache/ms-playwright/chromium-1228`, and a system browser sits at `/usr/bin/chromium`, so pointing Puppeteer at an existing binary through `PUPPETEER_EXECUTABLE_PATH` is the route that avoids a download.

The script also needs three changes before it can produce either image. It knows three hardcoded targets and neither of these is among them. Its interaction hook, `driveAndCapture()`, is a stub with a comment where the clicks should go, so it cannot open a dialog or grade a criterion. And it names files `<target>-<width>x<height>-<theme>.png`, which is not what the chapters reference.

Reusable pieces exist. `seedDemoScorer()` at `bbp-a11y-tests.mjs:27-36` is the canonical way to put the demo scorer in place before navigating. The `KEYBOARD_TESTS` array in the same file shows the declarative step-list shape that a click-driving version would follow. `SA.initCohort` and `SA.addToCohort` are exported, so a populated cohort can be seeded without clicking anything.

The missing piece is data. There is no fixture of marked students anywhere in the repository. `Demo_Scorer___Written_Response.json` is a scorer configuration, not marked work, and `scripts/gen-moodle-fixture.js` produces a Moodle CSV rather than Feedback Kitchen cohort records. Image 1 needs that fixture authored, once, with synthetic names.

## A note on the other 44 chapters

Provisional, pending the comparison. On the same test, the chapters most likely to earn an image are the ones whose subject is genuinely visual: the light and dark theme comparison in chapter 6, the tier pill colours, the two-column focus mode layout in chapter 12, and the rubric drift badge in chapter 28. That is a handful, not a set of 44.

A dozen or so chapters cannot be screenshotted at all, whatever is decided. Chapters on privacy architecture, versioning, the JSON format, cross-platform portability, deployment and lab rollout describe concepts or a terminal rather than a screen. Their original image slugs promised diagrams, which is different work with a different maintenance cost, and worth deciding separately.
