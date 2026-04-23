# Tasks: Core Tax Calculator

**Input**: `specs/001-tax-calculator/spec.md` + `specs/001-tax-calculator/plan.md`
**Prerequisites**: spec.md ✅ | plan.md ✅
**Tests**: Vitest unit tests — spec requires `npm test` ≥60% coverage on `src/engine/`

**Organization**: Tasks grouped by user story for independent implementation + testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[US#]**: User story from spec.md
- All paths relative to repo root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install missing dependencies and initialize test runner.

- [X] T001 Install runtime + dev dependencies: `npm install zod && npm install -D vitest @vitest/ui`
- [X] T002 Add vitest config block to `vite.config.ts`: `test: { globals: true, environment: 'node' }`
- [X] T003 Add `"test": "vitest run"` and `"test:ui": "vitest --ui"` to scripts in `package.json`
- [X] T004 Verify runner works: `npm test` exits cleanly (no test files yet — expect "no tests found" or exit 0)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: ARCA tax tables and Zod schemas that ALL user stories depend on.

**⚠️ CRITICAL**: No user story implementation begins until this phase is complete.

- [X] T005 Create `src/tablas/2026-H1.ts`: define `TaxBracket = { desde: number; hasta: number; fijo: number; pct: number }` and export `TABLAS_2026_H1` with all 10 ARCA H1 2026 tramos (values in `specs/001-tax-calculator/spec.md` tax scale table)
- [X] T006 [P] Add deduction limits to `src/tablas/2026-H1.ts`: `gni_mensual`, `ded_especial_mensual`, `ded_conyuge_anual`, `ded_hijo_anual` (values in spec.md "Deduction Caps" table)
- [X] T007 [P] Create `src/engine/schemas.ts`: add Zod schema `PayslipData` with all cumulative fields from spec.md "Key Schemas" section; export inferred type
- [X] T008 Add Zod schema `F572Data` to `src/engine/schemas.ts`: conyuge (boolean), hijos (number), cuota_medica (per-month record), indumentaria (per-month record); export type
- [X] T009 [P] Add Zod schemas `TaxResult` and `GapAnalysis` to `src/engine/schemas.ts`; export all inferred types
- [X] T010 Update `src/data.ts`: add `satisfies PayslipData` and `satisfies F572Data` type assertions to existing `RECIBO_MAR` and `F572` constants; remove fields now exported from `src/tablas/2026-H1.ts`; verify `npx tsc --noEmit` passes

**Checkpoint**: `npx tsc --noEmit` — zero errors. Schemas compile.

---

## Phase 3: User Story 1 — Manual Entry → Correct Tax Result (Priority: P1) 🎯 MVP

**Goal**: Pure engine that accepts `PayslipData` + `F572Data` and returns correct GNSI, impuesto, retención del mes.

**Independent Test**: `npm test` → all 4 test assertions green: GNSI ≈ $14.805.322 ± $100, impuesto ≈ $3.549.634 ± $100, retención mes ≈ $1.220.273,92 ± $100, edge cases pass.

### Tests for US1 ⚠️ Write FIRST — must FAIL before implementation (T011–T014)

- [X] T011 [P] [US1] Create `src/engine/calculator.test.ts`: import `RECIBO_MAR` from `src/data.ts`; add test `calcularGNSI(RECIBO_MAR)` returns value within 100 of 14805322
- [X] T012 [P] [US1] Add test to `src/engine/calculator.test.ts`: `calcularImpuesto(gnsi)` returns value within 100 of 3549634 for GNSI $14.805.322
- [X] T013 [P] [US1] Add test to `src/engine/calculator.test.ts`: `calcularRetencionMes(impuesto, retenidoAnterior)` returns value within 100 of 1220274
- [X] T014 [P] [US1] Add edge case tests to `src/engine/calculator.test.ts`: GNSI = 0 → impuesto = 0; GNSI = 1000000 (below first tramo threshold) → rate is 5%

### Implementation for US1

- [X] T015 [US1] Create `src/engine/calculator.ts`: add `calcularGNSI(data: PayslipData): number` — returns `bruto_acumulado - aportes_acumulados - indumentaria_aplicada - cuota_medica_aplicada - ded_especial - gni - ded_conyuge - ded_hijos - ded_especial_12`; zero React imports in this file
- [X] T016 [US1] Add `buscarTramo(gnsi: number): TaxBracket` to `src/engine/calculator.ts` — iterates `TABLAS_2026_H1.tramos` and returns the tramo where `gnsi >= desde && gnsi < hasta`
- [X] T017 [US1] Add `calcularImpuesto(gnsi: number): number` to `src/engine/calculator.ts` — calls `buscarTramo`, returns `tramo.fijo + tramo.pct * (gnsi - tramo.desde)`
- [X] T018 [US1] Add `calcularRetencionMes(impuesto: number, retencionAcumuladaAnterior: number): number` to `src/engine/calculator.ts` — returns `Math.max(0, impuesto - retencionAcumuladaAnterior)`

**Checkpoint**: `npm test` — US1 tests green. GNSI / impuesto / retención mes match recibo ± $100.

---

## Phase 4: User Story 2 — F.572 Gap Analysis (Priority: P1)

**Goal**: Engine computes gap between declared F.572 deductions and what the employer applied.

**Independent Test**: `npm test` → indumentaria gap $425.295 ± $100, cuota médica gap $670.449 ± $100, ahorro estimado $339.680 ± $500.

### Tests for US2 ⚠️ Write FIRST — must FAIL before implementation (T019–T022)

- [X] T019 [P] [US2] Add test to `src/engine/calculator.test.ts`: `calcularGap(RECIBO_MAR, F572, 3).indumentaria_gap` within 100 of 425295
- [X] T020 [P] [US2] Add test to `src/engine/calculator.test.ts`: `calcularGap(RECIBO_MAR, F572, 3).cuota_medica_gap` within 100 of 670449
- [X] T021 [P] [US2] Add test to `src/engine/calculator.test.ts`: `calcularGap(RECIBO_MAR, F572, 3).ahorro_estimado` within 500 of 339680
- [X] T022 [US2] Add edge case test: when F572 declared equals payslip applied → `total_gap = 0`, `ahorro_estimado = 0`

### Implementation for US2

- [X] T023 [US2] Add `calcularGap(payslip: PayslipData, f572: F572Data, meses: number): GapAnalysis` to `src/engine/calculator.ts`: sum F572 cuota_medica months 1..meses, sum indumentaria months 1..meses; subtract payslip applied amounts; compute `ahorro_estimado = total_gap * buscarTramo(gnsi).pct`
- [X] T024 [US2] Update `src/calculator.ts` (root level file): import from `src/engine/calculator.ts`; delegate `calcularGaps()` → `calcularGap(RECIBO_MAR, F572, RECIBO_MAR.meses)`; keep same export signatures so `App.tsx` needs no changes

**Checkpoint**: `npm test` — US1 + US2 all pass. App renders same numbers as before refactor.

---

## Phase 5: User Story 3 — Monthly Projection (Priority: P2)

**Goal**: Engine projects April retention and annual retention at current salary run-rate.

**Independent Test**: `proyectarAbril()` returns `retencion_abr_estimada < RECIBO_MAR.retencion_mes` when gap > 0; `proyectarAnual()` returns `efectiva_rate` between 0.10 and 0.40.

### Implementation for US3

- [X] T025 [US3] Add `proyectarAbril(payslip: PayslipData, f572: F572Data): ProyeccionAbril` to `src/engine/calculator.ts`: sum retroactive gap (Ene-Mar) + April new deductions; multiply total by tramo pct; subtract from retencion_mes; floor at 0
- [X] T026 [US3] Add `proyectarAnual(payslip: PayslipData): ProyeccionAnual` to `src/engine/calculator.ts`: bruto monthly = bruto_acumulado / meses; bruto_anual = monthly × 12; estimate months 4-12 at 70% of retencion_mes; sum with retencion_acumulada; compute efectiva_rate
- [X] T027 [US3] Update `src/calculator.ts` (root level): delegate `proyectarAbril()` + `proyectarAnual()` to engine equivalents
- [X] T028 [P] [US3] Add smoke test to `src/engine/calculator.test.ts`: `proyectarAbril(RECIBO_MAR, F572).retencion_abr_estimada < RECIBO_MAR.retencion_mes`

**Checkpoint**: App.tsx Resumen tab unchanged. All `npm test` pass.

---

## Phase 6: User Story 4 — Manual Entry Form (Priority: P1)

**Goal**: Any user can enter their own payslip data — app is no longer Fernando-only.

**Independent Test**: Enter Fernando data manually → same result as hardcoded. Change bruto_acumulado → ResultadoCard updates. Submit empty form → validation errors shown.

### Implementation for US4

- [X] T029 [US4] Create `src/components/PayslipForm.tsx`: labeled `<input type="text">` for each `PayslipData` field; `parseARS(str)` helper that strips `$`, `.` separators and replaces `,` with `.`; Zod parse on submit; show inline error per field if parse fails
- [X] T030 [US4] Add "Usar datos de Fernando" button to `src/components/PayslipForm.tsx`: on click, pre-fills all inputs from `RECIBO_MAR` imported from `src/data.ts`
- [X] T031 [US4] Create `src/components/F572Form.tsx`: cónyuge checkbox + hijos number input; 12-month inputs for cuota_medica (Jan–Dec); 12-month inputs for indumentaria; running total label per category updates on change
- [X] T032 [US4] Update `src/App.tsx`: add `useState<PayslipData | null>(RECIBO_MAR)` and `useState<F572Data | null>(F572)`; add "Datos" tab that renders `<PayslipForm>` + `<F572Form>`; pass state through to calculator calls; show results only when both states non-null
- [X] T033 [US4] Update `src/App.tsx` result tabs: when either state is null, replace tab content with inline prompt "Ingresá tus datos en la pestaña Datos"

**Checkpoint**: Submit Fernando data via form → results match old hardcoded version. Clear form → prompt shown.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T034 [P] Run `npx tsc --noEmit` — zero TypeScript errors; replace any `any` type with proper types
- [X] T035 [P] Run `npm run lint` — zero warnings; fix all reported issues
- [X] T036 Run `npm test` — all tests pass; confirm ≥60% line coverage on `src/engine/`
- [X] T037 Run `npm run build` — build succeeds, `dist/` generated without errors
- [ ] T038 Run `npm run preview` — open browser; verify all tabs render and calculator produces correct output

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Requires Phase 1 complete (zod installed)
- **US1 (Phase 3)**: Requires Phase 2 — write T011–T014 tests first, then T015–T018
- **US2 (Phase 4)**: Requires US1 complete (reuses `buscarTramo` + engine imports)
- **US3 (Phase 5)**: Requires US2 complete (needs `calcularGap` result)
- **US4 (Phase 6)**: Requires Phase 2 (schemas) + any engine function to call; can start in parallel with US2/US3 if scaffolding forms only
- **Polish (Phase 7)**: Requires all phases complete

### Parallel Opportunities

- T005, T007, T009 — different files, run in parallel
- T011, T012, T013, T014 — add to same file, run in sequence (or as parallel `describe` blocks)
- T019, T020, T021 — same pattern, add sequentially
- T034, T035 — independent checks, run in parallel

### User Story Independence

- **US1 (P1)**: Independent — validated by `npm test` alone
- **US2 (P1)**: Builds on US1 engine — independently testable via gap assertions
- **US3 (P2)**: Builds on US2 — independently testable via projection smoke test
- **US4 (P1)**: Form layer is independent of US2/US3 engine tests; depends only on schemas

---

## Notes

- PDF extraction (spec.md Scenario 3) → scoped to `specs/002-mvp-app-interface`, not this spec
- `src/engine/` — zero React imports — pure TypeScript functions only
- Fernando's data in `src/data.ts` is test fixture AND demo default — never delete it
- ARS formatting helper `parseARS()` belongs in `src/components/` (UI concern) not `src/engine/`
