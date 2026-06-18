#!/usr/bin/env node
/**
 * generate-favicons.mjs — reproducible favicon / app-icon generator.
 *
 * TWO-SOURCE, SIZE-APPROPRIATE design (favicons should be designed per size):
 *
 *   SMALL  public/favicon/_source-small.svg  — a minimal toque-in-shield mark
 *          (white pleated chef's hat in a gold shield on navy; no face/body).
 *          At 16px the detailed chef collapses into noise, so the tab shows only
 *          the toque. Drives: favicon-16/32/48.png + favicon.ico.
 *
 *   LARGE  public/favicon/_source-navy.svg   — the detailed navy chef badge.
 *          Looks great at 180px+. Drives: apple-touch-icon (180), android-chrome
 *          192/512 — i.e. home-screen / PWA contexts, which always render large.
 *
 * Both sources are raster-in-SVG (~1.6-1.7 MB each), so neither ships as an SVG
 * favicon — that would be payload bloat with no vector-sharpness gain. The tab
 * uses the rasterised 16/32/48 PNG + ICO. (If a TRUE-VECTOR small mark is ever
 * authored, add it back as `rel="icon" type="image/svg+xml"`.)
 *
 * Why split by CONTEXT, not by a `sizes`-selected pair of SVGs: an SVG favicon
 * is treated as `sizes="any"`, so browsers can't pick "small SVG vs large SVG"
 * by render size. Size-based selection only works for raster PNG/ICO. Splitting
 * by context (tab vs home-screen) achieves the same visual goal with mechanisms
 * that actually work. See public/favicon/README.md.
 *
 * Tool: ImageMagick v7 (`magick`) — density 384 + Lanczos downsample; `-strip`
 * removes each source's Canva/C2PA metadata from every output.
 *
 * Rerun any time:  node scripts/generate-favicons.mjs
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'public', 'favicon');

const SMALL = path.join(OUT, '_source-small.svg');   // minimal toque mark → small sizes
const LARGE = path.join(OUT, '_source-navy.svg');    // detailed chef badge → large sizes

for (const [label, p] of [['SMALL', SMALL], ['LARGE', LARGE]]) {
  if (!fs.existsSync(p)) { console.error(`${label} source not found: ${p}`); process.exit(1); }
}

const magick = (args) => execFileSync('magick', args, { stdio: ['ignore', 'ignore', 'inherit'] });
const at = (f) => path.join(OUT, f);

// High render density + Lanczos = crisp downsamples. `-strip` drops metadata.
// Sources are opaque navy by design, so outputs are correctly opaque (no white
// box added, nothing forced transparent — we preserve each source's pixels).
const render = (srcAbs, size, outFile) => {
  magick(['-density', '384', '-background', 'none', srcAbs,
          '-resize', `${size}x${size}`, '-filter', 'Lanczos', '-strip', at(outFile)]);
  console.log(`  ${outFile}  (${size}x${size})`);
};

console.log('SMALL (minimal toque mark) → tab favicons:');
render(SMALL, 16, 'favicon-16x16.png');
render(SMALL, 32, 'favicon-32x32.png');
render(SMALL, 48, 'favicon-48x48.png');

console.log('Assembling favicon.ico (16/32/48) from the minimal toque mark:');
magick([at('favicon-16x16.png'), at('favicon-32x32.png'), at('favicon-48x48.png'), at('favicon.ico')]);
console.log('  favicon.ico');

console.log('LARGE (detailed chef badge) → home-screen / PWA icons:');
render(LARGE, 180, 'apple-touch-icon.png');
render(LARGE, 192, 'android-chrome-192x192.png');
render(LARGE, 512, 'android-chrome-512x512.png');

console.log('\nDone. Files written to public/favicon/');
