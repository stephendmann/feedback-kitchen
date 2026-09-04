# Branding and Visual Identity

Feedback Kitchen pairs an ergonomic, academic-friendly interface with a clear visual identity and culinary conceptual metaphor.

### The culinary metaphor system

The user interface uses a cohesive culinary metaphor to describe assessment workflows:

| Concept | Culinary Term | Interface Location |
|---|---|---|
| **Assessment Configuration** | Kitchen / Scorer | Home dashboard (`#kitchen-grid`) and builder wizard. |
| **Synthesised Draft** | Cooked Feedback | Main feedback drafting editor (`#sec-feedback`). |
| **AI Text Polish** | Garnish | AI wording assistant API endpoint (`/api/garnish`). |
| **Reusable Phrases** | À la Carte Snippets | Personal snippet insertion menu (`SA_SNIPPETS`). |

### Core positioning and voice principles

The brand voice is defined in the project's **Brand Voice Canon**:

- **Core Positioning Statement:** *"Not an autograder — you choose the grades, the tool drafts the feedback."*
- **The Rule-of-Three Signature:**
  - *"Build · Mark · Export."*
  - *"Your rubric. Your judgement. Done in clicks."*
  - *"One rubric. Every marker. Consistent feedback."*
  - *"Student data never leaves the room."*
- **Academic Respect:** Copy respects the professional expertise of markers and avoids patronising automation claims. Plain language is preferred over technical jargon.

### Visual identity and icon assets

The application includes a complete suite of multi-resolution vector and raster assets:

- **Chef Brand Mark:** Vector SVG (`fk-chef.svg`) and high-density badge (`fk-chef-badge.png`) rendered in the primary navigation bar.
- **Favicon Suite:** The pages link `/favicon.ico`, `/fk-chef.svg`, `/favicon-32.png` and `/icon-192.png`. A fuller set at 16, 32 and 48 pixels is generated into `public/favicon/` by `scripts/generate-favicons.mjs` but is not currently referenced by any page.
- **Apple Touch Icon:** High-resolution 180×180 PNG (`apple-touch-icon.png`) for iOS home-screen bookmarks.
- **Web Manifest:** A `site.webmanifest` exists in `public/favicon/`, along with `icon-192.png` and `icon-512.png` at the repository root. No page links the manifest, so standalone installation is not wired up.

### Design principles

The visual interface prioritises speed and clarity:

- High-contrast typography using the **Inter** font family.
- Generous clickable touch targets and keyboard focus rings.
- Zero decorative animation bloat, ensuring instant responsiveness across large marking sessions.
