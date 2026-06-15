/**
 * FK-34/FK-36 regression guard — Score Rounding lives in the section rail with a two-line button design.
 *
 * The rounding control (a display control, like Focus mode) was moved out of the
 * crowded primary top bar into the section rail's right-hand cluster. FK-36 redesigned
 * the buttons to be compact two-line segmented buttons: label on line 1 (Exact/Half/Whole),
 * tiny muted example on line 2 (77.4/77.5/77). These structural assertions lock that
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

  test('rounding buttons have two-line segmented design (label + example)', () => {
    // Each button contains two divs: label (Exact/Half/Whole) + example number (77.4/77.5/77)
    expect(html).toMatch(/id="rnd-none"[\s\S]*?Exact[\s\S]*?77\.4/);
    expect(html).toMatch(/id="rnd-half"[\s\S]*?Half[\s\S]*?77\.5/);
    expect(html).toMatch(/id="rnd-whole"[\s\S]*?Whole[\s\S]*?77/);
    // #rail-rounding wrapper has no tooltip
    expect(html).not.toMatch(/id="rail-rounding"[^>]*title=/);
  });
});
