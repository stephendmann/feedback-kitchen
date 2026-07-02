---
name: writing-review
description: Audit text for signs of AI writing using the distilled Wikipedia:Signs_of_AI_writing catalogue, and optionally rewrite it. Use when asked to check whether text reads as AI-generated, to de-AI or humanise a draft, to review writing style before publishing, or to vet your own output ("review your last answer", "does this sound like AI?").
---

# Writing review

Audit a block of text against the catalogue in `references/ai-writing-signs.md` (distilled from [Wikipedia:Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing)), report which signs appear, and — only if asked — rewrite the text to remove them.

## Accepting input

The text to review can arrive as any of:

1. **Pasted text** in the invocation or the surrounding conversation.
2. **A file path** (or several) — read the file(s) first. For HTML, review the human-visible copy (headings, paragraphs, alt text, button labels), not the markup.
3. **A self-review request** — "review your last output", "check this PR description", "audit this page". Locate that text in the conversation or repo and treat it as the input.

If no target text can be identified, ask for it — don't audit the request itself.

## Audit workflow

1. Read `references/ai-writing-signs.md` in this skill's directory in full.
2. Scan the input against every catalogue entry (A1–E3). Collect, for each hit: the sign's ID and name, the quoted evidence (shortest quote that shows the pattern), and the sign's signal strength.
3. Weigh before reporting, per the catalogue's caveats:
   - One or two Medium/Low hits in isolation are not worth reporting as findings — mention them at most as a footnote.
   - Density is the tell for vocabulary (B1): count distinct AI-vocabulary words and total occurrences; report the counts.
   - Definitive-strength artifacts (D1–D3, E2, verified E3) justify a firm conclusion on their own.
4. Report, in this order:
   - **Verdict** — one sentence: how strongly the text reads as AI-generated (e.g. "no meaningful signs", "a few stylistic tells but nothing conclusive", "multiple high-signal patterns; very likely AI text"), with the caveat that stylistic evidence is probabilistic, never proof.
   - **Findings** — one line per confirmed sign: `ID · sign name · strength — "quoted evidence"`. Most severe first.
   - **Weak signals skipped** — brief, only if any were close calls.

Never accuse an author. The deliverable is "this text shows/doesn't show these patterns", not "this person used AI".

## Rewriting (only on request)

When asked to fix the text rather than just audit it:

- Fix only flagged patterns; preserve meaning, facts, and roughly the original length. Do not add new claims.
- Typical repairs: restore plain copulas (*is/has*), delete significance-inflation and participle tails, cut puffery adjectives, replace weasel attributions with the actual source or nothing, unwind negative parallelisms into direct statements, convert label-bullet lists back to prose, demote Title Case headings, swap em dashes for commas/parentheses where they're doing routine work, strip chat leakage and placeholders entirely.
- Show the rewrite, then a short list of what changed keyed to the finding IDs.

### In this repository (Feedback Kitchen)

Rewrites of user-facing copy must also conform to `brand-voice-canon.md` at the repo root: AU/NZ spelling, plain language, "you" voice, sentence-case UI text, calm non-alarmist tone. The canonical rule-of-three brand lines listed there are deliberate and exempt from sign B4 — do not "fix" them.

## Re-syncing the catalogue

The Wikipedia article evolves; the reference file records its retrieval date. To refresh:

1. Fetch the current wikitext:
   ```
   curl -s "https://en.wikipedia.org/w/api.php?action=parse&page=Wikipedia:Signs_of_AI_writing&prop=wikitext&format=json&formatversion=2"
   ```
   (If the network blocks Wikipedia, ask the user to paste or upload the current article text instead.)
2. Diff the article's sections against the catalogue entries: new signs, retired signs (the article tracks how vocabulary shifts by model era), changed word lists.
3. Update `references/ai-writing-signs.md` — keep the entry IDs stable where possible, and update the **Retrieved** date in its header.
