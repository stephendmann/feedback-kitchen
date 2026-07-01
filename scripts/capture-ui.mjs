#!/usr/bin/env node
/**
 * scripts/capture-ui.mjs
 *
 * High-DPI capture of the REAL Feedback Kitchen UI (builder.html / scorer.html)
 * for the brand film. Renders the live HTML at deviceScaleFactor:2 so text stays
 * razor-sharp at 4K — no screen-DPI screenshots, no JPEG grain, no AI-generated UI.
 *
 * Truthfulness: the scorer target seeds the bundled DEMO_SCORER into localStorage
 * (same approach as bbp-a11y-tests.mjs) so it renders the genuine populated marking
 * UI, not a mock-up.
 *
 * Prereq: dev server running in another terminal →  npm run dev   (http://localhost:3000)
 *
 * Usage:
 *   node scripts/capture-ui.mjs --target builder --still
 *   node scripts/capture-ui.mjs --target scorer  --still
 *   node scripts/capture-ui.mjs --target hero    --still           (nav+hero clip, dark)
 *   node scripts/capture-ui.mjs --target all     --still
 *   node scripts/capture-ui.mjs --target builder --frames --mp4   (author driveAndCapture first)
 *   node scripts/capture-ui.mjs --url file:///abs/path/brand-close.html --name closing
 *
 * Flags:
 *   --target builder|scorer|hero|all   which page(s)       (default builder)
 *   --url <url> --name <basename>      capture any page (incl file://) full-frame
 *   --scale  N                    deviceScaleFactor        (default 2 → 3840×2160)
 *   --width / --height            CSS viewport             (default 1920 / 1080)
 *   --theme  light|dark           fk-theme                 (default light — guide spec)
 *   --out    dir                  output folder            (default ./capture-out)
 *   --fps    N                    mp4 frame rate           (default 24, matches clips)
 *   --still                       write a single 4K PNG
 *   --frames                      write a PNG frame sequence via driveAndCapture()
 *   --mp4                         assemble frames → H.264 (-crf 18) with ffmpeg
 *
 * Env: BASE_URL overrides http://localhost:3000
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const has = (name) => process.argv.includes('--' + name);
function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  if (i < 0) return def;
  const next = process.argv[i + 1];
  return next && !next.startsWith('--') ? next : true;
}

const TARGET = arg('target', 'builder');
const SCALE  = parseInt(arg('scale', '2'), 10);
const WIDTH  = parseInt(arg('width', '1920'), 10);
const HEIGHT = parseInt(arg('height', '1080'), 10);
const THEME_EXPLICIT = has('theme');           // did the user pass --theme?
const THEME  = arg('theme', 'light');
const OUTDIR = arg('out', './capture-out');
const FPS    = parseInt(arg('fps', '24'), 10);

// Arbitrary-page mode: --url <full url, incl file://> --name <basename>.
// Lets the script capture any local film asset (e.g. brand-close.html) at high DPI.
const URL_OVERRIDE = arg('url', null);
const NAME = arg('name', null);

const TARGETS = {
  builder: { path: '/builder.html', seedDemo: false },
  // Bare /scorer.html shows only "No Scorer Found"; seed the real demo first.
  scorer:  { path: '/scorer.html?id=demo-written-response-v2', seedDemo: true },
  // Homepage hero extract: clip from the top of the page to the bottom of the
  // hero <section> (so the nav is included). Hero reads best in dark theme.
  // Dismiss the first-run welcome banner so the shot is clean nav + hero.
  hero:    { path: '/', clipBelow: 'section[style*="0c1527"]', defaultTheme: 'dark',
             seedKeys: { SA_WELCOME_DISMISSED: '1' } },
};

// Effective theme for a target: explicit --theme wins, else the target's preference.
function themeFor(target) {
  if (THEME_EXPLICIT) return THEME;
  return (TARGETS[target] && TARGETS[target].defaultTheme) || THEME;
}

fs.mkdirSync(OUTDIR, { recursive: true });

// Replicate tryDemoScorer()'s localStorage writes using index.html's own globals,
// so the scorer renders the genuine bundled demo (mirrors bbp-a11y-tests.mjs).
async function seedDemoScorer(page) {
  await page.goto(BASE_URL + '/', { waitUntil: 'networkidle2', timeout: 20000 });
  await page.evaluate(() => {
    /* global SA, DEMO_SCORER, DEMO_SCORER_ID */
    try {
      const all = SA.loadAllConfigs();
      if (!all.some((c) => c.id === DEMO_SCORER_ID)) SA.saveConfig(DEMO_SCORER);
      SA.setActiveId(DEMO_SCORER_ID);
      // Hide the first-run help banner so the marking UI is clean for film.
      localStorage.setItem('SA_DEMO_ONBOARDING_DISMISSED', '1');
    } catch (e) {
      // index globals absent — scorer will fall back to its empty state.
    }
  });
}

async function settle(page) {
  await page.evaluate(() => (document.fonts ? document.fonts.ready : null));
  await new Promise((r) => setTimeout(r, 600));
}

async function loadTarget(page, target) {
  const t = TARGETS[target];
  const theme = themeFor(target);
  // Establish origin (and seed) before setting theme so first paint is correct.
  if (t.seedDemo) await seedDemoScorer(page);
  else await page.goto(BASE_URL + '/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.evaluate((th) => { try { localStorage.setItem('fk-theme', th); } catch {} }, theme);
  if (t.seedKeys) {
    await page.evaluate((kv) => { try { for (const k in kv) localStorage.setItem(k, kv[k]); } catch {} }, t.seedKeys);
  }

  await page.goto(BASE_URL + t.path, { waitUntil: 'networkidle2', timeout: 20000 });
  await settle(page);
}

// Capture a single PNG. For targets with `clipBelow`, clip from the top of the
// page down to the bottom of that selector (e.g. nav + hero, no empty page below).
async function captureStill(page, target, basename, theme) {
  const t = TARGETS[target] || {};
  let clip;
  if (t.clipBelow && !has('full')) {   // --full = ignore the clip, capture the whole 16:9 frame
    clip = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: 0, y: 0, width: Math.ceil(window.innerWidth), height: Math.ceil(r.bottom) };
    }, t.clipBelow);
  }
  const w = clip ? clip.width * SCALE : WIDTH * SCALE;
  const h = clip ? clip.height * SCALE : HEIGHT * SCALE;
  const file = path.join(OUTDIR, `${basename}-${w}x${h}-${theme}.png`);
  await page.screenshot({ path: file, type: 'png', ...(clip ? { clip } : {}) }); // PNG only — never JPEG
  console.log('still  →', file);
}

// Arbitrary local/remote page (e.g. brand-close.html via file://) → full-frame 4K PNG.
async function captureUrl(page, url, name) {
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
  await settle(page);
  const file = path.join(OUTDIR, `${name}-${WIDTH * SCALE}x${HEIGHT * SCALE}.png`);
  await page.screenshot({ path: file, type: 'png' });
  console.log('still  →', file);
}

// ── Frame sequence ───────────────────────────────────────────────────────────
let _frame = 0;
function makeCaptureFrame(page, target) {
  const dir = path.join(OUTDIR, `${target}-frames`);
  fs.mkdirSync(dir, { recursive: true });
  return async function captureFrame() {
    await page.screenshot({ path: path.join(dir, String(_frame++).padStart(5, '0') + '.png'), type: 'png' });
  };
}

/**
 * Author your scene here. Pattern: change one visual state → captureFrame() → repeat.
 * Each frame is one PNG; ffmpeg turns the sequence into smooth motion at --fps.
 *
 * Scene 4 ("The Scorer / UI") example — a criterion typed, char by char:
 *
 *   await page.click('#add-criterion');
 *   for (const ch of 'Hypothesis & design') {
 *     await page.type('#criterion-name-input', ch, { delay: 60 });
 *     await captureFrame();
 *   }
 *   await page.type('#weight-input', '25', { delay: 80 });
 *   await captureFrame();
 *
 * The default below captures one frame so --frames yields a valid sequence
 * out of the box (replace it with real automation per scene).
 */
async function driveAndCapture(page, target, captureFrame) {
  await captureFrame();
}

function assembleMp4(target) {
  const dir = path.join(OUTDIR, `${target}-frames`);
  const out = path.join(OUTDIR, `${target}.mp4`);
  const r = spawnSync('ffmpeg', [
    '-y', '-framerate', String(FPS),
    '-i', path.join(dir, '%05d.png'),
    '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p',
    out,
  ], { stdio: 'inherit' });
  if (r.status !== 0) { console.error('ffmpeg failed (is it installed and on PATH?)'); process.exit(1); }
  console.log('mp4    →', out);
}

async function run() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--force-color-profile=srgb'],
  });
  try {
    // Arbitrary-page mode: --url <url> --name <basename>
    if (URL_OVERRIDE) {
      const page = await browser.newPage();
      await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: SCALE });
      await captureUrl(page, URL_OVERRIDE, NAME || 'page');
      await page.close();
      return;
    }

    const targets = TARGET === 'all' ? Object.keys(TARGETS) : [TARGET];
    for (const target of targets) {
      if (!TARGETS[target]) { console.error('unknown --target:', target); continue; }
      const page = await browser.newPage();
      await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: SCALE });
      await loadTarget(page, target);

      if (has('still') || !has('frames')) await captureStill(page, target, target, themeFor(target));
      if (has('frames')) {
        _frame = 0;
        await driveAndCapture(page, target, makeCaptureFrame(page, target));
        if (has('mp4')) assembleMp4(target);
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

run().catch((e) => { console.error(e); process.exit(1); });
