# claude/fk-11-rubric-version-stamping

Implementation branch for **FK-11 (INS-6) — per-record rubric version stamping**.

## Problem

`rubric_version_hash` is currently computed **once at export time** from the
*live* config (`_rubricHash(config)` in `js/moderation-export.js`) and stamped
identically onto every row and into the manifest. If the rubric (criteria
names, weights, or tier descriptors) is edited part-way through marking a
cohort, records scored against the old rubric and records scored against the
new one are all exported under the **current** hash. The moderation pack then
silently asserts rubric homogeneity that did not hold — a moderation-integrity
defect.

## Fix — stamp the rubric version onto each record at scoring/save time

1. **Shared hash function.** Promote the hash algorithm to a single shared
   implementation `SA.rubricVersionHash(config)` in `js/shared.js`, so the
   scorer save-path and the export path produce byte-identical hashes. The
   algorithm (djb2-derived, 8-char hex over criteria name/weight + all five
   tier descriptors) is unchanged.

2. **Stamp at save.** In `saveCurrentStudentToCohort` (`scorer.html`) add
   `rubricVersionHash: SA.rubricVersionHash(config)` to the persisted record.
   Re-opening + re-saving a record (FK-07 path) re-stamps with the rubric in
   force at re-save time — correct, since the scores then reflect that rubric.

3. **Export uses the per-record stamp.** In `js/moderation-export.js` each
   `10_rows` row emits `record.rubricVersionHash`, falling back to the
   live-config hash only for legacy records saved before FK-11.

4. **Manifest reflects heterogeneity.** Collect the distinct per-record hashes:
   - all equal → `rubric_version_hash` = that hash (status quo for the common case);
   - more than one → `rubric_version_hash` = `mixed`, plus a new
     `rubric_versions` key listing the sorted distinct hashes, plus a
     `suppression_notes` entry `RUBRIC_VERSION_MIXED: N versions`.

5. **Docs.** Update the `rubric_version_hash` data-dictionary entry in
   `js/moderation-readme.js` to say it is stamped per record at scoring time,
   and document the manifest `mixed` / `rubric_versions` semantics.

6. **Tests.** Add `js/rubric-version.test.js`: hash stability, sensitivity to
   each rubric field, and insensitivity to non-rubric config changes.

## Touch-points
- `js/shared.js` — new `rubricVersionHash`, added to the `window.SA` export.
- `scorer.html` — `saveCurrentStudentToCohort` record shape.
- `js/moderation-export.js` — `_rubricHash` delegates to SA; per-row + manifest.
- `js/moderation-readme.js` — data dictionary + manifest docs.
- `js/rubric-version.test.js` — new.

## Out of scope
No change to the hash algorithm, the export schema version, the suppression
thresholds, or the FK-07 drift cross-check (which compares recomputed scores,
not hashes).

## See also
fk-decisions.md G.1 (FK-07 re-entry) · ROADMAP.md Phase 3 · INS-6.
