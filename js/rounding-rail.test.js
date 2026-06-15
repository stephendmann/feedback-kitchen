/**
 * FK-34/FK-37 regression guard — Score Rounding lives in the section rail as single-line segmented buttons
 * with a dynamic helper line below.
 *
 * The rounding control (a display control, like Focus mode) was moved out of the
 * crowded primary top bar into the section rail's right-hand cluster. Single-line segmented buttons
 * (Exact/Half/Whole) with a desktop-only helper line beneath that dynamically displays computed
 * rounded values based on the current score: "Examples for 77.4: Exact 77.4 · Half 77.5 · Whole 77".
 * Placeholder shown when no score is calculated yet. These structural assertions lock that
 * placement and design in, and confirm the ID-driven JS contract still holds.
 */
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'scorer.html'), 'utf8');

const idx = (s) => html.indexOf(s);

describe('FK-34 rounding moved into the section rail', () => {
  test('the rounding wrapper and buttons exist', () => {
    expect(html).toMatch(/id="rail-rounding"/);
    ['rnd-none', 'rnd-half', 'rnd-whole'].forEach((id) => expect(html).toMatch(new RegExp('id="' + id + '"')));
    expect(html).toMatch(/id="rounding-example"/);
  });

  test('rounding sits inside the section rail (after #section-rail, before the title band)', () => {
    const rail = idx('id="section-rail"');
    const titleBand = idx('aria-label="Assessment title"');
    const rnd = idx('id="rail-rounding"');
    expect(rail).toBeGreaterThan(-1);
    expect(rnd).toBeGreaterThan(rail);
    expect(rnd).toBeLessThan(titleBand);
  });

  test('rounding is no longer in the primary top bar', () => {
    // the primary nav ends at the section-rail comment; the rounding control must
    // appear AFTER the section rail begins, i.e. not in the top nav block.
    const topbarRoundingComment = idx('Mobile row 2 / Desktop right');
    const rnd = idx('id="rail-rounding"');
    expect(rnd).toBeGreaterThan(topbarRoundingComment);
    // the old top-bar rounding markup (flex-col group) is gone
    expect(html).not.toMatch(/Desktop right: rounding/);
  });

  test('rounding buttons are single-line segmented (no nested divs)', () => {
    // Buttons contain simple text labels, not nested divs
    expect(html).toMatch(/id="rnd-none"[^>]*>Exact</);
    expect(html).toMatch(/id="rnd-half"[^>]*>Half</);
    expect(html).toMatch(/id="rnd-whole"[^>]*>Whole</);
  });

  test('#rounding-example is a visible helper line (desktop-only, initially italic placeholder)', () => {
    // Helper is hidden on mobile (hidden md:block), visible on desktop
    expect(html).toMatch(/id="rounding-example"[^>]*hidden md:block/);
    // Initially shows placeholder text
    expect(html).toMatch(/id="rounding-example"[^>]*italic[^>]*>Examples appear once/);
    // No tooltip on #rail-rounding wrapper
    expect(html).not.toMatch(/id="rail-rounding"[^>]*title=/);
  });
});
