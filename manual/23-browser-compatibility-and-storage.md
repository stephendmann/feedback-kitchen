# Browser Compatibility and Storage

Feedback Kitchen is built on standard web technologies and operates across all current desktop and mobile web browsers without plugins or native extensions.

![Browser storage architecture](images/ch23-storage-architecture.png)

### Browser support matrix

| Browser Family | Supported Versions | File Save Experience |
|---|---|---|
| **Google Chrome / Chromium** | Latest 3 versions | Uses the native **File System Access API** (`showSaveFilePicker`) to let you choose your target course folder directly. |
| **Microsoft Edge** | Latest 3 versions | Native Save-As picker dialog with persistent directory memory. |
| **Mozilla Firefox** | Latest ESR and standard | Standard blob anchor download to default system `Downloads` folder. |
| **Apple Safari (macOS / iOS)** | Safari 16+ | Standard blob anchor download to default download location. |

### Local storage engine

All application state is stored locally in the browser's `localStorage` partition under specific namespaced keys:

| Storage Key | Stored Content | Scope |
|---|---|---|
| `SA_CONFIGS` | JSON array of all saved assessment scorers (criteria, rubrics, scales, templates). | Global origin |
| `SA_ACTIVE` | Identifier string of the currently open scorer. | Global origin |
| `SA_SNIPPETS` | Personal feedback snippets library (`label`, `text`, `category`). | Global origin |
| `SA_COHORT_<scorerId>` | Array of marked student records for that specific assessment scorer. | Per Scorer |
| `SA_SCORER_SETTINGS_V1` | Scorer preferences (Moodle integration toggle, tutor persistence). | Global origin |
| `fk-theme` | Visual theme preference (`"light"` or `"dark"`). | Global origin |

### Storage quotas and write-hardening

Modern browsers allocate between 5MB and 10MB of storage to `localStorage` per origin.

- **Typical Consumption:** A complete assessment scorer consumes approximately 10KB. A cohort of 100 students with full feedback transcripts occupies roughly 150KB.
- **Write-Hardening:** All write operations are wrapped in structured exception guards.
- **Quota Warnings:** If local storage reaches browser capacity (`QuotaExceededError`), Feedback Kitchen displays an advisory banner prompting you to export your active cohort to Excel and clear completed historical cohorts.

### Private and incognito browsing

If you run Feedback Kitchen in an incognito or private browsing window:

- The browser creates an ephemeral `localStorage` container that is completely destroyed when the window closes.
- Always export your scorer configurations (`.json`) and cohort workbooks (`.xlsx`) before closing an incognito session.
