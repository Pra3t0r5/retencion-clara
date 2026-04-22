# Tasks: Core Tax Calculator

**Status**: Ready  
**Priority**: P1  
**Branch**: `feature/001-tax-calculator`

Execute in order. Mark `[x]` when done. `[P]` = parallel with previous task.

---

## Phase 1: Engine Refactor

### Task 1.1: Extract tax tables
- [ ] Create `src/tablas/2026-H1.ts`
- [ ] Define `TaxBracket` type: `{ desde, hasta, fijo, pct }`
- [ ] Add all 10 brackets (H1 2026 ARCA) — verify bracket 8 matches recibo observation
- [ ] Export `TABLAS_2026_H1`: `{ gni_mensual, ded_especial_mensual, ded_conyuge_anual, ded_hijo_anual, tramos }`
- **Test**: file compiles, TypeScript types correct
- **Time**: 30m

### Task 1.2: Define Zod schemas
- [ ] Create `src/engine/schemas.ts`
- [ ] Define `PayslipDataSchema` — all cumulative fields from recibo "Detalle de Calculo"
- [ ] Define `F572DataSchema` — cargas familia + cuota médica/indumentaria por mes
- [ ] Define `TaxResultSchema` — gnsi, impuesto, retencion_mes, gap, proyecciones
- [ ] Export inferred TypeScript types
- **Test**: `zod.parse()` succeeds on Fernando's real data constants
- **Time**: 30m

### Task 1.3: Implement calculator engine
- [ ] Create `src/engine/calculator.ts`
- [ ] `calcularGNSI(data: PayslipData): number` — bruto - aportes - deducciones generales - deducciones personales
- [ ] `calcularImpuesto(gnsi: number, tablas: Tablas): number` — bracket lookup + fijo + pct on excedente
- [ ] `calcularRetencionMes(impuesto: number, retenidoAnterior: number): number`
- [ ] `calcularGap(payslip: PayslipData, f572: F572Data): GapAnalysis`
- [ ] `proyectarAbril(payslip: PayslipData, f572: F572Data): ProyeccionAbril`
- [ ] `proyectarAnual(payslip: PayslipData, f572: F572Data): ProyeccionAnual`
- **Test**: TypeScript compiles, no `any`
- **Time**: 2h

### Task 1.4: Write unit tests
- [ ] Create `src/engine/calculator.test.ts`
- [ ] Test `calcularGNSI` → result must equal $14.805.322 ± $100
- [ ] Test `calcularImpuesto` → result must equal $3.549.634 ± $100
- [ ] Test `calcularRetencionMes` → result must equal $1.220.273,92 ± $100
- [ ] Test `calcularGap` → indumentaria $425.295 ± $100, cuota médica $670.449 ± $100
- [ ] Test edge: zero GNSI → impuesto = 0
- [ ] Test edge: GNSI below first bracket → 5% rate applies
- **Test**: `make test` → all pass
- **Time**: 1h

### [P] Task 1.5: Update `src/data.ts`
- [ ] Import and use `PayslipDataSchema` + `F572DataSchema` for type safety
- [ ] Keep hardcoded Fernando data as typed constants
- [ ] Delete anything now in `src/tablas/2026-H1.ts`
- **Test**: `make test` still passes, no regressions
- **Time**: 20m

---

## Phase 2: Wire UI to Engine

### Task 2.1: Update `src/calculator.ts`
- [ ] Replace current simplified calculator with calls to `src/engine/calculator.ts`
- [ ] Delete hardcoded `tramo_actual` observation
- [ ] All exported functions now delegate to engine
- **Test**: `make test` passes, App.tsx shows same numbers
- **Time**: 30m

### [P] Task 2.2: Smoke test in browser
- [ ] `npm run dev` → open http://localhost:5173
- [ ] Verify "Resumen" tab numbers unchanged vs current
- [ ] Verify on mobile viewport (DevTools → iPhone 14)
- [ ] Verify dark mode renders correctly
- **Test**: Manual visual check — numbers match, layout works on 390px width
- **Time**: 15m

---

## Phase 3: Manual Entry Form

### Task 3.1: PayslipForm component
- [ ] Create `src/components/PayslipForm.tsx`
- [ ] Fields: meses, bruto_acumulado, aportes_acumulados, indumentaria_aplicada, cuota_medica_aplicada, ded_especial, gni, ded_conyuge, ded_hijos, ded_especial_12, retencion_acumulada
- [ ] Number inputs with `es-AR` formatting hint
- [ ] Zod validate on change, show errors inline
- [ ] "Usar datos de Fernando" button pre-fills form
- **Test**: Form renders, pre-fill works, validation catches non-numbers
- **Time**: 2h

### Task 3.2: F572Form component
- [ ] Create `src/components/F572Form.tsx`
- [ ] Cargas familia: checkboxes cónyuge + hijos count
- [ ] Cuota médica: 12 month inputs (Jan–Dec)
- [ ] Indumentaria: 12 month inputs (Jan–Dec)
- [ ] Running total shown as user types
- **Test**: Form renders, totals update live
- **Time**: 1.5h

### Task 3.3: Wire forms into App
- [ ] Add "Ingresar datos" tab to `App.tsx`
- [ ] `useState` for `PayslipData` + `F572Data`
- [ ] Pass state to calculator → results update live
- [ ] Pre-load Fernando's data as default state
- **Test**: Change a field → result updates in "Resumen" tab
- **Time**: 1h

---

## Phase 4: Final Polish

### Task 4.1: Full test + lint pass
- [ ] `make ci` → format + lint + test + build all pass
- [ ] Fix any lint warnings
- **Time**: 30m

### Task 4.2: PR
- [ ] `git push origin feature/001-tax-calculator`
- [ ] Open PR to `main` via `gh pr create`
- [ ] PR description links to spec.md
- **Time**: 10m

---

## Sign-Off

- [ ] All tasks complete
- [ ] `make test` passes
- [ ] Calculator matches Fernando's recibo ± $100
- [ ] Manual entry form works for any user
- [ ] App installable as PWA on iPhone
- [ ] PR merged to main

**Verified test data**: `specs/001-tax-calculator/spec.md` section "Real Test Data"
