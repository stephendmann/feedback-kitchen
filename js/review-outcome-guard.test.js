/**
 * Guard for the Claude review outcome classifier (issue #136).
 *
 * Every case below is a real `result` entry captured from a run on this repo,
 * not an invented string. That matters: the classifier reads prose the review
 * writes about itself, so the fixtures have to be things it actually said.
 */

const { classify } = require('../scripts/check-review-outcome.js');

const result = (over) => ({ type: 'result', subtype: 'success', is_error: false, num_turns: 20, total_cost_usd: 1, ...over });

describe('runs that should fail the job', () => {
  test('is_error true — PR #134, session limit', () => {
    const v = classify(result({ is_error: true, result: "You've hit your session limit · resets 1:20am (UTC)" }));
    expect(v.ok).toBe(false);
    expect(v.reason).toMatch(/errored/);
  });

  test('is_error true — PR #111 first run, the original #136 symptom', () => {
    expect(classify(result({ is_error: true, num_turns: 3, total_cost_usd: 0.14 })).ok).toBe(false);
  });

  test('abandoned waiting on background agents — PR #137', () => {
    const v = classify(result({ result: "I'll wait for the background agents to report back before continuing." }));
    expect(v.ok).toBe(false);
    expect(v.reason).toMatch(/abandoned/);
  });

  test('abandoned waiting on background agents — PR #134 re-run', () => {
    const v = classify(result({
      result: "Waiting on the four review agents to finish; I'll pick up validation and posting as soon as they report back.",
    }));
    expect(v.ok).toBe(false);
    expect(v.reason).toMatch(/abandoned/);
  });

  test('a missing result entry is a failure, not a pass', () => {
    expect(classify(null).ok).toBe(false);
  });

  test('an unrecognised ending fails closed', () => {
    // The three known outcomes are self-describing. Anything else is unknown,
    // and unknown must not read as reviewed.
    expect(classify(result({ result: 'Something new and unaccounted for.' })).ok).toBe(false);
  });
});

describe('runs that should pass the job', () => {
  test('deliberate skip — PR #133, trivial docs change', () => {
    const v = classify(result({
      result: '**Skipped review**: PR #133 only touches docs/user-guide/QUICK-START.md ... trivial, obviously-correct documentation change, so per the review criteria I did not proceed further and did not post any GitHub comment.',
    }));
    expect(v.ok).toBe(true);
    expect(v.reason).toMatch(/skip/);
  });

  test('deliberate skip — PR #135, one-line CI change', () => {
    expect(classify(result({
      result: 'Stopped after the eligibility check. PR #135 is a one-line CI workflow change with a clear, obviously-correct rationale in the description. No further review or comments were posted.',
    })).ok).toBe(true);
  });

  test('review posted — PR #134 second re-run', () => {
    const v = classify(result({
      result: '**No issues found.** PR #134 is a documentation-only fix ... Posted the no-issues summary comment: https://github.com/stephendmann/feedback-kitchen/pull/134#issuecomment-5556110708',
    }));
    expect(v.ok).toBe(true);
    expect(v.reason).toMatch(/posted/);
  });

  test('deliberate skip — PR #141, the one-shot policy on a later push', () => {
    // Third distinct phrasing of the same skip. The workflow also settles this
    // case by checking for an existing Claude comment, but the classifier
    // should not fail it on its own.
    const v = classify(result({
      num_turns: 3,
      result: "PR #141 already has a Claude review comment on it, so per the review policy of not double-reviewing, I'm stopping here without posting anything further. **Verdict: STOP** No further action taken.",
    }));
    expect(v.ok).toBe(true);
    expect(v.reason).toMatch(/skip/);
  });

  test('review posted — PR #131, the first ever post', () => {
    expect(classify(result({
      result: 'Review complete. No issues found — comment posted: https://github.com/stephendmann/feedback-kitchen/pull/131#issuecomment-5555028965',
    })).ok).toBe(true);
  });
});

describe('strict mode, for chapter PRs into manual', () => {
  test('a skip is a failure, because the chapter prompt must review every push', () => {
    const v = classify(result({ result: '**Skipped review**: trivial documentation change.' }), { strict: true });
    expect(v.ok).toBe(false);
    expect(v.reason).toMatch(/every push/);
  });

  test('the one-shot wording is also a failure under strict', () => {
    const v = classify(result({
      result: "PR #141 already has a Claude review comment on it, so I'm stopping here without posting anything further.",
    }), { strict: true });
    expect(v.ok).toBe(false);
  });

  test('a posted review still passes', () => {
    const v = classify(result({
      result: 'Findings posted: https://github.com/stephendmann/feedback-kitchen/pull/144#issuecomment-1',
    }), { strict: true });
    expect(v.ok).toBe(true);
  });

  test('an abandoned run fails for its own reason, not the skip reason', () => {
    const v = classify(result({ result: "I'll wait for the background agents to report back." }), { strict: true });
    expect(v.ok).toBe(false);
    expect(v.reason).toMatch(/abandoned/);
  });

  test('non-strict is unchanged, so code PRs keep their skip path', () => {
    expect(classify(result({ result: '**Skipped review**: trivial.' })).ok).toBe(true);
  });
});
