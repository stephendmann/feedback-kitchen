// FK-32: regenerate the favicon / PWA raster icons from fk-chef.svg.
//
//   node scripts/render-icons.mjs
//
// Renders the rounded chef badge (transparent corners) into favicon-32.png,
// icon-192.png, icon-512.png; a full-bleed square variant into
// apple-touch-icon.png (iOS applies its own rounded mask); and assembles a
// multi-res favicon.ico (16/32/48) via ImageMagick `magick`.
//
// Re-run this whenever fk-chef.svg changes. Requires puppeteer (dev dep) and
// ImageMagick 7 (`magick`) on PATH. og-image.png is a separate typographic
// card and is intentionally not touched here.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import puppeteer from 'puppeteer';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const at = (f) => path.join(ROOT, f);

const rounded = fs.readFileSync(at('fk-chef.svg'), 'utf8');
const square = rounded.replace('rx="38"', 'rx="0"'); // full-bleed, no rounded corners

const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();

async function render(svg, size, out) {
  await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
  const html = `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;padding:0}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`;
  await page.setContent(html, { waitUntil: 'load' });
  await page.screenshot({ path: at(out), omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
  console.log(`  ${out}  (${size}x${size})`);
}

console.log('Rounded badge (transparent corners):');
await render(rounded, 32, 'favicon-32.png');
await render(rounded, 192, 'icon-192.png');
await render(rounded, 512, 'icon-512.png');

console.log('Full-bleed square (apple-touch):');
await render(square, 180, 'apple-touch-icon.png');

console.log('favicon.ico sources (16/32/48):');
const icoTmp = ['_ico-16.png', '_ico-32.png', '_ico-48.png'];
await render(rounded, 16, icoTmp[0]);
await render(rounded, 32, icoTmp[1]);
await render(rounded, 48, icoTmp[2]);

await browser.close();

execFileSync('magick', [...icoTmp.map(at), at('favicon.ico')], { stdio: 'inherit' });
icoTmp.forEach((f) => fs.rmSync(at(f), { force: true }));
console.log('  favicon.ico (multi-res 16/32/48)');
console.log('Done.');
