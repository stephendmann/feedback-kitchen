#!/usr/bin/env node
/**
 * generate-favicons.mjs — reproducible favicon / app-icon generator.
 *
 * Source: public/favicon/_source-navy.svg  (the "Michelin style blue exterior"
 * design — a self-contained NAVY square tile with a gold-rimmed shield + white
 * chef). It is technically an SVG but wraps a 2000×2000 base64 raster, so we
 * rasterise straight to PNG/ICO and do NOT ship an SVG favicon (a 1.6 MB
 * raster-in-SVG favicon would be pure bloat with no crispness gain).
 *
 * Why navy (single source, not adaptive): the static ICO/PNG/Apple/PWA assets
 * can only ever be ONE image, and the navy tile is the only variant that reads
 * on the default white browser tab; its gold rim also keeps it legible on dark
 * tabs. It matches the existing navy header brand mark (fk-chef.svg). See
 * public/favicon/README.md for the full rationale.
 *
 * Tool: ImageMagick v7 (`magick`). Chosen because it is already a repo
 * dependency (see scripts/render-icons.mjs), renders the embedded raster
 * cleanly, downsamples with Lanczos, builds multi-resolution .ico in one pass,
 * and `-strip`s the source's Canva/C2PA metadata out of every output.
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
const SRC = path.join(OUT, '_source-navy.svg');

if (!fs.existsSync(SRC)) {
  console.error(`Source SVG not found: ${SRC}`);
  process.exit(1);
}

const magick = (args) => execFileSync('magick', args, { stdio: ['ignore', 'ignore', 'inherit'] });
const at = (f) => path.join(OUT, f);

// High render density + Lanczos downsample = crisp small icons. `-strip` drops
// the source's C2PA/Canva metadata so we never ship it. The source tile is an
// opaque navy square by design, so outputs are correctly opaque (no forced
// white bg added, nothing made transparent — we preserve the source's pixels).
const render = (size, outFile) => {
  magick([
    '-density', '384',
    '-background', 'none',
    SRC,
    '-resize', `${size}x${size}`,
    '-filter', 'Lanczos',
    '-strip',
    at(outFile),
  ]);
  console.log(`  ${outFile}  (${size}x${size})`);
};

console.log('Rendering PNG favicons + app icons:');
render(16,  'favicon-16x16.png');
render(32,  'favicon-32x32.png');
render(48,  'favicon-48x48.png');
render(180, 'apple-touch-icon.png');        // iOS home screen (180×180)
render(192, 'android-chrome-192x192.png');  // PWA / Android
render(512, 'android-chrome-512x512.png');  // PWA splash / install

// Multi-resolution favicon.ico (16/32/48) for legacy + Windows.
console.log('Assembling favicon.ico (16/32/48):');
magick([
  at('favicon-16x16.png'),
  at('favicon-32x32.png'),
  at('favicon-48x48.png'),
  at('favicon.ico'),
]);
console.log('  favicon.ico');

console.log('\nDone. Files written to public/favicon/');
