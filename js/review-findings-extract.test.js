/**
 * Guard for the result-channel extractor (issue #136).
 *
 * Fixtures are real: the 6,124-character finding set from PR #151's review,
 * abbreviated, and the short status lines earlier runs produced when they had
 * nothing to deliver.
 */

const { extract, MIN_USEFUL_CHARS } = require('../scripts/extract-review-findings.js');

const log = (over) => [{ type: 'system', subtype: 'init' }, { type: 'result', is_error: false, ...over }];

describe('extracting findings from the execution log', () => {
  test('a real review is extracted whole', () => {
    const findings = '## PR #151 chapter review\n\n**1. The badge claim is backwards.**\n'.padEnd(900, 'x');
    const got = extract(log({ result: findings }));
    expect(got.ok).toBe(true);
    expect(got.text).toBe(findings.trim());
  });

  test('an errored run yields nothing to post', () => {
    const got = extract(log({ is_error: true, result: "You've hit your session limit" }));
    expect(got.ok).toBe(false);
    expect(got.reason).toMatch(/errored/);
  });

  test('a status line is too short to be a review', () => {
    // "The write is being blocked by a permission gate." — #146's second run.
    const got = extract(log({ result: 'The write is being blocked by a permission gate.' }));
    expect(got.ok).toBe(false);
    expect(got.reason).toMatch(/too short/);
  });

  test('a log with no result entry yields nothing', () => {
    expect(extract([{ type: 'system', subtype: 'init' }]).ok).toBe(false);
  });

  test('the threshold sits above a status line and below a review', () => {
    expect(MIN_USEFUL_CHARS).toBeGreaterThan(100);
    expect(MIN_USEFUL_CHARS).toBeLessThan(1000);
  });
});
