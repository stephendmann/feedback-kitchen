/**
 * FK-51 regression guard — one name for the "start a scorer" action.
 *
 * The single action of opening the builder had shipped under five different
 * labels (nav "+ Create Scorer", hero "Build a New Scorer", mid-page step
 * "Build Your Scorer", CTA-footer "Build a Scorer →", and the scorer
 * empty-state "Build a Scorer →"), differing in verb, determiner and case.
 * A first-time lecturer could not tell they were the same thing, and the
 * user manual cannot name a control that appears five ways.
 *
 * The canonical name is sentence-case "Build a scorer" (canon §7). The `+`
 * and `→` next to some call sites are layout decoration, not part of the
 * name, so they are kept where the layout already uses them.
 *
 * These tests lock in: (a) every anchor that opens builder.html on the two
 * production CTA pages carries exactly the canonical name once decoration is
 * stripped, (b) the normalised label set is a single string, (c) none of the
 * retired variants can reappear, and (d) the mid-page step-1 heading uses the
 * canonical name. A sixth variant on either page fails the suite.
 *
 * builder.html's <meta ...:title> ("Feedback Kitchen — Build a Scorer") is a
 * page/social title, not a call site for the action, and is out of scope.
 * scorer.html's "Edit scorer" control (id="edit-scorer-btn") also links to
 * builder.html but is a different action (edit the open scorer), so it is
 * excluded here and keeps its own name.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CTA_PAGES = ['index.html', 'scorer.html'];
const CANONICAL = 'Build a scorer';

const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

// Remove tags to a fixed point so overlapping/nested angle brackets cannot
// leave a residual tag behind (a single pass is incomplete sanitisation).
const stripTags = (s) => {
  let prev;
  do {
    prev = s;
    s = s.replace(/<[^>]*>/g, '');
  } while (s !== prev);
  return s;
};

// Inner text of an anchor with decoration + tags removed, whitespace collapsed.
const normaliseLabel = (inner) =>
  stripTags(inner)
    .replace(/[+→]/g, '')      // strip "+" / "→" affordances
    .replace(/\s+/g, ' ')
    .trim();

const builderAnchorLabels = (html) => {
  const labels = [];
  const re = /<a\b([^>]*)\bhref="builder\.html"[^>]*>([\s\S]*?)<\/a>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    // "Edit scorer" (edit the open scorer) is a different action — skip it.
    if (/\bid="edit-scorer-btn"/.test(m[0])) continue;
    labels.push(normaliseLabel(m[2]));
  }
  return labels;
};

describe('FK-51 one name for the start-a-scorer action', () => {
  test.each(CTA_PAGES)('%s: every builder.html CTA reads "Build a scorer"', (page) => {
    const labels = builderAnchorLabels(read(page));
    expect(labels.length).toBeGreaterThan(0);   // guard must actually be exercising anchors
    labels.forEach((label) => expect(label).toBe(CANONICAL));
  });

  test('exactly one distinct CTA label across the production pages', () => {
    const all = CTA_PAGES.flatMap((page) => builderAnchorLabels(read(page)));
    expect(new Set(all)).toEqual(new Set([CANONICAL]));
  });

  test.each(CTA_PAGES)('%s: no retired label variant survives', (page) => {
    const html = read(page);
    expect(html).not.toMatch(/Create Scorer/);      // nav variant
    expect(html).not.toMatch(/Build a New Scorer/);  // hero variant
    expect(html).not.toMatch(/Build Your Scorer/);   // mid-page step variant
    expect(html).not.toMatch(/Build a Scorer/);      // Title-case "Scorer" (canonical is lower-case)
  });

  test('index.html mid-page step-1 heading uses the canonical name', () => {
    expect(read('index.html')).toMatch(/<h3[^>]*>\s*Build a scorer\s*<\/h3>/);
  });
});
