# Score Automator

A free, browser-based tool for educators to build custom assessment feedback tools (like the Feedback Kitchen) for any course or assessment.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Landing page / scorer dashboard |
| `builder.html` | 5-step wizard to create/edit a scorer |
| `scorer.html` | Live grading interface |
| `js/shared.js` | Shared logic, grade mappings, state, scoring engine |
| `js/excel.js` | Excel export (uses SheetJS CDN) |
| `netlify.toml` | Netlify deployment config |

## How to Deploy (Netlify)

**Option A — Drag & Drop (easiest):**
1. Go to https://app.netlify.com
2. Sign in (free account)
3. Drag this entire folder onto the Netlify "deploy" area
4. Done — you'll get a URL like `https://your-site.netlify.app`

**Option B — GitHub:**
1. Push this folder to a GitHub repo
2. Connect repo to Netlify
3. Netlify auto-deploys on every commit

## Local Use

Just open `index.html` in any modern browser — no server needed.

## How It Works

1. **Build** — Use the wizard in `builder.html` to define criteria, weights, rubric descriptors, and grade feedback text
2. **Grade** — Open `scorer.html`, enter student details, select a grade per criterion
3. **Export** — Copy feedback to clipboard, download Excel, or print to PDF

## Data Storage

All scorer configurations are saved to your browser's `localStorage`. Nothing is sent to any server. Export your configs as JSON to back them up or share with colleagues.
