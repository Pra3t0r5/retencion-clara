# Tasks: Comparación de Períodos con Reglas SIRADIG

**Input**: Design documents from `/specs/009-comparacion-periodos/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅

**Scope**: US1 (comparison view + decomposition) + US2 (month selector navigation).
US3 (year-over-year) is P3 — out of scope for v1; stub at end.

---

## Phase 1: Foundational (Schema)

**Purpose**: Add `DiferenciaAnalisis` type before any tests or implementation can reference it.

- [ ] T001 Add `DiferenciaAnalisis` Zod schema and TypeScript type to `src/engine/schemas.ts`:
      ```typescript
      export const DiferenciaAnalisis = z.object({
        mesA: z.number().int().min(1).max(12),
        mesB: z.number().int().min(1).max(12),
        delta_retencion_mes: z.number(),
        delta_bruto_mensual: z.number(),
        delta_ded_aplicadas: z.number(),
        causa_efecto_acumulativo: z.number(),
        causa_rectificativa_siradig: z.number(),
        causa_salario: z.number(),
        causa_bracket: z.number(),
        residuo_inexplicado: z.number(),
        clasificacion: z.enum(["esperada", "revisar"]),
      });
      export type DiferenciaAnalisis = z.infer<typeof DiferenciaAnalisis>;
      ```

**Checkpoint**: `npm run build` (TypeScript) compiles cleanly with the new type exported.

---

## Phase 2: Engine TDD — calcularDiferencia (Principle III)

**⚠️ CRITICAL**: T002 (tests) MUST be written and committed BEFORE T003 (implementation).
Tests must be RED after T002. Only after T003 should they go GREEN.

**Goal**: Verify the decomposition engine against RECIBO_MAR + RECIBO_ABR fixtures.

**Independent Test**: `npm test -- --reporter=verbose` shows 7 failing tests after T002,
then all 7 pass after T003.

- [ ] T002 Write 7 TDD tests for `calcularDiferencia` in `src/engine/calculator.test.ts`
      (add new `describe` block; import `calcularDiferencia` from `./calculator`):

      ```
      const EMPTY_F572 = { conyuge: false, hijos: 0, cuota_medica: {}, indumentaria: {} };

      Test 1 — delta_retencion_mes:
        calcularDiferencia(RECIBO_MAR, RECIBO_ABR, F572, F572)
        → Math.abs(result.delta_retencion_mes - (-721_617)) < 100

      Test 2 — SC-001 (causa_rectificativa dominant):
        same fixture → Math.abs(result.causa_rectificativa_siradig) >= 680_000

      Test 3 — FR-005 (causes sum ±100):
        same fixture → Math.abs(delta - (acumulativo + rectificativa + salario + bracket)) <= 100

      Test 4 — clasificacion = "esperada":
        same fixture → result.clasificacion === "esperada"

      Test 5 — FR-007 (no F.572 → rectificativa = 0):
        calcularDiferencia(RECIBO_MAR, RECIBO_ABR, EMPTY_F572, EMPTY_F572)
        → result.causa_rectificativa_siradig === 0

      Test 6 — same month (US2-AC2):
        calcularDiferencia(RECIBO_MAR, RECIBO_MAR, F572, F572)
        → result.delta_retencion_mes === 0 AND result.causa_rectificativa_siradig === 0

      Test 7 — reverse order normalization (US2-AC3):
        calcularDiferencia(RECIBO_ABR, RECIBO_MAR, F572, F572) produces same
        delta_retencion_mes and causa_rectificativa_siradig as the forward call (±1 ARS)
      ```

      Tests MUST fail (import error expected — function not yet implemented).

- [ ] T003 Implement `calcularDiferencia` in `src/engine/calculator.ts` — make all 7 T002 tests pass:

      ```typescript
      export function calcularDiferencia(
        rawA: PayslipData, rawB: PayslipData,
        f572A: F572Data, f572B: F572Data,
      ): DiferenciaAnalisis {
        // Normalize: earlier month = A
        const [mesA, mesB, , fb] = rawA.meses <= rawB.meses
          ? [rawA, rawB, f572A, f572B]
          : [rawB, rawA, f572B, f572A];

        const delta_retencion_mes = mesB.retencion_mes - mesA.retencion_mes;
        const delta_bruto_mensual = (mesB.bruto_acumulado / mesB.meses)
                                  - (mesA.bruto_acumulado / mesA.meses);
        const delta_ded_aplicadas = (mesB.indumentaria_aplicada + mesB.cuota_medica_aplicada)
                                  - (mesA.indumentaria_aplicada + mesA.cuota_medica_aplicada);

        const causa_efecto_acumulativo    = -mesA.retencion_mes;
        const rate_B                      = buscarTramo(mesB.gnsi).pct;
        const causa_rectificativa_siradig = hasF572Data(fb)
                                          ? -(delta_ded_aplicadas * rate_B)
                                          : 0;
        const delta_impuesto              = mesB.impuesto_determinado - mesA.impuesto_determinado;
        const causa_salario               = delta_impuesto - causa_rectificativa_siradig;
        const causa_bracket               = 0;

        const residuo_inexplicado = delta_retencion_mes
          - (causa_efecto_acumulativo + causa_rectificativa_siradig + causa_salario + causa_bracket);

        const abs_delta    = Math.abs(delta_retencion_mes);
        const clasificacion: "esperada" | "revisar" =
          abs_delta === 0 || Math.abs(residuo_inexplicado) < 0.1 * abs_delta
            ? "esperada" : "revisar";

        return {
          mesA: mesA.meses, mesB: mesB.meses,
          delta_retencion_mes, delta_bruto_mensual, delta_ded_aplicadas,
          causa_efecto_acumulativo, causa_rectificativa_siradig, causa_salario, causa_bracket,
          residuo_inexplicado, clasificacion,
        };
      }
      ```

      Also add `import type { DiferenciaAnalisis } from './schemas';` at top of file.

**Checkpoint**: `npm test` — all existing tests still pass PLUS all 7 new calcularDiferencia tests pass.

---

## Phase 3: User Story 1 — Comparison View (Priority: P1)

**Goal**: User can open a panel that shows the decomposition of the month-to-month retention
difference, classified as "Diferencia esperada ✓" or "Revisar con empleador ⚠".

**Independent Test**: With RECIBO_MAR + RECIBO_ABR loaded, click "Comparar" in MonthNav →
modal opens with Δ retencion ≈ −721K, "Rectificativa SIRADIG aplicada" ≥ 680K, badge
"Diferencia esperada ✓".

- [ ] T004 [P] [US1] Create `src/components/ComparacionSIRADIG.tsx` skeleton:

      ```typescript
      import type { PayslipData, F572Data } from '../engine/schemas';
      import { calcularDiferencia } from '../engine/calculator';

      type Props = {
        mesA: PayslipData;
        mesB: PayslipData;
        f572A: F572Data;
        f572B: F572Data;
        allMonths: number[];             // for dropdowns (US2)
        onChangeMonths: (a: number, b: number) => void;  // for dropdowns (US2)
        onClose: () => void;
      };

      export function ComparacionSIRADIG({ mesA, mesB, f572A, f572B, allMonths, onChangeMonths, onClose }: Props) {
        const result = calcularDiferencia(mesA, mesB, f572A, f572B);
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100,
                        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 24,
                          minWidth: 320, maxWidth: 480, width: '90%', maxHeight: '90vh',
                          overflowY: 'auto' }}>
              <button onClick={onClose} style={{ float: 'right', cursor: 'pointer' }}>✕</button>
              <p>Placeholder — implement in T006</p>
            </div>
          </div>
        );
      }
      ```

- [ ] T005 [P] [US1] Add `comparacionMeses` state to `src/App.tsx`:
      ```typescript
      const [comparacionMeses, setComparacionMeses] = useState<{ a: number; b: number } | null>(null);
      ```
      No rendering yet — just the state declaration.

- [ ] T006 [US1] Implement full decomposition table in `src/components/ComparacionSIRADIG.tsx`
      (replace placeholder from T004). All styles inline. Layout:

      **Header row**: "Comparación: {MES_ABBR[mesA-1]} vs {MES_ABBR[mesB-1]}"

      **Headline section** (3 signed ARS values, FR-003):
      - "Δ Retención mes": `result.delta_retencion_mes`
      - "Δ Bruto mensual": `result.delta_bruto_mensual`
      - "Δ Deducciones aplicadas": `result.delta_ded_aplicadas`

      **Cause table** (4 rows, FR-004):
      | Causa | Campo | Nota especial |
      |-------|-------|---------------|
      | Efecto acumulativo fiscal | `causa_efecto_acumulativo` | — |
      | Rectificativa SIRADIG aplicada | `causa_rectificativa_siradig` | Show "Sin datos F.572" if value = 0 AND no F.572 data |
      | Cambio de salario bruto | `causa_salario` | — |
      | Cambio de tramo impositivo | `causa_bracket` | Always 0 in v1 |

      **Classification badge** (FR-006):
      - `clasificacion === "esperada"` → green badge "Diferencia esperada ✓"
      - `clasificacion === "revisar"` → yellow/orange badge "Revisar con empleador ⚠"
        with `residuo_inexplicado` shown as ARS amount

      Format all ARS values using: `new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value)`
      Positive values: green text; negative values: red text.

- [ ] T007 [P] [US1] Add "Comparar" button to `src/components/MonthNav.tsx`:
      - Add optional prop `onComparar?: () => void`
      - Render button only when `months.length >= 2`
      - Position after existing month pills, before "+ Agregar mes"
      - Inline style: same border-radius/padding as pills; distinct accent color to indicate action
      - Label: "Comparar →"

- [ ] T008 [US1] Wire `ComparacionSIRADIG` into `src/App.tsx`:
      - Pass `onComparar` to `MonthNav`:
        ```typescript
        onComparar={() => {
          const sorted = Array.from(fiscalYear.keys()).sort((a,b) => a-b);
          setComparacionMeses({ a: sorted.at(-2)!, b: sorted.at(-1)! });
        }}
        ```
      - Render `<ComparacionSIRADIG>` when `comparacionMeses !== null`:
        ```typescript
        {comparacionMeses !== null && (
          <ComparacionSIRADIG
            mesA={fiscalYear.get(comparacionMeses.a)!}
            mesB={fiscalYear.get(comparacionMeses.b)!}
            f572A={activeF572}
            f572B={activeF572}
            allMonths={Array.from(fiscalYear.keys()).sort((a,b)=>a-b)}
            onChangeMonths={(a, b) => setComparacionMeses({ a, b })}
            onClose={() => setComparacionMeses(null)}
          />
        )}
        ```
      - Guard: only render when both months exist in fiscalYear Map.

**Checkpoint**: With RECIBO_MAR + RECIBO_ABR loaded, MonthNav shows "Comparar →" button.
Clicking opens modal with correct decomposition values (verify manually or in browser).

---

## Phase 4: User Story 2 — Month Selector Navigation (Priority: P1)

**Goal**: User can freely switch Mes A / Mes B pair; comparison recalculates immediately.

**Independent Test**: With Jan, Mar, Apr loaded — switch from Mar/Apr to Jan/Apr → all values
update without page reload, Δ and causes reflect the new pair.

- [ ] T009 [US2] Add Mes A / Mes B `<select>` dropdowns inside `src/components/ComparacionSIRADIG.tsx`:
      - Two `<select>` elements populated from `allMonths` prop (display MES_ABBR labels)
      - Initial values: `mesA.meses` and `mesB.meses`
      - `onChange`: call `onChangeMonths(newA, newB)` → parent updates state → component re-renders with new payslips
      - **Same-month guard** (US2-AC2): when both selects show same month, render note
        "Seleccioná dos meses distintos para ver la comparación" instead of decomposition table;
        all ARS values show 0
      - Normalization (US2-AC3): `calcularDiferencia` already handles reversed order silently — no extra UI logic needed
      - Position: directly below header, above headline section

**Checkpoint**: Load 3 months → open comparison → change either dropdown → values update instantly,
no page reload, same-month guard triggers when both selects match.

---

## Phase 5: Polish

- [ ] T010 [P] Run `npm test` — all existing tests + 7 new `calcularDiferencia` tests pass (0 failures)

- [ ] T011 [P] Viewport check: open Chrome DevTools → set viewport to 375px → open comparison modal
      → verify no horizontal scrollbar on any of: header, headline section, cause table, badge
      (FR viewport NFR; SC-003)

- [ ] T012 Manual acceptance test — run with real Mar + Apr 2026 data in browser:
      1. Load RECIBO_MAR fixture → load RECIBO_ABR fixture (both months visible in MonthNav)
      2. Click "Comparar →" (≤2 interactions from multi-period view — SC-004)
      3. Verify modal opens with:
         - "Δ Retención mes" ≈ −721,617 ARS (±100 — SC-005)
         - "Rectificativa SIRADIG aplicada" ≥ 680,000 ARS (SC-001, target ~749K)
         - "Cambio de salario bruto" ≈ +1,248,324 ARS
         - "Efecto acumulativo fiscal" ≈ −1,220,274 ARS
         - Four causes sum ≈ −721,617 ±100 (SC-005)
         - Badge: "Diferencia esperada ✓" (green)
      4. Switch dropdowns to same month → "Seleccioná dos meses distintos" note appears
      5. Switch back to Mar/Apr → values restore correctly

---

## Phase 6: P3 Optional — Year-Over-Year (Out of Scope v1)

> **⚠️ DO NOT IMPLEMENT** unless `src/tablas/2025-H1.ts` and `src/tablas/2025-H2.ts`
> exist in the repository. Check before starting. This phase is fully skipped for v1.

- [ ] T013 [P3] [US3] Year-over-year comparison — implement only when prior-year ARCA tables available:
      - New UI to select target year in comparison panel
      - Load fiscalYear for year N-1 from localStorage `rc_year_{YYYY-1}`
      - Pass prior-year PayslipData to `calcularDiferencia`
      - Requires verifying bracket alignment across different ARCA table versions

---

## Known Open Issues

- **ARCA table rate for April 2026**: `calcularDiferencia` uses `buscarTramo(mesB.gnsi).pct = 0.35`
  (from 2026-H1.ts), giving `causa_rectificativa ≈ −749K`. The spec's "target ~718K" uses the
  payslip's implied effective rate (~33.5%). Both satisfy SC-001 (≥680K). Tracked in
  `src/tablas/2026-H1.ts` known discrepancy comment — resolves when official ARCA RG is obtained.
- **Non-consecutive month pairs**: residuo_inexplicado may be non-zero (includes skipped months'
  retention), potentially triggering "Revisar con empleador ⚠" incorrectly. V1 limitation;
  acceptable since primary use case is consecutive-month comparisons.

---

## Dependencies & Execution Order

- **Phase 1**: Independent — run first; T001 blocks everything (type needed by tests)
- **Phase 2**: After Phase 1; T002 before T003 (Principle III: TDD)
- **Phase 3**: After Phase 2 (T003 must pass); T004 ∥ T005; then T006 ∥ T007; then T008
- **Phase 4**: After Phase 3 (T006 must be complete — extends the component)
- **Phase 5**: After all implementation phases
- **Phase 6**: Independent of everything — conditional on prior-year ARCA tables
