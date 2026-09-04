# Hotkeys

Feedback Kitchen provides keyboard shortcuts to accelerate repetitive marking operations without requiring a mouse.

### Global keyboard shortcuts

Global shortcuts are active throughout the marking workspace (`scorer.html`).

| Shortcut | Action | Description |
|---|---|---|
| `?` | Show Shortcuts | Opens the in-app keyboard shortcuts reference dialog (when not typing in an input or textarea). |
| `Escape` | Dismiss Modal | Closes any open modal dialog (shortcuts, cohort list, wording assistant, settings). |
| `Ctrl + Shift + C` / `Cmd + Shift + C` | Copy Feedback | Assembles the current draft, copies it to the system clipboard, and records the student in the cohort store. |
| `Ctrl + Shift + E` / `Cmd + Shift + E` | Export Student Record | Generates and downloads the single-student Marker's Record spreadsheet (`.xlsx`). |
| `Ctrl + Shift + X` / `Cmd + Shift + X` | Export Cohort | Generates and downloads the multi-sheet class cohort workbook (`.xlsx`). |
| `Ctrl + Shift + N` / `Cmd + Shift + N` | New Student | Resets all criterion scores, feedback text, and marker notes for the next submission. |

### Focus mode navigation

When Focus Marking mode is enabled (`#focus-workspace`), keyboard navigation allows rapid stepping across assessment criteria:

| Key | Context | Action |
|---|---|---|
| `PageDown` | Focus Mode | Advances to the next assessment criterion. Ignored when typing inside the criterion feedback editor. |
| `PageUp` | Focus Mode | Returns to the previous assessment criterion. Ignored when typing inside the criterion feedback editor. |

### Input field navigation

Standard browser keyboard conventions apply across all input elements:

- **Dropdown selectors (`<select>`):** Press `Tab` to enter a criterion grade selector, then use the `Up Arrow` and `Down Arrow` keys to cycle through letter grades (`A+` through `D`).
- **Override inputs:** Use `Tab` to navigate to the score override field. Type numeric values directly, or use `Up Arrow` and `Down Arrow` to increment or decrement the score.
- **Section disclosure panels:** Focus on a `<details>` section header and press `Enter` or `Space` to expand or collapse the section.
