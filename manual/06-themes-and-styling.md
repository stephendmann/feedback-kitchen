# Themes and Styling

Feedback Kitchen provides a responsive visual interface built with Tailwind CSS and custom stylesheets. It supports light mode, dark mode, system preference synchronization, and strict WCAG 2.1 AA contrast compliance.

### The theme switcher

The navigation bar includes a theme toggle button (`#theme-toggle`) displaying a sun or moon icon.

Clicking the toggle switches between light and dark modes:

- **Light Mode (Default):** Clean slate background (`#f8fafc`) with dark slate typography (`#1e293b`) and high-contrast emerald action buttons.
- **Dark Mode:** Deep slate-navy background (`#0f172a`) with light slate text (`#e2e8f0`), lowered component borders, and subdued card backgrounds (`#141d2e`).

Theme choices are persisted in browser local storage under the `fk-theme` key (`"light"` or `"dark"`).

### System preference detection and FOUC prevention

If no explicit theme preference is stored in local storage, Feedback Kitchen reads your operating system preference using the CSS media query `(prefers-color-scheme: dark)`.

An inline initialization script executes in the HTML `<head>` before stylesheets render. This applies the `fk-dark` class to `document.documentElement` immediately, preventing Flash of Unstyled Content (FOUC) when loading pages in dark mode.

### Visual cues and field tints

Feedback Kitchen uses consistent color and structural cues to distinguish input types and calculation states:

| Style Class | Visual Treatment | Meaning |
|---|---|---|
| `.cell-yellow` | Yellow background (`#fefce8`) + 3px solid amber left border (`#d97706`) | Marker input field requiring user interaction. The border provides an accessible non-color cue. |
| `.cell-calc` | Soft blue background (`#eff6ff`) with bold navy text (`#1e40af`) | Auto-calculated score or grade derived from formula logic. |
| `.out-of-band` | Soft red background (`#fee2e2`) + light red border (`#fca5a5`) | Advisory indicator showing an override score sits outside the selected grade band. |
| `.tier-pill` | Tier-specific pastel backgrounds | Identifies rubric performance tier (Excellent, Proficient, Developing, Satisfactory, Unsatisfactory). |

### Typography

The interface uses the **Inter** font family (`wght@400;500;600;700;800;900`) for all UI labels, tables, headings, and instructional copy.

The **Cooked Feedback** editor uses a clean monospace font stack (`font-family: monospace; font-size: 0.82rem; line-height: 1.65;`). Monospace rendering ensures consistent character spacing, paragraph alignment, and clear visibility of indentation or punctuation errors before copying.

### Reduced motion support

The application includes scoped `@media (prefers-reduced-motion: reduce)` guards. When enabled in your operating system, micro-interaction transitions, badge pop animations, and toast entrance glides are disabled while preserving functional visibility.
