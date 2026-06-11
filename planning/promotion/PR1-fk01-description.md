# DRAFT — PR 1

**Branch:** cherry-pick `cec854b` onto a fresh branch off `main`
(suggested name: `fk01-score-characterization-tests`).
**Title:** `FK-01: characterization tests for scoreToGrade / scoreToGradeFromScale`

---

## What

Adds `js/score-grade.test.js` — 75 characterization tests locking in the
current behaviour of the two grade-banding functions in `js/shared.js`
(`scoreToGrade` :158, `scoreToGradeFromScale` :167). **No production code
changes** — both functions were already exported on `window.SA`.

## Why

Grade arithmetic is the correctness core of FK, and until now the Jest suite
covered only AI-wording post-processing — no score-math tests existed. This is
the regression net required before any scoring-related change (it gates the
upcoming engine-boundary work, FK-09).

## Coverage

- Every NZ default band boundary (exact floor, ±0.01) for both functions
- Custom `gradeScale` variants: shuffled NZ-mirror (exercises the internal
  sort), sparse 3-band, floored (lowest band > 0)
- Malformed input: `null`, `undefined`, `NaN`, negative, >100, numeric
  strings, non-numeric strings, empty string, empty/null scale
- Input non-mutation check

Tests assert **current** behaviour, including oddities. Five surprises were
recorded and triaged in the planning ledger rather than fixed here
(no-silent-fixes rule): a latent TypeError on empty/null scale (unreachable in
normal flow), below-all-bands returning the floor grade (intended), malformed
inputs converging on the bottom grade via two coincidentally-agreeing
mechanisms, numeric-string coercion, and no upper cap. Follow-up guards land
with FK-09, each in its own commit with tests updated alongside.

## Validation

- Full suite green: 98/98 (75 new + 23 existing).
- All 75 passed on first run — no behavioural discoveries beyond the ledgered
  surprises.

## Planning trail

Developed in the local planning worktree. References: FK-01 (board card),
planning D-01 (decision: characterize before feature work), INS-4 (surprises
ledger S-1…S-5), fk-decisions.md Addendum F.1. Snapshot:
`docs/planning-202606/`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
