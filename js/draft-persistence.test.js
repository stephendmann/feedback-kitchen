/**
 * @jest-environment jsdom
 *
 * FK-21 — regression guard for draft persistence v2 (scorer.html).
 *
 * scorer.html is an inline-script monolith not behaviourally unit-tested here
 * (the autosave/resume flow is runtime-verified on the demo scorer). This is a
 * cheap structural guard that fails in CI if the feature is removed or
 * regressed: it parses the markup with DOMParser (scripts not executed) and
 * greps the source for the load-bearing wiring.
 *
 * Run with: npx jest js/draft-persistence.test.js
 */

const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'scorer.html'), 'utf8');
const doc = new DOMParser().parseFromString(html, 'text/html');

describe('FK-21 · resume banner', () => {
  test('a hidden non-blocking #draft-resume-banner exists with Resume + Discard', () => {
    const banner = doc.getElementById('draft-resume-banner');
    expect(banner).not.toBeNull();
    expect((banner.className || '').split(/\s+/)).toContain('hidden');
    expect(banner.getAttribute('role')).toBe('status');
    expect(html).toMatch(/onclick="S\.resumeDraft\(\)"/);
    expect(html).toMatch(/onclick="S\.discardDraft\(\)"/);
  });
  test('resumeDraft + discardDraft are exposed on the public S API', () => {
    expect(html).toMatch(/resumeDraft,\s*discardDraft/);
  });
});

describe('FK-21 · storage wrapper (FK-24 integration)', () => {
  test('the draft write routes through SA.safeSetItem, not a raw setItem', () => {
    expect(html).toMatch(/SA\.safeSetItem\(\s*_draftKey\(\)/);
    // the dead PR #12 raw write must be gone
    expect(html).not.toMatch(/localStorage\.setItem\(\s*FK_DRAFT_KEY/);
  });
  test('the draft key is per-scorer (scoped to config.id)', () => {
    expect(html).toMatch(/FK_DRAFT_PREFIX\s*=\s*'SA_DRAFT_V1_'/);
    expect(html).toMatch(/FK_DRAFT_PREFIX\s*\+\s*\(\(config && config\.id\)/);
  });
});

describe('FK-21 · gating + debounce', () => {
  test('saveDraft is gated on FK-07 _sessionHasUnsavedWork()', () => {
    expect(html).toMatch(/function saveDraft[\s\S]{0,200}_sessionHasUnsavedWork\(\)/);
  });
  test('autosave is debounced via setTimeout(saveDraft, DRAFT_DEBOUNCE_MS)', () => {
    expect(html).toMatch(/DRAFT_DEBOUNCE_MS\s*=\s*\d+/);
    expect(html).toMatch(/setTimeout\(\s*saveDraft\s*,\s*DRAFT_DEBOUNCE_MS\s*\)/);
  });
  test('the last edits are flushed on page-hide', () => {
    expect(html).toMatch(/addEventListener\(\s*'pagehide'\s*,\s*_flushDraftSave\s*\)/);
  });
});

describe('FK-21 · clear hooks (AC#9)', () => {
  test('clearDraft() is wired into save-to-cohort and New-student', () => {
    const calls = html.match(/clearDraft\(\)\s*;/g) || [];
    // definition + at least two clear sites (save success, confirmNewStudent)
    expect(calls.length).toBeGreaterThanOrEqual(2);
  });
});
