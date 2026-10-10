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

  test('abandoned — PR #156 first run, eligibility subagent', () => {
    // Neither #156 wording matched the original literal markers, so both failed as
    // the generic "nothing posted" case. Correct verdict, too vague for the retry
    // watcher to act on.
    const v = classify(result({
      result: "I've kicked off the eligibility check for PR #156 and I'm waiting for that agent to finish before proceeding with the rest of the review.",
    }));
    expect(v.ok).toBe(false);
    expect(v.reason).toMatch(/abandoned/);
  });

  test('abandoned — PR #156 re-run, notified-automatically wording', () => {
    const v = classify(result({
      result: "Waiting for the background agents to complete - I'll be notified automatically.",
    }));
    expect(v.ok).toBe(false);
    expect(v.reason).toMatch(/abandoned/);
  });

  test('the abandonment verdicts point at #163, the open issue, not the closed #136', () => {
    // #136 is closed and describes a different defect (a failed review exiting
    // green). Anyone following the pointer from a red check has to land on the
    // issue that tracks the abandonment.
    const normal = classify(result({ result: "Waiting on the two background agents to finish before continuing." }));
    expect(normal.reason).toMatch(/\(see #163\)$/);
    const posted = classify(result({ result: "I'll wait for the background agents to report back." }), { posted: true });
    expect(posted.ok).toBe(false);
    expect(posted.reason).toMatch(/\(see #163\)$/);
    expect(normal.reason + posted.reason).not.toMatch(/#136/);
  });

  test('talk of comments without a link to one is not a post', () => {
    // The marker is the link, not the word "comment": a run that only discusses
    // inline comments it has not posted must still fail as nothing posted.
    const v = classify(result({ result: 'I reviewed the diff and would leave two inline comments, but have not left them yet.' }));
    expect(v.ok).toBe(false);
    expect(v.reason).toMatch(/nothing posted/);
  });

  test('an abandoned run is still abandoned even if it mentions a discussion', () => {
    const v = classify(result({ result: "Waiting on the two background agents; the discussion of findings will follow." }));
    expect(v.ok).toBe(false);
    expect(v.reason).toMatch(/abandoned/);
  });

  test('a plain mention of an agent is not an abandonment', () => {
    // The looser match must not swallow ordinary prose, or every review that
    // mentions its subagents gets retried.
    const v = classify(result({
      result: 'Four review agents checked the diff. No issues found; posted the comment.',
    }));
    expect(v.ok).toBe(true);
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

  test('deliberate skip — PR #181, the gate stops on a draft PR', () => {
    // Real result text from two runs on PR #181 while it was a draft. None of
    // the SKIP_MARKERS phrases appear in it, so it failed as "nothing posted".
    const v = classify(result({
      num_turns: 4,
      total_cost_usd: 0.39,
      result: "The gate check returned **PROCEED: NO** \u2014 PR #181 is a draft. Per the review instructions, I must stop here without proceeding to further review steps or posting any comments.\n\n**Summary:** PR #181 (\"Add E band (0\u201339) to the NZ grade scale\") is currently a draft PR. Per the code-review workflow's gating rule, draft PRs are not reviewed. No analysis was performed beyond the gate check, and no comments were posted.",
    }));
    expect(v.ok).toBe(true);
    expect(v.reason).toMatch(/draft/);
  });

  test('a draft skip is recognised from the sentence alone, without the gate verdict', () => {
    const v = classify(result({ result: 'Pull request #200 is currently a draft, so I am not reviewing it.' }));
    expect(v.ok).toBe(true);
    expect(v.reason).toMatch(/draft/);
  });

  test('review posted — PR #186 throwaway, findings posted as inline comments', () => {
    // Real result text. It says "inline comments posted" (plural), which no phrase
    // marker matches, but it links each comment, and the link is the evidence.
    const v = classify(result({
      num_turns: 22,
      result: "Both inline comments posted on PR #186:\n\n1. [`js/throwaway-grade-histogram.js:32`](https://github.com/stephendmann/feedback-kitchen/pull/186#discussion_r4236441699) \u2014 boundary bug: strict `>` instead of `>=` miscategorizes scores on a band edge.\n2. [`.github/workflows/fk-review-foreground-test.yml:60`](https://github.com/stephendmann/feedback-kitchen/pull/186#discussion_r4236441930) \u2014 spaced em dash violating the CLAUDE.md \"never spaced\" rule.\n\nBoth were independently flagged by two reviewer passes and confirmed in a validation pass before posting.",
    }));
    expect(v.ok).toBe(true);
    expect(v.reason).toMatch(/posted/);
  });

  test('review posted — PR #131, the first ever post', () => {
    expect(classify(result({
      result: 'Review complete. No issues found — comment posted: https://github.com/stephendmann/feedback-kitchen/pull/131#issuecomment-5555028965',
    })).ok).toBe(true);
  });
});

describe('the draft-skip match stays narrow', () => {
  test('"draft" in ordinary prose is not a skip', () => {
    // FK is full of drafts (the feedback draft, drafted comments). The word alone
    // must not turn a run that posted nothing into a pass.
    const v = classify(result({ result: 'I reviewed the feedback draft in scorer.html and found the wording reasonable.' }));
    expect(v.ok).toBe(false);
    expect(v.reason).toMatch(/nothing posted/);
  });

  test('a sentence about a draft that is not about the PR is not a skip', () => {
    const v = classify(result({ result: 'The output text is a draft of the feedback, ready for the marker to edit.' }));
    expect(v.ok).toBe(false);
  });

  test('an abandoned run that mentions drafting is still abandoned', () => {
    const v = classify(result({ result: "I'm waiting for the agent that is drafting the findings to finish." }));
    expect(v.ok).toBe(false);
    expect(v.reason).toMatch(/abandoned/);
  });

  test('a posted review that mentions a draft PR still reads as posted', () => {
    const v = classify(result({
      result: 'Review complete. The base PR is a draft in the stack, which is fine. comment posted: https://github.com/stephendmann/feedback-kitchen/pull/1#issuecomment-1',
    }));
    expect(v.ok).toBe(true);
    expect(v.reason).toMatch(/posted/);
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

  test('a draft skip is also a failure under strict', () => {
    const v = classify(result({ result: 'The gate check returned **PROCEED: NO** \u2014 PR #7 is a draft.' }), { strict: true });
    expect(v.ok).toBe(false);
    expect(v.reason).toMatch(/every push/);
  });

  test('non-strict is unchanged, so code PRs keep their skip path', () => {
    expect(classify(result({ result: '**Skipped review**: trivial.' })).ok).toBe(true);
  });
});

describe('posted mode, where the workflow already knows findings exist', () => {
  test('a run that wrote findings passes without any prose matching', () => {
    const v = classify(result({ result: 'Wrote my findings to chapter-review.md.' }), { posted: true });
    expect(v.ok).toBe(true);
    expect(v.reason).toMatch(/findings written/);
  });

  test('an abandoned run still fails even though a file exists', () => {
    // Partial findings can be on disk while the run died mid-flight.
    const v = classify(result({ result: "I'll wait for the background agents to report back." }), { posted: true });
    expect(v.ok).toBe(false);
    expect(v.reason).toMatch(/abandoned/);
  });

  test('an errored run still fails', () => {
    const v = classify(result({ is_error: true, result: "You've hit your session limit" }), { posted: true });
    expect(v.ok).toBe(false);
  });

  test('skip wording is irrelevant once posting is a fact', () => {
    const v = classify(result({ result: 'Skipped review of the trivial parts; findings written.' }), { posted: true });
    expect(v.ok).toBe(true);
  });
});
