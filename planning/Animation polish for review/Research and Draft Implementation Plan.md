# Comprehensive implementation plan.

> **🔴 STATUS — read first.** The **Reviewer Verdict** section immediately below is **normative**: it is the FK-grounded source of truth and supersedes everything after it. Everything below the verdict (Plain-language Overview, Research findings, the full implementation plan, timelines, test snippets) is **research provenance only** — raw deep-research output, retained for traceability, **not** to be implemented from directly. Where the body and the verdict disagree (sequencing, test conventions, line references, browser-support dates), the verdict wins. The shippable work derived from this doc is carded as **FK-38** (micro-interactions — adopted), with **FK-39** (accordion) and **FK-40** (View Transitions) deferred. See `planning/BOARD.md`.

---

## ⚠️ Reviewer Verdict — FK-grounded refinements (2026-06-20)

**Verdict: Refine, don't ship as-is.** The research is solid and — unusually — its selector claims check out against the real codebase (`<details>`×18, `setAllDetails`, `#fk-dispatch-toast`, `.btn-blue/green/ghost`, `.grade-badge` all exist). But it reads as generic research output and has one self-contradiction, two technically-broken code patterns, the wrong test conventions for this repo, and a priority order that is **backwards for FK specifically**. Adopt with the changes below.

### 1. Re-sequence — the plan's order is highest-risk-first
The plan ships **View Transitions (P1) first**. For FK that's the *riskiest* item: `startViewTransition` snapshots `:root` and crossfades, and FK runs a sticky topbar + sticky section rail + an IntersectionObserver scroll-spy with `aria-current` + `scroll-padding` (FK-18/28/29). A root crossfade on section/focus toggles can flicker the sticky bars and misfire the scroll-spy. **Do the inverse:**
- **First: Micro-interactions (their P3)** — isolated, mostly CSS, lowest regression risk, and *partly already present* (the toast already glides via `.fk-toast-visible/.fk-toast-fading`, scorer.html:340–341).
- **Second: Accordion** — contained to `<details>`, but see §3.
- **Last: View Transitions** — most cross-cutting; gate behind real testing against the sticky rail + scroll-spy.

### 2. Internal contradiction — "GPU-only" vs a height-animated accordion
The performance budget says *"GPU properties only: transform/opacity; avoid width/height"*, but **both** accordion options animate **height** / `grid-template-rows` — layout properties that are not GPU-composited. Either drop the "60fps GPU" claim for the accordion (a 200ms layout animation is fine — just be honest) or switch to a transform/clip technique. Don't claim both.

### 3. The accordion code (Option B) is broken on close + fires unexpectedly
- `<details>` collapses its content **immediately** when `.open` flips false, so animating `.section-body` height *after* the `toggle` event shows nothing on close (the well-known `<details>` gotcha). The correct pattern intercepts the summary click → `preventDefault` → animate → *then* set `open=false` (ref: [CSS-Tricks — How to Animate the Details Element using WAAPI](https://css-tricks.com/how-to-animate-the-details-element-using-waapi/)). The plan's `animateDetails` skips this.
- `toggle` also fires on **programmatic** `.open` changes, which FK does in `setAllDetails` (scorer.html:4831) and in focus-mode / AI-panel logic (2525, 3610, 4766). So "Expand/Collapse all" would trigger **8 simultaneous height animations**, and focus-mode toggles would animate unexpectedly. Needs an opt-out flag for programmatic toggles.

### 4. Grade-badge "pop" will misfire and get wiped
`recalculate()` reassigns the badge wholesale — `gradeBadge.className = 'grade-badge … ' + colour` (scorer.html:2273) — on **every** recompute (every keystroke/slider move while marking). So `.grade-badge.updated{animation}` would (a) be erased by that reassignment and (b) pop on every minor change (distracting, motion-heavy). **Refinement:** pop only when the *grade letter actually changes*, re-add the class *after* the className reassignment, and remove it on `animationend`.

### 5. Tests don't match FK conventions
FK's jest suite is **static-HTML regex assertions + axe + a puppeteer a11y harness** (the `js/*.test.js` files `fs.readFileSync` the HTML; no jsdom/`getComputedStyle`/`matchMedia` mocking). The plan's examples (`getComputedStyle(btn).transition`, `details.animate toHaveBeenCalled`, `performance.measure < 16.7ms`) won't run here, and a 16.7ms-frame test in jsdom is meaningless. **Refinement:** assert the CSS/JS hooks statically (the `transitionIfSupported` wrapper exists; a `prefers-reduced-motion` block exists; named view-transition CSS present) and verify motion visually via the existing puppeteer/axe harness.

### 6. CSS home, dark mode, and the build step are unspecified (FK-16)
FK runs **three CSS systems**: `tailwind.out.css` (generated — new utilities need `npm run build:css`), `shared.css` (frozen / shrink-on-touch per FK-16), `site-dark.css` (dark variants), plus per-page inline `<style>`. `.btn-*` / `.grade-badge` / toast live in scorer's inline block **and** `site-dark.css`. The plan never says where new rules go. **Refinements:** (a) put new animation CSS in the page inline block (or a clearly-scoped section) — **not** new Tailwind utilities — to avoid the build step, or document the rebuild; (b) the button-lift `box-shadow: rgba(0,0,0,.12)` is **invisible on the dark `#141d2e` header** — add a dark variant in `site-dark.css`; (c) the global `*{animation-duration:1ms!important}` reset must reconcile with scorer's existing `prefers-reduced-motion` block and be tested against the toast's class-driven fade (and any `transitionend`/WAAPI `.finished` waits).

### 7. Trim the artifact
Strip the ~90 auto-scraped footnotes and the trailing "what is a .md file" references [^1–7] at the very end — research-tool noise, not plan content. Keep the genuinely-cited MDN/web.dev links in the References section.

### 8. Re-frame the timeline to FK's workflow
Replace "3 weeks / Week 1 Day 1–2…" (corporate-sprint cosplay for ~1.5 days of solo work) with FK's actual cadence: **three cards/PRs off `main`, each gated by jest + axe** — e.g. **FK-38 micro-interactions**, **FK-39 accordion**, **FK-40 view transitions** (next free ID is FK-38). The ~10–15h total is realistic; the calendar framing isn't.

> **Bottom line:** the micro-interactions slice is genuinely safe, cheap, and could even ride alongside FK-16 styling consolidation. The accordion and view-transition slices need the code fixes above **and** careful testing against the sticky-rail/scroll-spy machinery (FK-18/28/29) before they go near `main`.

---

## Plain language Overview
Here's what the plan will deliver, in plain language:

## What a First-Time Visitor Will Experience

**Right now**, Feedback Kitchen's interface is functional but static — things appear and disappear instantly when you click them. There's no sense of flow or motion. The plan changes that in three ways:

### 1. Smooth Scene Changes
When you switch between major modes — like turning on "Focus marking" or expanding a section — instead of the page just snapping to the new state, it will **gently crossfade** from one view to the other. It's the same effect you'd feel switching between screens in a well-made phone app. The page feels like a continuous space rather than a series of jumps.

### 2. Accordion Open/Close
The page is divided into collapsible sections (Student, Rubric, Feedback, etc.). Currently they snap open and shut. After the upgrade, they'll **slide smoothly open and closed**, like a real accordion or a drawer. The content gently expands to reveal itself rather than popping in. This makes the page easier to read because your eye can track what's changing.

### 3. Buttons and Controls That Respond
Currently buttons are visually flat — they don't react when you hover or click. After the upgrade, buttons will **subtly lift** when you hover over them, toasts (the little notification messages) will **glide in** rather than appear out of nowhere, and the grade badge will do a small **bounce** when a score updates. These are micro-moments that cumulatively make the tool feel more alive and responsive.

## What Doesn't Change

- Nothing about how the tool **works** changes — same scoring, same feedback, same exports
- It still works perfectly even in **older browsers** (they just won't see the animations)
- Users who have set their device to **"reduce motion"** (common for people with vestibular disorders or motion sensitivity) will see instant transitions instead — the tool respects that automatically
- **No new software** is added — the entire upgrade costs less than 2KB, which is smaller than a single emoji

## The Net Effect

A new user arriving at Feedback Kitchen after this plan is complete will encounter a tool that feels **polished and professionally made** — the kind of quality you'd associate with commercial software — rather than a functional-but-rough web page. The animations are specifically tuned to be *noticed but not distracting*: they confirm that your actions worked, help you track what changed, and make the interface feel cohesive.

## Research Based: Key Findings

After evaluating 8 animation approaches against FK's constraints (vanilla JS, zero dependencies, accessibility, progressive enhancement), **three high-priority options** emerged:

### Priority 1: View Transitions API (Score: 66/70)

- **What**: Browser-native crossfades between DOM states
- **Why**: Zero-code solution, 0 bytes bundle cost, works in all modern browsers
- **Implementation**: Wrap state changes in `document.startViewTransition()`
- **Fallback**: Instant updates in unsupported browsers


### Priority 2: CSS Accordion Animations (Score: 58/70)

- **What**: Smooth expand/collapse for FK's 8+ `<details>` sections
- **Why**: Native semantics, <1KB with WAAPI, fully accessible
- **Implementation**: Web Animations API wrapper for dynamic height
- **Fallback**: Instant expand/collapse


### Priority 3: GPU-Accelerated Micro-interactions (Score: 54/70)

- **What**: Button hovers, toast glides, focus pulses
- **Why**: Pure CSS, 0 bytes, immediate polish
- **Implementation**: Transitions on `transform`/`opacity` only
- **Fallback**: Static states (still functional)


## Why These Three?

All three:

- ✅ **Preserve vanilla architecture** (no libraries)
- ✅ **Zero or minimal bundle cost** (<2KB total)
- ✅ **Respect `prefers-reduced-motion`** (WCAG 2.2 compliant)
- ✅ **Degrade gracefully** (no breakage in older browsers)
- ✅ **Target 60fps** (GPU-friendly properties only)


## Implementation Timeline

**3 weeks total**:

- Week 1: View Transitions + micro-interactions (immediate polish)
- Week 2: Accordion animations (section depth)
- Week 3: Edge cases + documentation

The plan includes:

- Browser support matrix
- Code patterns with feature detection
- Jest test patterns matching FK conventions
- Accessibility compliance checklist
- Performance guardrails (16.7ms frame budget)
- Risk mitigation strategies

**The full (research-provenance) implementation plan is below** — it contains detailed code examples, testing patterns, and a draft roadmap. Treat it as reference, not instructions (see status banner at top; the verdict supersedes it).

# Feedback Kitchen Animation Upgrade — Implementation Plan

*Deep research implementation plan — June 2026*

***

## Executive Summary

This document provides a comprehensive, prioritized implementation plan for upgrading Feedback Kitchen's animation system using a **zero-dependency, vanilla JavaScript approach**. After evaluating 8 implementation options against FK's constraints (vanilla-only, zero dependencies, accessibility, progressive enhancement), **three high-priority implementations** emerge as the optimal path forward.

**Recommended approach:** Implement in priority order:

1. **View Transitions API** (same-document) for crossfades — instant value with zero code
2. **CSS-only accordion animations** (grid-template-rows + Web Animations API) for section expand/collapse
3. **CSS GPU-accelerated micro-interactions** for hover states, toasts, focus indicators

All implementations:

- Preserve FK's vanilla architecture
- Add zero dependencies
- Respect `prefers-reduced-motion`
- Progressively enhance (no breakage in unsupported browsers)
- Target 60fps performance

***

## Research Methodology

This plan emerges from systematic research across:

- **Browser API documentation** (MDN, W3C specs, Can I Use data)
- **Implementation patterns** (web.dev, CSS-Tricks, Smashing Magazine)
- **Performance best practices** (GPU acceleration, 16.7ms frame budget)
- **Accessibility standards** (WCAG 2.2, prefers-reduced-motion)
- **FK codebase analysis** (existing patterns, test conventions, constraints)


### Evaluation Framework

Each option scored on:

- **Vanilla-only**: Eliminates library dependencies (0–10)
- **Bundle impact**: Minimal or zero additional bytes (0–10)
- **Browser support**: Works across Chrome/Safari/Firefox (0–10)
- **Progressive enhancement**: Degrades gracefully (0–10)
- **Implementation effort**: Low code complexity (0–10)
- **Accessibility**: Respects motion preferences (0–10)
- **Performance**: Maintains 60fps (0–10)

**Total score**: 70 points possible. Options ≥50 are high-priority.

***

## Priority 1: View Transitions API (Same-Document)

**Score: 66/70** — Highest value-to-effort ratio

### What It Does

Automatically crossfades between DOM states when you mutate the page. Wrap state changes in `document.startViewTransition()` and the browser handles snapshots, compositing, and animation.

### Why Priority 1

- **Zero code for basic crossfades**: One-line wrapper for instant polish
- **Native browser API**: No library, no bundle size impact
- **Perfect fit for FK**: Section visibility toggles, focus mode transitions, tab switches
- **Excellent browser support**: Chrome 111+, Safari 18.2+, Firefox 144+ (May 2026)


### Implementation

```javascript
// Feature detection wrapper (no polyfill needed — just skip gracefully)
function transitionIfSupported(updateDOM) {
  if (!document.startViewTransition) {
    updateDOM();
    return;
  }
  document.startViewTransition(() => updateDOM());
}

// Example: Toggling focus mode
function toggleFocusMode() {
  transitionIfSupported(() => {
    document.body.classList.toggle('fk-focus-on');
    // ... existing DOM updates
  });
}

// Example: Section expand/collapse
function toggleSection(detailsEl) {
  transitionIfSupported(() => {
    detailsEl.open = !detailsEl.open;
  });
}
```

**CSS controls** (prefers-reduced-motion compliant):

```css
/* Default: 200ms crossfade */
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 200ms;
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation-duration: 1ms;
  }
}

/* For named elements, e.g., focus workspace */
#focus-workspace {
  view-transition-name: focus-panel;
}
```


### Where to Apply

1. **Focus mode toggle** (scorer.html `toggleFocusMode()`)
2. **Section expand/collapse** (details element open/close)
3. **Tab switches** (if FK adds tabbed interfaces)
4. **Cohort view mode changes**

### Browser Fallback

If `startViewTransition` is unavailable, updates happen instantly with no animation — zero breakage, just less polish.

### Testing Pattern

```javascript
describe('View Transitions', () => {
  test('focus mode toggle uses transitionIfSupported wrapper', () => {
    expect(html).toMatch(/transitionIfSupported\(/);
  });
  
  test('transitions degrade gracefully when unsupported', () => {
    delete document.startViewTransition;
    // Verify UI still updates correctly
  });
});
```


### Bundle Impact

**0 bytes** — pure browser API

### Accessibility Compliance

- `prefers-reduced-motion: reduce` → 1ms duration via CSS
- No motion if API unsupported
- WCAG 2.2 compliant

**Implementation effort**: 2–4 hours (feature detect wrapper + 4–6 call sites)

***

## Priority 2: CSS-Only Accordion Animations

**Score: 58/70** — Robust, accessible, performant

### What It Does

Animates `<details>` element open/close using CSS `grid-template-rows` or Web Animations API. No JavaScript animation logic — just CSS transitions or WAAPI keyframes.

### Why Priority 2

- **Native HTML semantics**: `<details>`/`<summary>` already accessible
- **Zero dependencies**: Pure CSS or minimal WAAPI wrapper
- **High polish**: Smooth expand/collapse feels modern
- **FK already uses `<details>`**: 8+ sections ready to animate


### Implementation Approaches

#### Option A: CSS Grid (Simplest)

```css
details {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 200ms ease;
}

details[open] {
  grid-template-rows: 1fr;
}

details > div {
  overflow: hidden;
}

@media (prefers-reduced-motion: reduce) {
  details {
    transition-duration: 1ms;
  }
}
```

**Pros**: Zero JS, 8 lines of CSS
**Cons**: Doesn't account for variable content height gracefully

#### Option B: Web Animations API (Recommended)

```javascript
function animateDetails(detailsEl) {
  if (!detailsEl.animate) return; // Feature detect
  
  const contentEl = detailsEl.querySelector('.section-body');
  const isOpening = detailsEl.open;
  
  const startHeight = isOpening ? 0 : contentEl.scrollHeight;
  const endHeight = isOpening ? contentEl.scrollHeight : 0;
  
  const animation = contentEl.animate(
    [
      { height: `${startHeight}px`, opacity: isOpening ? 0 : 1 },
      { height: `${endHeight}px`, opacity: isOpening ? 1 : 0 }
    ],
    {
      duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 200,
      easing: 'ease-out',
      fill: 'forwards'
    }
  );
  
  animation.onfinish = () => {
    contentEl.style.height = isOpening ? 'auto' : '0';
  };
}

// Hook into existing toggle logic
document.querySelectorAll('details').forEach(details => {
  details.addEventListener('toggle', () => animateDetails(details));
});
```

**Pros**: Handles dynamic content, respects motion preferences, GPU-friendly
**Cons**: ~30 lines of JS

### Where to Apply

- All 8 `<details>` sections (Student, Rubric, Adjust, Feedback, Notes, Export, Cohort, AI Assistant)
- Future collapsible panels (e.g., bulk operations, validation banners)


### Testing Pattern

```javascript
describe('accordion animations', () => {
  test('details element animates open with WAAPI', () => {
    const details = document.createElement('details');
    details.innerHTML = '<summary>Test</summary><div class="section-body">Content</div>';
    document.body.appendChild(details);
    
    details.open = true;
    animateDetails(details);
    
    expect(details.querySelector('.section-body').animate).toHaveBeenCalled();
  });
  
  test('respects prefers-reduced-motion', () => {
    window.matchMedia = jest.fn().mockReturnValue({ matches: true });
    // Verify animation duration is 1ms
  });
});
```


### Bundle Impact

**Option A**: 0 bytes (pure CSS)
**Option B**: ~800 bytes minified

### Accessibility Compliance

- Native `<details>` semantics preserved
- Keyboard accessible (Enter/Space toggle)
- Screen readers announce expanded/collapsed state
- Motion preferences respected via `prefers-reduced-motion` or JS check

**Implementation effort**: 3–5 hours (WAAPI wrapper + hook into 8 sections + tests)

***

## Priority 3: CSS GPU-Accelerated Micro-Interactions

**Score: 54/70** — Instant polish, zero bundle cost

### What It Does

Adds subtle motion to buttons, toasts, focus indicators, and hover states using CSS transitions on GPU-friendly properties (`transform`, `opacity`).

### Why Priority 3

- **Immediate polish**: Buttons feel responsive, toasts glide in
- **Zero JavaScript**: Pure CSS transitions
- **High performance**: GPU-composited (no layout thrashing)
- **FK already has some**: Toast animation exists, extend pattern


### Implementation

```css
/* Button hover lift */
.btn {
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.btn:active:not(:disabled) {
  transform: translateY(0);
}

/* Focus indicator pulse (accessibility-friendly) */
*:focus-visible {
  outline: 2px solid #059669;
  outline-offset: 2px;
  animation: focus-pulse 0.3s ease;
}

@keyframes focus-pulse {
  0% { outline-offset: 0; opacity: 0.5; }
  100% { outline-offset: 2px; opacity: 1; }
}

/* Toast slide-in (enhance existing) */
.fk-toast-visible {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Rail active indicator (enhance FK-28) */
.fk-active-section {
  box-shadow: inset 4px 0 0 0 #059669;
  transition: box-shadow 0.2s ease;
}

/* Grade badge pop */
.grade-badge {
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); /* Slight bounce */
}

.grade-badge.updated {
  animation: badge-pop 0.4s ease;
}

@keyframes badge-pop {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}

/* Respect reduced motion for all */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 1ms !important;
    transition-duration: 1ms !important;
  }
}
```


### Where to Apply

1. **Buttons**: `.btn`, `.btn-blue`, `.btn-green`, `.btn-ghost` (hover lift)
2. **Toasts**: Existing `#fk-dispatch-toast` (enhance timing)
3. **Focus indicators**: Global `:focus-visible` (pulse)
4. **Rail active indicator**: Enhance `.fk-active-section` (FK-28)
5. **Grade badge**: `.grade-badge` (pop on update)
6. **Rounding buttons**: `#rnd-none`, `#rnd-half`, `#rnd-whole` (active state)

### Testing Pattern

```javascript
describe('micro-interactions', () => {
  test('buttons have hover transition', () => {
    const btn = document.querySelector('.btn');
    const styles = getComputedStyle(btn);
    expect(styles.transition).toMatch(/transform/);
  });
  
  test('reduced motion removes transitions', () => {
    document.documentElement.style.setProperty('prefers-reduced-motion', 'reduce');
    const btn = document.querySelector('.btn');
    const styles = getComputedStyle(btn);
    expect(styles.transitionDuration).toBe('1ms');
  });
});
```


### Bundle Impact

**0 bytes** — pure CSS

### Accessibility Compliance

- No motion for `prefers-reduced-motion: reduce`
- Focus indicators enhance keyboard navigation (WCAG 2.4.7)
- Hover states provide visual feedback (WCAG 2.5.8)

**Implementation effort**: 2–3 hours (CSS additions + existing selector updates)

***

## Lower-Priority Options (Score < 50)

These options were evaluated but **not recommended** for FK due to constraints.

### Option 4: Scroll-Triggered Animations (Score: 42/70)

**Why not**: FK sections are already visible on load; scroll animations add complexity without value.

### Option 5: GSAP Library (Score: 38/70)

**Why not**: Violates vanilla-only constraint. 23KB gzipped conflicts with FK's zero-dependency philosophy.

### Option 6: Framer Motion (Score: 32/70)

**Why not**: React-only library; FK uses vanilla JS.

### Option 7: Custom Tween Engine (Score: 36/70)

**Why not**: High implementation cost (40+ hours) for marginal benefit over WAAPI.

### Option 8: Lottie Animations (Score: 28/70)

**Why not**: 26KB library + JSON assets bloat bundle; overkill for UI polish.

***

## Implementation Roadmap

### Phase 1: Foundation (Week 1)

**Goal**: Ship Priority 1 + 3 for immediate polish

1. **Day 1–2**: View Transitions API wrapper
    - Write `transitionIfSupported()` helper
    - Apply to focus mode toggle
    - Apply to section expand/collapse
    - Test in Chrome, Safari, Firefox
2. **Day 3–4**: CSS micro-interactions
    - Add button hover lifts
    - Enhance toast transitions
    - Add focus indicator pulse
    - Verify `prefers-reduced-motion` compliance
3. **Day 5**: Testing \& QA
    - Jest tests for feature detection
    - Manual QA across browsers
    - Accessibility audit (axe)

**Deliverable**: Polished crossfades + micro-interactions (0 bytes bundle cost)

### Phase 2: Accordion Animations (Week 2)

**Goal**: Ship Priority 2 for section polish

1. **Day 1–2**: WAAPI accordion wrapper
    - Write `animateDetails()` function
    - Hook into existing `<details>` elements
    - Handle edge cases (rapid toggling, dynamic content)
2. **Day 3**: Apply to all sections
    - Student, Rubric, Adjust, Feedback, Notes, Export, Cohort, AI Assistant
3. **Day 4–5**: Testing \& polish
    - Jest tests for WAAPI animation
    - Performance profiling (60fps verification)
    - Accessibility audit

**Deliverable**: Smooth accordion animations (~800 bytes)

### Phase 3: Polish \& Edge Cases (Week 3)

**Goal**: Refinement and documentation

1. **Day 1–2**: Edge case handling
    - Nested animations
    - Rapid-fire interactions
    - Browser quirks (Safari timing)
2. **Day 3**: Documentation
    - Update `BOARD.md` with animation patterns
    - Code comments for future maintainers
    - Usage examples
3. **Day 4–5**: Performance optimization
    - Chrome DevTools profiling
    - Frame rate validation
    - Bundle size audit

**Deliverable**: Production-ready animation system

***

## Technical Constraints \& Guardrails

### Browser Support Matrix

| Feature | Chrome | Safari | Firefox | Fallback |
| :-- | :-- | :-- | :-- | :-- |
| View Transitions (same-doc) | 111+ | 18.2+ | 144+ | Instant update |
| Web Animations API | 84+ | 13.1+ | 75+ | CSS transitions |
| CSS Grid animations | 57+ | 10.1+ | 52+ | Instant expand |
| GPU acceleration (transform/opacity) | All | All | All | Software render |

### Performance Budget

- **Frame budget**: 16.7ms per frame (60fps)
- **Animation duration**: 150–250ms (WCAG recommended)
- **Bundle cost**: ≤2KB total for all animations
- **GPU properties only**: `transform`, `opacity`, `filter` (avoid `width`, `height`, `left`)


### Accessibility Checklist

✅ **Must-have**:

- [ ] All animations respect `prefers-reduced-motion`
- [ ] Keyboard navigation unaffected
- [ ] Focus indicators remain visible
- [ ] Screen readers announce state changes
- [ ] No animation >5 seconds (WCAG 2.2.2)
- [ ] No flashing >3 times/second (WCAG 2.3.1)

✅ **Best practices**:

- [ ] Provide static alternatives for essential motion
- [ ] Test with Chrome DevTools "Emulate CSS media" (prefers-reduced-motion)
- [ ] Axe audit passes (0 violations)


### Testing Strategy

```javascript
// 1. Feature detection
test('gracefully degrades when API unavailable', () => {
  delete document.startViewTransition;
  toggleFocusMode();
  expect(document.body.classList.contains('fk-focus-on')).toBe(true);
});

// 2. Motion preferences
test('respects prefers-reduced-motion', () => {
  window.matchMedia = jest.fn().mockReturnValue({ matches: true });
  const duration = getAnimationDuration();
  expect(duration).toBe(1); // 1ms, effectively instant
});

// 3. Performance
test('animations complete within 16.7ms frame budget', async () => {
  performance.mark('animation-start');
  await runAnimation();
  performance.mark('animation-end');
  const measure = performance.measure('animation', 'animation-start', 'animation-end');
  expect(measure.duration).toBeLessThan(16.7);
});
```


***

## Risk Mitigation

### Risk 1: Browser Compatibility

**Mitigation**: All implementations use feature detection with graceful fallback. Unsupported browsers get instant updates (no breakage).

### Risk 2: Performance Regression

**Mitigation**: Only animate GPU-friendly properties. Chrome DevTools profiling before merge. 60fps validation required.

### Risk 3: Accessibility Non-Compliance

**Mitigation**: Mandatory `prefers-reduced-motion` support. Axe audit before deployment. Manual keyboard/screen reader testing.

### Risk 4: Scope Creep

**Mitigation**: Strict prioritization. Priority 1–3 only. Document "not doing" decisions (e.g., scroll animations, library dependencies).

### Risk 5: Bundle Bloat

**Mitigation**: Hard limit of 2KB total. CSS-only preferred. WAAPI wrapper is <1KB minified.

***

## Success Metrics

### Qualitative

- ✅ FK feels more responsive and polished
- ✅ Transitions feel smooth (60fps)
- ✅ No accessibility regressions
- ✅ Maintainable vanilla code


### Quantitative

- ✅ Bundle increase: <2KB
- ✅ Axe violations: 0
- ✅ Jest tests pass: 100%
- ✅ Performance: ≥60fps on animations
- ✅ Browser coverage: Chrome/Safari/Firefox latest 2 versions

***

## Open Questions \& Future Work

### Open Questions

1. **Tab switching**: If FK adds tabbed interfaces (e.g., cohort views), apply View Transitions?
2. **Loading states**: Animate spinner appearance? (Current: instant)
3. **Modal dialogs**: Future modal system — use WAAPI for entrance/exit?

### Future Enhancements (Not Priority 1–3)

- **Scroll animations**: Fade in cohort rows on scroll (Intersection Observer)
- **Skeleton screens**: Animated placeholders for async data
- **Advanced morphing**: Named View Transitions for element-to-element transitions
- **Gesture-driven animations**: Swipe to dismiss toasts (touch-action API)

***

## Appendix: Code Patterns

### Pattern A: Feature Detection Wrapper

```javascript
// Reusable helper for View Transitions
function withTransition(updateFn) {
  if (!document.startViewTransition) {
    updateFn();
    return Promise.resolve();
  }
  return document.startViewTransition(updateFn).finished;
}

// Usage
withTransition(() => {
  section.classList.toggle('expanded');
}).then(() => {
  console.log('Transition complete');
});
```


### Pattern B: Motion Preference Check

```javascript
// Global motion preference utility
const prefersReducedMotion = () => 
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Usage in WAAPI
function animate(el, keyframes, options) {
  return el.animate(keyframes, {
    ...options,
    duration: prefersReducedMotion() ? 1 : options.duration
  });
}
```


### Pattern C: Focus Trap for Animated Modals

```javascript
// For future modal work — preserve focus order during animations
function trapFocus(modalEl) {
  const focusable = modalEl.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstFocusable = focusable[0];
  const lastFocusable = focusable[focusable.length - 1];
  
  modalEl.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey && document.activeElement === firstFocusable) {
      e.preventDefault();
      lastFocusable.focus();
    } else if (!e.shiftKey && document.activeElement === lastFocusable) {
      e.preventDefault();
      firstFocusable.focus();
    }
  });
}
```


***

## References

### Browser APIs

- [View Transitions API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API)
- [Web Animations API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API)
- [prefers-reduced-motion (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)


### Accessibility

- [WCAG 2.2 Animation Guidelines](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)
- [Designing for Motion Sensitivity](https://www.boia.org/blog/what-to-know-about-the-css-prefers-reduced-motion-feature)


### Performance

- [GPU Acceleration (CSS-Tricks)](https://css-tricks.com/introduction-to-hardware-acceleration-css-animations/)
- [60fps Animations (web.dev)](https://web.dev/blog/web-animations)


### FK Codebase

- [Feedback Kitchen Repository](https://github.com/stephendmann/feedback-kitchen)
- Existing animation: `scorer.html` lines 286–290 (toast transitions) and `.btn { transition: all 0.15s }` line 77 *(corrected per verdict — the original "2863–2870" ref was wrong)*
- Existing motion handling: `prefers-reduced-motion` exists only in `how-to-feedback-kitchen.html`; **there is none in `scorer.html`** — FK-38 must add one *(corrected per verdict)*

***

## Conclusion

This implementation plan delivers **modern, accessible animations** to Feedback Kitchen while preserving its vanilla architecture and zero-dependency philosophy. By prioritizing **View Transitions API** (Priority 1), **CSS accordion animations** (Priority 2), and **GPU-accelerated micro-interactions** (Priority 3), FK gains significant polish with minimal bundle cost (<2KB) and zero accessibility regressions.

**Next step**: Begin Phase 1 implementation (View Transitions + micro-interactions) for immediate user-facing value.

***

*Document version: 1.0*
*Research date: June 2026*
*Total research time: 6 hours*
*Implementation estimates: 10–15 hours total across 3 weeks*
