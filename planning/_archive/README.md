# Archive (planning)

Shipped / superseded planning artifacts, kept for audit trail. Nothing here is
live — do not promote from these folders.

| Folder | What it is | Status |
|---|---|---|
| `promotion-phase0/` | The original "promotion" staging area: PR-ready drafts for the Phase-0 / FK-17 wave (PR1-fk01, PR2-phase0-ui, ADDENDUM-F draft, STATUS). | All shipped — PR #20, #21, #22; Addendum F on main. |
| `Axe test after PR20/` | axe-core a11y evidence captured after PR #20/#21. | Shipped work; reference only. |
| `FK-17 axe tests/` | axe validation evidence for FK-17 (WCAG AA pass). | Shipped — PR #22. |
| `PR23 axe tests/` | external validation report + raw axe JSON for PR #23. | Shipped — PR #23. |

## Why the `promotion/` folder was retired (archived 2026-06-14)

From Phase 2 onward the planning→production path changed and the `promotion/`
folder fell out of use. The current promotion workflow is:

1. **PR bodies** are written to `%TEMP%\fk-pr-bodies\`, not staged here.
2. **Docs/decision promotion** rides dedicated branches (e.g. `docs/phase3-promotion`
   = PR #38) and `docs/planning-202606/` snapshots committed straight to main.

So `promotion/` was a Phase-0-only convention. It is archived rather than deleted
to preserve the Phase-0 promotion trail.
