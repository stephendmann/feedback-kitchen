/**
 * Guard: the marker's notes panel has one name (issue #154).
 *
 * scorer.html had four casings across seven mentions — "Marker's notes",
 * "Marker's Notes", "marker's notes" and "Marker&rsquo;s Notes" — which left the
 * manual with nothing to quote. Six chapters had settled on one form and two on
 * another, neither wrong against a UI that had not decided.
 *
 * The panel is now "Marker's notes" everywhere it is named, matching the
 * accordion title a marker actually clicks and CLAUDE.md's sentence-case rule for
 * UI text, with straight apostrophes per the same guide.
 *
 * Lowercase mid-sentence prose ("your private marker's notes") is left alone:
 * that is the phrase used as ordinary words rather than as the panel's name.
 */

const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'scorer.html'), 'utf8');

describe('the marker\'s notes panel is named consistently', () => {
  // \s+ rather than a literal space, because the first version of this guard used
  // a space and missed an occurrence wrapped across two source lines. A name split
  // by a newline is still the name, and formatting must not be able to hide drift.
  test('no capitalised "Notes" survives, wrapped or not', () => {
    expect(html).not.toMatch(/[Mm]arker(?:'|&rsquo;)s\s+Notes/);
  });

  test('no curly apostrophe survives in the name, wrapped or not', () => {
    expect(html).not.toMatch(/[Mm]arker&rsquo;s\s+[Nn]otes/);
  });

  test('the accordion title is the form everything else follows', () => {
    expect(html).toMatch(/<span class="step-title">Marker's notes<\/span>/);
  });

  test('the section list entry matches it', () => {
    expect(html).toMatch(/<strong>Marker's notes<\/strong>/);
  });

  test('the AI privacy note names the panel the same way', () => {
    // This one reads as a reference to the panel, so it takes the panel's casing
    // rather than sentence-position casing.
    expect(html).toMatch(/in Marker's notes or your draft/);
  });
});
