# Tasks: Dashboard de Impacto del F.572 — "¿Cuánto recuperé?"

**Branch**: `010-dashboard-impacto-f572`
**Input**: `specs/010-dashboard-impacto-f572/` (spec.md, plan.md)
**Test fixture**: `RECIBO_MAR`, `RECIBO_ABR`, `F572` from `src/data.ts`

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete dependencies)
- **[Story]**: User story from spec.md — [US1] hero section, [US2] chart annotation, [US3] F.572 card, [US4] modal language (P2)

---

## Phase 1 — TDD: Write Failing Tests (RED) ⚠️ CONSTITUCIÓN PRINCIPIO III

**Purpose**: Write all engine tests BEFORE implementation. Every test here MUST FAIL after this phase. Do not implement yet.

**⚠️ CRITICAL**: Run `npm test` after this phase and verify these tests FAIL (red). Only then proceed to Phase 2.

- [x] T001 [US1] [US2] Write failing tests for `calcularRecuperado` and `detectarF572Events` in `src/engine/calculator.test.ts`

  Add a `describe('calcularRecuperado', ...)` block with:
  - `it('returns ahorro_estimado of March when fiscal year is Map([[3, RECIBO_MAR], [4, RECIBO_ABR]]) with F572', ...)` → expect result > 339_180 && < 340_180  
  - `it('returns 0 when fiscal year has only one month', ...)` → `Map([[3, RECIBO_MAR]])` with F572 → expect 0  
  - `it('returns 0 when gap is 0 in all months', ...)` → `Map([[3, RECIBO_MAR]])` with `EMPTY_F572` → expect 0  

  Add a `describe('detectarF572Events', ...)` block with:
  - `it('returns Set containing "Abr" when gap drops from >100K to ~0 between Mar and Abr', ...)` → `Map([[3, RECIBO_MAR], [4, RECIBO_ABR]])` with F572 → expect `result.has('Abr') === true`  
  - `it('returns empty Set when fiscal year has only one month', ...)` → `Map([[3, RECIBO_MAR]])` → expect `result.size === 0`  
  - `it('returns empty Set when gap never exceeds 100K', ...)` → `Map([[3, RECIBO_MAR]])` with `EMPTY_F572` → expect `result.size === 0`  

  Use existing `RECIBO_MAR`, `RECIBO_ABR`, `F572` imports from `'../data'`. Use `EMPTY_F572` constant already defined in `calculator.test.ts` (or define locally). Import functions from `'./calculator'` — they don't exist yet, so the tests will fail to compile/run. That is correct.

**Checkpoint**: `npm test` shows FAILED tests for `calcularRecuperado` and `detectarF572Events`. Do NOT proceed until confirmed red.

---

## Phase 2 — Engine: Implement `calcularRecuperado` + `detectarF572Events` (GREEN)

**Purpose**: Implement the two pure engine functions. Make Phase 1 tests pass.

**Goal**: `npm test` passes green for all new tests after this phase.

- [x] T002 [US1] [US2] Implement `calcularRecuperado` in `src/engine/calculator.ts`

  Add after the `hasF572Data` export (line ~135):

  ```typescript
  export function calcularRecuperado(
    fiscalYear: Map<number, PayslipData>,
    f572: F572Data,
  ): number {
    const sorted = [...fiscalYear.keys()].sort((a, b) => a - b);
    let recuperado = 0;
    for (let i = 0; i < sorted.length - 1; i++) {
      const m = sorted[i];
      const mNext = sorted[i + 1];
      const gapM = calcularGap(fiscalYear.get(m)!, f572, m);
      const gapNext = calcularGap(fiscalYear.get(mNext)!, f572, mNext);
      if (gapM.total_gap > 0 && gapNext.total_gap < 1_000) {
        recuperado += gapM.ahorro_estimado;
      }
    }
    return recuperado;
  }
  ```

  Note: `Map<number, PayslipData>` matches `FiscalYearData` from `src/storage/index.ts`. Import type if needed or use inline type — do not import from storage (engine must not import outside `src/engine/`). The type is structurally identical; use `Map<number, PayslipData>` directly.

- [x] T003 [US2] Implement `detectarF572Events` in `src/engine/calculator.ts`

  Add after `calcularRecuperado`:

  ```typescript
  export function detectarF572Events(
    fiscalYear: Map<number, PayslipData>,
    f572: F572Data,
  ): Set<string> {
    const MES_ABBR = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const sorted = [...fiscalYear.keys()].sort((a, b) => a - b);
    const events = new Set<string>();
    for (let i = 0; i < sorted.length - 1; i++) {
      const m = sorted[i];
      const mNext = sorted[i + 1];
      const gapM = calcularGap(fiscalYear.get(m)!, f572, m);
      const gapNext = calcularGap(fiscalYear.get(mNext)!, f572, mNext);
      if (gapM.total_gap > 100_000 && gapNext.total_gap < 1_000) {
        events.add(MES_ABBR[mNext - 1]);
      }
    }
    return events;
  }
  ```

  Note: `MES_ABBR` is defined locally here to keep engine free of App-level constants. The array is identical to the one in `App.tsx`.

- [x] T004 Run `npm test` and verify all tests in `calculator.test.ts` pass (including the new `calcularRecuperado` and `detectarF572Events` suites). Fix any TypeScript errors. Do NOT touch `schemas.ts`.

**Checkpoint**: `npm test` fully green. Engine coverage ≥ 60% for new functions. Proceed to Phase 3.

---

## Phase 3 — UI: HeroStats Component + Wiring (Priority: P1)

**Goal**: The main screen shows three impact numbers (Retenido / Recuperado / Pendiente) replacing the existing two stat-cards.

**User Story**: [US1] Hero section with 3 numbers

**Independent Test**: Load demo data (click "Demo" in app), verify three cards visible at top of screen without any additional clicks.

- [x] T005 [P] [US1] Create `src/components/HeroStats.tsx`

  New component with props:
  ```typescript
  type HeroStatsProps = {
    retenido: number
    recuperado: number
    pendiente: number
    periodoLabel: string  // e.g. "Ene–Abr 2026"
  }
  ```

  Layout: three cards side by side using inline styles `display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px`.  
  Each card: `flex: 1 1 80px; min-width: 80px; background: var(--card-bg, #1e293b); border-radius: 10px; padding: 12px 10px; text-align: center`.

  Card 1 — "Retenido":
  - Label: "Retenido"
  - Value: formatted ARS (use existing `$()` pattern or `Intl.NumberFormat`)
  - Sublabel: `periodoLabel` (e.g. "Ene–Abr 2026")
  - Style: value color `#f87171` (danger red, consistent with current stat-card danger)

  Card 2 — "Recuperado":
  - Label: "Recuperado"
  - Value: formatted ARS, followed by `" est."` if `recuperado > 0`
  - Sublabel: `recuperado > 0 ? "gracias al F.572 ✓" : "sin datos F.572"`
  - Badge "✓": inline `<span>` with `background: #16a34a; color: white; borderRadius: 9999px; padding: 1px 6px; fontSize: 10px` — only shown when `recuperado > 0`
  - Style: value color `#4ade80` (success green) when `recuperado > 0`, else `#94a3b8`

  Card 3 — "Pendiente":
  - Label: "Pendiente"
  - Value: formatted ARS
  - Sublabel: `pendiente === 0 ? "todo acreditado ✓" : "sin acreditar"`
  - Style: value color `#fb923c` when `pendiente > 0`, else `#4ade80` (green when resolved)

  Format helper — inline at top of file:
  ```typescript
  const $ = (n: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);
  ```

- [x] T006 [US1] Wire `HeroStats` into `App.tsx` — TabResumen section

  In `App.tsx`:

  1. Add imports at top:
     ```typescript
     import { HeroStats } from './components/HeroStats';
     import { calcularRecuperado, detectarF572Events } from './engine/calculator';
     ```

  2. In the main component body, after `activePayslip` is resolved, compute:
     ```typescript
     const recuperado = activePayslip && hasF572Data(activeF572)
       ? calcularRecuperado(fiscalYear, activeF572)
       : 0;
     const f572Events = hasF572Data(activeF572)
       ? detectarF572Events(fiscalYear, activeF572)
       : new Set<string>();
     ```
     (where `activeF572` is the existing F572 state variable — check its actual name in App.tsx)

  3. In the `TabResumen` section, locate the `stat-grid` div (lines ~98–109) that renders two stat-cards ("Retenido acumulado" and "Ahorro próx. mes est."). **Replace the entire `stat-grid` div** with `<HeroStats>`:
     ```typescript
     {activePayslip && (
       <HeroStats
         retenido={activePayslip.retencion_acumulada}
         recuperado={recuperado}
         pendiente={calcularGap(activePayslip, activeF572, activePayslip.meses).ahorro_estimado}
         periodoLabel={`Ene–${MES_ABBR[activePayslip.meses - 1]} ${YEAR}`}
       />
     )}
     ```
     Note: `YEAR` and `MES_ABBR` are already defined in `App.tsx`. If `MES_ABBR` is not a named const, define it as one.

  4. Pass `f572Events` to `<RetentionChart>` (prop will be added in Phase 4 — add it now as `f572Events={f572Events}` and TypeScript will complain until T008 is done; that's fine, fix in T008).

**Checkpoint**: Dev server shows three cards at top. "Recuperado" shows ~$339K with "✓" badge. "Pendiente" shows "$0 / todo acreditado ✓". No horizontal scroll at 375px.

---

## Phase 4 — Chart Annotation: `f572Events` in RetentionChart (Priority: P1)

**Goal**: Bars for months in `f572Events` show a "F.572 ✓" label directly on the SVG.

**User Story**: [US2] Chart annotation when F.572 application detected

**Independent Test**: Demo data loaded, gráfico shows "F.572 ✓" annotation above Abril bar without hover.

- [x] T007 [US2] Write failing test for `RetentionChart` with `f572Events` prop in `src/components/RetentionChart.test.tsx`

  Add a test case:
  - `it('renders F.572 ✓ annotation text for months in f572Events', ...)` — render `<RetentionChart data={[{month:'Mar', retencion:1220274, acumulado:3549634},{month:'Abr', retencion:498657, acumulado:4048291}]} f572Events={new Set(['Abr'])} />` and assert the rendered SVG contains the text "F.572 ✓".
  
  This test should FAIL (prop not accepted yet).

- [x] T008 [US2] Extend `src/components/RetentionChart.tsx` — add `f572Events` prop and SVG annotation

  1. Change the function signature:
     ```typescript
     export function RetentionChart({ data, f572Events }: { data: ChartPoint[]; f572Events?: Set<string> }) {
     ```

  2. Inside the `data.map((d, i) => ...)` bar rendering loop (line ~100), after the "Monthly amount above bar" `<text>` element, add the annotation conditionally:
     ```typescript
     {f572Events?.has(d.month) && (
       <text
         x={x + barW / 2}
         y={y - 20}
         textAnchor="middle"
         fontSize={9}
         fill="#4ade80"
         fontWeight="700"
       >
         F.572 ✓
       </text>
     )}
     ```

  3. Also update the tooltip rendering — when `f572Events?.has(tooltip.month)`, add extra tooltip line: `"Tu empleador aplicó el F.572 retroactivamente aquí"`. Find the tooltip `<div>` block (SVG foreignObject or absolute div) and append this line conditionally.

  4. Run `npm test` — verify `RetentionChart.test.tsx` test now passes.

**Checkpoint**: `npm test` green. Chart shows "F.572 ✓" above Abril bar in demo mode.

---

## Phase 5 — F.572 Card: Always Visible + "Todo acreditado ✓" State (Priority: P1)

**Goal**: The F.572 history card never disappears when F.572 data is loaded. Shows "Todo acreditado ✓" badge when `gap = 0`.

**User Story**: [US3] F.572 history card always visible

**Independent Test**: Load demo data (Abr with gap=0), F.572 history card visible with "Todo acreditado ✓" badge.

- [x] T009 [US3] Fix F.572 card visibility condition and add "Todo acreditado ✓" state in `App.tsx`

  Locate the `Card` block titled `"📋 Deducción no acreditada (F.572)"` in the `TabResumen` section (around line ~118 of the TabResumen component). It currently renders inside `{hasF572Data(f572) && gaps.total_gap > 0 && (` (or similar conditional).

  Changes:

  1. **Remove the `gaps.total_gap > 0` condition**. The card renders whenever `hasF572Data(f572)` is true.

  2. **Update card title**: Change from `"📋 Deducción no acreditada (F.572)"` to a dynamic title:
     - When `gaps.total_gap === 0`: `"📋 F.572 — Todo acreditado ✓"`
     - When `gaps.total_gap > 0`: `"📋 F.572 — Pendiente de acreditar"`

  3. **Add conditional content at bottom of card**:
     - When `gaps.total_gap === 0`: Show a success message row:
       ```typescript
       <Row
         label="Estado"
         value="Todo acreditado ✓"
         highlight  // use existing highlight prop for green styling, or add inline style
       />
       <Row
         label="Ahorro materializado est."
         value={`${$(recuperado)}`}
       />
       ```
     - When `gaps.total_gap > 0`: Keep existing "Total no acreditado × rate → ahorra" row.

  4. The three rows (Declarado / Aplicada / No acreditada) for indumentaria and cuota médica remain unchanged regardless of gap state.

  Note: `recuperado` is already computed in App.tsx as of T006. Pass it into `TabResumen` or compute it inline — whichever matches the current component structure.

**Checkpoint**: Load demo data → F.572 card visible with "Todo acreditado ✓" and ahorro materializado est. ~$339K. Card does NOT disappear.

---

## Phase 6 — P2: Simplify Comparison Modal Language (Priority: P2)

**Purpose**: Rename labels in `ComparacionSIRADIG.tsx` and the comparison button. Implement ONLY after all P1 tasks pass manual test.

**User Story**: [US4] Language simplification in comparison modal

- [x] T010 [P] [US4] Rename button text in `App.tsx` — the button/link that opens the comparison modal

  Find the trigger for `ComparacionSIRADIG` (search for `"Comparar"` or `onComparar` in App.tsx — around line ~495). Change button label from `"Comparar →"` to `"¿Por qué cambió mi retención? →"`. Keep the `onClick` handler and all logic unchanged.

- [x] T011 [P] [US4] Rename 4 cause labels in `src/components/ComparacionSIRADIG.tsx`

  Locate the four label strings in the diff breakdown table (lines ~148–165). Change:
  - `"Efecto acumulativo fiscal"` → `"El impuesto se calcula desde enero"`
  - `"Rectificativa SIRADIG aplicada"` → `"F.572 aplicado en este período"`
  - `"Cambio de salario bruto"` → `"Cambio en tu sueldo"`
  - `"Cambio de tramo impositivo"` → `"Cambio de alícuota"`

  Change display strings ONLY. Do NOT touch calculation logic, variable names, or component structure.

**Checkpoint**: Open comparison modal → all four rows show simplified labels. Button reads "¿Por qué cambió mi retención? →".

---

## Phase 7 — Manual Acceptance Test (P1)

**Purpose**: Validate all P1 success criteria from spec.md against the running app.

- [x] T012 Run `npm run dev`, click "Demo", and verify all P1 acceptance criteria:

  **a)** Hero section shows three cards at top of screen without any additional clicks:
  - Card 1 "Retenido": ~$4.048.291 with sublabel "Ene–Abr 2026"
  - Card 2 "Recuperado": ~$339K est. with badge "✓" and sublabel "gracias al F.572 ✓"
  - Card 3 "Pendiente": $0 with sublabel "todo acreditado ✓"

  **b)** Chart shows "F.572 ✓" label directly above the Abril bar (no hover required)

  **c)** F.572 history card is visible (not hidden) and shows "Todo acreditado ✓" badge

  **d)** Resize browser to 375px width: all three hero cards fit without horizontal scroll

  **e)** Qualitative test: show screen to someone unfamiliar with impuestos — they can answer "¿cuánto recuperaste?" in <10 seconds

  If any criterion fails: fix the relevant task before marking T012 complete.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (TDD)**: No dependencies — start immediately. MUST complete (red tests) before Phase 2.
- **Phase 2 (Engine)**: Depends on Phase 1 completion. T002 and T003 can run in parallel.
- **Phase 3 (HeroStats)**: Depends on Phase 2 (needs `calcularRecuperado`, `detectarF572Events` to exist).
- **Phase 4 (Chart)**: T007 (test) can run in parallel with Phase 3. T008 (implementation) depends on T007.
- **Phase 5 (Card fix)**: Depends on Phase 3 (`recuperado` must be computed in App.tsx per T006).
- **Phase 6 (P2)**: Independent of Phases 3–5 — T010 and T011 can run in parallel. ONLY after P1 manual test passes.
- **Phase 7 (Manual test)**: Depends on Phases 3, 4, 5 all complete.

### Within-Phase Parallel Opportunities

```
Phase 2: T002 ║ T003  (different functions in same file — sequential is safer; parallelize only if using worktrees)
Phase 3: T005 [P] — HeroStats.tsx creation independent of T006
Phase 6: T010 [P] ║ T011 [P]  (different files, no dependency)
```

### Story Completion Criteria

- **US1 complete**: T001 + T002 + T004 + T005 + T006 — hero section renders correct numbers
- **US2 complete**: T001 + T003 + T004 + T007 + T008 — chart annotation visible
- **US3 complete**: T006 + T009 — F.572 card always visible with correct state
- **US4 complete**: T010 + T011 — modal labels simplified (P2)
- **P1 MVP complete**: US1 + US2 + US3 + T012 manual test

---

## Implementation Strategy

### MVP (P1 only — Phases 1–5 + Manual Test)

1. Phase 1 → confirm red
2. Phase 2 → confirm green
3. Phase 3 → verify hero in browser
4. Phase 4 → verify chart annotation in browser
5. Phase 5 → verify F.572 card always visible in browser
6. Phase 7 → manual acceptance test → **SHIP P1**

### Add P2 (Phase 6)

7. Phase 6 → rename labels → **SHIP P2**

---

## Notes

- Inline styles only — no CSS classes, no Tailwind, no CSS modules
- `src/engine/schemas.ts` — do NOT modify
- Existing `calcularGap`, `proyectarAbril`, `proyectarAnual`, `hasF572Data`, `calcularDiferencia` — do NOT modify signatures or logic
- `src/components/DetalleCalculo.tsx` — do NOT touch
- After T004, run `npm run build` (or `npx tsc --noEmit`) to verify no TypeScript errors before UI work
- Commit after each phase (or after each task if preferred)
- `EMPTY_F572` constant for tests: `{ conyuge: false, hijos: 0, cuota_medica: {}, indumentaria: {} }` — already in calculator.test.ts line ~20
