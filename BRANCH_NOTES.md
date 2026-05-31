# perf/lazy-load-sheetjs

Implementation branch for PR 2 of the Feedback Kitchen roadmap.

## Scope
- `scorer.html` only (~15 lines changed)
- Remove static `<script src="...xlsx.full.min.js">` from `<head>`
- Add dynamic `import()` / `loadScript()` helper inside `downloadExcel()`
- Show a brief loading indicator while SheetJS fetches (first export only)

## Key touch-point (from CC parallel-reader pass)
- xlsx script tag: currently in `<head>` — move to lazy load in `downloadExcel()`

## See also
ROADMAP.md — PR Sequence table, PR 2
