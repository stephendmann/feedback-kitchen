# Signs of AI writing — distilled catalogue

**Source:** [Wikipedia:Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing)
**Retrieved:** 2026-07-02 (from a full copy of the article supplied by the repo owner)
**Maintained by:** the `/writing-review` skill — see SKILL.md for the re-sync procedure.

Each entry has a **signal strength**:

- **Definitive** — essentially never occurs in human writing; one hit is enough.
- **High** — strong tell, especially when several co-occur.
- **Medium** — meaningful in combination; weak alone.
- **Low** — common in human writing too; only supporting evidence.

## Caveats before you flag anything

- Humans are poor at detecting AI text — studies put untrained readers near chance. Even heavy LLM users are right only ~90% of the time, so expect false positives.
- Human writing is converging on LLM style (measurable since 2024), and some writers deliberately avoid AI tropes. Any single sign proves nothing.
- A word being overused by AI does **not** mean its synonyms are; take the vocabulary lists literally.
- One or two weak signs are coincidence. Many signs, many times, in post-2022 text is the real tell.

---

## A. Content signs

### A1. Undue emphasis on significance, legacy, broader trends — High
Puffing up arbitrary details as representing something bigger; "importance" statements attached to mundane facts, sometimes after a hedge acknowledging low importance.
Watch for: *stands/serves as, is a testament/reminder, a vital/significant/crucial/pivotal/key role/moment, underscores/highlights its importance, reflects broader, symbolizing its ongoing/enduring/lasting, contributing to the, setting the stage for, marking/shaping the, represents/marks a shift, key turning point, evolving landscape, focal point, indelible mark, deeply rooted*. In biology topics: generic ecosystem connections and belaboured conservation status.

### A2. Canned emphasis on notability, attribution, media coverage — High (2025+ models)
Hammering claims of notability by listing where a subject was covered and what kind of outlets they are; "maintains an active social media presence".
Watch for: *independent coverage, local/regional/national media outlets, trade publications, profiled in, written by a leading expert, active social media presence*.

### A3. Superficial analyses — High
Present-participle tails bolted onto sentences to assert significance: "..., highlighting the collaborative nature of X", "..., ensuring Y". Also claims that things "have generated debate about" related concepts.
Watch for: *highlighting/underscoring/emphasizing …, ensuring …, reflecting/symbolizing …, contributing to …, cultivating/fostering …, encompassing …, enhancing …, valuable insights, align/resonate with*.

### A4. Promotional, advertisement-like language — High
Travel-guide or press-release tone regardless of topic; may appear in a "rewrite" that claims to remove promotional tone.
Watch for: *boasts a, vibrant, rich, profound, enhancing, showcasing, exemplifies, commitment to, natural beauty, nestled, in the heart of, groundbreaking, renowned, featuring, diverse array, rich cultural heritage, breathtaking*. Newer models are subtler (avoid "the best") but reuse the same phrase set.

### A5. Vague attributions and overgeneralised opinions — Medium-High
Weasel wording plus exaggerating how many sources hold a view ("scholars", "reviewers" for a single cite; "such as" implying non-exhaustive lists without support).
Watch for: *industry reports, observers have cited, experts argue, some critics argue, several sources/publications* (when few are cited), *widely interpreted as*.

### A6. Outline-like "challenges and future prospects" conclusions — High
The rigid formula, not any mention of challenges: "Despite its [praise], [subject] faces challenges…" ending in vague positivity or speculation; "Future Outlook" / "Challenges and Legacy" sections; essay-style "In conclusion" wrap-ups.

### A7. Defining a non-proper-noun title as an entity — Medium
Lead sentences that treat a descriptive title or list as a standalone thing: "*Catchment area (health) refers to…*", "*The 'List of songs about Mexico' is a curated compilation…*".

## B. Language and grammar

### B1. High density of AI vocabulary — High (density is the tell)
Overused words, roughly by model era:
- **2023 – mid-2024 (GPT-4 era):** Additionally (sentence-initial), boasts, bolstered, crucial, delve, emphasizing, enduring, garner, intricate/intricacies, interplay, key (adj.), landscape (abstract), meticulous(ly), pivotal, underscore, tapestry (abstract), testament, valuable, vibrant
- **Mid-2024 – mid-2025 (GPT-4o era):** align with, bolstered, crucial, emphasizing, enhance, enduring, fostering, highlighting, pivotal, showcasing, underscore, vibrant
- **Mid-2025 on (GPT-5 era):** emphasizing, enhance, highlighting, showcasing, plus A2 phrasing
- **Grok idiosyncrasies:** causal, empirical, correlate, underscore (still, as of 2026)
Also: robust, showcase, highlight (verb). "Concrete" (as in *concrete evidence/examples*) is a tell in discussion comments specifically.

### B2. Avoidance of basic copulas — Medium-High
Replacing *is/are/has* with *serves as, stands as, marks, represents, boasts, features, maintains, offers, refers to*; "ventured into politics as a candidate" for "was a candidate". Documented ~10% drop in *is/are* in post-2023 academic text; visible in AI "copyedits".

### B3. Negative parallelisms — High
"Not only X but (also) Y", "It's not just X, it's Y", "not X, but Y", "no X, no Y, just Z", and the reversed "X rather than Y" (common in Grok output). Often several per page.

### B4. Rule of three — Medium
Reflexive triads ("adjective, adjective, adjective"; three parallel short phrases) used to make thin analysis look comprehensive. Human writers use triads too — flag *frequency*, not existence. (In this repo, deliberate rule-of-three brand lines from `brand-voice-canon.md` are exempt.)

### B5. Excessive lexical variation — Low-Medium
Repetition-penalty side effect: cycling through synonyms/paraphrases instead of repeating a term ("Soviet artistic constraints" → "state-imposed artistic norms" → "the confines of…"). Note: non-native English writers are often taught to do this.

## C. Style and formatting

### C1. Title Case headings — Medium
Capitalising All Main Words in headings where the house style is sentence case.

### C2. Boldface overuse — Medium-High
Mechanical "key takeaways" bolding; emphasising every instance of a chosen phrase; bold inline labels.

### C3. Inline-header vertical lists — High
Bullets or numbers where each item is a **Bold Label:** followed by text; bullet characters (•, -, –) or literal "1." numbering pasted as plain text; sometimes no punctuation between label and text.

### C4. Em-dash overuse — Medium (combine with others)
More em dashes than the genre warrants, doing work commas/parentheses/colons would do; spaced em dashes ( — ); "punched-up" sales rhythm. Newer models (e.g. GPT-5.1) suppress them, so absence proves nothing.

### C5. Unnecessary small tables — Low-Medium
Tiny tables for facts that read naturally as prose.

### C6. Curly quotes and apostrophes — Low-Medium
Curly (“ ” ‘ ’) marks, especially *inconsistently mixed* with straight ones in the same text. ChatGPT/DeepSeek habit; Claude and Gemini typically use straight quotes. Word processors, macOS/iOS smart quotes, and professional typesetting also produce these — weak alone.

### C7. Structural markup quirks — Medium
Skipping heading levels (starting at H3); thematic breaks (`---`) before every heading.

## D. Communication artifacts (chat leakage)

### D1. Collaborative-communication leakage — Definitive
Chatbot correspondence pasted as content: *I hope this helps, Of course!, Certainly!, You're absolutely right!, Would you like…, is there anything else, let me know, here is a…, more detailed breakdown*, meta-advice about how to use the text, "In this section, we will discuss…".

### D2. Knowledge-cutoff disclaimers and speculation about gaps — Definitive
*As of my last knowledge update…, up to my last training update…, while specific details are limited/scarce…, not widely documented/disclosed…, in the provided/available sources/search results…, based on available information…*; speculation about what missing information "likely" is; "maintains a low profile / keeps personal details private" as a cover for absent facts.

### D3. Phrasal templates and placeholder text — Definitive
Unfilled Mad-Libs blanks: *[Your Name]*, *[Describe the specific section…]*, *[link to the revised article]*; placeholder dates (*2025-XX-XX*), *INSERT_SOURCE_URL*, *PASTE_YOUTUBE_VIDEO_URL_HERE*.

## E. Markup and citation artifacts

### E1. Markdown in a non-Markdown context — High
`**bold**`, `## headings`, `[text](url)` links, ``` fenced blocks appearing where the platform uses another markup (or none); mixed/broken hybrid syntax is a very strong tell.

### E2. Chatbot citation-plumbing leakage — Definitive
Machine artifacts pasted verbatim: `citeturn0search0` / `turn0image0` (ChatGPT), `:contentReference[oaicite:0]{index=0}`, `oai_citation`, `Example+1`, `({"attribution":{"attributableIndex":"…"}})` (ChatGPT), `[cite: 1]` (Gemini), `【85†L261-269】` (DeepSeek), `[attached_file:1]` / `[web:1]` (Perplexity), `<grok-card …>` / `grok_render_citation_card_json` (Grok), `:::writing{variant="document" id="12345"}`.

### E3. Hallucinated references and structures — Definitive (once verified)
Citations to sources that don't exist or don't support the claim; invented categories, templates, shortcuts, DOIs; broken generated markup. Requires checking, but confirmed fabrication is conclusive.
