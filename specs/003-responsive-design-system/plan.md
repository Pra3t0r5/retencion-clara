# Implementation Plan: Responsive Layout + Design System Foundation

**Branch**: `003-responsive-design-system` | **Date**: 2026-04-24 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-responsive-design-system/spec.md`

## Summary

Refactor the single-column layout into a responsive two-column grid (≥768px) and extract all
inline/hardcoded style values into CSS custom property tokens. Pure CSS — no new dependencies,
no JS bundle impact.

## Technical Context

**Language/Version**: TypeScript 5.x + React 19  
**Primary Dependencies**: None new — CSS only change  
**Storage**: N/A (layout feature)  
**Testing**: Vitest 4.x (existing 28 tests must continue to pass)  
**Target Platform**: Browser (mobile-first, tablet/desktop responsive)  
**Project Type**: SPA (client-side React)  
**Performance Goals**: Zero increase in JS bundle size; CSS-only  
**Constraints**: No new npm deps; mobile layout (<768px) pixel-perfect unchanged  
**Scale/Scope**: 4 component files + index.css + App.tsx

## Constitution Check

| Gate | Status | Notes |
|------|--------|-------|
| I. Zero Backend | ✅ PASS | CSS-only change, no data transmission |
| II. Tax Math Authoritative | ✅ PASS | No engine changes |
| III. Test-First for Engine | ✅ PASS | No engine changes; existing 28 tests must pass |
| IV. No New Deps | ✅ PASS | CSS custom properties, no npm packages |
| V. Accessibility | ✅ PASS | Layout restructure must not reduce Lighthouse score |

## Project Structure

### Documentation (this feature)

```text
specs/003-responsive-design-system/
├── plan.md          # This file
├── research.md      # CSS layout decisions
├── tasks.md         # /speckit.tasks output
└── checklists/
```

### Source Code Changes

```text
src/
  styles/
    tokens.css       # NEW — all CSS custom properties (design tokens)
  index.css          # MODIFY — remove token definitions, add responsive grid
  App.tsx            # MODIFY — two-column layout wrapper, remove inline colors
  components/
    DetalleCalculo.tsx  # MODIFY — token refs
    F572Form.tsx        # MODIFY — token refs
    PayslipForm.tsx     # MODIFY — token refs
    PDFDropzone.tsx     # MODIFY — token refs
```

## Phase 0: Research

### Decision: CSS Layout Strategy

**Decision**: CSS Grid with two named template areas — `left` (inputs/tabs) and `right` (results).

**Rationale**:
- CSS Grid `grid-template-columns: 1fr 1fr` is the simplest correct approach
- No JS required; layout is purely declarative
- Degrades gracefully: below 768px, `grid-template-columns: 1fr` stacks columns

**Implementation**:
```css
/* Desktop (≥768px) */
@media (min-width: 768px) {
  .app-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-6);
    align-items: start;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 var(--space-6);
  }
}
```

**Alternatives considered**:
- Flexbox: equally valid but Grid areas are more explicit for named panels
- CSS container queries: overkill for a two-panel layout

### Decision: Token File Structure

**Decision**: Single `src/styles/tokens.css` imported in `main.tsx`. Tokens defined in `:root`
with dark mode override block.

**Token categories**:
- Colors: `--color-*` (primary, danger, success, bg, surface, border, text, muted)
- Spacing: `--space-1` through `--space-12` (4px grid: 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 80)
- Typography: `--text-xs` (11px), `--text-sm` (13px), `--text-base` (16px), `--text-lg` (20px), `--text-xl` (24px), `--text-2xl` (28px)
- Radius: `--radius-sm` (8px), `--radius` (14px), `--radius-lg` (20px)
- Shadows: `--shadow-sm`, `--shadow`
- Transition: `--transition-fast` (150ms)

**Migration**: `index.css` keeps existing class names but replaces all hardcoded values with
token references. Old `:root` block moves to `tokens.css`.

### Decision: App.tsx Layout Wrapper

**Decision**: Replace `<div className="container">` with `<div className="app-grid">`.
On desktop: left column = Datos tab + F572 tab inputs; right column = Resumen always visible.
On mobile: single column, tabs work as today.

**React change**: On desktop (≥768px), Resumen card is always rendered in the right column
regardless of active tab. Tabs still switch the left-panel content. This eliminates the need
to switch to "Resumen" tab on desktop.

**How to detect breakpoint in React**: Use `window.matchMedia('(min-width: 768px)')` with a
`useEffect`/`useState` listener, OR simply rely on CSS and always render both panels but
hide/show via CSS class. Prefer CSS-only approach: render both panels, use CSS to hide/show.

```tsx
// Always render both panels; CSS handles visibility
<div className="app-grid">
  <div className="panel-left">
    {/* tabs + active tab content */}
  </div>
  <div className="panel-right">
    {/* Resumen always rendered */}
  </div>
</div>
```

## Phase 1: Design & Contracts

### data-model.md

Not applicable — this is a pure UI/CSS feature with no data model changes.

### Contracts

No external interfaces. The only "contract" is:
- Existing 28 Vitest tests continue to pass (no engine changes)
- CSS class names in existing components are preserved (or renamed consistently)
- Mobile layout renders identically to current at <768px

### Quickstart — Manual Test Scenarios

1. **Desktop two-column**: Open `http://localhost:5173` at 1280px width → left panel shows
   Datos form, right panel shows Resumen. Enter data → right panel updates live. ✓

2. **Mobile unchanged**: Resize to 375px → single column with tabs. Navigate tabs → identical
   to current behavior. ✓

3. **Token change**: Edit `--color-primary` in `tokens.css` to `#7c3aed` → all buttons, active
   tabs, highlighted rows update without touching any component. ✓

4. **Dark mode stub**: Add `class="dark"` to `<html>` in DevTools → token overrides activate
   (colors invert). No functionality changes. ✓

5. **Existing tests**: Run `bun test` → 28/28 pass. ✓

## Implementation Strategy

**MVP first**: US1 (two-column layout) can be delivered by only modifying `index.css` and
`App.tsx`. Ship that first, then layer in US2 (token extraction) and US3 (spacing scale).

**Risk**: App.tsx restructuring is the highest-risk change. The dual-panel render (always showing
Resumen on desktop) must not break mobile tab behavior.

**Mitigation**: Use CSS `display: none` / `display: block` via media query to hide right panel
on mobile — no JS breakpoint logic needed. This keeps App.tsx changes minimal.
