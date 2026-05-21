# Feedback Kitchen — UI/UX Roadmap

**Current baseline:** v2.1.1 (quick-win copy + status chips pass complete).
**Source of this plan:** Perplexity UX review (April 2026) + Steve's own tracking notes.

This file is the resume-point for later sessions. Each version below is a discrete, shippable pass — pick one, do it, tag it, move on.

---

## ✅ Completed — v2.0 → v2.1.1

Baseline already pushed to Git.

- **v2.0** — Cohort Excel export (Option B): auto-add on Copy/Export, first-use scoping modal, replace-on-rematch, post-export wipe prompt, 30-day nudge, version stamping.
- **v2.0.1–2.0.4** — Cache-busting + Marker's Notes copy clarified; Excel tab order fixed (Student Feedback → Grade Matrix → Cohort Summary → Rubric → Grade Feedback → Instructions).
- **v2.1.0** — Quick-win copy pass per Perplexity review: task-based section titles (Student, Rubric scores, Adjustments, Feedback builder, Marker's notes, AI polish, Export, Cohort export); short buttons ("Copy feedback", "Export student record", "Export cohort (Excel)"); tightened micro-copy; added live status chips (rubric, feedback, AI, cohort).
- **v2.1.1** — Fixed chip bug where "Rubric scores" always read "7 of 7"; now counts only graded criteria.

---

## 🎯 v2.2 — Sticky action bar + workspace polish

**Goal:** single dominant primary action always visible; less scrolling to export.
**Estimated effort:** half-day.

1. **Sticky footer action bar** (bottom of viewport, no-print).
   - Primary: `📋 Copy feedback` (same `S.copyFeedback()`).
   - Secondary: `📥 Export student record`, `📥 Export cohort`, `↺ New student`.
   - Mirror the buttons inside Section G but hide them on narrow screens where the sticky bar takes over.
   - Add a small live summary chip on the left: `"Jane Doe · A- · 7 of 7 graded · Draft ready"` — pulled from existing status-chip data.
2. **Sticky section indicator** (optional, top of viewport when scrolled past nav).
   - A single strip showing `Student › Rubric › Adjustments › Feedback › AI › Export` with the current in-view section highlighted (IntersectionObserver).
3. **Collapsible `<details>` defaults audit.**
   - Decide which sections default-open vs collapsed on a fresh load. Suggested: Student + Rubric open; Adjustments, Feedback builder, Marker's notes, AI polish, Export, Cohort export collapsed but auto-open when a trigger fires (e.g., AI polish opens automatically after first `aiGarnishDirect()` call).
4. **Feedback textarea auto-grow.**
   - Pure CSS approach using `field-sizing: content` fallback to a tiny JS listener.

**Acceptance:** marker can grade a full student + copy feedback without scrolling past the rubric.

---

## 🎯 v2.3 — AI Copilot redesign

**Goal:** move from "AI Garnish" (playful feature) to "AI Copilot" (trusted assistant) per Perplexity review.
**Estimated effort:** 1 full day.

1. **Three explicit actions instead of one "Garnish" button.**
   - `Draft feedback from rubric` — regenerate body based on current grades.
   - `Improve clarity and tone` — light rewrite of current body.
   - `Shorten for LMS paste` — compress to fit typical 2000-char Moodle limits.
   - Implement as three buttons with different prompt prefixes; share the existing `/api/garnish` proxy.
2. **Visible "Input used" pane.**
   - Chips listing exactly what was sent to Claude: `grades`, `rubric descriptors`, `marker's notes`, `snippets`, `penalty setting`. Click-to-expand view of the actual prompt (already available in debug log — expose it properly).
3. **Visible "Locked" pane.**
   - Static list: `greeting`, `final grade notice`, `late penalty statement`. Microcopy: *"These stay exactly as generated from your grades; AI never touches them."*
4. **Output controls (three buttons under the result):**
   - `Replace draft` — overwrite main feedback textarea.
   - `Insert below current text` — append.
   - `Compare changes` — side-by-side or inline diff (use a small diff library or colour-coded split view).
5. **Microcopy overhaul.**
   - Panel intro: *"AI can rewrite the body for clarity, tone, and consistency. It will not change scores or penalty settings. Review before copying."*
   - Status chip: `Idle` / `Drafting…` / `Applied — 3 edits` / `Error`.
6. **BETA badge review.**
   - Once the copilot pattern is in, demote BETA to a smaller tag or drop it entirely.

**Acceptance:** a cautious marker feels the AI is transparent, bounded, and reversible. No scores or penalties can change via the AI path. A new user understands in 5 seconds what AI will and will not do.

---

## 🎯 v3.0 — Dashboard layout (optional, only if v2.2 + v2.3 still feel cramped)

**Goal:** shift from vertical form to app-style workspace with the rubric as the visual centre.
**Estimated effort:** 1–2 days.

1. **Top header card** — compact student details strip (name · ID · tutor · date · current grade badge). Always visible.
2. **Main panel** — rubric table (the marker's primary work surface).
3. **Right rail (or tabs on narrow screens):**
   - Adjustments
   - Feedback builder + textarea
   - AI Copilot
   - Export / Cohort
4. **Keyboard shortcuts** (since power users will mark 40+ students in a sitting):
   - `⌘/Ctrl+C` from anywhere → copy feedback (with confirmation toast).
   - `⌘/Ctrl+E` → export student record.
   - `Tab` cycles through grade dropdowns row by row.
5. **Autosave badge** in header: `Saved · 14:32` / `Unsaved changes`.

**Acceptance:** feels like a real SaaS marking tool, not a long form.

---

## 🔹 Nice-to-haves (not version-bound)

Drop any of these into whichever pass has capacity.

- **Inline rubric descriptors** — click a grade cell → popover of the rubric band text (currently only in Excel export).
- **Keyboard-first grade entry** — type `A`, `B+`, etc. into a focused cell.
- **Scorer switcher** in the nav — quick dropdown of saved scorers so you don't bounce through `index.html`.
- **Cohort import** — bring a previous `.xlsx` cohort back into localStorage so you can re-open a partially-marked cohort.
- **PDF export** alongside Excel for single-student records (some institutions prefer it for moderation).
- **Dark mode** — deferred until v3.

# Best sequencing
My suggested order is: 
- 1) keyboard-first grade entry, 
- 2) inline rubric descriptors, 
- 3) scorer switcher, 
- 4) cohort import, 
- 5) PDF export, 
- 6) dark mode.

That order prioritizes improvements to the live marking loop first, then admin convenience, then rehydration/import complexity, and lastly alternate-output and cosmetic work.

## Quick read
If you want the strongest mix of payoff and buildability, I’d put them into four buckets:

**Do next**: keyboard-first grade entry, inline rubric descriptors.

**Quick win**: scorer switcher.

**Useful but heavier**: cohort import.

**Later**: PDF export, dark mode.

## ProductScoring lens
If I translate your list into a simple product lens, it looks like this:

**Highest value-per-effort**: scorer switcher.

**Highest absolute value**: keyboard-first grade entry.

**Best quality-of-judgment aid**: inline rubric descriptors.

**Highest implementation risk**: cohort import.

**Most deferrable**: dark mode.
---

## 📝 Working notes for next session

- **Cache-bust pattern:** bump `?v=` on `js/shared.js` and `js/excel.js` in `scorer.html` whenever JS changes — otherwise browser will serve stale code even after Ctrl+F5.
- **File locations:**
  - Main scorer UI: `C:\Users\GGPC\feedback-kitchen\scorer.html`
  - Builder: `C:\Users\GGPC\feedback-kitchen\builder.html`
  - Homepage: `C:\Users\GGPC\feedback-kitchen\index.html`
  - Shared JS + storage + scoring: `js/shared.js`
  - Excel export (single + cohort): `js/excel.js`
- **Version conventions:**
  - `config.appVersion` = Feedback Kitchen app version (currently `'2.0'` in `shared.js` `newConfig()`; bump to `'2.1'` when we ship v2.2+).
  - `config.version` = user's own scorer revision (unchanged by us).
- **Status-chip logic** lives in `refreshStatusChips()` inside `scorer.html`. Hooked by `recalculate()`, `updateFeedback()`, `refreshCohortUI()`, `aiGarnishDirect()` completion, and `newStudent()` reset. When v2.2 adds a sticky summary bar, reuse the same data source.
- **Perplexity source review:** full text saved in prior chat; key quotes that drove v2.1:
  - *"Phrases like 'Copy Feedback (+ add to cohort)' are accurate but cognitively dense for a repeated action workflow."*
  - *"For grading tools, trust comes from explicit state, concise labels, and clear boundaries."*
  - *"The best version of this tool is not 'AI garnish'; it is a marking copilot with explicit guardrails."*

---

## Resume cue (paste into next chat)

> Resuming Feedback Kitchen. Current live version v2.1.1. Next planned pass is **v2.2 (sticky action bar + workspace polish)** per `ROADMAP.md` in the repo. Read that file first, then confirm scope before editing.


## Missing
(i) Quick Guide
Tiers vs. grades

Grades are grouped into four performance tiers: Excellent (A+/A/A–), Proficient (B+/B/B–), Developing (C+/C/C–), and Unsatisfactory (D). The rubric descriptor shown in each student's feedback is the one written for that tier — not the individual grade.

Feedback tone and late penalties

The opening and closing paragraphs always reflect the student's pre-penalty grade — they speak to the quality of the work itself. Any late deduction and the final penalised score are appended at the end of the feedback block, after the academic commentary.

Personal snippets

Use the 💬 Insert snippet… dropdown in the Cooked Feedback panel to insert a saved phrase at the cursor. Select ⚙ Manage snippets… to build your own library of reusable phrases in your own style. Snippets are personal to your browser — they are not included when you export or share a Scorer.

Marker's Notes

The Marker's Notes panel below the feedback is a private scratchpad. Notes are not included when you copy feedback to paste into Moodle or Turnitin — but are included in your Excel download as part of the formal marking record, useful for moderation.


## Expand
Click to expand vs click to **expand and contract** (marking.sdm version is **"click to collapse"**

---

## Builder & Brand Pass (BBP)

**Owner:** Stephen Mann (brand voice + Product), CD (technical implementation)
**Source:** Tutorial-video mockup audit, May 2026 (D15)
**Gating:** BBP v1.0 blocked until Phase 6 and Marking Roadmap v3.0 stable
**Priority:** Lower than Marking Roadmap v3.0 (marking-loop UX is higher user impact)

**Rationale:** Builder is used once per rubric; marking view is used hundreds of times per rubric. Prioritise high-frequency surfaces first.

**Reorder trigger:** If tutorial video drives significant inbound builder traffic, promote BBP v1.0 above v3.0.

---

### BBP v0.1 — Copy & Messaging Quick Wins

Pure copy edits. No new decisions, no technical risk. Ship between cycles (Steve owns approval).

**Status:** Shipped 2026-05-21. See `bbp-v0.1-audit-triage.html` for visual audit briefing; canonical record in `fk-decisions.md` § D15.

**Scope:**
- Calm override-banner wording (`scorer.html` #override-audit)
- "Not an autograder — you choose the grades, the tool drafts the feedback." sub-headline (homepage hero, builder/scorer top)
- Footer privacy/sharing micro-copy: "Everything stays in this browser. You can export the scorer as JSON to share with your team." (`builder.html` persistent footer)
- Simplified wizard helper copy (`builder.html` Steps 3–6 subtitles)
- Rule-of-three brand voice pattern codified ("Your X. Your X. Your X." sentence structure)

**Acceptance:** All five strings live in production; pattern documented in `brand-voice-canon.md`.

---

### BBP v1.0 — Wizard UX

Needs design brief + Figma + real UX iteration. Estimated effort: 1–2 weeks.

**Scope:**
- Left-sidebar wizard navigation (replace top progress bar)
- Step 6 tabular summary (replace text-list `populateReviewSummary`)
- Inline weight bars for criteria (replace bare numeric inputs)

**Acceptance:** New wizard navigation passes Phase 2 a11y checks; Step 6 summary uses cross-scene math (4 criteria · 16 descriptors etc.); weight bars match calculated totals visually.

---

### BBP v1.1 — Builder Polish

Batch with v1.0 or follow-up pass.

**Scope:**
- Token-pill highlighting in feedback templates
- 2-letter country pills (NZ/AU/GB/US) replacing flag emojis
- Per-tier feedback template tab strip
- Default starter snippets seed
- "6 steps · ~10 min" expectation badge
- Discrete "Course code" + "Tutor" fields in Step 1
- Custom dropdown for "Insert snippet"
- Avatar colour-coding for shared scorers

---

### Cross-Track Integrations

These mockup items don't live in BBP — they attach to other streams:

**Autosave signalling (mockup #13)** → Marking Roadmap v3.0
Harmonise "Untitled draft" / "Saved · 14:32" pattern across builder AND marking headers; same component.

**Toast pattern (mockup #20)** → new Global Notification System pass
One design for success/error/info toasts across MV, RE, builder. Replaces ad-hoc `showCohortToast` variations.

**In-UI privacy reassurance (mockup #10)** → UX + Legal/Comms cross-surface item
The privacy *behaviour* is signed off (Addendum B); the privacy *visibility* in the UI is not. Lock-icon + "Names and IDs are stripped before anything is sent" message should appear wherever data leaves the browser (wording assistant in `scorer.html`; any future surfaces).

