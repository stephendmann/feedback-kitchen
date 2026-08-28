/**
 * Asset version stamping — cache-safety guard.
 *
 * Local JS and CSS are served with a long immutable cache (see vercel.json).
 * That is only safe while every reference carries a ?v= stamp that changes
 * when the code does: an unstamped or stale reference means a returning
 * marker keeps running last release's JavaScript for up to a year, with no
 * way to force a refresh short of clearing their browser cache.
 *
 * Before this guard existed the stamps had drifted to three different values
 * (?v=2.9.0, ?v=1.0.0 and none at all) across the pages, none of which
 * matched the app version. Consistent with FK's other static guards, this
 * asserts on the page source rather than behaviour.
 *
 * When FK_VERSION is bumped in js/shared.js, this test fails until every
 * page is restamped. That failure is the point — it is the mechanism that
 * makes the long cache safe.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const PAGES = [
  'index.html',
  'scorer.html',
  'builder.html',
  'upload.html',
  'convert.html',
  'how-to-feedback-kitchen.html'
];

/* The single source of truth, read from shared.js rather than duplicated. */
const FK_VERSION = (() => {
  const shared = fs.readFileSync(path.join(ROOT, 'js', 'shared.js'), 'utf8');
  const m = shared.match(/const FK_VERSION = '([^']+)'/);
  if (!m) throw new Error('FK_VERSION not found in js/shared.js');
  return m[1];
})();

/* Local .js/.css references only — Vercel's injected scripts and any
   CDN-hosted library are outside our cache policy and are skipped. */
const ASSET_REF = /(?:src|href)="([^"]*\.(?:js|css)(?:\?[^"]*)?)"/g;

function localAssetRefs(html) {
  const refs = [];
  let m;
  while ((m = ASSET_REF.exec(html)) !== null) {
    const url = m[1];
    if (/^https?:\/\//.test(url)) continue;
    if (url.startsWith('/_vercel/')) continue;
    refs.push(url);
  }
  return refs;
}

describe('local asset references are version-stamped', () => {
  test.each(PAGES)('%s stamps every local js/css reference', page => {
    const html = fs.readFileSync(path.join(ROOT, page), 'utf8');
    const unstamped = localAssetRefs(html).filter(u => !u.includes('?v='));
    expect(unstamped).toEqual([]);
  });

  test.each(PAGES)('%s stamps match the current FK_VERSION', page => {
    const html = fs.readFileSync(path.join(ROOT, page), 'utf8');
    const stale = localAssetRefs(html).filter(u => !u.includes('?v=' + FK_VERSION));
    expect(stale).toEqual([]);
  });

  test.each(PAGES)('%s uses root-absolute asset paths', page => {
    const html = fs.readFileSync(path.join(ROOT, page), 'utf8');
    const relative = localAssetRefs(html).filter(u => !u.startsWith('/'));
    expect(relative).toEqual([]);
  });
});

describe('the cache policy this guard protects', () => {
  const vercelConfig = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8')
  );

  test('vercel.json still caches /js and /css', () => {
    const sources = vercelConfig.headers.map(h => h.source);
    expect(sources).toContain('/js/:path*');
    expect(sources).toContain('/css/:path*');
  });

  /* Vercel applies the LAST matching header rule, not the most specific one.
     xlsx.full.min.js is a frozen vendor bundle loaded dynamically without a
     stamp (scorer.html loadSheetJS), so it carries its own immutable rule —
     which only survives while it sits below the general /js rule. */
  test('the frozen vendor rule stays below the general /js rule', () => {
    const sources = vercelConfig.headers.map(h => h.source);
    expect(sources.indexOf('/js/xlsx.full.min.js')).toBeGreaterThan(
      sources.indexOf('/js/:path*')
    );
  });
});
