# Scorer F/G/H redesign — review & ship

**Branch:** `scorer-redesign-fgh`
**Files changed:** `scorer.html`, `.gitignore`, `REVIEW.md` (this file)

## What changed

- Rail re-lettered to contiguous **A · B · C · D · E · F · G** (no skipped letters):
  - A Student | B Rubric | C Adjustments | D Feedback | E Notes | F Finish | G Cohort
- Old wording assistant (was F) folded inline into D as a "✨ Refine wording" panel
- Sticky bar reduced to **Copy feedback** + **↺ New student** only (no duplicates with G)
- F (Finish) now contains: Export student record · Print page · Edit scorer
- G (Cohort) is progressive: collapsed when empty, auto-expands on first save, rail badge shows live count `G · Cohort (n)`
- New scorer-level setting "Show advanced wording tools" (off by default) — gates the legacy F section + manual fallback / prompt builder / log
- Local-only usage instrumentation at `localStorage` key `scorer.usage.v1`
- Diagnostic page at `?diag=usage` (Copy JSON / Reset / Back to scorer)

## Test checklist

- [ ] Hard-refresh (Ctrl+Shift+R) to clear cache before testing
- [ ] Rail reads exactly: `A · Student | B · Rubric | C · Adjustments | D · Feedback | E · Notes | F · Finish | G · Cohort`
- [ ] D has "✨ Refine wording" button + helper "Optional: improve wording without changing marks"
- [ ] Clicking Refine wording opens inline panel with: Improve clarity & tone · Make concise · Draft from rubric · suggestion textarea · Replace draft / Insert below / Copy suggestion
- [ ] E badge is slate **E** (Marker's notes 📝)
- [ ] F badge is green **F** (Finish), with: Export student record · Print page · Edit scorer
- [ ] G badge is slate **G** (Cohort); chip says "Ready" when empty, "n saved" after first student
- [ ] Sticky bar shows only **📋 Copy feedback** and **↺ New student**
- [ ] Footer bar has ⚙ Settings + 📊 Diag links
- [ ] Settings modal opens; "Show advanced wording tools" toggle is off by default
- [ ] Toggling on shows the legacy wording-assistant section
- [ ] Visit `?diag=usage` — counter table renders with Copy JSON / Reset / Back

## Cleanup before push

The bash sandbox couldn't `rm`, so two stale files were moved into `_todelete/`:

```
_todelete/scorer.dev.html                       (163 KB — dev preview duplicate)
_todelete/scorer.backup.20260502-222311.html    (150 KB — pre-redesign safety copy)
```

`_todelete/` is .gitignored so these will not be committed. Delete them from your local shell:

```bash
cd C:\Users\GGPC\feedback-kitchen
rmdir /s /q _todelete       # Windows cmd
# or:  Remove-Item -Recurse -Force _todelete   # PowerShell
# or:  rm -rf _todelete                        # Git Bash / WSL
```

## Commit, merge, push

The `.git/index.lock` was stuck in the sandbox. Run from your own shell:

```bash
cd C:\Users\GGPC\feedback-kitchen

# 1. Clear any leftover git lock (safe — no other git process is running on your machine)
del .git\index.lock 2>nul    # Windows cmd
# or:  Remove-Item .git\index.lock -Force -ErrorAction SilentlyContinue
# or:  rm -f .git/index.lock

# 2. Stage only the real changes (skip CRLF noise on README.md and builder.html)
git checkout -- README.md builder.html
git add scorer.html .gitignore REVIEW.md

# 3. Commit on the dev branch
git commit -m "feat(scorer): F/G/H redesign — contiguous A-G rail, fold wording into D, progressive Cohort, advanced-tools toggle, local usage instrumentation"

# 4. Merge to main and push
git checkout main
git merge --ff-only scorer-redesign-fgh
git push origin main

# 5. Optional: clean up the local branch
git branch -d scorer-redesign-fgh
```

If `git merge --ff-only` fails because main moved while you were working, do `git pull --rebase origin main` then `git merge --ff-only scorer-redesign-fgh` again.

## Rollback (if anything's wrong after deploy)

```bash
git revert HEAD
git push origin main
```

Or restore from the in-repo history:

```bash
git checkout HEAD~1 -- scorer.html
git commit -m "revert: scorer F/G/H redesign"
git push origin main
```

## Implementation notes (for future reference)

- Legacy `#sec-ai` block (~700 lines: explainers, prompt builder, manual fallback, run log) is **kept in the DOM** with `display:none` so existing JS handlers (`aiAssist`, `aiCopyFinal`, `aiBuildPrompt`, etc.) keep working without rewiring. It's revealed only via the advanced-tools setting.
- The Refine panel's textarea (`refine-suggestion-mirror`) syncs both directions with the canonical `ai-suggestion` textarea, so Replace/Insert/Copy reuse existing handlers.
- Usage instrumentation wraps `aiBuildPrompt`, `aiAssembleFinal`, and `aiViewLog` so legacy paths get counted too.
- All 5 inline scripts parse clean (verified via Node `new Function(...)` parse).

## What's deferred

- **Delete legacy `#sec-ai` block entirely** — pending 60–90 days of usage data per the deletion thresholds in the spec (manual fallback ≥5 uses, build prompt ≥5 uses, view log ≥3 views to keep).
- **Vercel preview** — currently local-only. Push the branch and Vercel will auto-create a preview URL when you're ready.
