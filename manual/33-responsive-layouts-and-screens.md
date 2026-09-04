# Responsive Layouts and Screens

Feedback Kitchen adapts dynamically across desktop monitors, laptops, tablets, and mobile devices through a responsive layout system built with Tailwind CSS.

### Desktop layout (≥768px)

On desktop viewports:

- **Stacked Sticky Navigation:** The primary header (`h-14`) and section rail stick to the top of the viewport (`sticky top-0` and `sticky top-14`), maintaining rapid section access during long document scrolls.
- **Split Focus Workspace:** Focus mode arranges criteria controls and feedback editing into a side-by-side grid (`focus-card-grid` with a fixed controls column and flexible feedback textarea).
- **Expanded Tables:** The main rubric section renders a full multi-column table displaying criterion names, percentage weights, grade dropdowns, midpoints, manual override fields, calculated weighted scores, and tier pills.

### Mobile and tablet layout (<768px)

On smaller screens:

- **Adaptive Header:** The primary top bar refactors into a stacked flex column, placing the brand mark, marker readout, theme toggle, and **New student** button within easy thumb reach.
- **Horizontal Scrollable Rail:** The section rail switches to a smooth horizontally scrolling container (`overflow-x-auto whitespace-nowrap`), allowing markers to swipe between section anchors without cluttering vertical screen space.
- **Stacked Card Views:** Complex table rows collapse into vertical input cards with full-width grade selectors.

### Scroll padding and anchor offsets (FK-29)

When jumping to sections using the rail or keyboard shortcuts, sticky navigation bars can obscure section headings if not properly offset.

Feedback Kitchen solves this at the document root using CSS `scroll-padding-top`:

- **Desktop:** `scroll-padding-top: 6.5rem`
- **Mobile:** `scroll-padding-top: 8.5rem`

Every in-page anchor jump (`#sec-student`, `#sec-rubric`, `#sec-feedback`) lands with the section title positioned cleanly beneath the navigation bars.

### Print media styling (`@media print`)

When triggering **Print page** or `Ctrl + P`:

- All interactive controls (`.no-print`), navigation bars, and modals are hidden.
- Container boundaries expand to full page width (`.print-full`).
- Background colours convert to pure white for crisp, high-contrast printing on standard paper or PDF export.
