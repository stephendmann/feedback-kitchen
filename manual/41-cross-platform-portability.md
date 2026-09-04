# Cross-Platform Portability

Feedback Kitchen is built on open web standards. It operates seamlessly across all major operating systems, device architectures, and hardware form factors without installation or platform-specific drivers.

### Supported operating systems

Feedback Kitchen runs identical code across:

- **Linux:** Arch Linux, Omarchy, Ubuntu, Fedora, Debian, openSUSE.
- **macOS:** Apple Silicon (M1/M2/M3/M4) and Intel Macs running Safari, Chrome, Edge, or Firefox.
- **Windows:** Windows 10 and Windows 11 running Microsoft Edge, Chrome, or Firefox.
- **ChromeOS:** Chromebooks in native Chrome browser mode.
- **iPadOS & Android:** Tablets and mobile browsers with responsive touch ergonomics.

### Portable file interchange formats

All data produced by Feedback Kitchen uses standard, cross-platform file schemas:

| File Type | Format | Universal Compatibility |
|---|---|---|
| **Assessment Scorers** | `.json` (UTF-8) | Plain-text JSON files easily shared across email, cloud drives, or git repositories. |
| **Excel Workbooks** | `.xlsx` (OpenXML) | Fully compatible with Microsoft Excel (Windows/macOS/Web), LibreOffice Calc, Apple Numbers, and Google Sheets. |
| **Moodle Worksheets** | `.csv` (RFC-4180) | Formatted with universal UTF-8 character encoding and standard CRLF line terminators accepted by any Moodle server. |
| **Personal Snippets** | `.csv` (Plain Text) | Structured comma-separated files importable across all modern spreadsheet editors. |

### Offline hardware portability

Because the entire application runs in the browser using client-side JavaScript:

- You can mark on a laptop while traveling on a flight or train without an active Wi-Fi connection.
- Scorers and student cohorts remain accessible in browser cache.
- Excel workbooks and Moodle CSV files can be generated and saved directly to your local drive completely offline.
