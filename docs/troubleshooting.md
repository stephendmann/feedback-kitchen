# Troubleshooting notes

Failures that have cost real time in this repo, with the diagnosis that actually worked. Each entry records what the symptom looks like, what it turned out to be, and which check settles it.

Every claim here was verified against this repository: the workflow run history, the built CSS, or the running app. Where a diagnosis was wrong the first time, that is recorded too, because the wrong answer is usually the plausible one.

---

## The Claude review job fails in seconds

**Symptom.** The "Claude code review (read-only)" check goes red about two seconds after Claude Code initialises. The log ends with `is_error: true`, `num_turns: 1`, `total_cost_usd: 0`, and no error message. It happens on every pull request, regardless of what the diff contains.

**What it is.** Zero cost with an instant first-turn failure means the run was rejected before any work happened. In this repo the cause has been the mutable `@v1` tag on `anthropics/claude-code-action` moving under us, not the OAuth token.

The run history is the evidence. `fk-claude-review.yml` has not been edited since 2026-06-23, yet:

| Date | `@v1` resolved to | Result |
|---|---|---|
| 2026-07-06 | `558b1d6` | green, 10 turns, $0.25 |
| 2026-07-18 | `3553f843` | fail, 1 turn, $0 |
| 2026-07-24 | `44423bd` | fail, 1 turn, $0 |

Three different action SHAs in under three weeks, and only the oldest was ever green. Everything in the job before the Claude call is byte-identical between the green run and the failing ones.

**Why the token looked guilty.** The 2026-07-18 failure was diagnosed as an expired `CLAUDE_CODE_OAUTH_TOKEN`, the token was regenerated, and the pull request merged. That reads like a fix but is not one: the review check is **not a required status check** and `main` has **no branch protection**, so pull requests merge red either way. There has been no green review run since 2026-07-06, and a second token regeneration on 2026-07-24 changed nothing.

Never infer that a check recovered from the fact that a pull request merged. Read the run conclusion.

**What to do.** Pin the action to the last known-good SHA, which is also the standard hardening for third-party actions:

```yaml
uses: anthropics/claude-code-action@558b1d6cab4085c7753fe402c10bef0fbb92ac7a
```

Treat that as a test rather than a guaranteed fix. A pinned action can still fail for quota, auth, or upstream service reasons, and there is a second floating dependency in the same workflow: `plugins: "code-review@claude-code-plugins"` resolves against live `anthropics/claude-code.git`. Pinning the action discriminates between the two. If a pinned run still fast-fails, the marketplace plugin is the remaining suspect.

**Confirming it worked.** Re-run from the Checks tab, or `gh run rerun <run_id> --failed`. The run ID is required. A recovered run looks like roughly 10 turns with a non-zero cost; the broken one is always 1 turn and $0.

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
| Claude review fails fast on every PR | The `@v1` tag moved. Pin the SHA, then look at credentials. |
| A red check that never blocked anything before | It is advisory. Check whether it is a required status check before treating it as a gate. |
| `hidden` element still visible | Cascade or specificity, usually `.btn` or an ID selector beating `.hidden`. Not a missing class. |
| A new rule in a stylesheet does nothing | The file stopped parsing above it, or the server is serving a different copy. |
| A fix that appears to change nothing | Evidence about the file or the server, not about the fix. Verify what the browser actually received. |
