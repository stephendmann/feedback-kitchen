# Browser Compatibility and Storage

Feedback Kitchen is built on standard web technologies and operates across all current desktop and mobile web browsers without plugins or native extensions.

### Browser support matrix

| Browser Family | Supported Versions | File Save Experience |
|---|---|---|
| **Google Chrome / Chromium** | Latest 3 versions | Uses the native **File System Access API** (`showSaveFilePicker`) to let you choose your target course folder directly. |
| **Microsoft Edge** | Latest 3 versions | Native Save-As picker dialog with persistent directory memory. |
| **Mozilla Firefox** | Latest ESR and standard | Standard blob anchor download to default system `Downloads` folder. |
| **Apple Safari (macOS / iOS)** | Safari 16+ | Standard blob anchor download to default download location. |

### Local storage engine

Application state is stored locally in the browser's `localStorage` partition under namespaced keys. The ones worth knowing about:

| Storage Key | Stored Content | Scope |
|---|---|---|
| `SA_CONFIGS` | JSON array of all saved assessment scorers (criteria, rubrics, scales, templates). | Global origin |
| `SA_ACTIVE` | Identifier string of the currently open scorer. | Global origin |
| `SA_SNIPPETS` | Personal feedback snippets library (`label`, `text`, `category`). | Global origin |
| `SA_COHORT_<scorerId>` | Array of marked student records for that specific assessment scorer. | Per Scorer |
| `SA_DRAFT_V1_<scorerId>` | The in-progress student for that scorer, offered back by the resume banner. | Per Scorer |
| `SA_SCORER_SETTINGS_V1` | Device settings: advanced wording tools, cohort consistency indicator, clear marker name between students. | Global origin |
| `SA_SECTION_STATE_V1` | Which sections you left open or collapsed. | Global origin |
| `fk-theme` | Visual theme preference (`"light"` or `"dark"`). | Global origin |
| `SA_FK_USER`, `SA_FK_PASS` | Ko-fi supporter username and password, as ordinary text, unlocking the wording assistant and the PDF converter. Also copied into `sessionStorage` so the upload and convert pages share them within a session. See chapter 45. | Global origin |

Other keys hold interface state that matters to nobody but you: whether focus mode was on, the audience and length last chosen for generated feedback, and a local counter (`scorer.usage.v1`) that records how often you use each feature and never leaves the device.

### Storage quotas and write-hardening

Modern browsers allocate between 5MB and 10MB of storage to `localStorage` per origin.

- **Typical Consumption:** A complete assessment scorer consumes approximately 10KB. A cohort of 100 students with full feedback transcripts occupies roughly 150KB.
- **Write-Hardening:** All write operations are wrapped in structured exception guards.
- **Quota Warnings:** If local storage reaches browser capacity (`QuotaExceededError`), the save is refused and an amber notice tells you so, rather than the write failing silently. Export your active cohort to Excel and clear completed historical cohorts to make room. The student on screen is not saved until that succeeds, so do not clear the page first.

### Private and incognito browsing

If you run Feedback Kitchen in an incognito or private browsing window:

- The browser creates an ephemeral `localStorage` container that is completely destroyed when the window closes.
- Always export your scorer configurations (`.json`) and cohort workbooks (`.xlsx`) before closing an incognito session.
