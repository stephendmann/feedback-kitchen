# Favicon set — size-appropriate chef badge

Favicons are designed **per size**. A single detailed mark can't serve both a
16px browser tab and a 512px install icon, so this set uses **two sources**:

| Source | Drives | Why |
|---|---|---|
| `_source-small.svg` | `favicon-16/32/48.png`, `favicon.ico` | Minimal **toque-in-shield** mark (white chef's hat, no face/body) — the detailed chef collapses into noise at 16/32px, so the tab shows only the hat |
| `_source-navy.svg` | `apple-touch-icon` (180), `android-chrome` 192/512 | Detailed **chef badge** — looks great at 180px+, used only where icons render large (home-screen / PWA) |

Palette: navy `#1a2744` · gold `#c9a84c` · white `#ffffff`.

Regenerate any time:

```bash
node scripts/generate-favicons.mjs
```

## Why split by CONTEXT, not by two size-selected SVGs

The intuitive plan — ship a small SVG and a large SVG and let the browser pick by
the `sizes` attribute — **does not work**. An SVG favicon is treated as
`sizes="any"`; browsers that support SVG favicons use that one SVG at *every*
size. Size-based selection via `sizes` only applies to **raster** icons
(PNG/ICO).

So the same visual goal is achieved by splitting on **context** instead:

- **Tab** (always small) → minimal toque (16/32/48 PNG + `.ico`).
- **Home-screen / PWA** (always large) → detailed chef badge PNGs.

## No SVG favicon (both sources are raster-in-SVG)

Both `_source-small.svg` and `_source-navy.svg` are technically SVG but **wrap a
high-res base64 raster** (~1.7 MB / ~1.6 MB). Shipping either as
`rel="icon" type="image/svg+xml"` would be payload bloat with no vector-sharpness
gain, so the tab uses the rasterised **16/32/48 PNG + ICO**.

> This is a source-specific decision, not a stance that SVG favicons are bad. If
> the small toque mark is ever rebuilt as a **true vector** (clean paths, small
> payload), add it back as `<link rel="icon" type="image/svg+xml" ...>` ahead of
> the PNG links and keep the ICO/PNG as fallback — optionally adaptive via
> `prefers-color-scheme` (see web.dev/articles/building/an-adaptive-favicon).

## Files

| File | Notes |
|---|---|
| `favicon.ico` | 16/32/48 multi-res, from the minimal toque mark |
| `favicon-16x16.png` / `-32x32` / `-48x48` | Tab, from the minimal toque mark |
| `apple-touch-icon.png` (180) | Detailed chef badge |
| `android-chrome-192x192.png` / `-512x512` | Detailed chef badge (PWA) |
| `site.webmanifest` | PWA metadata (`theme_color` `#1a2744`) |
| `test.html` | Local visual test page |
| `_source-small.svg` | Minimal toque design source (not shipped to users) |
| `_source-navy.svg` | Detailed chef design source (not shipped to users) |

## Small-size QA (16 / 32)

- **32px:** crisp — gold shield, navy fill, white toque (pleats visible) read
  instantly.
- **16px:** the toque blurs to a clean white mass inside the gold rim, but the
  hat-in-shield silhouette survives on both white and dark tabs — far more legible
  than the detailed chef, whose face/arms mush at 16px.
- Rendered at density 384 + Lanczos; every output `-strip`ped of metadata.

## `<head>` markup (staged local paths)

```html
<link rel="icon" href="/public/favicon/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="16x16" href="/public/favicon/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/public/favicon/favicon-32x32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/public/favicon/apple-touch-icon.png">
<link rel="manifest" href="/public/favicon/site.webmanifest">
<meta name="theme-color" content="#1a2744">
```

## Live wiring

The five live pages (`index`, `scorer`, `builder`, `convert`, `upload`) point
their `<head>` directly at this folder via `/public/favicon/...` paths, with
`theme-color` `#1a2744`. Vercel serves the repo root (`outputDirectory: "."`),
so these paths resolve in production. Guarded by `js/favicon-links.test.js`.

The old root assets (`favicon-32.png`, `icon-192.png`, `icon-512.png`,
`fk-chef.svg`) are intentionally left in place — `fk-chef.svg` is still the
header logo `<img>`, and `icon-192.png` is used as decoration on the how-to page.

**Optional future tidy:** move this set to the site root and drop the
`/public/favicon/` prefix (→ `/`) for shorter URLs. Not required — it's purely
cosmetic, and would mean updating the markup + this folder's paths together.
