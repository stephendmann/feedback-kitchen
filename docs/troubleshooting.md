# Troubleshooting notes

Failures that have cost real time in this repo. Each entry records what the symptom looks like, what it turned out to be, and which check settles it.

Every claim here was verified against this repository: the workflow run history, the built CSS, or the running app. Where a diagnosis was wrong the first time, that is recorded too, because the wrong answer is usually the plausible one.

---

## The Claude review job fails in seconds

**Symptom.** The "Claude code review (read-only)" check goes red about two seconds after Claude Code initialises. The log ends with `is_error: true`, `num_turns: 1`, `total_cost_usd: 0`, and no error message. It happens on every pull request, regardless of what the diff contains.

**What it was.** The `CLAUDE_CODE_OAUTH_TOKEN` repository secret was **empty**. The action received a blank token, which the API rejects on the first turn before any inference, producing the zero-cost signature. Confirmed on 2026-07-25: the owner set the correct value, and re-running the previously failing canary job (`30118079810`) with no other change produced a real review, `is_error: false`, 11 turns, $0.2926, 35 seconds. Same pinned action, same code, only the secret populated.

Read the rest of this entry as a worked example of how long a wrong frame can survive, because the answer turned out to be the very first suspect, wearing a disguise. The failure was the token all along. It was not *expired*, which is what the first diagnosis claimed and later got talked out of. It was blank. "It's the token" was rejected precisely because someone had supposedly already replaced the token, so the reasoning became "the token has been refreshed, therefore the token is not the problem." That inference is only as good as the belief that the refresh wrote a non-empty value to the right secret, and that belief was never checked. **When a fix for a suspect does not work, confirm the fix landed before crossing the suspect off.** An empty secret and a healthy secret are indistinguishable from the run history: both let the job start, both reach the model call, and the action redacts the error that would tell them apart.

What the signature told us, correctly: zero cost with a first-turn failure means the run was rejected before any work happened. Claude Code initialises, reports `"model": "claude-sonnet-5"`, and returns a result roughly two seconds later with `duration_ms` under 2000. Everything in the job before that point succeeds, including the OIDC handshake, the app token exchange, the permission check, the Claude Code install, the marketplace clone, and the plugin install. All of that uses the GitHub token, not the Anthropic one, which is why the Anthropic credential being blank breaks nothing until the model call.

The eliminations below were sound reasoning from the evidence available, and they did useful work: they steered away from the action, the client stack, and the plugin, and toward the account. The one that was wrong, "eliminated: the token", was wrong not in its logic but in its premise. It is kept in place, marked, rather than quietly deleted.

**Eliminated: the action version.** The mutable `@v1` tag did move under us, which looked causal. `fk-claude-review.yml` had not been edited since 2026-06-23, yet:

| Date | `@v1` resolved to | Result |
|---|---|---|
| 2026-07-06 | `558b1d6` | green, 10 turns, $0.25 |
| 2026-07-18 | `3553f843` | fail, 1 turn, $0 |
| 2026-07-24 | `44423bd` | fail, 1 turn, $0 |

Three different action SHAs in under three weeks, and only the oldest was ever green. That is a strong-looking correlation, and it is the wrong answer. PR #98 pinned `558b1d6`, the SHA from the green run, and the next run still failed with the same signature: `is_error: true`, `num_turns: 1`, `total_cost_usd: 0`. The log confirms the pin took effect (`Download action repository 'anthropics/claude-code-action@558b1d6...'`) and that the action's bundled Claude Code 2.1.201 installed cleanly. Same action, same version, green in July and failing now, so the cause is not in the action.

The pin stays, because pinning a third-party action is right regardless and because it removes one variable from the next diagnosis. It is not a fix.

**Eliminated: the client stack entirely.** Comparing the last green run against a pinned failing one settles this. Both installed Claude Code **v2.1.201** and both initialised on **`claude-sonnet-5`**:

| Run | Date | Claude Code | Model | Result |
|---|---|---|---|---|
| `28773539302` | 2026-07-06 | v2.1.201 | `claude-sonnet-5` | `is_error: false`, 10 turns, $0.2487 |
| `29635934160` | 2026-07-18 | v2.1.214 | `claude-sonnet-5` | `is_error: true`, 1 turn, $0 |
| `30118079810` | 2026-07-24 | v2.1.201 | `claude-sonnet-5` | `is_error: true`, 1 turn, $0 |

The same Claude Code version and the same model produced a real review in July and a first-turn rejection now. Nothing that ships in the action explains it. Two corollaries worth keeping:

The model default did not drift. `claude-sonnet-5` is what the SDK selected on the green run too, so "the plan cannot reach the new default model" is not the answer. The plan reached that exact model successfully on 6 July.

Cost reporting works for this token. The green run reported $0.2487, so `total_cost_usd: 0` is not an artefact of subscription billing. It means no billable inference happened.

**Eliminated: the marketplace plugin, mostly.** `plugins: "code-review@claude-code-plugins"` resolves against live `anthropics/claude-code.git` and was the other floating dependency. The log shows it clone, validate, and install successfully every time. It remains possible that the plugin's `/code-review:code-review` command contract changed in a way that errors on the first turn, but the plugin is not failing to load.

**"Eliminated: the token" — this was the wrong elimination.** The 2026-07-18 failure was diagnosed as an expired `CLAUDE_CODE_OAUTH_TOKEN`, the token was reportedly regenerated, and the pull request merged. Reading "the PR merged" as a fix was a genuine error, separate from this one: the review check is **not a required status check** and `main` has **no branch protection**, so pull requests merge red either way. That much still holds, and read the run conclusion, never the merge, for whether a check recovered.

But the deeper mistake was here. Because a regeneration had supposedly happened, the token was crossed off, and every later step reasoned "not the token". The regeneration either wrote an empty value, updated the wrong secret, or did not save. Nobody read back the secret to confirm it was non-empty, and the secret being blank was the whole cause. The lesson is not "suspect the token"; it is **verify that the fix you already applied is actually in place before you rule its target out.**

**Why you cannot see the error.** There is an error message. The action refuses to print it:

```
Running Claude Code via SDK (full output hidden for security)...
Rerun in debug mode or enable `show_full_output: true` in your workflow file for full output.
```

That instruction is half wrong. `gh run rerun --debug` adds runner-level `##[debug]` lines and does **not** lift the redaction, because the suppression happens inside the action rather than in the runner. Verified on run `30117731296`: re-run with `--debug`, identical output, still no error text. The only route to the message is `show_full_output: true` in the workflow, which has two costs worth weighing before anyone reaches for it. It prints Claude's full output into the logs of a public repository, and because it edits the workflow file it cannot take effect until it is merged to `main` (see the validation trap below).

Had the error been visible, this entry would have been one line. It was not, so the cheapest genuinely diagnostic step, once the client stack was ruled out, was to read the secret back and confirm it held a value. That is the step to reach for first next time: when the signature points at the credential and a fix was supposedly already applied, verify the credential is actually present before building anything.

**How to check the secret is set.** GitHub never shows a secret's value, but it will tell you whether one exists and when it was last updated:

```bash
gh secret list
```

An empty or absent `CLAUDE_CODE_OAUTH_TOKEN` here is the whole bug. Regenerate with `claude setup-token` and set it with `gh secret set CLAUDE_CODE_OAUTH_TOKEN`, then confirm the `Updated` timestamp moved.

**Confirming the fix, and the trap that hides it.** Two traps sit between a real fix and the green check that should prove it.

The workflow-validation guard refuses to run on any pull request whose copy of the workflow file differs from `main`, and that refusal exits **green**. So a pull request that edits the workflow cannot test its own change. It flips the check to green while running no review. Verified on run `28016397454`, and again on PR #98, which passed in 14 seconds with `Exiting due to workflow validation skip`.

And the check mark is not the signal. On PR #99 the check reported **pass** in 30 seconds while the log carried `is_error: true`, `num_turns: 1`, and no review was posted. Green here can mean the review ran, the guard skipped it, or the run failed and the action exited zero. All three look identical from the Checks tab.

The only real confirmation is a run that both uses the current `main` workflow and reads the current secret, then the log rather than the check mark:

```bash
gh run view <run_id> --log | grep -E "num_turns|total_cost_usd|is_error"
```

Because the secret is read fresh at run time, re-running a past job that already matched `main` is enough, and it costs nothing. That is how this was confirmed: re-running `30118079810` after the secret was set returned `is_error: false`, 11 turns, $0.2926. A working run is roughly 10 turns with a non-zero cost and `is_error: false`. The broken one is 1 turn and $0.

---

## An element has `class="hidden"` but still renders

**Symptom.** A control carries the `hidden` utility in the markup, the class is present in DevTools, and it is visible on screen anyway. Meanwhile `hidden md:block` elements behave correctly, which makes it look like the class works in general.

**What it is.** Two different collisions against `.hidden`, both real in this repo:

Source order. `.btn` is declared in `scorer.html`'s inline `<style>`, which the browser applies after the linked stylesheets. `.btn { display: inline-flex }` and `.hidden { display: none }` tie on specificity, so the later declaration wins. Anything with `class="btn ... hidden"` renders as flex. This hit `btn-insights`, `btn-modexport-run`, and `btn-modexport-disable`, which defeated the moderation lifecycle split where run and disable stay hidden until opt-in.

Specificity. `#framework-label-chip { display: inline-flex }` is an ID selector and outranks a class outright, so the chip rendered as an empty pill whenever no marking framework was set.

**What to do.** Add a targeted override that wins on specificity without touching the responsive variants:

```css
.btn.hidden { display: none; }
#framework-label-chip.hidden { display: none; }
```

**What not to do.** `.hidden { display: none !important }` fixes these cases and breaks a widely used pattern. Verified in `css/tailwind.out.css`: both `.hidden{display:none}` and `.md\:block{display:block}` are emitted without `!important`, so an important `.hidden` would beat every `hidden md:block` element and stop it un-hiding at its breakpoint. Before adding any `.btn.hidden`-style override, check that nothing in that class relies on a responsive un-hide.

**Why the test suite misses this.** The jest suite reads HTML as text, so it sees the class and passes. Only computed style reveals that the class does nothing. The guard for this lives in `bbp-a11y-tests.mjs`, where a real browser is already driving the page, and it is a custom check rather than an axe rule. It flags any element carrying `hidden` whose computed display is not `none`, after filtering out elements with a responsive un-hide variant. Without that filter it reports 19 false positives from legitimate `hidden md:block` markup, which would make it noise nobody trusts.

---

## A rule added to `shared.css` does nothing

**Symptom.** A new rule is in the file, the stylesheet is linked, the page loads it, and the rule has no effect. It does not appear in the DevTools Styles pane.

**What it is.** A parse failure earlier in the file. `css/shared.css` was committed truncated: a final `@media` block with a selector, no declarations, and no closing braces, leaving the file two braces short. The CSS parser treated everything from that point to end-of-file as an unterminated block and dropped it. The file had been in that state since before 2026-06-15, so the 1100px footer variant never applied and, more damagingly, **any rule appended to this stylesheet silently did nothing**.

That is the failure mode to remember: the symptom is not "my selector is wrong", it is "this file stopped parsing somewhere above me".

**How to check.** Counting `{` against `}` is a useful smell test but only that, since braces inside `content:` strings or `url()` data URIs skew the count. The reliable check is to ask the browser how much of the file it actually parsed:

```js
[...document.styleSheets]
  .filter(s => /shared\.css/.test(s.href || ''))
  .map(s => s.cssRules.length)
```

If appending a rule does not raise that number, the tail is being dropped. When this was hit the count stayed at 30 after a rule was added, and the new selector was absent from the parsed rules entirely.

The dangling block sat at the end of the file, which is why nothing looked broken for five weeks: there was nothing after it to lose. The damage was latent and only surfaced when someone appended to the file, which makes this the kind of bug that punishes the next author rather than the one who introduced it.

**A local gotcha that wastes time first.** Pages link `/css/shared.css` root-absolute, and the dev server is rooted at whichever checkout started it. Editing CSS in a worktree while the server runs from the main checkout means the browser keeps serving the unmodified file, which looks exactly like "my change had no effect". Confirm what is actually being served before diagnosing anything else:

```bash
curl -s http://localhost:3000/css/shared.css | grep -c "<a string from your edit>"
```

Both problems were present at once when this was first hit, and the serving issue masked the parse failure.

---

## First suspects

When one of these fails, start here rather than with the diff:

| Symptom | First suspect |
|---|---|
| Claude review fails fast (1 turn, $0) on every PR | An empty or absent `CLAUDE_CODE_OAUTH_TOKEN` secret. `gh secret list` and check it exists. This was the 2026-07 cause after a supposed regeneration left it blank. |
| Claude review went green the moment you edited its workflow | The validation guard skipped it. A skip exits green. Read the log for `workflow validation`. |
| Claude review is green but posted no review | Green does not mean it ran. Check `is_error` and `num_turns` in the log. |
| A fix for a ruled-out suspect that "was already applied" | Confirm the fix actually landed before trusting the elimination. The empty secret hid behind a regeneration nobody read back. |
| A red check that never blocked anything before | It is advisory. Check whether it is a required status check before treating it as a gate. |
| `hidden` element still visible | Cascade or specificity, usually `.btn` or an ID selector beating `.hidden`. Not a missing class. |
| A new rule in a stylesheet does nothing | The file stopped parsing above it, or the server is serving a different copy. |
| A fix that appears to change nothing | Evidence about the file or the server, not about the fix. Verify what the browser actually received. |
