/**
 * Test helper: the scorer's full source, markup and application logic together.
 *
 * The scorer's ~200 KB of application logic used to live in an inline <script>
 * inside scorer.html, and FK's guard tests assert against it as a string —
 * scorer.html is a monolith that is not behaviourally unit tested, so static
 * assertions are how its wiring is protected.
 *
 * That logic now lives in js/scorer-app.js so the browser can cache it. Reading
 * scorer.html alone would therefore silently stop seeing the code those guards
 * exist to check, and they would pass while asserting nothing. This helper
 * returns markup and logic concatenated, so a guard written against the inline
 * monolith keeps testing exactly what it did before.
 *
 * Use this instead of reading scorer.html directly whenever a test asserts on
 * scorer behaviour or wiring. Tests that only inspect markup (favicon links,
 * header brand mark) can still read the page file directly.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

/** scorer.html and js/scorer-app.js concatenated, as one searchable string. */
function readScorerSource() {
  const markup = fs.readFileSync(path.join(ROOT, 'scorer.html'), 'utf8');
  const app = fs.readFileSync(path.join(ROOT, 'js', 'scorer-app.js'), 'utf8');
  return markup + '\n' + app;
}

module.exports = readScorerSource;
module.exports.readScorerSource = readScorerSource;
