# Feedback Kitchen — Phase 0 Decisions (ADR)

**Status:** Draft for Claude Design sign-off
**Date:** 2026-05-14
**Author:** Stephen Mann (UI review pass)
**Scope:** Blocking decisions that must land before Phase 1 (token foundation) can proceed.

---

## How to use this document

Four decisions are listed below. Each has:
- **Context** — what's currently in the export and why a decision is needed.
- **Options** — concrete alternatives with trade-offs.
- **Recommendation** — the option I'd pick, with reasoning.
- **Decision** — left blank for Claude Design to fill in.

Sign-off format: tick the chosen option and add initials + date in the **Decision** block. If a different option is preferred, strike through the recommendation and note why.

---

## D1 — Canonical hero gradient

### Context

Two different gradient definitions exist in the export and they don't match.

| Source | Definition | Stops |
|---|---|---|
| `ui_kits/feedback-kitchen/styles.css` (line 18) | `linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)` | 2 |
| `preview/component-fk-stats.html` (line 7) | `linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)` | 2 |
| `ui_kits/feedback-kitchen/Components.jsx` (dash-head, inferred) | matches `styles.css` | 2 |
| `fk-tokens.js` (`bg-fk-hero`, line 42) | `linear-gradient(135deg, #1E3A8A 0%, #1E40AF 40%, #2563EB 100%)` | 3 |
| `MANIFEST.md` / parent README | "blue-800 → blue-600 diagonal" — describes 2-stop | — |

The README and the rendered CSS agree on 2-stop. The Tailwind token is the outlier.

### Options

**Option A — Lock the 2-stop (`#1E40AF → #2563EB`)**
- Matches what's actually rendering today.
- Matches the README's stated rule ("blue-800 → blue-600").
- Simpler to reason about; one fewer colour to govern.
- Loses the deeper `#1E3A8A` shoulder that gives the 3-stop a richer top-left corner.

**Option B — Lock the 3-stop (`#1E3A8A → #1E40AF → #2563EB`)**
- Visually richer; the navy shoulder reads as more premium on a large hero.
- Requires updating `styles.css`, `Components.jsx`, `component-fk-stats.html`, and the README rule.
- Introduces a new colour (`#1E3A8A`, blue-900) to the FK palette.

**Option C — Lock the 2-stop for surfaces, allow the 3-stop only for OG/social imagery**
- Surfaces stay simple; marketing assets get the richer rendering.
- Adds a governance edge case ("which gradient is this?").

### Recommendation

**Option A.** The README is the canonical brand rule and the live site already renders 2-stop. Updating one Tailwind token is cheaper than updating three CSS files plus the README. The 3-stop's visual richness is real but marginal at viewport scale; it's not worth the governance cost.

If the 3-stop is judged worth keeping, **Option C** is the next-best — but only if there's a specific marketing artefact that demands it. Don't keep it "just in case."

### Decision

```
[ ] Option A — 2-stop (#1E40AF → #2563EB)        ← recommended
[ ] Option B — 3-stop (#1E3A8A → #1E40AF → #2563EB)
[ ] Option C — 2-stop on surface, 3-stop on marketing only

Signed:                                Date:
```

---

## D2 — Canonical emoji vocabulary

### Context

The emoji set has drifted across four documents. Marking-view chrome introduces a further eight emoji that aren't in any vocabulary list.

| Source | Emoji set | Count |
|---|---|---|
| Parent README (per export brief) | `🛠 💬 ↺ ⚙ ↑ 🗑 ✓ ✕ 👋 🔒 ✨` | 11 |
| `MANIFEST.md` | adds `⚖ ⏱` | 13 |
| `preview/brand-emoji.html` | `🛠 💬 ↺ ⚙ 📥 🗑 ✓ ✕ 👋 🔒 ✨ 📚` (drops `↑ ⚖ ⏱`, adds `📥 📚`) | 12 |
| `preview/component-marking-view.html` (introduced ad-hoc) | `📄 📎 🔍 ✏️ 🖍 🔗 ⌨ 💾` | 8 |

There are effectively three categories in flight:
1. **Action verbs** (`🛠 💬 ↺ 📥 🗑 ✓ ✕`)
2. **Status / meta** (`🔒 ✨ 👋 ⚖ ⏱ 📚`)
3. **App chrome** (`📄 📎 🔍 ✏️ 🖍 🔗 ⌨ 💾 ⚙`)

The brand rule was "emoji as functional icons, with a canonical set" — but the canonical set has no room for the chrome category that the marking surface needed.

### Options

**Option A — Single flat vocabulary, expand to include marking-view chrome**
- One list, one rule. Easy to govern.
- The list grows to ~20+ and stops feeling curated.
- Risk: future surfaces keep adding "one more" emoji and erode the rule entirely.

**Option B — Two-tier vocabulary: Core + App Chrome**
- **Core** (governs marketing/landing/cards/CTAs): the canonical eleven from the README, plus `📥 📚` which are already in production use.
- **App Chrome** (governs marking surfaces only): `📄 📎 🔍 ✏️ 🖍 🔗 ⌨ 💾 ⚙`.
- Each tier has its own admission rule. New core emoji require a system update; new chrome emoji require a marking-surface review only.
- Slightly more complex to govern but the boundary is real and useful.

**Option C — Replace marking-view chrome with Lucide icons; keep Core emoji-only**
- Cleanest separation: emoji = brand voice, line icons = app machinery.
- Breaks the README rule that "Lucide is not in FK's vocabulary."
- Requires re-skinning the marking view.

### Recommendation

**Option B.** The marking surface already proved the canonical set was insufficient. Two tiers acknowledges reality without abandoning the brand rule. The boundary ("marketing/landing/cards" vs "marking app chrome") is intuitive and stable.

Specifically:

**Core (12):** `🛠 💬 ↺ ⚙ 📥 🗑 ✓ ✕ 👋 🔒 ✨ 📚`
- Drops `↑` (better as Lucide-free SVG arrow), `⚖ ⏱` (never used in any rendered surface).
- Adds `📥 📚` which are in active production use.

**App Chrome (9):** `📄 📎 🔍 ✏️ 🖍 🔗 ⌨ 💾 ⚙`
- `⚙` appears in both tiers intentionally — it's the universal settings affordance.

**Out of vocabulary entirely:** anything not in the two lists above. Adding a new emoji requires a documented decision (same format as this ADR).

### Decision

```
[ ] Option A — Single flat vocabulary
[ ] Option B — Two-tier: Core + App Chrome     ← recommended
[ ] Option C — Lucide for chrome, emoji for Core only

If B, confirm exact Core set:                  Confirm exact App Chrome set:

Signed:                                Date:
```

---

## D3 — Focus ring specification

### Context

The export has no system-wide focus ring. Only the rubric textarea defines one:

```css
.desc textarea:focus {
  outline: none;
  border-color: var(--fk-blue);          /* #2563EB */
  box-shadow: 0 0 0 3px var(--fk-blue-100); /* #DBEAFE — blue@~20% */
  background: #fff;
}
```

Every other interactive control (buttons, nav links, status pills, level cells, nudgers, tabs) relies on browser-default focus. On Chromium that's a 2px solid `Highlight` colour outline — visually inconsistent with FK's rounded language and the 3px blue halo above.

### Options

**Option A — Promote the existing textarea ring to a global token**
- Token: `boxShadow.fk-focus` = `0 0 0 3px rgba(37,99,235,.35)`
- 3px halo at ~35% opacity (slightly stronger than the current `#DBEAFE` solid, for non-input controls that don't have the white inner border to lift it).
- Applied via `:focus-visible` (not `:focus`) so it only shows for keyboard users.
- Pairs with `outline: 2px solid transparent` for high-contrast mode.

**Option B — Two-tier: one ring for inputs (current), a tighter ring for buttons**
- Inputs keep the existing `0 0 0 3px #DBEAFE`.
- Buttons get `0 0 0 2px #fff, 0 0 0 4px #2563EB` (the "halo-and-ring" pattern, similar to GitHub).
- Visually crisper on solid buttons but more code to govern.

**Option C — Use CSS `outline` instead of `box-shadow`**
- `outline: 3px solid rgba(37,99,235,.35); outline-offset: 2px;`
- Respects border-radius in modern browsers, doesn't trigger layout shift.
- Trade-off: `outline-offset` can clip against tightly-packed parent containers (the rubric matrix cells, the marking-view level grid).

### Recommendation

**Option A** for simplicity and consistency, with one caveat: use `:focus-visible`, not `:focus`. This avoids the "every click leaves a glowing button" problem mouse users hate while preserving keyboard accessibility.

Token to add to `fk-tokens.js`:

```js
boxShadow: {
  // ...existing entries
  'fk-focus': '0 0 0 3px rgba(37,99,235,.35)',
}
```

Global rule to add to `styles.css`:

```css
:focus { outline: none; }
:focus-visible {
  outline: 2px solid transparent;          /* high-contrast mode */
  box-shadow: var(--fk-focus, 0 0 0 3px rgba(37,99,235,.35));
  border-radius: inherit;
}
```

Inputs keep their existing tighter ring (it pairs with the border-colour change, which buttons can't do). Everything else inherits the global rule.

### Decision

```
[ ] Option A — Single global ring, :focus-visible only       ← recommended
[ ] Option B — Two-tier (input vs button)
[ ] Option C — CSS outline instead of box-shadow

Confirm token spec:  0 0 0 3px rgba(37,99,235,.35)   [ ] yes  [ ] adjust to: __________

Signed:                                Date:
```

---

## D4 — Descriptor character-counter soft cap

### Context

The rubric editor renders a character count under each descriptor cell:

```
22 – 25         248 chars
```

There's no target, threshold, or styling change at any length. Rendered counts in the export range from 176 to 276 characters. The kit's anatomy notes argue for "parallel descriptors" — descriptors that share grammatical shape across a row, which naturally tend toward similar lengths.

The original review recommended either soft-capping at ~280 characters (the parallel-descriptor sweet spot) or removing counters entirely except when over cap.

### Options

**Option A — Soft cap at 280, amber over 320, rose over 400**
- Counter is always visible but stays neutral colour up to 280.
- Three states: neutral (`<= 280`), amber (`281–320`), rose (`> 320`).
- Cap is advisory, not enforced — descriptors can exceed it, the writer just sees a warning.
- Reasoning: 280 is roughly the longest descriptor in the export (276); 320 is ~15% headroom; 400 is "this is now a paragraph, not a descriptor."

**Option B — Hide counter until over soft cap**
- Counter only appears when `> 280` chars, coloured amber.
- Cleaner default; counter becomes a warning rather than a meter.
- Risk: writers who care about parity won't know they're drifting until they cross the line.

**Option C — Show counter, no thresholds, no colour change**
- Status quo. Acknowledges that the rubric editor is for power users who know what they're doing.
- Loses an easy lever for descriptor parity.

**Option D — Show *relative* length, not absolute**
- Instead of "248 chars", show a 4-segment dot meter showing this descriptor's length relative to its row siblings: `●●●○` if shortest, `●●●●` if longest.
- Surfaces row parity directly (the actual design goal).
- More complex to implement; less informative for editors writing a row from scratch (no comparison yet).

### Recommendation

**Option A** for the next phase, with a note to consider Option D as a Phase 4 enhancement.

Option A is the cheapest improvement that surfaces the soft cap. Option D is the right *eventual* answer because it operationalises the actual goal (row parity), but it requires more thought and shouldn't block Phase 1.

Specific thresholds:

| Range | State | Colour |
|---|---|---|
| 0–280 | Neutral | `--fk-ink-4` (`#94A3B8`, current) |
| 281–320 | Approaching cap | `--fk-amber-fg` (`#92400E`) |
| 321+ | Over cap | `--fk-rose-fg` (`#B91C1C`) |

### Decision

```
[ ] Option A — Soft cap 280, amber 320, rose 400          ← recommended
[ ] Option B — Hidden until over cap
[ ] Option C — No thresholds (status quo)
[ ] Option D — Relative-length dot meter (defer to Phase 4)

If A, confirm thresholds:  280 / 320 / 400   [ ] yes  [ ] adjust to: __________

Signed:                                Date:
```

---

## Summary table — for fast sign-off

| ID | Decision | Recommendation |
|---|---|---|
| D1 | Hero gradient | **Option A** — 2-stop `#1E40AF → #2563EB` |
| D2 | Emoji vocabulary | **Option B** — Two-tier: Core (12) + App Chrome (9) |
| D3 | Focus ring | **Option A** — Global `0 0 0 3px rgba(37,99,235,.35)` via `:focus-visible` |
| D4 | Descriptor soft cap | **Option A** — 280 / 320 / 400 thresholds |

---

## What unblocks once these four are signed off

- **Phase 1 (token foundation)** can start immediately. Specifically:
  - `fk-tokens.js` gets `boxShadow.fk-focus`, reconciled `fk-hero`, `colors.fk.status.*`
  - `fk-emoji-registry.md` is authored from D2
  - `styles.css` + all `preview/*.html` are tokenised against the above
- **Phase 2 (a11y)** can start in parallel; D3 is its primary input.
- **Phase 4 (rubric editor polish)** waits on D4 but doesn't block earlier phases.

---

## Open questions deferred from this round

These came up during review but didn't rise to "blocking." Logged here so they're not lost:

1. **Do partner logos in grayscale meet brand-guideline contrast on dark backgrounds?** Currently only tested on `#F8FAFC`.
2. **Should `↺` (reset) be replaced with a Lucide rotate-ccw icon?** It's the only Unicode arrow in the Core set and looks visually lighter than the surrounding emoji.
3. **Is the footer credit footnote required on `component-marking-view.html` and `component-rubric-editor.html`?** README says "every page" but the marking view has no footer at all.

These can be folded into Phase 5 or addressed separately.

---

# Post-signing amendments (mirror sync log)

This section tracks decisions made after the Phase 0 ADR was countersigned. The canonical countersigned ADR lives in CD's tree; this mirror copy summarises the deltas so a local reader doesn't need CD's tree to see current state.

---

## Phase 0 outcome (signed)

D1–D4 all landed on a different option than the draft above:

| ID | Signed value | Notes |
|---|---|---|
| **D1** | **Option B (3-stop)** — `linear-gradient(135deg, #1E3A8A 0%, #1E40AF 40%, #2563EB 100%)` | Mid stop at 40% (not 45%). Pass 1.0 drifted to 45%, Pass 1.1 reverted. |
| **D2** | Superseded by **Addendum A — Resolution C** | Three tiers: `wired` (12) + `appChrome` (9, with `uses[]`) + `dropped` (9). |
| **D3** | Teal-based focus ring (not the draft blue) | `--fk-focus-shadow: 0 0 0 3px rgba(0,85,119,.20), 0 0 0 1px #005577` via `.fk-focus-ring:focus-visible`. Pairs with `outline: 2px solid transparent` for HCM. |
| **D4** | **Option A** with inclusive `<=` semantics | `hidden ≤200 · neutral 200–280 · amber 281–320 · rose 321+`. Wired + locked at Phase 4 Pass 2 ratification (7 boundary cases: 199/200/280/281/320/321/400 → hidden/hidden/neutral/amber/amber/rose/rose). |

---

## D5 — C4 add-criterion redistribution semantics

**Locked at Phase 4 Pass 2 (2026-05-16).**

### Decision

Redistribution on add-criterion when weight-sum = 100 is **proportional**, not literal flat-10.

```
For previous criterion count n, on choosing "redistribute":
  each existing weight w → round(w × n/(n+1))
  new row weight        → round(100/(n+1))
  round-off drift (±1)  → land on the largest existing weight
                          so the sum stays exactly 100
```

### Rationale

The Phase 4 brief's "Take 10% from each" wording was illustrative. Literal flat-10 breaks at edges (5% rows lose half their weight, 25% rows lose 1/5); only proportional redistribution preserves the author's relative emphasis across unequal weights.

### In-tree representation

`preview/component-rubric-editor.behaviours.js` header docblock, "Spec § C4 (locked Pass 2)" sub-paragraph (lines 24–31), with matching expansion in the `handleAddAction('redistribute')` inline comment. Phase 4 has no separate spec HTML; the JS header is the canonical surface, and `fk-rubric-editor-v1.html` extraction is queued as Phase 5 housekeeping (non-gating).

### Worked examples

- `25/25/20/15/15` → `21/21/17/12/12 + 17` (drift = 0)
- `34/33/33` → `27/28/28 + 17` (drift = −1, lands on largest existing → 27)

---

## Addenda (signed, post-Phase-0)

| ID | Subject | Signed | Summary |
|---|---|---|---|
| **A** | Resolution C as amendment to D2 | Phase 1 (CD countersign; mirror Pass 2 validation) | Renames `core → wired`, `App Chrome → appChrome`. Elevates `dropped` to first-class tier (3 → 9 entries with `category: 'semantic' \| 'brand'`). Requires `uses[]` on `appChrome`. |
| **B** | Storage backend abstraction | Phase 3 | Doc-only amendment to `fk-marking-interactions-v1.html` § B4: `localStorage` → "configured storage backend; v1 default is `localStorage`, v1.1 introduces a folder-backed adapter (File System Access API, Chromium-only, opt-in per kitchen)". No behaviour shift. |
| **C** | Schema versioning convention | Phase 3 v1.0.1 patch | `schemaVersion: "1.0"` as first field of `persistedShape()`. 18 bytes per entity, free forward-compat for v1.1 folder adapter. |
| **D** | C4 redistribution lock (proportional) | Phase 4 Pass 2 (2026-05-16) | D5 above. Both sides signed: CD via Pass 2 bundle + `PHASE-4-MERGED.md`; mirror via `phase-4-pass-2-validation.md`. Phase 5 housekeeping pickup explicitly captured: `fk-rubric-editor-v1.html` narrative spec to be extracted from `behaviours.js` header docblock as a post-merge artefact (non-gating, extraction-only — no new content beyond Pass 2 doc set). |
| **E** | Folder-as-storage adapter contract (v1.1) | Phase 6 Pass 1 — ✅ both sides signed 2026-05-16 | Implementation-shape contract for FolderAdapter. 5-method surface (get/set/del/list/stat); ETag-on-load conflict resolution; banner + localStorage fallback permission-renewal UX; kitchen-config.json schema; migration and OOS. Supersedes `fk-marking-interactions-v1-addendum-storage.md`. |
| **F** | Improvement-programme Phase 0 decisions (2026-06) | 2026-06-11 — solo-maintainer track | Three validated decisions from the 2026-06 architecture-assessment improvement programme (a different "Phase 0" from this document's title): F.1 characterization-tests-first for the scoring functions; F.2 de-letter sections/navigation; F.3 reorder sections to the marking task sequence. Full text at the end of this document; planning trail snapshot at `docs/planning-202606/`. |

---

---

## D6 — Folder-adapter contract (v1.1 Storage backend) [P0]

**Status:** Open — awaiting CD sign-off. Blocks all v1.1 Pass 1 work.
**Source:** Addendum B (Phase 3); CD scoping triage 2026-05-16.
**New doc:** Addendum E (implementation-shape contract — separate from Addendum B which is doc-only).

### Locked sub-decisions

| Q | Question | Decision | Notes |
|---|---|---|---|
| Q1 | **File format on disk** | **Per-entity JSON** — one `<key>.json` per snippet / kitchen / draft | Git-friendly; Dropbox dedup friendly; catalogue adds merge-conflict surface for free. ✅ Both sides agree. |
| Q2 | **Conflict resolution** | **ETag-on-load** — read `lastModified` on file open; if newer than `state.lastSavedAt`, show one-time modal ("file changed externally — load fresh / keep FK state") before resuming autosave | Strict LWW rejected (silent data loss in Dropbox/iCloud scenario). Full detect-and-prompt deferred (UX cost not justified until telemetry shows race frequency). ETag-on-load catches the stale-snapshot case at load time only; no per-write overhead. `stat?` required on adapter surface. Observability: log `external_changed_since_load: bool` per session so v1.2 can decide if upgrade to detect-and-prompt is warranted. |
| Q3 | **Permission-renewal UX** | **Inline banner** (dismissible, non-blocking) + transparent localStorage fallback if re-grant declined | Banner fires on tab restart when DirectoryHandle re-grant is pending. If user declines, FK silently falls back to localStorage for that session; banner persists until re-grant succeeds. Autosave debounce loop not interrupted. |
| Q4 | **Cross-device race** | **v1.1: single-session assumption holds.** No multi-session concurrency support. If two FK tabs hold handles to the same folder, behaviour is undefined (no lock file, no warning). Document as known limitation in Addendum E OOS. v1.2 evaluates lock file if telemetry warrants. | Not a v1.1 implementation decision — explicit deferral so the audit trail is clean. |
| Q5 | **Schema versioning** | Already resolved — Addendum C. `schemaVersion: "1.0"` as first field; folder files inherit same field. | No new decision. |

### Adapter interface shape

```js
// Storage = { backend, get, set, del, list?, stat? }
// Already wired in __fkMarking + __fkRubric as the swap site.
// v1.1 adds list? (Q1 per-entity inspection) and stat? (Q2 ETag-on-load).

const FolderAdapter = {
  backend: 'folder',

  async get(key: string): Promise<string | null>,
  // Reads <key>.json from DirectoryHandle. Returns null if not found.

  async set(key: string, value: string): Promise<void>,
  // Writes <key>.json; updates kitchen-config.json lastSavedAt.

  async del(key: string): Promise<void>,
  // Deletes <key>.json. No-op if not found.

  async list(prefix: string): Promise<string[]>,
  // Returns all keys whose filename begins with prefix. Used for bulk reads
  // (e.g. loading all snippets on init). Required for Q1 per-entity model.

  async stat(key: string): Promise<{ lastModified: number } | null>,
  // Returns file metadata for ETag-on-load check (Q2). Returns null if not found.
  // lastModified is a Unix timestamp (ms).
}
```

`kitchen-config.json` (root of picked folder) identifies the backend and tracks save state:
```json
{
  "schemaVersion": "1.0",
  "backend": "folder",
  "pickedAt": "<ISO8601>",
  "lastSavedAt": "<ISO8601>"
}
```

`LocalStorageAdapter` (existing v1 backend, for symmetry):
```js
const LocalStorageAdapter = {
  backend: 'localStorage',
  async get(key)         { return localStorage.getItem(key) },
  async set(key, value)  { localStorage.setItem(key, value) },
  async del(key)         { localStorage.removeItem(key) },
  async list(prefix)     { return Object.keys(localStorage).filter(k => k.startsWith(prefix)) },
  async stat(_key)       { return null },  // no lastModified available; ETag check skipped
}
```

### What Addendum E will contain

- Adapter API surface (above, verbatim)
- Permission-pick flow: Settings → Storage tab → `showDirectoryPicker()` → write `kitchen-config.json`
- Permission-renewal UX: banner spec + localStorage fallback behaviour
- ETag-on-load flow: `stat()` on open → compare to `state.lastSavedAt` → modal if stale
- Migration story: localStorage → folder (export-on-switch; no silent data move; user confirms)
- `kitchen-config.json` schema
- OOS: multi-session concurrency, cross-device lock file, Safari/Firefox support

### Decision block

```
Q1 Per-entity JSON:             ✅ signed (CD + mirror)
Q2 ETag-on-load + observability: ✅ signed (CD + mirror)
Q3 Banner + LS fallback:        ✅ signed (CD + mirror)
Q4 Single-session / v1.2 defer: ✅ signed (CD + mirror)
Q5 Addendum C covers:           ✅ signed (no new decision)

Adapter interface shape (get/set/del/list/stat):
                                ✅ signed (CD + mirror)

Signed (CD):    ✅   Date: 2026-05-16
Signed (mirror): ✅  Date: 2026-05-16
```

### Contract clarifications (Addendum E callouts, per CD 2026-05-16)

These are not new decisions — they are spec-precision notes to be written verbatim into Addendum E:

1. **`stat().lastModified` is FS-layer truth.** Milliseconds since epoch per `File.lastModified` (File System Access API) — set by the file system on write, not by FK. ETag check: `stat().lastModified > state.lastSavedAt + epsilon` → external writer touched the file since FK's last `set()`.

2. **Coherent-stale edge case — documented OOS.** If an external sync drops a stale entity file *and* a stale `kitchen-config.json` in the same operation, FK's `lastSavedAt` becomes wrong in lockstep with the entity and the ETag check produces a false negative. Practically rare (Dropbox/iCloud sync per-file, not as coordinated snapshots). v1.1 documents and accepts. v1.2 may add cross-file consistency check if telemetry warrants. Footnote-class.

---

## D7 — Late-penalty policy table [P1]

**Status:** ✅ Signed — both sides (Pass 1 bundle, 2026-05-16).
**Source:** Phase 3/4 carry; CD scoping triage 2026-05-16.
**Spec doc:** `fk-marking-late-policies-v1.html` — CD authored, mirror reviewed Pass 1, now on disk in mirror tree.

### Decision

Late penalties are **flat per-day with optional tiers**, not proportional. Proportional redistribution has no coherent semantic for penalty deduction.

### Schema (parallel to D3's `CONFIG.letterGradeTable`)

```js
CONFIG.latePenaltyPolicy = {
  bands: [
    { minDaysLate: 0, ratePerDay: 10 },   // −10 %/day for days 1–3
    { minDaysLate: 3, ratePerDay: 20 },   // −20 %/day beyond day 3
  ],
  capPct: 50,       // never deduct more than 50 % total
  graceHours: 0,    // hours within due time treated as on-time (0 = none)
}
```

**Back-compat:** if `bands` is absent, the legacy `latePenaltyPct` scalar field is honoured as `bands: [{ minDaysLate: 0, ratePerDay: latePenaltyPct }]` with no cap.

**v1 simple path** (single rate, no cap): `bands: [{ minDaysLate: 0, ratePerDay: X }]`.

### Calculation

```
totalPct = 0
for each band (sorted by minDaysLate desc):
  daysInBand = daysLate - band.minDaysLate   (clamped to 0+)
  totalPct  += daysInBand × band.ratePerDay
totalPct = min(totalPct, capPct ?? Infinity)
penalisedScore = rawScore × (1 − totalPct / 100)
```

### Worked examples

| Scenario | daysLate | bands | cap | deduction | penalised (raw=80) |
|---|---|---|---|---|---|
| Simple 10%/day | 2 | `[{0, 10}]` | none | 20% | 64 |
| Tiered, under cap | 4 | `[{0,10},{3,20}]` | 50% | 30+20=50% | 40 |
| Tiered, hits cap | 6 | `[{0,10},{3,20}]` | 50% | 30+60→cap | 40 |
| Grace period | 0.2 days (graceHours=6) | any | any | 0% | 80 |

### Decision block

```
Schema (bands/capPct/graceHours):  ✅ signed (CD + mirror)
Spec doc:                          ✅ fk-marking-late-policies-v1.html — CD authored, mirror Pass 1 review complete
Back-compat (short-circuit):       ✅ signed — computePenalty short-circuits before walker on v1 scalar path
§ L7 exemption workaround:         ✅ signed — remove data-days-late first, then data-late-penalty="0"

Signed (CD):    ✅   Date: 2026-05-16
Signed (mirror): ✅  Date: 2026-05-16

Advisory (non-blocking): Example 3 modal copy uses "6 days" longform vs Example 2's "2d" shorthand.
Align on next pass or leave — does not affect contract.
```

---

## D8 — `region` axe carry: full-surface restructure [P2]

**Status:** Open — does not gate P0/P1. Can land in any Phase 6 bundle.
**Source:** Phase 5 mirror decision (excluded from Pass 2 scope); CD scoping triage 2026-05-16.

> **Cross-reference (2026-06-12, improvement-programme FK-17):** the *live-app*
> `region` violations (index.html, builder.html, scorer.html — page chrome,
> rails, banners, action bars) were cleared by the FK-17 WCAG AA pass and are
> now guarded by the full-coverage local axe harness (demo-loaded scorer).
> D8's own scope — the preview-component surfaces (modals, legends, callouts,
> inner cards) — remains open and unsigned; this note narrows, not closes, it.

### Context

The `region` axe rule fires on content outside `<main>`. Phase 5 Pass 1 resolved the `landmark-one-main` carry by adding `<main>`. However, modal, legend, callout, and inner-card surfaces were explicitly deferred because the restructure is broad and shouldn't share a bundle with the CLS-sensitive Pass 2 items.

### Scope

All surfaces where `region` violations are expected post-Phase-5:

- Modals (rubric editor + marking view)
- Legend containers
- Callout blocks
- Inner card wrappers

One consolidated PR (not per-surface). Mirror-owned; no CD bundle dependency.

### Decision block

```
Restructure scope: [ ] approve (modals / legends / callouts / inner cards)
                   [ ] adjust: _______
Bundle timing:     [ ] Phase 6 P2 batch (recommended)
                   [ ] standalone PR

Signed (CD):                               Date:
Signed (mirror):                           Date:
```

---

## D9 — `fk-tokens.css` drift-ignore allowlist addition [P2]

**Status:** Open — hygiene; does not gate P0/P1/D8.
**Source:** Phase 5 Pass 1 recommendation; CD scoping triage 2026-05-16.

### Context

The token-drift script produces 11 false-positive definition-site warnings for tokens that are legitimately defined outside the primary token block. Phase 5 Pass 1 identified these; adding them to `.fk-drift-ignore.json` was deferred as Phase 6 / maintenance.

### Tokens to allowlist

- `--fk-btn-lift` (Phase 5 addition; definition site is a utility class, not the token block)
- `.fk-card-lift` (same)
- Any new v1.1 tokens that emerge from D6 / Addendum E work

### Decision block

```
Allowlist --fk-btn-lift + .fk-card-lift: [ ] approve   [ ] adjust: _______
v1.1 token additions: defer to end of Phase 6 Pass 1 bundle (recommended)
                      [ ] approve   [ ] handle separately

Signed (CD):                               Date:
Signed (mirror):                           Date:
```

---

## Phase-boundary table (current)

| Phase | Status |
|---|---|
| 0 | ✅ Complete (D1–D4 signed) |
| 1 | ✅ Complete (Pass 2, Addendum A) |
| 2 | ✅ Complete (`landmark-one-main` cleared Phase 5 Pass 1; `rubric-textarea-label` cleared Phase 4 Pass 1) |
| 3 | ✅ Complete (Pass 2 + v1.0.1 patch, Addendum B + C) |
| 4 | ✅ Complete (Pass 2 2026-05-16, D5 + Addendum D) |
| 5 | ✅ Complete (D1/F1/F2/F3 + `<main>` restructure + spec extraction; Pass 2 math correction) |
| 6 | 🟡 **Pass 1 ready to seal** — D6 ✅ · D7 ✅ · Addendum E ✅ · D8/D9 open (P2, non-gating) · implementation deltas not yet started |

— Mirror sync, 2026-05-16

---

<!-- D11.6.3 is a sub-decision of D11.6 (held in CD tree). Mirrored here
     because it carries a mirror-side enforcement obligation. -->
### D11.6.3 — Illustrative Control Marker Convention
- **Date:** 2026-05-19
- **Context:** Cycle 2B smoke testing surfaced unwired controls (zoom, submit handler) that needed to be distinguished from wired controls during audits.
- **Decision:** Unwired / illustrative controls must carry `title="[Label] — illustrative"` (or equivalent visual / aria marker) to flag them as non-functional during keyboard and screen-reader walkthroughs.
- **Examples:**
  - Zoom buttons (L443): `title="Zoom — illustrative"`
  - Search / Highlight (siblings): already carry `title="[Tool] — illustrative"`
- **Enforcement:** Add to Component Patterns section (linked from D11.6.2) before 2C closes.
- **Related:** D11.6.1 (contrast deferral), D11.6.2 (modal titles h3)

---

## Appendix — Phase 6 Cycle 2B Test Artefacts

### Axe Scan Logs
- **2026-05-19 (v4.1 initial):** `button-name = 0`, `heading-order = 0`, `color-contrast = 3–5 per state` (deferred to 2C per D11.6.1)
- **2026-05-20 (v4.1 re-verification):** Identical results — gated criteria still met
- **Protocol:** Incognito Chrome, all extensions disabled, hard refresh before each scan
- **Scans:** MV default, MV shortcuts, MV submit-modal
- **Link:** [2B-v2-Tests.md](./cd-handoff/2B-v2-Tests.md) · [SmokeTestResults.md](./cd-handoff/SmokeTestResults.md)

### Synthetic Rotor (CD)
- **Date:** 2026-05-19
- **Output:** [synthetic-rotor-2026-05-19.md](./cd-handoff/synthetic-rotor-2026-05-19.md)
- **Validation:** Matched axe heading-order results; sufficient for 2B gate (live VO / NVDA deferred)

### Keyboard Smoke Test
- **Protocol:** Pure keyboard (no screen reader), Chrome incognito, hard refresh
- **2026-05-19 run (v3 + v4):** 10/12 PASS — Tests 7 + 8 FAIL on shortcuts overlay (Bug A click-scope, Bug B forward-Tab)
- **2026-05-19 re-test (v4.1, post-addendum-3.1):** 12/12 PASS — shortcuts fixes verified
- **2026-05-20 re-verification (tightened protocol):** 13/14 PASS — **Test 12 FAIL** on submit-modal first-cycle focus escape
- **Root cause (Test 12):** Submit-modal missing forward-Tab trap. Tab from last focusable (Confirm Submission) falls through to browser chrome (address bar) instead of cycling to first focusable (Close). Same pattern as v4 shortcuts Bug B before addendum 3.1 fix.
- **Test-wording drift note:** 19 May Test 12 passed on "doesn't leak to page behind" — ambiguous about cycle count. 20 May tightened wording ("Tab past last focusable must cycle to first") surfaced the gap. Component Patterns section must lock the precise test wording.
- **2026-05-20 19:54 NZST re-run (v4.2, post-addendum-4):** Test 12 ✅ PASS all 4 sub-tests (forward Tab cycle, reverse Shift+Tab, Esc close + focus return, Tab-from-modal-card edge case). D13 pattern verified end-to-end on submit-modal.
- **Link:** [SmokeTestResults.md](./cd-handoff/SmokeTestResults.md)

### Gate #3 Decision
- **Status:** 🟢 SEALED — second seal 2026-05-20 19:54 NZST (cycle-2b-bundle v4.2 final)
- **2026-05-19 first seal (rescinded):** All gated criteria met under then-current test protocol
- **2026-05-20 reopen rationale:** Tightened keyboard smoke surfaced WCAG 2.1.2 Level A violation on submit-modal focus-trap (first-cycle escape, not edge case)
- **2026-05-20 second seal rationale:** CD addendum 4 (v4.2) lifted submit-modal to canonical D13 focus-trap pattern. Steve's targeted Test 12 re-run: ✅ PASS all 4 sub-tests (forward cycle, reverse cycle, Esc + focus return, modal-card edge). D13 compliance matrix: shortcuts ✅×5, submit-modal ✅×5, firstload ✅×0 (2D scope).
- **Closure conditions (met):**
  1. ✅ CD shipped addendum 4 — submit-modal lifted to D13 5-point pattern
  2. ✅ Steve re-ran Test 12 — full pass (Chrome incognito, hard refresh, 2026-05-20 19:54 NZST)
  3. ✅ Expected cycle confirmed: Close → Textarea → Cancel → Confirm → cycles to Close
- **Non-gated deferrals (unchanged):** `color-contrast` (5 token pairs incl. firstload 1.17:1) → 2C per D11.6.1
- **Lessons logged:**
  - Test wording precision is a gate condition, not a polish item
  - Synthetic rotor + axe convergence is necessary but not sufficient — empirical keyboard smoke must use exhaustive cycle wording
  - Three modals = three trap implementations is a maintenance smell; **D13 canonical recipe** now codified — 2D applies same to firstload + addresses foot-Cancel one-liner

---

## D10–D13 — Held in CD's canonical tree (mirror stubs)

These decisions were authored in CD's Phase 6 bundles and do not have mirror-side implementation obligations. They are listed here for D-number continuity only. Canonical source: CD's `fk-decisions.md` at `C:\Users\GGPC\Claude Design Folder\Stephen Mann Design Project\fk-decisions.md`.

| ID | Subject | Date | Status |
|---|---|---|---|
| **D10** | Phase 6 Pass 1 seal & wording amendments | 2026-05-17 | ✅ Sealed |
| **D11** | Phase 6 Pass 2 design countersign (parent of D11.5, D11.6.x series) | 2026-05-17 | ✅ Mirror countersigned |
| **D11.5** | Pass 2 Cycle 2A execution provenance | — | ✅ Recorded |
| **D11.6.1–D11.6.4** | Contrast deferral · Modal h3 titles · Illustrative control markers · Submit-modal focus-trap addendum | 2026-05-19/20 | ✅ Sealed (D11.6.3 mirror-side enforcement applies — see below) |
| **D12** | Cycle 2C WCAG 2.1 AA contrast remediation | 2026-05-19 | ✅ Applied |
| **D13** | Canonical focus-trap recipe (5-point pattern) | 2026-05-19 | ✅ Codified — referenced in 2B test artefacts below |

> **Note:** There is no standalone D14. D11.6.4 is the last sub-patch in this sequence. D15 (below) is the next sequential top-level decision.

---

## D15 — Builder & Brand Pass (BBP) scoped as separate track

**Date:** 2026-05-21
**Status:** Signed
**Author:** Stephen Mann (with mockup audit from Opus, structural feedback from Perplexity)
**Owner:** Stephen Mann (brand voice + Product), CD (technical implementation)

### Context

A May 2026 review of seven scenes of a tutorial-video mockup deck (rendered by Claude Design) surfaced 20 builder/brand UI recommendations. Cross-referencing against the Claude Design phases (0–6) and the Perplexity-driven Marking Roadmap (v2.0–v3.0) shows ~17 of 20 items are orthogonal to both existing tracks. The remaining 3 items (#10, #13, #20) are cross-cutting and overlap multiple surfaces.

### Decision

Treat builder/wizard UX and brand/positioning copy as a dedicated track — **Builder & Brand Pass (BBP)** — owned by Stephen Mann (brand voice + product direction) with CD handling technical implementation. Do not fold into Phase 7 or the Marking Roadmap.

Cross-cutting items attach to existing streams:
- Autosave signalling (#13) → Marking Roadmap v3.0 (harmonise across builder + marking)
- Toast pattern (#20) → new Global Notification System pass (success/error/info toasts across MV, RE, builder)
- In-UI privacy reassurance (#10) → UX + Legal/Comms cross-surface item (touches Addendum B compliance scope)

### Rationale

- Keeps Claude Design infra/accessibility phases focused
- Avoids coupling wizard UX changes to marking-loop changes
- Gives brand voice and privacy messaging an explicit owner (Steve)
- Matches the established pattern of small, scoped sub-passes (cf. 2B/2C/2D)
- Steve already owns product direction and academic positioning — brand voice is a natural extension

### Brand Voice Principles (Locked)

To prevent drift, BBP work follows these voice principles:

1. **Academic-friendly** — respect educators' expertise; avoid patronising language
2. **Plain language** — accessibility over jargon (WCAG plain-language guidelines)
3. **"You" voice** — direct address, active voice ("You choose the grades" not "Grades are chosen")
4. **Transparent about AI** — never claim to "know" what's fair; position as drafting tool
5. **Privacy-first** — explicit, visible reassurance wherever data leaves browser
6. **AU/NZ spelling** — behaviour, colour, artefacts (in prose; code identifiers stay as-is)

These principles are canonical. Any BBP copy changes must align with them. Documented in `brand-voice-canon.md` (created with BBP v0.1).

### Next

- ROADMAP.md updated with BBP v0.1 (copy quick wins) and v1.0 (wizard UX)
- Gating: BBP v1.0 (wizard IA) blocked until Phase 6 close and v3.0 stable
- BBP v0.1 (copy) **unblocked** — Steve can proceed between cycles

### Implementation reference

See ROADMAP.md § Builder & Brand Pass for full scope breakdown.

### BBP v0.1 a11y audit follow-up (2026-05-21)

Post-ship axe + keyboard audit surfaced 12 violations across `index.html`, `builder.html`, `scorer.html`, plus 2 keyboard items and 1 missing page. **Most are pre-existing a11y debt, not BBP v0.1 regressions.** Triage:

**Fixed in BBP v0.1 finalisation pass (mechanical, no scope collision):**
- ✅ `label-title-only` on `#s1-name` + `#s1-assessmentTitle` — added `for=` attributes on existing labels
- ✅ `landmark-one-main` on `index.html` — wrapped hero through saved-scorers section in `<main>`
- ✅ `page-has-heading-one` on `builder.html` + `scorer.html` — added `<h1 class="sr-only">` ("Build a scorer" / "Mark a student")

**Attached to existing owners (do not fix in BBP):**

| Item | Pages | Owner | Status |
|---|---|---|---|
| `color-contrast` | Home, Builder, Scorer | **D12 (Cycle 2C)** | D12 already remediated 5 token pairs in CD mirror. Leftover scope; CD to re-audit current axe baseline |
| `region` | All 3 pages | **D8 (Phase 6 P2)** | "`region` axe carry: full-surface restructure" — D8 open per `fk-handover-phase6.md`. Not yet started |
| `link-in-text-block` | Home | **Phase 2 backlog** | Single-page, low priority. Bundle into next Phase 2 sweep |
| `landmark-one-main` (Scorer) | Scorer | **Phase 2** | Scorer already has `<main>` at line 357. Audit may be false-positive or content-outside-main issue. Surface to Phase 2 verification |
| `page-has-heading-one` (Home) — *not flagged, but check* | Home | n/a | Home already has `<h1>` in the hero (line 99–101) — confirmed not in audit results |
| Keyboard: Enter/Escape drops focus to body (Home) | Home | **Phase 2 modal work** | Expected behaviour without modals wired up. Document for when modals land |
| `results.html` 404 | n/a | **Test config issue** | ✅ Resolved 2026-05-21. Page never existed (confirmed via `git log`). Dropped from `bbp-a11y-tests.mjs` PAGES array + KEYBOARD_TESTS block; stale entry removed from `bbp-a11y-report.json`. |

**Action items for CD / Phase 2:**
- CD to re-audit `color-contrast` against current axe-core baseline post-D12
- D8 (`region`) execution to follow Phase 6 Pass 2 bundle ordering
- Phase 2 backlog: `link-in-text-block` (Home), keyboard focus management when first modals land on Home
- ~~Test-config maintainer: resolve `results.html` reference in `bbp-a11y-report.json`~~ ✅ Resolved 2026-05-21 (dropped from PAGES and KEYBOARD_TESTS in `bbp-a11y-tests.mjs`; stale 404 entry trimmed from `bbp-a11y-report.json`)

**Net BBP v0.1 a11y state:** 3 of 12 violations cleared at source; 9 logged to canonical owners with no scope collision.

**Reference doc:** Visual briefing at `bbp-v0.1-audit-triage.html` (Perplexity-authored, non-canonical) — useful for sharing context with CD or future contributors.

---

## D16 — Interim dark-mode UoW logo treatment

**Date:** 2026-06-10
**Status:** ✅ Approved as temporary workaround — mirror-local decision.
**Decision:** CSS filter-based dark-mode treatment for the University of Waikato logo (`invert`/`grayscale` filter on `#uow-logo`) is acceptable and deployed. This is a workaround, not an official reversed or dark-background asset; end-state is an asset swap when a suitable file is available from UoW marketing, at which point the workaround CSS is removed. An alternative filter refinement exists in local stash only and is not planned for release unless the live version proves inadequate.
**See:** ROADMAP.md § UI Polish and Branding Safety — Parked Items.

---

## Addendum F — Improvement-programme Phase 0 decisions (2026-06)

**Track:** 2026-06 architecture-assessment improvement programme (planning
worktree board) — distinct from the CD-project "Phase 0" this document's title
refers to. Planning trail snapshot: `docs/planning-202606/` (DECISIONS.md,
BOARD.md, INSPECTION.md).
**Status:** recorded, solo-maintainer track. Each decision below ran its
planning-register validation step before promotion; outcomes are quoted. No
new global D-numbers — subsections are addendum-scoped (F.1–F.3) to avoid
colliding with the legacy D-series.

### F.1 — Characterise the scoring functions before any feature work *(planning D-01)*

**Decision.** Grade arithmetic gets a characterization-test net before any
behavioural change ships. Tests assert what the code *does*, not what it
should do; surprises are ledgered (planning INS-4) and triaged — never fixed
inside the test commit.

**Rationale.** Grade arithmetic is the product's licence to exist; until this
programme, the Jest suite covered only AI-wording post-processing — zero
score-math tests.

**Validation outcome (2026-06-11).** `js/score-grade.test.js`: 75 tests over
`scoreToGrade` / `scoreToGradeFromScale` — every NZ band boundary (floor,
±0.01), custom scales (shuffled, sparse, floored), malformed input. All passed
on first run; **zero source changes needed** (both functions were already
exported). Five surprises ledgered (INS-4 S-1…S-5): one latent crash
(empty/null gradeScale → TypeError, unreachable in normal flow), four
intended/benign coercion behaviours. None affect normal-path correctness.
Suite 98/98.

**Consequences.** FK-09 (engine boundary hardening) inherits the S-1/S-4/S-5
guard decisions as interface-contract items. The no-silent-fixes rule is
standing policy for future characterization work.

**Refs.** planning D-01 · FK-01 · INS-3, INS-4.

### F.2 — De-letter sections and navigation *(planning D-02)*

**Decision.** Section identity is the plain name ("Student", "Rubric scores",
"Penalty & grade override", …). The A–G letter badges are removed from step
badges, onboarding banner, nav rail, and the letter-keyed CSS hooks
(`data-rail` re-keyed to section slugs). Letters do not return.

**Rationale.** Letters re-decay on every structural change — observed twice
before the decision (focus mode replaced B·Rubric; the page carried a
*duplicate F*: wording assistant and Finish) and the onboarding banner taught
sections that no longer matched. Names don't decay.

**Validation outcome (2026-06-11).** Repo-wide grep: letter references were
confined to scorer.html (plus one stale REVIEW.md checklist); the how-to page
and README carried no load-bearing letters. One load-bearing code reference —
focus-mode CSS hiding rail entries by letter — was re-keyed to slugs *before*
markup changes. Landed with FK-02/FK-03; runtime-validated (focus enter/exit,
rail, banner); a11y baseline diff clean (one pre-existing violation removed).

**Consequences.** brand-voice-canon.md gained §7 (UI control casing: sentence
case). FK-05's reorder no longer interacts with navigation labelling.

**Refs.** planning D-02 · FK-02, FK-03 · INS-9.

### F.3 — Reorder sections to the marking task sequence *(planning D-05)*

**Decision.** Page order follows the marker's task order: Student → Rubric /
Focus marking → Penalty & grade override → Feedback draft → Notes → Finish →
Cohort. Penalty/override no longer renders above the marking blocks.

**Rationale.** Marker task order is score-then-penalise; the old layout forced
a per-student visual skip and put override UI in view before grading (anchoring
risk).

**Validation outcome (2026-06-11).** Pre-flight inspection (planning INS-9)
found zero positional DOM lookups — focus navigation is criterion-indexed and
order-independent — so the move was a markup splice plus banner re-match; the
rail was already in target order. Runtime battery (focus nav, expand/collapse-
all, penalty → recalculate → sticky bar) and a11y baseline diff clean.

**Consequences.** Section order is confirmed non-load-bearing; future reorders
need only the INS-9 grep set re-run as a guard.

**Refs.** planning D-05 · FK-05 · INS-9, INS-3.
