/**
 * FK-32 regression guard — favicon / PWA icon wiring.
 *
 * The favicon set was regenerated from the new chef badge (fk-chef.svg) and an
 * SVG favicon <link> was added so modern browsers use the crisp vector directly
 * (PNG/ICO as fallback). These tests lock that wiring in across the five live
 * pages and confirm the raster assets exist. The pixel content of the rasters
 * is produced by scripts/render-icons.mjs from fk-chef.svg.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PAGES = ['index.html', 'scorer.html', 'builder.html', 'upload.html', 'convert.html'];
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

describe('FK-32 SVG favicon link', () => {
  test.each(PAGES)('%s declares the SVG favicon', (page) => {
    const html = read(page);
    expect(html).toMatch(/<link\b[^>]*rel="icon"[^>]*href="\/fk-chef\.svg"[^>]*type="image\/svg\+xml"|<link\b[^>]*href="\/fk-chef\.svg"[^>]*type="image\/svg\+xml"/);
  });

  test.each(PAGES)('%s keeps the ICO + PNG + apple-touch fallbacks', (page) => {
    const html = read(page);
    expect(html).toMatch(/<link\b[^>]*rel="icon"[^>]*href="\/favicon\.ico"/);
    expect(html).toMatch(/href="\/favicon-32\.png"/);
    expect(html).toMatch(/rel="apple-touch-icon"[^>]*href="\/apple-touch-icon\.png"|href="\/apple-touch-icon\.png"/);
    expect(html).toMatch(/href="\/icon-192\.png"/);
  });
});

describe('FK-32 raster assets exist', () => {
  test.each(['favicon.ico', 'favicon-32.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png'])(
    '%s is present and non-empty',
    (asset) => {
      const p = path.join(ROOT, asset);
      expect(fs.existsSync(p)).toBe(true);
      expect(fs.statSync(p).size).toBeGreaterThan(0);
    }
  );
});
