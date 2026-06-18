/**
 * FK-31 regression guard — header brand mark (two-tier crest system).
 *
 * The header lockups use a two-tier brand system:
 *   • HOMEPAGE (index.html) → /fk-chef-badge.png — the larger detailed navy/gold
 *     chef badge (128px raster of _source-navy.svg), read well at the 40px lockup.
 *   • APP PAGES (scorer/builder/upload/convert) → /fk-chef-crest.png — a simpler
 *     blue-shield crest (96px raster of _source-crest.svg) that holds at the
 *     tighter 22/32px navbars.
 *
 * fk-chef.svg (the original self-contained navy tile + white chef knockout) is
 * no longer a header <img>; it remains the SVG favicon, so its self-contained
 * properties are still guarded below.
 *
 * These tests lock in: (a) the four app pages share the single crest asset,
 * (b) the homepage uses the detailed badge, (c) no header reverts to the old
 * favicon-32/icon-192 raster, (d) fk-chef.svg stays self-contained.
 *
 * Rendering-consistency note: marks are referenced via <img src>, so each asset
 * is an isolated document — page color/fill/CSS custom properties cannot tint it.
 * The only thing that could is filter/opacity/mix-blend/mask applied to the img
 * element itself; the dark-mode image filters in css/site-dark.css are scoped to
 * the partner logos (img.grayscale, #uow-logo) and never the chef.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PAGES = ['index.html', 'scorer.html', 'builder.html', 'upload.html', 'convert.html'];
const APP_PAGES = ['scorer.html', 'builder.html', 'upload.html', 'convert.html'];

const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

describe('FK-31 header brand mark', () => {
  test.each(APP_PAGES)('%s header lockup uses the app-page crest', (page) => {
    const html = read(page);
    // header lockup <img> points at the canonical app-page crest asset
    expect(html).toMatch(/<img\b[^>]*\bsrc="\/fk-chef-crest\.png"/);
  });

  test('index.html header lockup uses the detailed chef badge', () => {
    const html = read('index.html');
    expect(html).toMatch(/<img\b[^>]*\bsrc="\/fk-chef-badge\.png"/);
  });

  test.each(PAGES)('%s no longer uses the old raster as a header <img>', (page) => {
    const html = read(page);
    // <link rel="icon" href="..."> is allowed (favicon regen is a follow-on);
    // only the header <img src=...> lockup must be off the old raster.
    expect(html).not.toMatch(/<img\b[^>]*\bsrc="\/(?:favicon-32|icon-192)\.png"/);
  });

  test('the four app-page headers reference the same single asset', () => {
    const srcs = APP_PAGES.map((page) => {
      const m = read(page).match(/<img\b[^>]*\bsrc="(\/fk-chef-crest\.png)"/);
      return m && m[1];
    });
    expect(new Set(srcs)).toEqual(new Set(['/fk-chef-crest.png']));
  });
});

describe('FK-31 fk-chef.svg asset is self-contained', () => {
  const svg = read('fk-chef.svg');

  test('carries its own navy tile + white chef (no external/theme dependency)', () => {
    expect(svg).toMatch(/fill="#1e3a5f"/);          // navy tile
    expect(svg).toMatch(/fill="#ffffff"/);          // white chef
    expect(svg).toMatch(/fill-rule="evenodd"/);     // chef knockout
    expect(svg).toMatch(/<rect\b/);                 // tile/base rect present
    expect(svg).toMatch(/clip-path="url\(#/);       // rounded-tile clip
  });

  test('uses no theme-dependent colour hooks (currentColor / CSS vars / blend)', () => {
    expect(svg).not.toMatch(/currentColor/);
    expect(svg).not.toMatch(/var\(--/);
    expect(svg).not.toMatch(/mix-blend-mode/);
  });
});
