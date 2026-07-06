/**
 * @jest-environment jsdom
 *
 * Regression guard for two PR #83 QA fixes to the wording-assistant
 * validation badge (#validation-badge):
 *
 * 1. Placement — the badge was found living inside <details id="sec-ai"
 *    style="display:none">, a permanently hidden legacy section, so
 *    showValidationBadge()/hideValidationBadge() were writing to a node the
 *    marker could never see. It was moved into the real "Suggested wording"
 *    panel that refineAction -> aiAssist actually populates (the same panel
 *    as #refine-suggestion-mirror).
 * 2. Announcement — the badge now carries role="status" + aria-live="polite"
 *    (WCAG 2.1 AA 4.1.3, matching the FK-13 / PR #43 pattern) so a
 *    screen-reader marker hears the flag, not just sees it, with a
 *    de-dupe convention so an identical repeat still re-announces cleanly.
 *
 * scorer.html is a large inline-script monolith and is not behaviourally
 * unit tested here. This suite is a cheap structural guard that fails in CI
 * if either fix is accidentally undone: it parses the markup with jsdom
 * (scripts are NOT executed) and greps the raw source for the announcer
 * wiring. Runtime behaviour (badge visible on a flagged run, cleanly hidden
 * on the next clean run) was verified against a live dev server — see PR
 * #83 description.
 *
 * Run with: npx jest js/validation-badge-placement.test.js
 */

const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'scorer.html'), 'utf8');
// jsdom's DOMParser does NOT execute inline scripts — safe structural parse.
const doc = new DOMParser().parseFromString(html, 'text/html');

describe('validation badge · placement (not inside dead #sec-ai)', () => {
  test('#validation-badge exists exactly once', () => {
    const all = doc.querySelectorAll('#validation-badge');
    expect(all.length).toBe(1);
  });

  test('#validation-badge is not inside the permanently-hidden #sec-ai legacy section', () => {
    const badge = doc.getElementById('validation-badge');
    const secAi = doc.getElementById('sec-ai');
    expect(badge).not.toBeNull();
    expect(secAi).not.toBeNull();
    expect(secAi.contains(badge)).toBe(false);
  });

  test('#validation-badge shares the same "Suggested wording" panel as #refine-suggestion-mirror', () => {
    const badge  = doc.getElementById('validation-badge');
    const mirror = doc.getElementById('refine-suggestion-mirror');
    expect(mirror).not.toBeNull();
    // Nearest ".panel-suggestion" ancestor of each must be the same element —
    // i.e. the badge lives in the visible panel the marker actually sees,
    // not a lookalike copy elsewhere in the document.
    const badgePanel  = badge.closest('.panel-suggestion');
    const mirrorPanel = mirror.closest('.panel-suggestion');
    expect(badgePanel).not.toBeNull();
    expect(badgePanel).toBe(mirrorPanel);
  });
});

describe('validation badge · assistive-tech announcement (FK-13 pattern, WCAG 4.1.3)', () => {
  test('carries role="status" and aria-live="polite" aria-atomic="true"', () => {
    const badge = doc.getElementById('validation-badge');
    expect(badge.getAttribute('role')).toBe('status');
    expect(badge.getAttribute('aria-live')).toBe('polite');
    expect(badge.getAttribute('aria-atomic')).toBe('true');
  });

  test('showValidationBadge de-dupes identical consecutive messages', () => {
    expect(html).toMatch(/_lastValidationAnnouncement/);
    // declared, compared against, and re-assigned — at least 3 references
    const refs = html.match(/_lastValidationAnnouncement/g) || [];
    expect(refs.length).toBeGreaterThanOrEqual(3);
  });

  test('hideValidationBadge resets the de-dupe state so a re-trigger re-announces', () => {
    const fnMatch = html.match(/function hideValidationBadge\s*\([\s\S]{0,300}?\n\s*\}/);
    expect(fnMatch).not.toBeNull();
    expect(fnMatch[0]).toMatch(/_lastValidationAnnouncement\s*=\s*''/);
  });
});
