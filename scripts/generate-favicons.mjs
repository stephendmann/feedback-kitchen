#!/usr/bin/env node
/**
 * generate-favicons.mjs — reproducible favicon / app-icon generator.
 *
 * TWO-SOURCE, SIZE-APPROPRIATE design (favicons should be designed per size):
 *
 *   SMALL  public/favicon/favicon-small.svg  — a TRUE-VECTOR minimal mark
 *          (white toque inside a gold shield on navy). No face/body — at 16px
 *          the detailed chef collapses into noise, so the tab icon shows only
 *          the toque. Drives: favicon-16/32/48.png + favicon.ico, and is itself
 *          served as the SVG favicon (crisp at every tab size).
 *
 *   LARGE  public/favicon/_source-navy.svg   — the detailed navy chef badge
 *          (raster-in-SVG, ~1.6 MB). Looks great at 180px+. Drives:
 *          apple-touch-icon (180), android-chrome 192/512 — i.e. home-screen /
 *          PWA contexts, which always render large.
 *
 * Why split by CONTEXT, not by a `sizes`-selected pair of SVGs: an SVG favicon
 * is treated as `sizes="any"`, so browsers can't pick "small SVG vs large SVG"
 * by render size. Size-based selection only works for raster PNG/ICO. Splitting
 * by context (tab vs home-screen) achieves the same visual goal with mechanisms
 * that actually work. See public/favicon/README.md.
 *
 * Tool: ImageMagick v7 (`magick`) — density 384 + Lanczos downsample; `-strip`
 * removes the detailed source's Canva/C2PA metadata from every output.
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

const SMALL = path.join(OUT, 'favicon-small.svg');   // minimal vector → small sizes
const LARGE = path.join(OUT, '_source-navy.svg');    // detailed raster → large sizes

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

console.log('SMALL (minimal toque vector) → tab favicons:');
render(SMALL, 16, 'favicon-16x16.png');
render(SMALL, 32, 'favicon-32x32.png');
render(SMALL, 48, 'favicon-48x48.png');

console.log('Assembling favicon.ico (16/32/48) from the minimal vector:');
magick([at('favicon-16x16.png'), at('favicon-32x32.png'), at('favicon-48x48.png'), at('favicon.ico')]);
console.log('  favicon.ico');

console.log('LARGE (detailed chef badge) → home-screen / PWA icons:');
render(LARGE, 180, 'apple-touch-icon.png');
render(LARGE, 192, 'android-chrome-192x192.png');
render(LARGE, 512, 'android-chrome-512x512.png');

console.log('\nSVG favicon: favicon-small.svg is served as-is (true vector, no build step).');
console.log('Done. Files written to public/favicon/');
