# Favicon set — size-appropriate chef badge

Favicons are designed **per size**. A single detailed mark can't serve both a
16px browser tab and a 512px install icon, so this set uses **two sources**:

| Source | Type | Drives | Why |
|---|---|---|---|
| `favicon-small.svg` | true vector | `favicon-16/32/48.png`, `favicon.ico`, **and the SVG favicon** | Minimal **toque-in-shield** mark — the detailed chef collapses into noise at 16/32px, so the tab shows only the hat |
| `_source-navy.svg` | raster-in-SVG (~1.6 MB) | `apple-touch-icon` (180), `android-chrome` 192/512 | Detailed **chef badge** — looks great at 180px+, used only where icons render large (home-screen / PWA) |

Palette: navy `#1a2744` · gold `#c9a84c` · white `#ffffff`.

Regenerate any time:

```bash
node scripts/generate-favicons.mjs
```

## Why split by CONTEXT, not by two size-selected SVGs

The intuitive plan — ship `favicon-small.svg` and `favicon-large.svg` and let
the browser pick by the `sizes` attribute — **does not work**. An SVG favicon is
treated as `sizes="any"`; browsers that support SVG favicons use that one SVG at
*every* size. Size-based selection via `sizes` only applies to **raster** icons
(PNG/ICO).

So the same visual goal is achieved by splitting on **context** instead:

- **Tab** (always small) → minimal toque, served as `favicon-small.svg` (vector,
  crisp at any tab size) with 16/32/48 PNG + `.ico` as fallback.
- **Home-screen / PWA** (always large) → detailed chef badge PNGs.

This is robust across every browser and needs no non-existent SVG-size selector.

## SVG favicon — now YES (this is a true-vector asset)

The minimal mark `favicon-small.svg` is hand-authored clean geometry (no
`<image>`, no embedded raster, no fonts), so it ships as a real SVG favicon.

> Note: the earlier "no SVG favicon" decision applied to the **detailed**
> `_source-navy.svg`, which wraps a 2000×2000 base64 raster — shipping *that* as
> `image/svg+xml` would be ~1.6 MB of payload with no vector-sharpness gain. That
> was a source-specific call, not a general rule, and it correctly flips here
> because this small mark is genuinely vector.

## Files

| File | Notes |
|---|---|
| `favicon-small.svg` | Minimal toque, true vector — the SVG favicon + small-PNG source |
| `favicon.ico` | 16/32/48 multi-res, from the minimal mark |
| `favicon-16x16.png` / `-32x32` / `-48x48` | Tab, from the minimal mark |
| `apple-touch-icon.png` (180) | Detailed chef badge |
| `android-chrome-192x192.png` / `-512x512` | Detailed chef badge (PWA) |
| `site.webmanifest` | PWA metadata (`theme_color` `#1a2744`) |
| `test.html` | Local visual test page |
| `_source-navy.svg` | Detailed design source (not shipped to users) |

## Small-size QA (16 / 32)

- **32px:** crisp — gold shield, navy fill, white toque (puffy crown + band) read
  instantly.
- **16px:** the bold white toque inside the gold rim survives on both white and
  dark tabs. Iterated once (enlarged the toque, thinned the gold rim to ~1.5px)
  so the hat silhouette holds at tab size — far more legible than the detailed
  chef, whose face/arms mush at 16px.
- Rendered at density 384 + Lanczos; every output `-strip`ped of metadata.

## `<head>` markup (staged local paths)

```html
<link rel="icon" href="/public/favicon/favicon.ico" sizes="any">
<link rel="icon" href="/public/favicon/favicon-small.svg" type="image/svg+xml">
<link rel="icon" type="image/png" sizes="16x16" href="/public/favicon/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/public/favicon/favicon-32x32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/public/favicon/apple-touch-icon.png">
<link rel="manifest" href="/public/favicon/site.webmanifest">
<meta name="theme-color" content="#1a2744">
```

## Going live

These are staged under `public/favicon/` so the live root favicons stay untouched
during testing. To adopt: move the files to the **site root**, drop the
`/public/favicon/` prefix in the markup (→ `/`), set `theme-color` to `#1a2744`,
and retire the old `icon-192.png` / `icon-512.png` (or repoint the manifest).
