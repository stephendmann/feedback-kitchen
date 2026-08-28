# Reading the usage numbers

Feedback Kitchen's usage reporting is assembled by hand once a month. This document is the procedure: where each number comes from, what has to stay true for the numbers to mean anything, and the two decisions still outstanding.

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

## Still outstanding

Two decisions this procedure cannot make for itself.

**Automating the snapshot.** The current Vercel plan is Hobby, and its Web Analytics API returns `not_found` on that tier — which is why steps 1 to 4 above are manual dashboard reads. Two ways out: upgrade the plan, or use GA4's Data API, which is free and already holds four months of history predating the first report. Until one is chosen, the snapshot stays hand-assembled and the figures cannot be regenerated after the fact.

**The unread GA4 history.** GA4 has been collecting since 19 April 2026 and nothing has drawn on it. It holds engagement time, returning-visitor rates and landing-page data for a period no Vercel report covers. Reading it is the cheapest remaining source of insight about the early audience.
