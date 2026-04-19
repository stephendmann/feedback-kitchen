# Feedback Kitchen — Ko-fi button swap

**Scope:** replace the text-and-emoji "Buy me a coffee" button in the footer with the official Ko-fi "Support me on Ko-fi" image button.

**Files to touch:** every page with a footer Ko-fi button. Check at minimum `scorer.html`, `builder.html`, `index.html`, `upload.html`. Use Grep to confirm — replace every occurrence.

---

## Task

**Find** (in each page — pattern will be near-identical, with minor whitespace variation):

```html
<a href="https://ko-fi.com/smann" target="_blank" rel="noopener noreferrer" aria-label="Support Stephen on Ko-fi" class="inline-flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-sm font-medium text-slate-900 shadow-sm hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 transition">
  <span aria-hidden="true">☕</span> Buy me a coffee
</a>
```

**Replace with:**

```html
<a href="https://ko-fi.com/smann" target="_blank" rel="noopener noreferrer" aria-label="Support Stephen on Ko-fi" class="inline-block transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 rounded">
  <img src="https://storage.ko-fi.com/cdn/brandasset/v2/support_me_on_kofi_blue.png"
       alt="Support me on Ko-fi"
       height="36"
       style="height:36px;width:auto;border:0;display:block">
</a>
```

**Also tidy the supporting copy** — the preceding `<p>` in the scorer footer currently reads:

```
If my tools save you time, a tip helps cover hosting and AI tokens to keep them improving.
```

Leave as-is. It still reads well with the new button.

---

## Acceptance

- Every page that had the old button now shows the official Ko-fi blue image button.
- Clicking it still opens `https://ko-fi.com/smann` in a new tab with `rel="noopener noreferrer"`.
- Button height ≈36px on all viewports.
- Keyboard focus ring visible when tabbed to.
- Hover reduces opacity slightly (subtle — the Ko-fi brand asset shouldn't be recoloured).
- Prints correctly (or is hidden — whichever the page's existing footer rule dictates; do not change print behaviour).

No version bump needed — cosmetic change only. No cache-bust needed unless you also touched `shared.js` or `excel.js` (which you shouldn't have).
