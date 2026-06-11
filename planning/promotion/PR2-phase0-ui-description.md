# DRAFT — PR 2

**Branch:** cherry-pick, in order, `f1cc122` → `3b6e286` → `a465484` onto a
fresh branch off `main` *after PR 1 merges* (suggested name:
`phase0-trust-ux-fixes`). The three commits are sequential edits to
scorer.html — do not reorder.
**Title:** `Phase 0 trust & UX fixes: de-letter sections, task-order layout, cohort safety, input cues (FK-02–FK-06, FK-16 slice)`

---

## What

Three commits, one per board card cluster — per-card detail lives in the
commit messages:

1. **`f1cc122` — FK-02/FK-03 (D-02: de-letter).** Section letters removed from
   step badges, onboarding banner, nav rail, and CSS hooks (`data-rail`
   re-keyed from letters to section slugs — done *before* markup changes, as
   the focus-mode CSS keyed off letters). Banner rewritten to match the
   visible sections 1:1. Sentence-case rule added to brand-voice-canon.md (§7)
   and applied ("New student"); the duplicate "Exact" rounding text
   disambiguated ("Display: exact" status chip).
2. **`3b6e286` — FK-05 (D-05: task-order layout).** Penalty & grade override
   moved below the Rubric/Focus marking blocks; banner re-matched; rail was
   already in target order. Pre-flighted by inspection: zero positional DOM
   lookups, focus nav is criterion-indexed.
3. **`a465484` — FK-04 / FK-06 / FK-16 slice.** Cohort actions regrouped:
   primaries first, moderation trio behind a divider (labels/behaviour
   untouched), **Clear cohort** right-isolated with real danger styling (new
   `.btn-danger`; the old `text-red-600` utility never applied — inline
   `.btn-ghost` wins the cascade). Marker-input fields gain a non-color cue
   (amber left border) + on-screen legend. Dev workflow: `npm run dev` script,
   `watch:css` hardened to `--watch=always`, README "Local Development"
   section documenting the stale-CSS footgun.

## Why

First-run users were being taught sections that didn't exist (banner said
A–E; the page had a duplicate F and a focus block the banner never mentioned).
Penalty/override rendered above the marking blocks, inviting anchoring and a
per-student visual skip. The destructive Clear Cohort sat at equal weight
among 8 peer buttons. Required-input state was conveyed by colour alone.

## Behaviour notes

- **No scoring logic changes anywhere in this PR.**
- Clear-cohort's existing double-confirmation was verified, not added: empty
  cohort → silent no-op; cancel at either dialog → nothing deleted; the
  post-export wipe path is export-gated and modal-confirmed.
- Moderation Export… / Export for Moderation semantics deliberately untouched
  (gated on a pending inspection, planning INS-2).

## Validation

- Runtime (dev server): focus-mode enter/exit, Previous/Next, nav-strip
  hide/dim behaviour with the re-keyed selectors, expand/collapse-all,
  grade → penalty → recalculate → sticky-bar chain, all four clear-cohort
  confirm paths (stubbed `confirm`), dark-mode check on the input cue.
- Accessibility: axe baseline diff at each step — **zero new violations**;
  the de-letter commit removed one pre-existing color-contrast violation.
- Jest 98/98 after each commit.

## Known residuals (tracked on the planning board, not in this PR)

- `index.html:323` still says "New Student" (was outside the casing card's
  agreed file scope).
- Field labels ("Student Name", "Late Submission Penalty", …) remain Title
  Case — normalise on next touch per canon §7.
- `watch:css` output is unminified; run `npm run build:css` before committing
  the artifact (noted for the future FK-16 styling migration).

## Planning trail

Developed in the local planning worktree. References: FK-02…FK-06, FK-16
(watch-task slice) board cards · planning D-02, D-05 · INS-3, INS-4 (S-6),
INS-9 · fk-decisions.md Addendum F.2/F.3. Snapshot: `docs/planning-202606/`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
