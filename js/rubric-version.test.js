/**
 * @jest-environment jsdom
 *
 * FK-11 — Unit tests for SA.rubricVersionHash (js/shared.js).
 *
 * This is the single source of truth for the per-record rubric version
 * stamp. The scorer stamps it onto each cohort record at save time and the
 * moderation export reads it back, so the hash must be deterministic, must
 * change when (and only when) the rubric definition changes, and must be a
 * stable 8-character lowercase hex string.
 *
 * Run with: npx jest js/rubric-version.test.js
 */

function loadShared() {
  jest.resetModules();
  delete global.window.SA;
  require('./shared.js');
  return global.window.SA;
}

let SA;
beforeAll(() => { SA = loadShared(); });

function baseConfig() {
  return {
    scoreRounding: 'none',
    label: 'Demo scorer',
    criteria: [
      {
        name: 'Argument',
        weight: 60,
        rubric: {
          excellent: 'Compelling, well-evidenced argument.',
          proficient: 'Clear argument with adequate support.',
          developing: 'Argument present but thinly supported.',
          satisfactory: 'Basic argument.',
          unsatisfactory: 'No discernible argument.'
        }
      },
      {
        name: 'Structure',
        weight: 40,
        rubric: {
          excellent: 'Logical, signposted structure.',
          proficient: 'Mostly coherent structure.',
          developing: 'Some structural lapses.',
          satisfactory: 'Loose structure.',
          unsatisfactory: 'No structure.'
        }
      }
    ]
  };
}

describe('format and determinism', () => {
  test('returns a stable 8-character lowercase hex string', () => {
    const h = SA.rubricVersionHash(baseConfig());
    expect(h).toMatch(/^[0-9a-f]{8}$/);
  });

  test('is deterministic across calls and fresh objects', () => {
    expect(SA.rubricVersionHash(baseConfig())).toBe(SA.rubricVersionHash(baseConfig()));
  });

  test('handles empty / missing criteria without throwing', () => {
    expect(SA.rubricVersionHash({ criteria: [] })).toMatch(/^[0-9a-f]{8}$/);
    expect(SA.rubricVersionHash({})).toMatch(/^[0-9a-f]{8}$/);
    expect(SA.rubricVersionHash(null)).toMatch(/^[0-9a-f]{8}$/);
  });
});

describe('sensitivity to rubric changes', () => {
  test('changes when a criterion name changes', () => {
    const a = baseConfig();
    const b = baseConfig();
    b.criteria[0].name = 'Thesis';
    expect(SA.rubricVersionHash(a)).not.toBe(SA.rubricVersionHash(b));
  });

  test('changes when a criterion weight changes', () => {
    const a = baseConfig();
    const b = baseConfig();
    b.criteria[0].weight = 50;
    b.criteria[1].weight = 50;
    expect(SA.rubricVersionHash(a)).not.toBe(SA.rubricVersionHash(b));
  });

  test.each([
    'excellent', 'proficient', 'developing', 'satisfactory', 'unsatisfactory'
  ])('changes when the %s tier descriptor changes', (tier) => {
    const a = baseConfig();
    const b = baseConfig();
    b.criteria[1].rubric[tier] = a.criteria[1].rubric[tier] + ' (revised)';
    expect(SA.rubricVersionHash(a)).not.toBe(SA.rubricVersionHash(b));
  });

  test('changes when criterion order changes', () => {
    const a = baseConfig();
    const b = baseConfig();
    b.criteria.reverse();
    expect(SA.rubricVersionHash(a)).not.toBe(SA.rubricVersionHash(b));
  });
});

describe('insensitivity to non-rubric config', () => {
  test('ignores fields outside the rubric definition', () => {
    const a = baseConfig();
    const b = baseConfig();
    b.scoreRounding = 'whole';
    b.label = 'A totally different scorer name';
    b.id = 'some-other-id';
    expect(SA.rubricVersionHash(a)).toBe(SA.rubricVersionHash(b));
  });
});
