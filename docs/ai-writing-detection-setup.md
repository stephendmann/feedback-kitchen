# AI writing detection — global setup

This repo ships two layers for catching (and avoiding) the patterns catalogued at [Wikipedia:Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing):

1. **Passive rules** — the "Writing style — avoid AI tells" section in the root `CLAUDE.md`. Claude loads it automatically in every session *in this repo*.
2. **The `/writing-review` skill** — `.claude/skills/writing-review/`. An on-demand audit/rewrite tool that works on any text: your drafts, Claude's own output, third-party writing.

This page covers extending both layers beyond this repo so they apply to all your Claude Code sessions, Cowork sessions, and claude.ai chats.

## 1. Install the skill globally (Claude Code + Cowork)

On your machine:

```bash
mkdir -p ~/.claude/skills
cp -r .claude/skills/writing-review ~/.claude/skills/
```

Skills in `~/.claude/skills/` are available in every local Claude Code and Cowork session, in any project. Invoke with `/writing-review` (or just ask "does this read as AI-written?").

To pick up future improvements automatically, symlink instead of copying:

```bash
ln -s "$(pwd)/.claude/skills/writing-review" ~/.claude/skills/writing-review
```

## 2. claude.ai web and mobile chats

Web chats don't read `~/.claude`. Two options:

- **Upload as a capability/skill**: in claude.ai, add the `writing-review` folder (SKILL.md + references) as a skill under Settings → Capabilities, where available on your plan.
- **Project instructions**: for a claude.ai Project, paste the global rules block below into the project's custom instructions, and attach `references/ai-writing-signs.md` as project knowledge so chats can audit against the full catalogue.

## 3. Global always-on rules

Append this block to `~/.claude/CLAUDE.md` (create the file if it doesn't exist) to make the passive layer apply to every local session, not just this repo:

```markdown
## Writing style — avoid AI tells

Rules distilled from Wikipedia:Signs_of_AI_writing. Apply to all prose you write for me.

1. Don't inflate significance ("stands as a testament", "pivotal", "underscores the importance", "reflects broader trends", "evolving landscape").
2. No participle tails asserting significance ("…, highlighting X", "…, showcasing Y", "…, ensuring Z").
3. Plain copulas: "is/has/was", not "serves as", "boasts", "features", "refers to" in definitions.
4. Avoid AI vocabulary: delve, tapestry, intricate, meticulous, pivotal, crucial, robust, vibrant, garner, interplay, underscore, showcase, foster, abstract "landscape", testament, sentence-initial "Additionally,".
5. No negative parallelisms ("not just X, but Y", "It's not X — it's Y").
6. No reflexive rule-of-three triads.
7. Em dashes sparingly, never spaced; prefer commas, parentheses, colons.
8. No weasel attributions ("experts argue", "observers note", "industry reports").
9. No formula endings ("In conclusion", "Despite these challenges…", "Future outlook").
10. Prose over bullets; no "**Label:** text" bullet lists unless the content is genuinely a list.
11. Bold sparingly; no key-takeaways bolding.
12. No chat leakage in written artifacts ("I hope this helps", "Certainly!", "Would you like…").
13. No hedge-disclaimers ("While specific details are limited…", "based on available information").
14. Never leave placeholders in output.
15. Straight quotes and apostrophes.
```

Cowork and Claude Code on the same machine share `~/.claude/CLAUDE.md`, so one paste covers both.

## 4. Keeping the catalogue current

The Wikipedia article changes as models change (its vocabulary lists are tracked by model era). The reference file records its retrieval date — currently 2026-07-02. To re-sync, run the procedure in `.claude/skills/writing-review/SKILL.md` ("Re-syncing the catalogue"), or just tell Claude:

> Re-sync the writing-review skill's catalogue from the current Wikipedia article.

If you installed the global copy by `cp` rather than symlink, re-copy after a re-sync.
