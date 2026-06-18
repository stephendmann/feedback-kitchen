# Favicon set — navy "Michelin-style" chef badge

Generated from `_source-navy.svg` (the **"Michelin style blue exterior"** variant:
a self-contained **navy `#1e3553` square tile** with a gold-rimmed shield and a
white chef). Regenerate any time with:

```bash
node scripts/generate-favicons.mjs
```

## Files

| File | Size | Used by |
|---|---|---|
| `favicon.ico` | 16/32/48 multi-res | Legacy browsers, Windows, bookmarks |
| `favicon-16x16.png` | 16×16 | Browser tab |
| `favicon-32x32.png` | 32×32 | Browser tab (hi-dpi), taskbar |
| `favicon-48x48.png` | 48×48 | Windows site icons |
| `apple-touch-icon.png` | 180×180 | iOS home-screen |
| `android-chrome-192x192.png` | 192×192 | Android / PWA |
| `android-chrome-512x512.png` | 512×512 | PWA install / splash |
| `site.webmanifest` | — | PWA metadata |
| `test.html` | — | Local visual test page |
| `_source-navy.svg` | 1.6 MB | Design source (not shipped to users) |

## Why navy, and why a single source (not adaptive light/dark)

Two design variants were evaluated — **navy tile** vs **white tile** — rendered
at 16/32px on both white and dark tabs:

- Both are **solid square tiles** (not transparent badges); the shield + gold rim
  + white chef is identical. Only the tile colour differs.
- **White tile fails on the default white tab** — the tile vanishes and you're
  left with a floating, unfinished-looking shield.
- **Navy tile reads on both**: it pops on white tabs, and on dark tabs the
  **gold rim keeps the shield legible** even though the navy edge merges.
- The static `.ico`/PNG/Apple/PWA assets can only ever be **one** image, and that
  image has to work on the dominant white tab — so navy is the only viable single
  source.
- Navy also matches the existing site header brand mark (`/fk-chef.svg`), which is
  itself a self-contained navy tile chosen so it needs no theme switching.

An adaptive `prefers-color-scheme` SVG (navy in light, white in dark) was
considered and **declined**: it would only marginally sharpen the dark-mode
square *edge* for modern browsers, can't help any of the static contexts above,
and Safari has an unreliable history honouring dark-mode media queries inside
favicon SVGs.

## Small-size legibility

- **No simplified variant was needed.** At 16px the chef's face/arms soften into a
  white figure, but the **gold-rimmed shield silhouette** — the real recognition
  cue — survives cleanly. 32px and up are crisp.
- Rendered at **density 384 + Lanczos** downsampling for sharp edges.
- Every output is `-strip`ped, removing the source's Canva/C2PA provenance
  metadata (the source SVG carries a large embedded raster + C2PA manifest; only
  the rasterised pixels are kept).

## No SVG favicon — a source-specific decision, NOT a general rule

`_source-navy.svg` is technically an SVG but **wraps a 2000×2000 base64 raster**
(≈1.6 MB). Shipping it as `rel="icon" type="image/svg+xml"` would be pure bloat
with zero crispness gain over the PNGs, so this set is **PNG + ICO only**.

This conclusion is tied to *this asset being raster-in-SVG* — it is **not** a
stance that SVG favicons are bad. If the mark is ever rebuilt as a **true vector**
source (real paths, small payload), an SVG favicon becomes worthwhile again and
can even go adaptive via `prefers-color-scheme` (see
https://web.dev/articles/building/an-adaptive-favicon). At that point: add
`<link rel="icon" type="image/svg+xml" href="...">` ahead of the PNG links and
keep the ICO/PNG set as the fallback for browsers and contexts that don't use it.

## Going live

These are staged under `public/favicon/` for local testing without touching the
live root favicons. To adopt:

1. Move/copy these files to the **site root** (where `favicon.ico`,
   `apple-touch-icon.png`, etc. already live).
2. Update the `<head>` links to drop the `/public/favicon/` prefix (use `/`).
3. Replace the old `theme-color` (`#1e40af`) with `#1e3553` to match the tile.
4. Delete the superseded `icon-192.png` / `icon-512.png` or repoint the manifest.

See `test.html` for the exact `<head>` markup currently under test.
