# Comparison packet: the offline manual

Prepared 5 September 2026, for a decision that has not been made yet. Everything below sits on the `manual` branch. Nothing has been pushed, merged, deployed or linked from the application, and no file under `docs/user-guide/` has been edited.

## What to read, in what order

Start with two pilot chapters side by side against their equivalents in the published manual. That comparison is the point of this exercise, and it takes about ten minutes.

| Read this | Against this |
|---|---|
| `manual/02-getting-started.md` | `docs/user-guide/QUICK-START.md`, and part 3 of `USER-MANUAL.md` |
| `manual/16-moodle-worksheet-import.md` | Part 6 of `USER-MANUAL.md` |
| `manual/08-assembled-feedback-and-clipboard.md` | Part 4 of `USER-MANUAL.md` |
| `manual/45-security-and-pii-protection.md` | Parts 10 and 11 of `USER-MANUAL.md` |

Then the two supporting documents: `docs/manual-accuracy-review-2026-09-04.md`, which now carries the original audit, the corrections applied, six questions for you, and the findings against the published guides; and `docs/manual-screenshot-plan.md`.

## What was done

Nine commits of factual correction, covering roughly fifty errors: the grade scale midpoints, the five-tier rubric, the moderation pack structure, the Moodle dispositions, the Excel workbooks, draft persistence, and the Switch marker claim that had it destroying work it in fact preserves. Terminology moved from tutor to marker where PR #125 renamed the field, and the 48 broken image openers were removed.

Then four chapters rewritten as pilots, and a screenshot plan that proposes two images where the draft mandated 48.

## Which Omarchy conventions transferred

These worked, and I would keep them:

**Open by stating the subject and the way in.** One sentence, no preamble, no "in this chapter". Chapter 16 now opens by telling you to do this before you mark anyone, which is the actual advice.

**Sentence-case headings that are noun or gerund phrases.** "Reading the preview", "What the draft is made of". This also happens to be what `brand-voice-canon.md` already requires, so it cost nothing.

**Prose over bullets, tables only where content is tabular.** The draft's `**Label:** text` lists became paragraphs. The one table left in chapter 16 is a genuine four-way lookup.

**Name the default, then the override. Flag the gotcha in the same breath.** The amber override field is explained as advisory in the sentence that introduces it, rather than in a warning box three sections later.

**Close by handing off.** No summaries. Each pilot ends by naming the chapter that continues the thought.

**Let length follow the subject.** Omarchy pages run from 150 to 1,200 words with no house length. The pilots run 600 to 1,040.

## Which conventions conflicted, and lost

**Italics for menu paths.** Omarchy italicises menu routes and barely bolds anything. Feedback Kitchen bolds on-screen control names in sentence case, and `docs/MANUAL-MAINTENANCE.md` makes that load-bearing: the screen-name rule means a renamed button breaks the manual, and bold is how a reader spots the names to check. The house convention won.

**The first-person product owner.** Omarchy's manual has an author in it, with opinions delivered in the first person and the occasional exclamation. Feedback Kitchen's published guides have a voice but not a narrator, and `brand-voice-canon.md` asks for calm and academic respect. The pilots keep the directness and the willingness to give an opinion, and drop the swagger.

**Rhetorical questions.** Omarchy uses them freely as a signature move. One or two would sit fine here; the density would read as chatty to a marker at eleven at night. Used once, in chapter 45.

**The sidebar table of contents.** Omarchy's flat 51 chapters are navigable because the site renders a persistent numbered sidebar. A directory of 48 markdown files has no such affordance, and the draft has no index file at all. If this manual survives, it needs one.

**Image galleries.** Omarchy's theme page works because themes are a visual choice. Feedback Kitchen has no equivalent subject, which is most of why the screenshot count came out at two.

## The structural finding

The draft is 48 chapters against Omarchy's 51, and that similarity is misleading. Every Omarchy chapter is written for the person using the system. Roughly seven of these are not.

Chapters 19 and 20 document the Jest suite, the accessibility harness, the maintenance scripts and the local dev server. Chapter 33 explains the CSS `scroll-padding-top` values. Chapter 39 is brand documentation. Chapters 46 and 48 are deployment guides. Chapter 6 spends its length on hex codes and class names. A lecturer marking essays needs none of it, and some of it duplicates `README.md` and `CLAUDE.md`.

The 48 was reached partly by documenting the repository rather than the product. That is worth knowing before deciding whether the chapter count is the thing that impressed you about Omarchy, or whether it was the shape of the individual pages.

## Recommendation for the remaining 44

| Treatment | Chapters | Reasoning |
|---|---|---|
| **Light edit** | 01, 05, 07, 09, 11, 12, 15, 21, 22, 24, 25, 27, 29, 31, 32, 36, 37, 40, 42, 43, 44, 48 | Factually corrected already; needs the voice pass, sentence-case headings and de-bulleting, but the content and scope are right. Chapter 15 is the strongest chapter in the draft and needs least. |
| **Substantial rewrite** | 03, 04, 13, 14, 17, 18, 26, 28, 34, 35, 47 | Sound subject, wrong execution. Several lead with implementation detail (element ids, CSS classes) where the reader needs the task. Chapter 34 should tell a lecturer that the tool works by keyboard and with a screen reader, not list live-region ids. |
| **Merge** | 10 into 13, 14, 28 and 36; 23 and 41 into one; 30 into 28 | Chapter 10 is a catalogue of notices that each belong beside the feature that raises them. Chapters 23 and 41 both cover portability and storage. Chapters 28 and 30 are both about the rubric hash. |
| **Retire from this manual** | 06 (in part), 19, 20, 33, 39, 46 | Written for a developer or for the brand, not for a marker. The useful parts of 6 are the theme toggle and reduced motion; the rest is stylesheet internals. If this material is worth keeping it belongs under `docs/`, next to the analytics runbook. |

That leaves roughly 38 user-facing chapters, which is a manual, rather than 48, which is a repository tour.

## The three documents, and what I would do

The uncomfortable fact is that `manual/` and `USER-MANUAL.md` cover nearly the same ground for nearly the same reader. Keeping both means maintaining two descriptions of every control, and `docs/MANUAL-MAINTENANCE.md` exists precisely because one description already drifts.

There is a real choice here, and it is yours.

**Option A, and my recommendation: keep `USER-MANUAL.md` canonical and harvest.** It already has the voice, the maintenance gate, the surface map and a published history. Take from `manual/` the subjects it does not cover, which are hotkeys, focus mode, the converter, cohort insights, calibration and drift, accessibility, offline installation and institutional deployment, and add them as parts. Retire `manual/` once harvested. This costs least and risks least, and you still get the chapters that were missing.

**Option B: restructure `USER-MANUAL.md` into chaptered pages.** If what impressed you about Omarchy was one page per topic with a numbered index, rather than the writing itself, then the answer is to split the existing manual's 12 parts into chapters and add the missing ones, keeping its prose. This is more work and touches a published document, but it is the only option that actually delivers the Omarchy shape.

**Option C: adopt `manual/` as canonical.** I would not, unless you find the pilots clearly better than the published parts they replace. It would mean finishing the voice pass on 44 chapters, rewriting the surface map and `docs-impact:` gate in `MANUAL-MAINTENANCE.md` against chapter numbers, and retiring a document that is currently accurate in the ways that matter most.

Whichever you choose, `QUICK-START.md` keeps its job unchanged. Two pages for the first session is a different document from a reference, and it is doing that job well.

## Two things to fix regardless

The Switch marker error is in the **published** manual, twice, offered both times as the answer to marking on a shared machine. `USER-MANUAL.md:134` and `:342` say it drops the in-progress draft. It does not. That is worth correcting on its own schedule rather than waiting for this decision.

The tutor to marker rename from PR #125 has not reached `docs/user-guide/` either, and under the screen-name rule that is a documentation-impacting change with no `docs-impact: none` available to it.

## Caveats

The repo-local `/writing-review` skill could not be run, because this session started outside the repository and project skills load from the working directory. The pilots were checked by hand against the same catalogue: no Title Case headings, no label bullets, no spaced em dashes outside a quoted UI string, no US spellings, no banned vocabulary, no negative parallelisms, no participle tails, no placeholders. A session started in `/home/sdm/feedback-kitchen` should run `/writing-review` over the four pilot paths before any of this is considered finished.

The Omarchy manual is not on this machine. It was characterised from `omarchy.org/manual/` directly, and the system's own menu links there rather than shipping a copy.
