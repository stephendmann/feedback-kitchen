/**
 * @jest-environment jsdom
 *
 * FK-13 — regression guard for the score-result live region (WCAG 2.1 AA
 * 4.1.3 Status Messages) and the deliberate validation-convention note
 * (INS-8).
 *
 * scorer.html is a large inline-script monolith and is not behaviourally unit
 * tested here (the live announcement is runtime-verified against the demo
 * scorer + the bbp-a11y axe harness). This suite is a cheap structural guard
 * that fails in CI if the fix is accidentally removed or de-wired: it parses
 * the markup with jsdom (scripts are NOT executed) and asserts the region
 * exists and is announced through, and that the hard/soft validation
 * convention comment survives.
 *
 * Run with: npx jest js/score-result-live-region.test.js
 */

const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'scorer.html'), 'utf8');
// The jsdom test environment provides DOMParser; parseFromString does NOT
// execute inline scripts, so this is a safe structural parse of the markup.
const doc = new DOMParser().parseFromString(html, 'text/html');

describe('FK-13 · #score-result-live region', () => {
  test('exists as an sr-only polite aria-live region', () => {
    const live = doc.getElementById('score-result-live');
    expect(live).not.toBeNull();
    expect(live.getAttribute('aria-live')).toBe('polite');
    expect(live.getAttribute('aria-atomic')).toBe('true');
    expect((live.className || '').split(/\s+/)).toContain('sr-only');
  });

  test('is announced through by recalculate() (the announcer is defined and called)', () => {
    expect(html).toMatch(/function\s+_announceScoreResult\s*\(/); // helper defined
    // called at least once outside its own definition (i.e. wired into recalculate)
    const calls = html.match(/_announceScoreResult\s*\(/g) || [];
    expect(calls.length).toBeGreaterThanOrEqual(2);
  });

  test('announcement is debounced (not chatty on rapid recalculation)', () => {
    expect(html).toMatch(/setTimeout[\s\S]{0,200}score-result-live|score-result-live[\s\S]{0,400}setTimeout/);
  });
});

describe('FK-13 · validation-convention note (INS-8 hard-invalid vs soft-warn)', () => {
  test('the deliberate convention is documented in source so it is not "fixed" later', () => {
    const notes = html.match(/VALIDATION CONVENTION/g) || [];
    expect(notes.length).toBeGreaterThanOrEqual(2); // one at each setter (hard + soft)
  });

  test('the soft-warn override keeps aria-invalid="false" (not flattened to a hard invalid)', () => {
    // the per-criterion override path still forces 'false'
    expect(html).toMatch(/setAttribute\(\s*['"]aria-invalid['"]\s*,\s*['"]false['"]\s*\)/);
  });
});
