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

Feedback Kitchen has to be served over HTTP, even offline. Any of these will do it, and none of them needs a network:

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

### Why `file://` does not work

Opening `index.html` by double-clicking it will not run Feedback Kitchen. Every page loads its scripts and stylesheets from root-absolute paths (`/js/shared.js`, `/css/tailwind.out.css`), which a `file://` URL resolves against the root of your filesystem rather than the repository folder. The page appears unstyled and nothing works, because `shared.js` never loads.

Use one of the local servers above. They need no internet connection, only a process on your own machine.

### Air-gapped marking environments

For confidential examination marking, military assessments, or secure medical licensing exams:

- Load Feedback Kitchen onto an air-gapped laptop.
- Mark student cohorts with zero external network connectivity.
- Export results to encrypted USB drives via `.xlsx` workbooks and `.json` scorer backups.
