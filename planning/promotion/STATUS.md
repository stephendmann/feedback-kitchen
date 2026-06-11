# Promotion status (2026-06-12)

Executed locally; **nothing pushed**. Awaiting explicit go after the sense-check
report.

| Step | State |
|---|---|
| Addendum F → fk-decisions.md | ✅ on branch `phase0-trust-ux-fixes` (commit `fc4af46`) |
| INS-3 map → fk-project-overview.md | ✅ same commit |
| Snapshot → docs/planning-202606/ (incl. PHASE0-PROMPT.md, + SNAPSHOT-NOTE) | ✅ same commit |
| PR1 branch `fk01-score-characterization-tests` | ✅ = main + `b13c4c1` (cherry-pick of cec854b); Jest 98/98 on branch |
| PR2 branch `phase0-trust-ux-fixes` | ✅ stacked on PR1: + `dc322aa`, `09aa584`, `0a3a220` (clean cherry-picks, content identical to source branch) + `fc4af46` docs; Jest 98/98; a11y Home 3 / Builder 2 / Scorer 5 (= main − 1, zero new) |
| Clean PR bodies | ✅ `%TEMP%\fk-pr-bodies\pr1-body.md` / `pr2-body.md` (DRAFT preambles stripped; PR1 reworded — addendum/snapshot land with PR2; PR2 reworded — four commits + stacking banner) |
| Push / `gh pr create` | ✅ Executed 2026-06-12 on user confirmation (full snapshot kept, two-stage sequencing): **PR #20** (FK-01 tests) opened and **merged**; **PR #21** (Phase-0 UI bundle, 4 commits, base main) **open** — https://github.com/stephendmann/feedback-kitchen/pull/21. Merging #21 auto-deploys to production (acknowledged). |

The draft files in this folder (PR1/PR2 descriptions) are superseded by the
clean bodies above; kept for history.
