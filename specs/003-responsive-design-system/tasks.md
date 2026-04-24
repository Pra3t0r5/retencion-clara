# Tasks: Responsive Layout + Design System Foundation

**Input**: Design documents from `/specs/003-responsive-design-system/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅

**Tests**: No test tasks — this is a pure CSS/layout feature. Existing 28 Vitest tests
must pass unmodified (verified in Polish phase).

**Organization**: Tasks grouped by user story. US1 (two-column layout) is MVP — shippable alone.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

**Purpose**: Create token infrastructure before any component work

- [ ] T001 Create `src/styles/tokens.css` with all CSS custom properties (colors, spacing,
      typography, radius, shadows, transitions) — move `:root` block from `src/index.css`
      and expand to full token set per research.md
- [ ] T002 Import `src/styles/tokens.css` in `src/main.tsx` before `./index.css`

---

## Phase 2: User Story 1 — Desktop Two-Column Layout (Priority: P1) 🎯 MVP

**Goal**: On ≥768px, left panel (inputs/tabs) and right panel (Resumen) visible side by side.

**Independent Test**: Open at 1280px → both panels visible. Resize to 375px → single column
with tabs, identical to current. Enter data → right panel updates live.

### Implementation

- [ ] T003 [US1] Restructure `src/App.tsx`: wrap content in `<div className="app-grid">` with
      `<div className="panel-left">` (tabs + active tab content) and `<div className="panel-right">`
      (Resumen always rendered). On mobile, panel-right hidden via CSS.
- [ ] T004 [US1] Add responsive grid CSS to `src/index.css`:
      - `.app-grid`: single column by default (mobile)
      - `@media (min-width: 768px)`: `grid-template-columns: 1fr 1fr; gap: var(--space-6); max-width: 1200px`
      - `.panel-right`: `display: none` on mobile; `display: block` on desktop
      - `.panel-left`: full width on mobile; normal on desktop
- [ ] T005 [US1] Update `.container` in `src/index.css` to remove `max-width: 540px` — max-width
      now controlled by `.app-grid` for desktop; keep for mobile panel-left fallback
- [ ] T006 [US1] Manual test: verify desktop two-column renders correctly at 768px, 1024px, 1280px
      without horizontal scroll; verify mobile single-column unchanged at 375px, 430px

**Checkpoint**: US1 shippable — two-column desktop layout works.

---

## Phase 3: User Story 2 — Design Token System (Priority: P2)

**Goal**: Zero hardcoded hex colors in component files. All visual values reference tokens.

**Independent Test**: Change `--color-primary` in `tokens.css` → all primary-colored elements
update without touching any component file.

### Implementation

- [ ] T007 [P] [US2] Migrate `src/index.css`: replace all hardcoded hex/rgba/px values with
      token references. Verify no raw color values remain. Keep class names unchanged.
- [ ] T008 [P] [US2] Migrate `src/App.tsx`: replace any remaining inline `style={{}}` color/spacing
      values with token CSS var references or className-based tokens
- [ ] T009 [P] [US2] Migrate `src/components/PayslipForm.tsx`: replace hardcoded colors/spacing
      with token references in JSX style props
- [ ] T010 [P] [US2] Migrate `src/components/F572Form.tsx`: replace hardcoded colors/spacing
      with token references
- [ ] T011 [P] [US2] Migrate `src/components/PDFDropzone.tsx`: replace hardcoded colors/spacing
      with token references
- [ ] T012 [P] [US2] Migrate `src/components/DetalleCalculo.tsx`: replace hardcoded colors/spacing
      with token references
- [ ] T013 [US2] Audit: run `grep -r '#[0-9a-fA-F]\{3,6\}' src/` — confirm zero hardcoded hex
      colors remain in component JSX files

**Checkpoint**: US2 complete — token system live.

---

## Phase 4: User Story 3 — Typography + Spacing Scale (Priority: P2)

**Goal**: All spacing is multiples of 4px via scale tokens. Typography hierarchy defined.

**Independent Test**: Audit rendered spacing values — all multiples of 4. Font sizes follow
defined scale (11/13/16/20/24px).

### Implementation

- [ ] T014 [US3] Add spacing scale to `src/styles/tokens.css`:
      `--space-1: 4px` through `--space-16: 64px` plus `--space-20: 80px`
- [ ] T015 [US3] Add typography scale to `src/styles/tokens.css`:
      `--text-xs: 11px`, `--text-sm: 13px`, `--text-base: 16px`, `--text-lg: 20px`,
      `--text-xl: 24px`, `--text-2xl: 28px`, `--font-weight-medium: 500`, `--font-weight-bold: 700`
- [ ] T016 [US3] Update `src/index.css` to use `--space-*` tokens for all padding/margin/gap values
- [ ] T017 [US3] Update `src/index.css` to use `--text-*` tokens for all font-size values

**Checkpoint**: US3 complete — consistent scale applied.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [ ] T018 [P] Verify all 28 existing Vitest tests pass: `bun test` → 0 failures
- [ ] T019 [P] Add dark mode token overrides to `src/styles/tokens.css` under
      `@media (prefers-color-scheme: dark)` block (move from `index.css`, expand to full token set)
- [ ] T020 [P] Add `.dark` class override stubs in `tokens.css` for class-based dark mode
      (prepared, not activated — spec FR-008)
- [ ] T021 Manual browser test: run Lighthouse accessibility audit at 1280px viewport — score
      must not decrease from baseline

---

## Dependencies & Execution Order

- **Phase 1 (Setup)**: Start here — T001 must complete before any token usage in components
- **Phase 2 (US1)**: T003→T004→T005 sequential (App restructure then CSS then verify). Depends on T001.
- **Phase 3 (US2)**: T007–T012 can all run in parallel — different files. T013 after all complete.
  Depends on T001 (tokens must exist before referencing them).
- **Phase 4 (US3)**: T014→T015 in parallel, then T016→T017. Depends on T001.
- **Phase 5 (Polish)**: T018, T019, T020 in parallel. T021 last.

## Parallel Opportunities

```bash
# Phase 3 — all component migrations in parallel:
T007: index.css migration
T008: App.tsx migration
T009: PayslipForm.tsx migration
T010: F572Form.tsx migration
T011: PDFDropzone.tsx migration
T012: DetalleCalculo.tsx migration

# Phase 4 — token definitions in parallel:
T014: spacing scale
T015: typography scale
```

## Implementation Strategy

### MVP (US1 only)

1. T001, T002 (setup)
2. T003, T004, T005 (two-column layout)
3. T006 (manual verification)
4. **Ship** — desktop layout delivers immediate value

### Full spec

- After US1 MVP ships, add US2 (token migration) and US3 (scale) in parallel
- Each phase independently testable

## Notes

- This is CSS-only — no Vitest tests need updating
- All class names preserved — no breaking changes to component structure
- Token prefix: `--color-*`, `--space-*`, `--text-*`, `--radius-*`, `--shadow-*`
- Mobile layout must be pixel-perfect unchanged — US1 only adds to desktop behavior
