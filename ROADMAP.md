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
