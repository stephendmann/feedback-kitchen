# Keeping the user guide true

The manual is only worth publishing if it cannot quietly go stale. This document is the mechanism: what counts as a documented surface, what happens when one changes, and who decides.

The per-change gate described below is not yet automated. Until it is, this is the checklist to follow by hand, and the specification for the automation when it lands.

---

## Why a pull-request gate rather than a calendar reminder

FK already has evidence that documentation drifts silently. The moderation-export gloss in `docs/fk_moderation_export_v1.md` went stale and was only caught later (fixed in PR #41). `fk-decisions.md` records Sonnet as gated to `improve_criterion_body`, while the shipped allowlist in `api/garnish.js` permits four modes. In both cases the code was reviewed and merged correctly, and the prose describing it simply was not looked at.

There is a second failure mode worth naming, because it produced a false drift report while these documents were being written. A claim about `README.md` was raised as drift, investigated, and turned out to be wrong: the reader had checked a stale worktree copy rather than the version on the default branch. **Verify against the default branch, not against whatever checkout you happen to have open.** A wrong drift report costs as much time as real drift and damages trust in the rest of the audit.

A weekly or monthly sweep would not have caught these any sooner, and it would have generated a recurring "check whether the manual is stale" task whose answer is almost always no. The weekly `/fk-health-check` deliberately keeps a silence contract, and documentation accuracy is not something it can probe: a stale sentence returns HTTP 200 like any other.

The moment the manual becomes wrong is the moment behaviour changes. That is where the check belongs.

---

## The surface map

A change to any file below can change what the manual says. This map turns "did I touch documented behaviour?" from a judgement call into a lookup.

| Application surface | Files | Manual sections |
|---|---|---|
| Scorer builder wizard | `builder.html` | Part 3; quick start step 1 |
| Grade scale presets and midpoints | `builder.html` (preset definitions) | Part 3, grade scale table |
| Late penalty policy and defaults | `builder.html`, penalty logic in `js/shared.js` | Part 3, penalty table |
| Marking loop, overrides, rounding, focus mode | `scorer.html` `#sec-student`, `#sec-rubric`, `#sec-adjust` | Part 4; quick start step 2 |
| Feedback assembly and the editable draft | `scorer.html` `#sec-feedback`, assembly logic in `js/shared.js` | Part 4 |
| Marker's notes | `scorer.html` `#sec-notes` | Parts 4 and 5 |
| Snippets | `scorer.html` snippet manager, `SA_SNIPPETS` handling | Part 5 |
| Moodle worksheet round trip | `js/moodle-worksheet.js`, Moodle UI in `scorer.html` | Part 6; quick start Moodle section |
| Cohort record, insights, moderation export | `scorer.html` `#sec-cohort`, `js/cohort-insights.js`, `js/moderation-*.js`, `js/excel.js` | Part 7; quick start step 3 |
| File download destinations | download call sites in `builder.html` and `scorer.html` | Part 8 |
| Scorer JSON export and import | `builder.html` backup and share, `upload.html` | Part 9 |
| Storage keys, quota handling, draft persistence | `js/shared.js`, draft persistence | Part 10 |
| Supporter gating and AI assistant | `api/garnish.js`, `js/converter.js`, `upload.html`, `convert.html` | Part 11 |
| Privacy posture and what leaves the device | `api/garnish.js`, PII scrubbing in `js/shared.js` | Parts 10 and 11 |

Two rules keep the map honest. Add a row whenever the manual starts describing a surface it does not yet cover, in the same change that adds the prose. Remove a row only when the manual stops describing that surface, never merely because the row is inconvenient.

---

## What runs when a mapped file changes

**One.** The author checks the map. If the diff touches a mapped file, open the manual sections it points at and read them against the change.

**Two.** The author answers the documentation-impact line in the pull request:

```
docs-impact: none
docs-impact: USER-MANUAL.md part 6 updated (Moodle import moved to the Student section)
```

`none` is a legitimate and common answer. Most changes to a mapped file are internal and change nothing a lecturer would read. The line exists to make the check visible, not to manufacture documentation work.

**Three.** A CI guard enforces that the line exists. If the diff touches a mapped file, the pull request must either change a file under `docs/` or carry an explicit `docs-impact: none`. It is a completeness check on the process, and it deliberately cannot judge whether the prose is correct. It reuses the workflow wiring FK-23 already put in place.

**Four.** The reviewer treats a `docs-impact: none` on a user-visible change as a review comment, exactly like a missing test.

---

## The screen-name rule

The manual names controls as they appear on screen: "Import Moodle worksheet…", "Export cohort (Excel)", "Switch tutor", "Backup and share". A renamed button therefore breaks the manual even when nothing behavioural changed.

Renaming a user-facing control is always a documentation-impacting change. There is no version of that edit where `docs-impact: none` is the right answer.

Casing is the one exception. The guides write control names in sentence case per `brand-voice-canon.md`, even where a shipped label uses title case. Do not "correct" the guides to match: the label is the thing scheduled to change, and matching it would lock the violation into published documentation. Recognition does not depend on case, so a reader loses nothing.

The action that starts a new scorer settled on one string, "Build a scorer", in FK-51 (previously it shipped under five variants), and the guides name it that way throughout; a static guard (`js/scorer-cta-label.test.js`) keeps every call site on that single label.

---

## When the free and paid boundary moves

Part 11 states which features are supporter-only and gives a proportion. Any change to what is gated, to the modes an assistant may use, or to how access is unlocked has to update three things together, or they will disagree with each other:

1. Part 11 of the manual and the closing note of the quick start.
2. Decision D17 in `fk-decisions.md`, or a new decision superseding it.
3. The enforcement itself, in `api/garnish.js` and the supporter checks in `js/converter.js` and `upload.html`.

The D17 and `SONNET_ELIGIBLE_MODES` mismatch is what this rule is for. The decision record and the code drifted apart, and a manual written from either one alone would have been wrong.

The proportion given in part 11 is deliberately approximate and stated as feature areas, not as a marketing figure. Recount it when the tally changes rather than adjusting the wording to sound better, and keep the sentence that matters: the whole marking workflow is free.

---

## Reviewing the manual as a whole

The per-change gate catches drift at the point of change. Once a semester, or after any release that lands several mapped changes together, read the manual end to end against the live application, which catches the accumulated small stuff no single diff was responsible for.

The end-to-end read is one task: mark a real student in a real scorer with the manual open, and correct what does not match. That surfaces more than re-reading the prose in isolation, because the order of the manual either matches the order of the work or it does not.

Record the date at the foot of each document when you do it.

---

## Ownership

Stephen Mann owns the manual, as product and brand voice owner, and the same person who signs the decisions the manual describes.

The manual follows the repository writing rules in `CLAUDE.md` and the voice in `brand-voice-canon.md`: AU and NZ spelling, sentence-case headings, plain language, no placeholders. The `/writing-review` skill audits a draft against those rules before publication.
