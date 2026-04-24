# Feature Specification: Responsive Layout + Design System Foundation

**Feature Branch**: `feature/003-responsive-design-system`
**Created**: 2026-04-24
**Status**: Draft

## Overview

Refactor the current single-column mobile-first layout into a responsive design that uses available
horizontal space on tablets and desktops. Simultaneously, extract all inline styles into a
structured CSS/token system that will serve as the foundation for a future design system. The app
should look and work well on phones (current), tablets, and desktop screens without breaking
existing functionality.

---

## User Scenarios & Testing

### User Story 1 — Desktop Two-Column Layout (Priority: P1)

On screens wider than 768px, the app displays a two-column layout: the input/data section on the
left and the results/summary on the right. Both panels are visible simultaneously without scrolling
to switch between them.

**Why this priority**: Family members using laptops or desktops currently have to scroll up and
down constantly between the data entry forms and the results. Two columns eliminates that friction.

**Independent Test**: Open app on a 1280px-wide browser → left column shows tabs/forms, right
column shows Resumen cards. Resize to 600px → single column, tabs reappear as currently.

**Acceptance Scenarios**:
1. **Given** viewport ≥ 768px, **When** app loads, **Then** left panel (inputs) and right panel
   (results) render side by side with no horizontal scroll
2. **Given** viewport < 768px, **When** app loads, **Then** layout is identical to current
   single-column with tabs
3. **Given** DetalleCalculo panel open on desktop, **When** data changes, **Then** right panel
   updates in place without layout shift

---

### User Story 2 — Design Token System (Priority: P2)

All visual properties (colors, spacing, border-radius, font sizes, shadows) are extracted from
inline styles into CSS custom properties (design tokens) in a single source-of-truth file. No
inline style attributes remain in component files.

**Why this priority**: Current codebase has colors and spacing duplicated across 8+ components.
Any future theming or design iteration requires touching every file. Tokens fix this before
the codebase grows further.

**Independent Test**: Change `--color-primary` token from `#2563eb` to `#7c3aed` → all buttons,
active tabs, and highlights update without touching any component file.

**Acceptance Scenarios**:
1. **Given** design token file, **When** `--color-primary` is changed, **Then** all primary-colored
   UI elements update automatically
2. **Given** a component file, **When** reviewed, **Then** zero hardcoded color hex values exist
   in JSX style props — all reference token variables
3. **Given** dark mode token set (prepared but not activated), **When** CSS class `dark` is added
   to `<html>`, **Then** colors invert correctly (validation only — dark mode not shipped in this spec)

---

### User Story 3 — Typography + Spacing Scale (Priority: P2)

Font sizes and spacing values follow a defined numeric scale (4px base grid). All layout gaps,
paddings, and margins use scale values. Text hierarchy (h1, h2, body, label, caption) is defined
once and applied consistently.

**Why this priority**: Current spacing is inconsistent (8px here, 12px there, 16px elsewhere with
no pattern). A scale makes future development predictable and consistent.

**Independent Test**: Audit all spacing values in the rendered app — all values are multiples
of 4px. Font sizes follow a consistent ratio (e.g., 12/13/14/16/20/24px).

---

## Requirements

### Functional Requirements

- **FR-001**: Layout MUST be responsive with breakpoints at 768px (tablet) and 1200px (desktop)
- **FR-002**: On desktop (≥768px), Resumen panel MUST be visible simultaneously with Datos panel
  without requiring tab switching
- **FR-003**: All CSS custom property tokens MUST be defined in a single `src/styles/tokens.css` file
- **FR-004**: Component files MUST NOT contain hardcoded color values — all colors reference tokens
- **FR-005**: Spacing values MUST follow a 4px base grid (multiples of 4)
- **FR-006**: Typography scale MUST define at minimum: display, heading, body, label, caption sizes
- **FR-007**: Existing mobile layout MUST be preserved pixel-perfect (no regressions on <768px)
- **FR-008**: Dark mode token stubs MUST be prepared (variables defined) but NOT activated

### Non-Functional Requirements

- Zero increase in JavaScript bundle size (CSS-only change)
- No new npm dependencies (use CSS custom properties, no CSS-in-JS library)
- All existing Vitest tests continue to pass unmodified

---

## Success Criteria

- **SC-001**: On a 1280px viewport, both input panel and result panel visible without scrolling
- **SC-002**: Lighthouse accessibility score does not decrease from current baseline
- **SC-003**: All 28 existing tests pass with zero modifications
- **SC-004**: Design token audit: zero hardcoded hex colors in component JSX
- **SC-005**: A junior developer can add a new themed color by editing only `tokens.css`

---

## Assumptions

- CSS custom properties (variables) are sufficient for the design token system — no build tool needed
- No new npm dependencies for styling — pure CSS approach
- The two-column desktop layout uses CSS Grid or Flexbox, not a framework
- Mobile layout (<768px) remains identical to current — this spec does not redesign mobile
- Dark mode variables are prepared as a stub for spec 009+ but not shipped in this spec
- The app header stays at full width on all screen sizes
