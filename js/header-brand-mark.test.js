/**
 * FK-31 regression guard — header brand mark.
 *
 * The chef logo was standardised onto a self-contained asset
 * (/fk-chef.svg: navy tile + white chef knockout) so it renders identically on
 * light AND dark headers with no theme CSS. The HOMEPAGE (index.html) header
 * intentionally diverges onto the larger detailed chef badge (/fk-chef-badge.png,
 * a 128px raster of _source-navy.svg) — it only reads well at the homepage's
 * 40px lockup, so the tighter app-page navbars (22/32px) keep fk-chef.svg.
 *
 * These tests lock in: (a) the four app pages stay on the single fk-chef.svg
 * asset, (b) the homepage uses the detailed badge, (c) no header reverts to the
 * old favicon-32/icon-192 raster, (d) fk-chef.svg stays self-contained.
 *
 * Rendering-consistency note: marks are referenced via <img src>, so the SVG is
 * an isolated document — page color/fill/CSS custom properties cannot tint it.
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
  test.each(APP_PAGES)('%s header lockup uses /fk-chef.svg', (page) => {
    const html = read(page);
    // header lockup <img> points at the canonical app-page asset
    expect(html).toMatch(/<img\b[^>]*\bsrc="\/fk-chef\.svg"/);
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
      const m = read(page).match(/<img\b[^>]*\bsrc="(\/fk-chef\.svg)"/);
      return m && m[1];
    });
    expect(new Set(srcs)).toEqual(new Set(['/fk-chef.svg']));
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
