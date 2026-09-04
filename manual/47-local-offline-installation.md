# Local Offline Installation

Feedback Kitchen can run entirely offline on an isolated or air-gapped machine without an active internet connection.

### Downloading the repository

To prepare an offline installation:

1. Clone the repository using Git:
   ```bash
   git clone https://github.com/stephendmann/feedback-kitchen.git
   cd feedback-kitchen
   ```
2. Or download and extract the repository ZIP archive from GitHub to an external USB drive or local directory.

All core styling (`css/tailwind.out.css`) and spreadsheet generation libraries (`js/xlsx.full.min.js`) are vendored locally within the repository.

### Running with a lightweight local server

Modern browsers enforce strict security boundaries on some APIs when loading raw `file://` URLs. Running a minimal local static server provides the cleanest offline experience:

#### Option A: Node.js Built-in Dev Server
```bash
node dev-server.js
# Opens on http://localhost:3000
```

#### Option B: Python 3 Built-in HTTP Server
```bash
python3 -m http.server 8000
# Opens on http://localhost:8000
```

#### Option C: Caddy File Server
```bash
caddy file-server --listen :8000
```

### Direct filesystem execution (`file://`)

You can also double-click `index.html` to open Feedback Kitchen directly from your filesystem:

- All core grading calculations, rubric builders, personal snippets, and draft autosaves operate normally.
- Single Marker Records and Cohort Workbooks generate offline using the local SheetJS binary.

### Air-gapped marking environments

For confidential examination marking, military assessments, or secure medical licensing exams:

- Load Feedback Kitchen onto an air-gapped laptop.
- Mark student cohorts with zero external network connectivity.
- Export results to encrypted USB drives via `.xlsx` workbooks and `.json` scorer backups.
