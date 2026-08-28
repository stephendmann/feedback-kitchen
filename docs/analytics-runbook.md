# Reading the usage numbers

Feedback Kitchen's usage reporting is assembled by hand once a month. This document is the procedure: where each number comes from, what has to stay true for the numbers to mean anything, and what is still outstanding.

It exists because the first-month report drew four conclusions the data did not support, and each one traced back to a measurement gap rather than a reading error. Those gaps are now closed; this is how they stay closed.

---

## What is measuring the site

Three layers, two of them feeding the monthly report.

| Layer | What it answers | Where it lives |
|---|---|---|
| Vercel Web Analytics | Visitors, page views, countries, devices, referrers | Injected per page, gated on `FK_INTERNAL` |
| Google Analytics 4 (`G-LQSJNBBPKZ`) | Engagement time, returning visitors, landing pages, workflow events | `gtag` block in each page head, live since 19 April 2026 |
| Vercel Speed Insights | Real-user load speed and Web Vitals | Injected alongside Web Analytics |

Every user-facing page carries all three: `index`, `scorer`, `builder`, `upload`, `convert`, `how-to-feedback-kitchen`. A page without them is invisible in reporting and reads as unvisited rather than unmeasured — that is exactly how `convert.html` and the how-to page went missing from the first report.

**If you add a page, add the analytics block to it.** Copy the head block from any existing page; it is self-contained.

### The hostname filter is not optional

`G-LQSJNBBPKZ` is not a Feedback Kitchen property. It also receives `www.stephendmann.com` and local development, so its headline totals are not FK figures and must never be quoted as such.

**Every GA4 reading for this report must be filtered to `Hostname` exactly matches `marking.stephendmann.com`.** Over 19 April to 28 August the property-wide total was 267 active users against 135 for Feedback Kitchen production. The filter is the difference between a figure you can publish and one you cannot.

---

## Before the first report using this procedure

Two setup steps, both one-off.

### 1. Activate the internal traffic filter in GA4

The site sends `traffic_type: 'internal'` for browsers flagged as the project's own, but GA4 ignores that parameter until a filter is switched on.

In GA4 → Admin → Data Streams → the FK stream → **Define internal traffic**, confirm a rule matching `traffic_type` equals `internal`, then Admin → **Data Filters** and set the internal traffic filter from *Testing* to **Active**.

Until that filter is Active, GA4 still counts developer sessions. The Vercel side needs nothing further — the scripts are simply not loaded for flagged browsers.

### 2. Flag every machine used for development or demos

Visit any page once on each browser you use for building, testing or demonstrating the product:

```
https://marking.stephendmann.com/?fk-internal=1
```

The flag is stored per browser and persists. To clear it:

```
https://marking.stephendmann.com/?fk-internal=0
```

This matters more than it looks. In the first month, twenty deployments landed inside a thirty-day window against a base of seventy-one visitors, and the operating-system split matched the project's own machines. An unknown but probably large share of that "audience" was the people building the product. Every figure was an upper bound on outside interest, and there was no way to say by how much.

Flag a new laptop, a phone used for a demo, or a colleague's machine you borrowed for testing. An unflagged demo to a room of people can move a monthly figure by a visible margin.

**Local development needs no flag.** `localhost`, `127.0.0.1`, `[::1]`, an empty hostname (`file://`) and any `*.local` host are treated as internal unconditionally, ahead of the stored flag. That is already in the pages.

The stored flag could never have covered them. `localStorage` is per-origin, so a flag set on `marking.stephendmann.com` does not exist on `localhost`, and nobody would think to set it there. Local sessions were reaching the live property until this was fixed.

---

## The monthly snapshot

Run this on the same day each month, over the same window length, so figures stay comparable.

1. **Vercel → Analytics**, production environment, last 30 days. Record visitors, page views, bounce rate, the per-page visitor counts, countries, devices, operating systems and any named referrers.
2. **Vercel → Speed Insights**, same window. Record the Web Vitals.
3. **GA4**, same window. Record engagement time, returning versus new visitors, and the workflow event counts below.
4. **Vercel → Deployments**, same window. Record the deployment count and build times.

### Rules that keep the numbers honest

These are the mistakes the first report made. Each one is easy to repeat.

- **Never add per-page visitor counts together.** A visitor who used both the upload and builder pages appears in both rows. Their combined reach is *at most* the sum and realistically well below it. Report them separately, or as a bounded range.
- **Page views per visitor is not pages per visitor.** Returning to the scorer three times counts three times. With six pages on the site, distinct pages per visitor is always lower.
- **Do not put a six-hour reliability snapshot beside a thirty-day audience figure without labelling both.** A zero error rate over six hours says nothing about the other 714 hours.
- **Do not report month-over-month percentages at this scale.** On a base under a few hundred visitors, a nine-point move is a handful of people and reads as far more meaningful than it is. Report the raw counts.
- **A zero function-invocation reading is a sampling artefact, not the architecture.** `api/garnish.js` and `api/parse-manual.js` are real serverless functions. They are simply not called on most page loads.
- **Page visits do not imply completed work.** Arrival on the scorer is not a marked student. That is what the workflow events are for.

---

## What the GA4 history showed

GA4 has been collecting since 19 April 2026. It was read for the first time over 19 April to 28 August 2026, filtered to Feedback Kitchen production. This is the baseline later reports are measured against, and the reason several of the rules above exist.

**Feedback Kitchen production over that period: 785 views, 135 users, 4m 51s average engagement.**

### The two systems disagree, and neither is wrong

Over the first report's window GA4 counted 41 users where Vercel counted 71. Treat **41 as the floor and 71 as the ceiling** — do not declare either correct. The gap is widest on the scorer: Vercel 44 users against GA4's 14.

Quote a range, or name the system a figure came from. Never add the two together.

### The scorer is real work

`/scorer.html` drew 27 users at **14m 58s** average engagement over the full period, and 14 users at 12m 38s inside the report window. Page titles name real Waikato assessments — `MRKTG102-26B Online Test 1` and `MRKTG307-26B Individual Seminar`.

That is the strongest evidence the tool is being used to mark rather than looked at and abandoned, and no page-view report can show it.

### The funnel narrows sharply

95 home to 55 builder to 27 scorer. `/upload.html` is the weak point: 45 users at 12 seconds, arriving and leaving.

### Feature use

`try_demo_scorer` fired 75 times from 52 users, the most-used feature by a wide margin. `manual_detect_count` has never fired, and `convert.html` has no production views at all.

### Acquisition

225 users arrived direct, then github.com 11, google organic 8 and linkedin 8. By sessions, Teams and Waikato SharePoint together contributed 51 — internal university channels are a working distribution path, not noise.

### Retention is thin, and not yet measured properly

Property-wide the period shows 267 active users against 278 new, so almost everyone is a first-timer. That figure spans all hostnames and is therefore not a Feedback Kitchen retention rate. **FK-only returning users have not been isolated** — that needs an Explore. Until someone builds it, this is an impression rather than a number.

---

## The workflow events

These answer the questions page views cannot. Each fires only on a confirmed success — a cancelled export, a failed assistant call, an auth error or a quota-blocked write is not counted.

| Event | Means | Parameters |
|---|---|---|
| `scorer_created` | A scorer was saved for the first time | `criteria_count` |
| `scorer_imported` | A scorer JSON parsed and passed validation | `criteria_count` |
| `student_scored` | A student record was committed to a cohort | `replaced`, `cohort_size` |
| `feedback_copied` | Feedback was copied to the clipboard | `saved_to_cohort` |
| `cohort_exported` | A cohort workbook was actually written | `format`, `student_count` |
| `wording_assistant_used` | The assistant returned usable text | `model`, `prompt_chars` |

Three older events also report: `kofi_click`, `try_demo_scorer` and `manual_detect_count`.

**All of these are counts and structure only.** No student name, ID, score, rubric wording, feedback text, prompt or response ever leaves the page. Keep it that way — if a future event needs student data to be useful, it is the wrong event.

`student_scored` is the closest available proxy for "a student was marked", not a direct measure. It fires when a record reaches a cohort, which is the last point the browser can observe.

---

## Keeping the cache safe

`/js` and `/css` are served `immutable` for a year. That is only safe because every reference carries a `?v=` stamp matching `FK_VERSION` in `js/shared.js`.

**When you bump `FK_VERSION`, restamp every page.** `js/asset-versioning.test.js` fails until you do, which is the point — a stale or missing stamp means returning markers keep running last release's JavaScript for up to a year with no way to force a refresh.

The same guard asserts that the `/js/xlsx.full.min.js` rule stays *below* the general `/js/:path*` rule in `vercel.json`. Vercel applies the last matching rule, not the most specific, so reordering those silently drops that file's long cache.

---

## Archived snapshots stay off production

`_snapshots/` holds frozen copies of earlier builds. It stays in git — other guards treat it as history and `scripts/check-lazy-load.js` already excludes it — but it must never be reachable on the live site.

It was reachable. `/_snapshots/pre-wording-assistant-20260505-0042/` returned 200 for all three of its pages, carried the live GA and Vercel tags and had no `noindex`, so a four-month-old copy of the marking tool was usable, crawlable, and reporting into the production figures. GA4 showed only `127.0.0.1` had reached it, which was luck rather than protection.

`.vercelignore` now excludes `_snapshots` from the deployment, so those paths 404 in production. **That ignore file is the control.** `robots.txt` disallows the same path as hygiene for anything already crawled; it is not what keeps the directory off the site.

If you archive another build, add it to `.vercelignore` in the same commit. An archived copy that ships is a stale marking tool carrying its own analytics tags and its own unfixed bugs.

---

## Still outstanding

One decision this procedure cannot make for itself.

**Automating the snapshot.** The current Vercel plan is Hobby, and its Web Analytics API returns `not_found` on that tier — which is why steps 1 to 4 above are manual dashboard reads. Two ways out: upgrade the plan, or use GA4's Data API, which is free and already holds four months of history predating the first report. Until one is chosen, the snapshot stays hand-assembled and the figures cannot be regenerated after the fact.
