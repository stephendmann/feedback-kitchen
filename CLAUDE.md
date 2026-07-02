# CLAUDE.md

## Writing style — avoid AI tells

All prose written in this repo (docs, UI copy, PR descriptions, commit messages, feedback text) follows these rules, distilled from [Wikipedia:Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing). Full catalogue: `.claude/skills/writing-review/references/ai-writing-signs.md`. To audit or fix existing text, use the `/writing-review` skill.

1. Don't inflate significance. No "stands as a testament", "pivotal moment", "underscores the importance", "reflects broader trends", "rich cultural heritage", "evolving landscape", "setting the stage for".
2. No participle tails asserting significance: "…, highlighting X", "…, showcasing Y", "…, ensuring Z". End the sentence at the fact.
3. Use plain copulas. "Is", "has", "was" — not "serves as", "stands as", "boasts", "features", "offers", "refers to" (in definitions).
4. Avoid AI-vocabulary words: delve, tapestry, intricate, meticulous, pivotal, crucial, robust, vibrant, garner, interplay, underscore, showcase, foster, landscape (abstract), testament, and sentence-initial "Additionally,".
5. No negative parallelisms: "not just X, but Y", "It's not X — it's Y", "no X, no Y, just Z".
6. No reflexive rule-of-three triads in body prose. (The canonical brand taglines in `brand-voice-canon.md` are deliberate and exempt.)
7. Em dashes sparingly, and never spaced ( — ); prefer commas, parentheses, or colons.
8. No weasel attributions: "experts argue", "observers note", "industry reports", "widely regarded as".
9. No formula endings: "In conclusion", "Despite these challenges…", "Future outlook", vague upbeat closers.
10. Prose over bullets. No "**Label:** text" bullet lists unless the content is genuinely a list.
11. Bold sparingly — never "key takeaways" bolding. Headings and UI text in sentence case (see `brand-voice-canon.md`).
12. No chat leakage: "I hope this helps", "Certainly!", "Great question", "Would you like…", "Let me know if…".
13. No hedge-disclaimers: "While specific details are limited…", "based on available information", "not widely documented".
14. Never leave placeholders ("[Your Name]", "2025-XX-XX", "INSERT_URL") in anything committed or published.
15. Straight quotes and apostrophes in code, UI strings, and web copy.

## Other writing references

- `brand-voice-canon.md` — canonical voice for all user-facing copy: AU/NZ spelling, plain language, "you" voice, sentence-case UI controls, calm tone.
