# Development Tools and Scripts

Feedback Kitchen is architected as a zero-dependency static web application with a comprehensive local testing, accessibility, and maintenance toolchain.

### The Jest test suite

The codebase includes automated unit and characterisation tests powered by Jest:

```bash
npm test
# or run directly with npx
npx jest
```

The test suite validates pure functional contracts without DOM overhead:

| Test Module | Path | Target Coverage |
|---|---|---|
| **Scoring Engine** | `js/score-engine.test.js` | Verifies weighting formulas, midpoint selections, and custom score band mappings. |
| **Moodle Parser** | `js/moodle-worksheet.test.js` | Tests RFC-4180 parsing, quoted delimiters, newline handling, and poisoned CSV fixtures. |
| **Cohort Import** | `js/moodle-cohort-import.test.js` | Validates duplicate suppression, identifier matching, and overwrite protection. |
| **Moderation Privacy** | `js/moderation-suppression.test.js` | Confirms k-anonymity suppression rules and schema v1 compliance. |
| **Draft Persistence** | `js/draft-persistence.test.js` | Tests debounced autosave, quota error hardening, and session restore mechanics. |

### Automated accessibility test battery

To maintain WCAG 2.1 AA compliance, the project includes an automated `axe-core` accessibility test suite:

```bash
# Ensure local dev server is running, then execute:
bash run-bbp-a11y.sh
```

The test runner launches headless browser instances across the home page, builder wizard, and demo scorer to audit:

- Colour contrast ratios across light and dark themes
- Form field labels, accessible names, and ARIA attributes
- Semantic landmark boundaries (`<header>`, `<main>`, `<nav>`, `<details>`)
- Keyboard tab order and modal focus traps

### Maintenance and utility scripts

The `scripts/` directory provides operational utilities for ongoing repository maintenance:

- **Lazy Load Guard (`scripts/check-lazy-load.js`):** Confirms that large vendor bundles (such as `xlsx.full.min.js`) are lazy-loaded on demand rather than included in initial page loads.
- **Moodle Fixture Generator (`scripts/gen-moodle-fixture.js`):** Creates synthetic 14-column Moodle CSV files for local testing.
- **Icon and Favicon Builders (`scripts/render-icons.mjs`):** Generates SVG, PNG, and PWA manifest icon assets from vector masters.
- **Worktree Gardening (`scripts/worktree-gardening.ps1`):** Prunes merged git branches and temporary worktrees.
