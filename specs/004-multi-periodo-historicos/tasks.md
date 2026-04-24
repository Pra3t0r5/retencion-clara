# Tasks: Multi-Período, Históricos y Gráficos

**Input**: Design documents from `/specs/004-multi-periodo-historicos/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅

**Scope**: US1 (multi-month load + nav) + US2 (chart). US3 (auth) descoped — constitution violation.
No new runtime dependencies. No backend. No Supabase.

---

## Phase 1: Storage Layer

- [X] T001 Write `src/storage/local.test.ts` first (TDD):
      - `saveMonth` persists data under key `rc_year_{YYYY}` with correct month key
      - `loadYear` returns correct `Map<number, PayslipData>` from stored JSON
      - `deleteMonth` removes the month entry, leaves other months intact
      - `loadYear` on empty localStorage returns empty Map
- [X] T002 Create `src/storage/index.ts`: export `StorageAdapter` interface
      (`loadYear`, `saveMonth`, `deleteMonth`) and `LocalStorageAdapter` class stub
- [X] T003 Implement `LocalStorageAdapter` in `src/storage/local.ts` — make T001 tests pass

**Checkpoint**: `npm test` green with storage tests.

---

## Phase 2: User Story 1 — Multi-Month Loading & Navigation (P1)

**Goal**: User adds payslips for multiple months; MonthNav lets them switch between months.

**Independent Test**: Load January + March → MonthNav shows both → switching months shows correct
data for each.

- [X] T004 Refactor `App.tsx` state:
      - Replace single `payslip: PayslipData | null` with
        `fiscalYear: Map<number, PayslipData>` + `activeMonth: number | null`
      - Derive active payslip: `fiscalYear.get(activeMonth)`
- [X] T005 Wire `LocalStorageAdapter` in `App.tsx`:
      - `useEffect` on mount: `loadYear(currentYear)` → set `fiscalYear`
      - On payslip save: `saveMonth(year, month, data)` → update Map
      - On clear: `deleteMonth(year, month)` → remove from Map
- [X] T006 Create `src/components/MonthNav.tsx`:
      - Loaded months as pill buttons ("Ene", "Feb", ...) — only months present in Map
      - Active month highlighted (distinct border/background)
      - "+ Agregar mes" button sets `activeMonth = null` (resets form for new entry)
      - Inline styles only
- [X] T007 Wire `MonthNav` into `App.tsx`:
      - Render above tabs when `fiscalYear.size > 0`
      - Month click → `setActiveMonth(m)`
      - "+ Agregar mes" click → `setActiveMonth(null)`
- [ ] T008 Manual test: add January data → add March → MonthNav shows both →
      switching displays correct Resumen values for each → localStorage has both entries

**Checkpoint**: Multi-month nav works for same browser session and after page reload.

---

## Phase 3: User Story 2 — Progression Chart (P1)

**Goal**: Bar chart shows monthly and cumulative retention for all loaded months.

**Independent Test**: Load Jan + Mar → chart renders 2 bars with correct retention values.

- [X] T009 Create `src/components/RetentionChart.tsx`:
      - Props: `data: ChartPoint[]` (month label, retencion, acumulado)
      - Inline SVG bar chart — no library
      - Bar height proportional to retention amount; labeled with ARS amount
      - Cumulative shown as secondary line or overlaid bar (lighter color)
      - Spanish month labels on x-axis ("Ene", "Feb", ...)
      - Single-point state: show message "Agregá más meses para ver la progresión"
      - Responsive: scales to 100% container width; readable at 375px
- [X] T010 Derive `ChartPoint[]` in `App.tsx` or `Resumen` component:
      - Sort Map entries by month number
      - Run engine per month to get retention amount
      - Accumulate `acumulado` running total
- [X] T011 Render `<RetentionChart>` below summary cards in Resumen tab
- [ ] T012 Manual test: 3 months loaded → chart shows 3 bars with correct values →
      readable on 375px viewport

**Checkpoint**: Chart renders correctly.

---

## Phase 4: Polish

- [X] T013 [P] Run `npm test` — all existing engine tests + new storage tests pass
- [ ] T014 [P] localStorage persistence: add months → close tab → reopen → months restored
- [X] T015 Empty state: if `fiscalYear.size === 0`, show hint below upload area:
      "Cargá tu primer recibo para ver la progresión mensual"

---

## Dependencies & Execution Order

- **Phase 1**: Independent — run first; blocks everything
- **Phase 2**: After Phase 1 (StorageAdapter must exist)
- **Phase 3**: After Phase 2 (needs `FiscalYearData` Map for chart derivation)
- **Phase 4**: After all stories
