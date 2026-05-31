# perf/homepage-and-dark-mode

Implementation branch for PR 5 of the Feedback Kitchen roadmap.

## Scope
- Two files: `index.html` and `scorer.html` (~25 lines total)
- Smallest PR; bundles remaining performance and class-name items

## Changes

### index.html
- Add `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` before the Google Fonts stylesheet link
- Add explicit `width` and `height` attributes to all `<img>` elements (eliminates CLS)
- Add `.hero` class to the hero section element

### scorer.html
- `renderLineDiff()`: replace inline `style="color:..."` / `style="background:..."` with CSS classes (`.diff-added`, `.diff-removed`, `.diff-unchanged`) so the diff respects the page's colour scheme and dark-mode can target them

## Key touch-points (from CC parallel-reader pass)
- `fonts.gstatic` preconnect: missing from `index.html` `<head>`
- `renderLineDiff`: inline styles identified by parallel-reader pass
- Hero element: lacks `.hero` class
- Image `<img>` tags: missing `width`/`height` causing CLS

## Sequencing note
This is the only multi-file PR; placed last because it has no dependencies
on PRs 1–4 and bundles the smallest remaining items.

## See also
ROADMAP.md — PR Sequence table, PR 5
