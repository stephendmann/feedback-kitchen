# Usage reading — August 2026

Feedback Kitchen is in real use as a marking tool, not a brochure. That is the finding, and it comes from a part of the data the first report could not see: how long people stay on the scorer, and what their scorers are named.

This is the canonical usage reading. It supersedes the first-month report as the document to cite. See [Status of the first-month report](#status-of-the-first-month-report) at the end.

The procedure behind these figures is `docs/analytics-runbook.md`. This document is the reading; the runbook is the method.

---

## Scope

**Canonical audience figures are hostname-filtered to `marking.stephendmann.com` only.**

`G-LQSJNBBPKZ` is not a Feedback Kitchen property. It receives three sites: Feedback Kitchen production, `www.stephendmann.com`, and local development. Property-wide totals from that account are not Feedback Kitchen numbers and must never be quoted as such.

Two windows appear below, and every figure is labelled with the one it came from.

| Window | Span | What it is |
|---|---|---|
| Four-month window | 19 April – 28 August 2026 | GA4 has been collecting since 19 April 2026. This is the full history, read for the first time. |
| Report window | 29 July – 28 August 2026 | The 30 days covered by the first-month report. |

Do not compare a figure from one window against a figure from the other.

Both windows also close on or before **28 August 2026**, and that date is a boundary. On it, local hostnames stopped reporting and the GA4 internal traffic filter went Active. GA4 filters are not retroactive, so every figure in this document was collected before that cleanup and still contains internal traffic. Later readings will be cleaner and therefore smaller — that is filtering, not a decline. `docs/analytics-runbook.md` carries the detail.

---

## Read these rules before the numbers

The first report's conclusions failed on measurement, not arithmetic. These are the constraints that make the figures below usable.

**The hostname filter is mandatory.** Without it the totals include another site and every development session. There is no way to recover a clean figure afterwards.

**Roughly 40% of the unfiltered GA record was local development.** `localhost` and `127.0.0.1` fire GA exactly as production does, and those sessions were reaching the live property. This is fixed: local hostnames are now treated as internal unconditionally. The `fk-internal` flag could never have covered them, because `localStorage` is per-origin — a flag set on the production domain does not exist on `localhost`.

**Never add per-page user counts together.** Someone who used both the builder and the scorer appears in both rows. The rows are not additive in any direction.

**GA and Vercel disagree, and neither is wrong.** Over the report window GA counted 41 users where Vercel counted 71. Treat **41 as the floor** — GA loses ad-blocked sessions — and **71 as the ceiling**. The gap is widest on the scorer: Vercel 44 against GA's 14. Quote a range, or name the system a figure came from.

**Page views are not completed marking.** Arrival on the scorer is not a marked student. `student_scored` is the proxy for that, and it will be usable once events accumulate. This reading leans on engagement time and page titles instead, because that is what four months of history actually contains.

**No month-over-month percentages.** At this scale a percentage move is a handful of people and reads as far more than it is.

---

## Feedback Kitchen production, four-month window

Hostname-filtered to `marking.stephendmann.com`, 19 April – 28 August 2026.

**785 views, 135 users, 4m 51s average engagement.**

| Page | Views | Users | Average engagement |
|---|---|---|---|
| `/index.html` | 320 | 95 | 39s |
| `/scorer.html` | 247 | 27 | 14m 58s |
| `/builder.html` | 124 | 55 | 3m 11s |
| `/upload.html` | 60 | 45 | 12s |
| `/` | 34 | 16 | 14s |

`convert.html` recorded zero production views across the whole period. The converter is unused, not broken.

---

## The number that changes the story

`/scorer.html`: **27 users at 14m 58s average engagement** over the four-month window, and 14 users at 12m 38s inside the report window.

Fifteen minutes on a page is not evaluation. It is work.

The page titles say what that work is:

| Scorer | Views | Users |
|---|---|---|
| Feedback Kitchen — MRKTG102 HAM & NET 2026 — MRKTG102-26B Online Test 1 | 51 | 8 |
| Feedback Kitchen — MRKTG307 HAM & NET 2026B — MRKTG307-26B Individual Seminar | 14 | 4 |

Real Waikato courses, configured scorers, actual assessments. No page-view report can show this, which is why the first report could describe reach and nothing else.

---

## Where people fall out

The funnel narrows sharply: **95 home → 55 builder → 27 scorer.**

`/upload.html` is the clearest experience leak in the data: **45 users at 12 seconds.** People arrive and leave. Forty-five is a larger audience than the scorer's 27 — this is not a traffic problem, it is what happens after they land.

Recorded here as a finding. Whether to redesign that page is a separate decision and is not part of this reading.

---

## Events and acquisition

Custom event counts are property-wide and are not hostname-filtered. They indicate direction, not Feedback Kitchen totals.

- **`try_demo_scorer`: 75 times from 52 users** — the most-used feature by a wide margin.
- **`manual_detect_count`: never fired.** Consistent with `convert.html` having no production views.

Acquisition, also property-wide over the four-month window:

| Source | Users |
|---|---|
| Direct | 225 |
| github.com | 11 |
| google organic | 8 |
| linkedin.com | 8 |

By sessions, Microsoft Teams and Waikato SharePoint together contributed **51**. Internal university channels work as a distribution path — that is a route worth using deliberately rather than an accident.

Cities, property-wide: Tauranga 49, Sydney 46, Melbourne 23, Hamilton 15, Auckland 14.

---

## Retention is thin, and not properly measured

Property-wide the four-month window shows **267 active users against 278 new**. Almost everyone is a first-timer.

That figure spans all three hostnames, so it is not a Feedback Kitchen retention rate. **FK-only returning users have not been isolated.** Doing so needs an Explore in GA4. Until someone builds it, this is an impression and must not be reported as a number.

---

## What shipped after the first report

The first report listed its changes as "implemented and awaiting the next release". That line is now wrong: both pull requests have merged and are live in production.

**PR #116** (merge commit `09c104c`) — Vercel Speed Insights on every page, six workflow events (`scorer_created`, `scorer_imported`, `student_scored`, `feedback_copied`, `cohort_exported`, `wording_assistant_used`), and cache headers.

**PR #117** (merge commit `e2ac0bc`):

- `fk-internal` flag, with local hostnames treated as internal unconditionally.
- Asset stamps aligned to `FK_VERSION` 2.5.1, with `/js` and `/css` served `immutable` for a year.
- The scorer's application logic extracted to `js/scorer-app.js` so browsers can cache it.
- `docs/analytics-runbook.md`.
- `_snapshots/` no longer deployed. `.vercelignore` is the control; the `robots.txt` `Disallow` is hygiene for anything already crawled.

Verified live on `marking.stephendmann.com`:

- The archived `_snapshots/` URLs return 404.
- `robots.txt` is present.
- `/index.html` returns 308 to `/`.
- `js/shared.js?v=2.5.1` is served `Cache-Control: max-age=31536000, immutable`.

---

## Still outstanding

None of these are in this document's pull request.

- **Flag demo machines** with `?fk-internal=1`. Local development is covered automatically; demo laptops and phones are not.
- **Automating the monthly snapshot.** The Hobby plan's Web Analytics API returns `not_found`, so the figures stay hand-read.
- **CodeQL relocation alerts** against `js/scorer-app.js` — pre-existing findings now reported at a new path. Separate work.
- **Whether to redesign `/upload.html`.**

---

## Status of the first-month report

The first-month report covers 29 July – 28 August 2026 and was prepared on 28 August 2026. It remains on file as a dated first draft.

Its measurement was contaminated: unfiltered, and inclusive of development traffic it had no way to identify. Its headline figures are not wrong so much as unattributable — they mix sources the reader cannot separate.

**This document is the one to cite.**
