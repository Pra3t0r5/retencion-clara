# Research: Responsive Layout + Design System (spec 003)

## CSS Grid vs Flexbox for Two-Panel Layout

**Decision**: CSS Grid  
**Rationale**: `grid-template-columns: 1fr 1fr` with a single responsive breakpoint is the
clearest declarative solution. Grid `align-items: start` ensures panels don't stretch to match
each other's height.  
**Alternatives**: Flexbox equally valid; chosen Grid for named-area clarity.

## Token File: Separate File vs index.css

**Decision**: `src/styles/tokens.css` — separate from `index.css`  
**Rationale**: Isolates token definitions from layout rules. Easier for future contributors to
find and update design values without scanning layout CSS.  
**Import**: Added to `src/main.tsx` before `index.css`.

## Breakpoint Values

**Decision**: 768px (tablet/desktop threshold)  
**Rationale**: Matches spec FR-001. Standard tablet breakpoint. App is usable in two columns
at 768px+ (each column ≥ 340px).  
**Second breakpoint**: 1200px max-width on outer container to cap line length.

## Resumen Panel: Always-Rendered vs Tab-Switched

**Decision**: Always render Resumen in `panel-right`; hide via CSS on mobile  
**Rationale**: Avoids JS breakpoint detection (`useEffect` + `matchMedia`). CSS `display: none`
on `.panel-right` below 768px is simpler and avoids flash-of-wrong-layout.  
**Trade-off**: Resumen renders even when hidden on mobile (negligible cost — it's a few divs).

## Spacing Scale

**Decision**: 4px base grid, tokens `--space-1` (4px) through `--space-12` (80px)  
**Rationale**: Matches spec FR-005. Covers all current spacing values (8, 12, 14, 16, 20, 24,
32px). Named by multiplier (not px value) for clarity.

## Typography Scale

**Decision**: Named size tokens matching role: `--text-xs` (11px), `--text-sm` (13px),
`--text-base` (16px), `--text-lg` (20px), `--text-xl` (24px)  
**Rationale**: Current codebase uses 11, 13, 14, 16, 20, 24, 26px. Token names map to semantic
roles rather than pixel values to allow future scaling.

## Dark Mode

**Decision**: Stub only — `@media (prefers-color-scheme: dark)` overrides moved to `tokens.css`  
**Rationale**: App already has a dark mode block in `index.css`. Move it to tokens file without
activating a class-based toggle. Class-based dark mode (`.dark` on `<html>`) prepped but
not shipped — future spec.
