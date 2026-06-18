/**
 * Favicon wiring guard — staged set under /public/favicon/.
 *
 * The favicon set was rebuilt as a size-appropriate, two-source design: a
 * minimal toque mark for the browser tab (16/32/48 PNG + ICO) and the detailed
 * chef badge for home-screen / PWA (apple-touch + android-chrome). Both design
 * sources are raster-in-SVG, so NO SVG favicon ships (PNG + ICO only). The set
 * is staged under public/favicon/ and the five live pages point their <head>
 * there. These tests lock that wiring in and confirm the assets exist.
 *
 * (Supersedes the FK-32 guard, which asserted the older /fk-chef.svg +
 * /favicon-32.png + /icon-192.png wiring.)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FAV = 'public/favicon';
const PAGES = ['index.html', 'scorer.html', 'builder.html', 'upload.html', 'convert.html'];
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

describe('favicon wiring across the five live pages', () => {
  test.each(PAGES)('%s points at the staged ICO + 16/32 PNG + apple-touch + manifest', (page) => {
    const html = read(page);
    expect(html).toMatch(/<link\b[^>]*rel="icon"[^>]*href="\/public\/favicon\/favicon\.ico"/);
    expect(html).toMatch(/href="\/public\/favicon\/favicon-16x16\.png"/);
    expect(html).toMatch(/href="\/public\/favicon\/favicon-32x32\.png"/);
    expect(html).toMatch(/rel="apple-touch-icon"[^>]*href="\/public\/favicon\/apple-touch-icon\.png"/);
    expect(html).toMatch(/rel="manifest"[^>]*href="\/public\/favicon\/site\.webmanifest"/);
  });

  test.each(PAGES)('%s ships no SVG favicon <link> (both design sources are raster-in-SVG)', (page) => {
    const html = read(page);
    expect(html).not.toMatch(/<link\b[^>]*rel="icon"[^>]*type="image\/svg\+xml"/);
  });

  test.each(PAGES)('%s declares theme-color #1a2744', (page) => {
    const html = read(page);
    expect(html).toMatch(/<meta\b[^>]*name="theme-color"[^>]*content="#1a2744"/i);
  });
});

describe('staged favicon assets exist and are non-empty', () => {
  test.each([
    'favicon.ico',
    'favicon-16x16.png',
    'favicon-32x32.png',
    'favicon-48x48.png',
    'apple-touch-icon.png',
    'android-chrome-192x192.png',
    'android-chrome-512x512.png',
    'site.webmanifest',
  ])('%s', (asset) => {
    const p = path.join(ROOT, FAV, asset);
    expect(fs.existsSync(p)).toBe(true);
    expect(fs.statSync(p).size).toBeGreaterThan(0);
  });
});
