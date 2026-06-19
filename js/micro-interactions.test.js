/**
 * @jest-environment jsdom
 *
 * FK-38 — regression guard for the micro-interactions animation slice
 * (button hover-lift, toast easing polish, grade-badge pop, reduced-motion
 * guard).
 *
 * Consistent with FK's other scorer.html guards (e.g. score-result-live-region),
 * scorer.html is an inline-script monolith that is not behaviourally unit tested
 * here: there is no jsdom getComputedStyle / matchMedia mocking. This suite is a
 * cheap STATIC guard — it reads the file as text and asserts the CSS rules and
 * the small JS hook survive, so CI fails if the slice is accidentally removed or
 * de-wired. The visible animation behaviour is verified manually / via the
 * bbp-a11y preview harness.
 *
 * Run with: npx jest js/micro-interactions.test.js
 */

const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'scorer.html'), 'utf8');
const darkCss = fs.readFileSync(path.join(__dirname, '..', 'css', 'site-dark.css'), 'utf8');

describe('FK-38 · button hover-lift', () => {
  test('.btn:hover lift rule has a transform and a box-shadow', () => {
    const rule = html.match(/\.btn:hover:not\(:disabled\)\s*\{[^}]*\}/);
    expect(rule).not.toBeNull();
    expect(rule[0]).toMatch(/transform\s*:\s*translateY\(\s*-1px\s*\)/);
    expect(rule[0]).toMatch(/box-shadow\s*:/);
  });

  test('.btn:active resets the lift', () => {
    expect(html).toMatch(/\.btn:active:not\(:disabled\)\s*\{[^}]*transform\s*:\s*translateY\(\s*0\s*\)/);
  });

  test('dark mode supplies a visible hover-lift shadow variant', () => {
    expect(darkCss).toMatch(/html\.fk-dark\s+\.btn:hover:not\(:disabled\)\s*\{[^}]*box-shadow\s*:/);
  });
});

describe('FK-38 · grade-badge pop', () => {
  test('@keyframes badge-pop is defined', () => {
    expect(html).toMatch(/@keyframes\s+badge-pop\s*\{/);
  });

  test('.grade-badge.updated drives the badge-pop animation', () => {
    expect(html).toMatch(/\.grade-badge\.updated\s*\{[^}]*animation\s*:\s*badge-pop/);
  });

  test('recalculate() captures the previous grade letter before reassignment', () => {
    expect(html).toMatch(/_prevGradeText\s*=\s*gradeBadge\.textContent/);
  });

  test('the pop is re-added only on a real grade-letter change, after the className reassignment', () => {
    // className reassignment that wipes `.updated` must come BEFORE the re-add.
    const reassignIdx = html.indexOf("gradeBadge.className = 'grade-badge");
    const reAddIdx = html.search(/gradeBadge\.classList\.add\(\s*['"]updated['"]\s*\)/);
    expect(reassignIdx).toBeGreaterThan(-1);
    expect(reAddIdx).toBeGreaterThan(reassignIdx);
    // guarded by an actual-change check (not popping on every keystroke)
    expect(html).toMatch(/_newGradeText\s*!==\s*_prevGradeText/);
  });

  test('the pop is one-shot — cleared on animationend', () => {
    expect(html).toMatch(/addEventListener\(\s*['"]animationend['"]/);
    expect(html).toMatch(/classList\.remove\(\s*['"]updated['"]\s*\)/);
  });
});

describe('FK-38 · reduced-motion guard', () => {
  test('a prefers-reduced-motion block exists in scorer.html', () => {
    expect(html).toMatch(/@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)/);
  });

  test('the guard disables the micro-interaction animations/transitions', () => {
    const block = html.match(
      /@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)\s*\{[\s\S]*?\.btn,\s*\.grade-badge,\s*#fk-dispatch-toast\s*\{[^}]*\}/
    );
    expect(block).not.toBeNull();
    expect(block[0]).toMatch(/animation\s*:\s*none/);
    expect(block[0]).toMatch(/transition\s*:\s*none/);
  });
});
