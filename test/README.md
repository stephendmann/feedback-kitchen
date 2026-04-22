# Snippet CSV Import — Local Test Kit

## Files

| File | Purpose |
|---|---|
| `snippet-import-test.html` | Unit tests for the parser/serialiser. Open in browser, scan for PASS/FAIL. |
| `stp-snippets-transformed.csv` | Your real STP Report snippets, reshaped for 2-column import. **Use this to import into scorer.html.** |
| `sample-tricky.csv` | Edge-case CSV: commas, quotes, newlines in fields. |
| `sample-malformed.csv` | CSV with empty fields and a duplicate label. |

## How to test

### A — Run the unit tests
1. Open `snippet-import-test.html` in your browser (double-click or drag into tab).
2. All 11 sections should be green.

### B — Manual UI test against scorer.html
1. Open `scorer.html` (any config) in browser.
2. Open Manage Snippets modal.
3. **Export first** — to save your current snippets as a backup CSV.
4. **Import `sample-tricky.csv`** — should report "Imported: 5 · Skipped (empty): 0 · Skipped (duplicate labels): 0".
5. **Re-import the same file** — should now report 5 duplicates.
6. **Import `sample-malformed.csv`** — should report "Imported: 2 · Skipped (empty): 2 · Skipped (duplicate labels): 1".
7. **Import `stp-snippets-transformed.csv`** — should add 31 new snippets.
8. **Round-trip test** — export, then re-import the exported file. All should be flagged as duplicates.

## Notes on your original CSV

Your `Snippet overview.csv` had **3 columns** (`section,label,text`) and 8 section-header rows with empty text. The importer only reads columns 1 and 2, so raw import would produce labels like "1", "2" instead of "PI-CLARITY".

`stp-snippets-transformed.csv` drops the section column and the header rows. Also fixes the encoding corruption on PI-CLARITY (`problem�solution` → `problem-solution`).
