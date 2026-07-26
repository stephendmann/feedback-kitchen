/**
 * FK-43 regression guard — axe harness page coverage.
 *
 * A "serious" colour-contrast violation on convert.html survived on main
 * because the axe battery (bbp-a11y-tests.mjs) never scanned that page:
 * convert.html and upload.html were outside its PAGES list. Fixing the
 * contrast without also scanning the pages would let the same class of gap
 * reappear silently the next time either page drifts.
 *
 * The battery itself needs a browser (puppeteer) and is not run in CI, so
 * this static guard — which is — asserts the five production pages stay in
 * the scan set. If someone drops a page from PAGES, CI fails here.
 */
const fs = require('fs');
const path = require('path');

const harness = fs.readFileSync(
  path.join(__dirname, '..', 'bbp-a11y-tests.mjs'),
  'utf8'
);

// Only the PAGES array should define scan targets; pull it out so a path
// mentioned in a comment elsewhere cannot satisfy the assertions.
const pagesBlock = harness.slice(
  harness.indexOf('const PAGES'),
  harness.indexOf('];', harness.indexOf('const PAGES')) + 2
);

const REQUIRED_PAGES = [
  "path: '/'",
  "path: '/builder.html'",
  "path: '/scorer.html?id=demo-written-response-v2'",
  "path: '/upload.html'",
  "path: '/convert.html'",
];

describe('FK-43 axe harness page coverage', () => {
  test('PAGES block is found', () => {
    expect(pagesBlock).toMatch(/const PAGES\s*=\s*\[/);
  });

  test.each(REQUIRED_PAGES)('axe battery still scans %s', (needle) => {
    expect(pagesBlock).toContain(needle);
  });
});
