/**
 * FK-34 regression guard — Score Rounding lives in the section rail, not the top bar.
 *
 * The rounding control (a display control, like Focus mode) was moved out of the
 * crowded primary top bar into the section rail's right-hand cluster. These
 * structural assertions lock that placement in and confirm the ID-driven JS
 * contract still holds (the buttons keep their ids; the example line is mirrored
 * to the #rail-rounding tooltip since the rail is single-line).
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

  test('highlightRoundingBtn mirrors the example onto the #rail-rounding tooltip', () => {
    expect(html).toMatch(/getElementById\('rail-rounding'\)/);
    expect(html).toMatch(/wrap\.title = ex\.textContent/);
  });
});
