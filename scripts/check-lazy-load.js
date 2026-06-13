#!/usr/bin/env node
/**
 * Lazy-load guard (FK-23).
 *
 * Protects the #15 invariant: SheetJS must NOT sit on the critical path as a
 * static `<script src="...xlsx...">` / `...sheetjs...` tag. It must only ever
 * be pulled in lazily via loadSheetJS() (scorer.html), which builds the
 * <script> element at runtime on first export.
 *
 * The guard fails CI if a static SheetJS/xlsx script tag reappears in any
 * production HTML file. `_snapshots/` is excluded on purpose — those archived
 * copies predate the lazy refactor and legitimately still carry the old tag.
 *
 * Runs anywhere Node runs (no shell/grep dependency), so it works locally on
 * Windows as well as in CI.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const EXCLUDED_DIRS = new Set(['_snapshots', 'node_modules', '.git']);

// Matches a static <script ... src="...xlsx..."> or "...sheetjs..." tag.
// Does NOT match: the HTML comment marker, or the runtime `s.src = '...'`
// assignment inside loadSheetJS() (neither is a literal <script src=...> tag).
const STATIC_SHEETJS_TAG = /<script\b[^>]*\bsrc\s*=\s*["'][^"']*(?:xlsx|sheetjs)[^"']*["']/i;

function collectHtmlFiles(dir, acc) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) continue;
      collectHtmlFiles(path.join(dir, entry.name), acc);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      acc.push(path.join(dir, entry.name));
    }
  }
  return acc;
}

const violations = [];
for (const file of collectHtmlFiles(ROOT, [])) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, i) => {
    if (STATIC_SHEETJS_TAG.test(line)) {
      violations.push(`${path.relative(ROOT, file)}:${i + 1}: ${line.trim()}`);
    }
  });
}

if (violations.length > 0) {
  console.error('✗ Lazy-load guard failed — SheetJS is back on the critical path.');
  console.error('  SheetJS must load lazily via loadSheetJS(), not a static <script src> tag.');
  console.error('  Offending lines:');
  for (const v of violations) console.error(`    ${v}`);
  process.exit(1);
}

console.log('✓ Lazy-load guard passed — no static SheetJS/xlsx script tags in production HTML.');
