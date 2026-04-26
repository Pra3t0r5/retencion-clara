# Feature Specification: Comparación de Períodos con Reglas SIRADIG

**Feature Branch**: `009-comparacion-periodos`
**Created**: 2026-04-25
**Status**: Draft

## Overview

Allow users to understand *why* their retention changed between two months. The app already shows
month-by-month retention figures (spec-004); this feature adds a comparison panel that decomposes
the retention difference into its root causes according to SIRADIG rules, and classifies whether
the difference is expected or warrants review with the employer.

**Key domain rule**: When an employee updates their F.572 SiRADIG, the employer applies the changes
in the *next* payslip, covering all prior months of the fiscal year retroactively. This causes a
month's retention to be dramatically lower than the previous month despite a higher gross salary —
because the employer applied accumulated pending deductions all at once.

**Real-world evidence** (motivating case):
- March 2026, WORMHOLE S.A.: bruto acumulado 27.4M → retencion_mes 1,220,274 ARS
- April 2026, WORMHOLE S.A.: bruto acumulado 36.4M (higher) → retencion_mes 498,657 ARS (lower)
- Cause: employer applied F.572 retroactively in April (indumentaria +1.1M, cuota_médica +1M)
- Without this feature, users cannot tell if the difference is a correct SIRADIG application or an employer error.

---

## User Scenarios & Testing

### User Story 1 — Compare Two Months (Priority: P1)

User selects two months already loaded in the multi-period view and sees a breakdown that explains
how much of the retention change comes from salary growth, bracket changes, F.572 rectificativa
applications, and cumulative fiscal-year calculation effects.

**Why this priority**: The core value — differentiating a correct SIRADIG rectificativa from an
employer error is the primary insight this feature delivers.

**Independent Test**: With March + April 2026 loaded — select March as Mes A and April as Mes B
→ breakdown panel shows Δ retencion ≈ −721K, attributes ≥680K of that to "Rectificativa SIRADIG
aplicada", labels result "Diferencia esperada ✓", and all four cause rows sum to the total Δ ±100 ARS.

**Acceptance Scenarios**:

1. **Given** ≥2 months loaded in the multi-period view, **When** user opens comparison, **Then**
   a month selector shows two dropdowns (Mes A / Mes B) preloaded with the two most recently
   loaded months
2. **Given** Mes A and Mes B selected, **When** comparison renders, **Then** headline section
   shows three signed ARS values: Δ retencion_mes, Δ bruto mensual, Δ deducciones aplicadas
3. **Given** comparison rendered, **When** cause breakdown shown, **Then** four rows appear:
   (a) Cambio de salario bruto, (b) Cambio de tramo impositivo, (c) Rectificativa SIRADIG
   aplicada, (d) Efecto acumulativo fiscal — and their sum equals total Δ retencion_mes ±100 ARS
4. **Given** April 2026 data with F.572 rectificativa applied, **When** compared against March,
   **Then** "Rectificativa SIRADIG aplicada" is the dominant row (≥80% of absolute Δ)
5. **Given** difference is consistent with SIRADIG rules, **When** comparison shown, **Then**
   badge "Diferencia esperada ✓" is visible
6. **Given** an unexplained residual exceeds 10% of total Δ, **When** comparison shown, **Then**
   badge "Revisar con empleador ⚠" is visible with the unexplained ARS amount displayed
7. **Given** no F.572 data entered for the session, **When** comparison renders, **Then**
   "Rectificativa SIRADIG aplicada" row shows 0 ARS with note "Sin datos F.572"

---

### User Story 2 — Month Selector Navigation (Priority: P1)

User can freely switch the Mes A / Mes B pair to compare any combination of loaded months.

**Why this priority**: Without flexible pair selection the comparison covers only one fixed view,
eliminating most of its exploratory value.

**Independent Test**: With January, March, April loaded — switch from March/April to January/April
→ comparison recalculates immediately, all values update without page reload.

**Acceptance Scenarios**:

1. **Given** comparison panel open, **When** user changes Mes A or Mes B, **Then** breakdown
   recalculates and re-renders without page reload or navigation
2. **Given** user selects the same month for both Mes A and Mes B, **When** comparison renders,
   **Then** all deltas show 0 ARS and a note "Seleccioná dos meses distintos para ver la comparación"
3. **Given** Mes A is chronologically later than Mes B, **When** comparison renders, **Then** the
   app normalizes order silently (earlier month = A, later month = B)

---

### User Story 3 — Year-Over-Year Comparison (Priority: P3)

User compares the same calendar month across two different fiscal years (e.g., March 2025 vs March 2026).

**Why this priority**: P3 — requires two full years of data and ARCA tables for the prior year.
Out of scope for v1; included here so the data model is not blocked.

**Independent Test**: N/A — out of scope for v1.

*Out of scope for v1. Requires ARCA tables for prior fiscal year (`src/tablas/2025-H1.ts`,
`2025-H2.ts`). Will be activated in a follow-up spec when prior-year tables are added.*

---

### Edge Cases

- **<2 months loaded**: comparison entry point is hidden or disabled; no empty state needed
- **F.572 not entered**: rectificativa cause shows 0 ARS with note; all other causes still compute
- **Zero retencion_mes in one month**: valid case (over-application in prior month); show signed delta as-is
- **Same month selected twice**: all deltas = 0; show "Seleccioná dos meses distintos" note
- **ARCA table discrepancy**: when engine's `calcularImpuesto` disagrees with payslip's
  `impuesto_determinado`, the decomposition uses the payslip value as ground truth (employer's
  computation takes precedence)

---

## Requirements

### Functional Requirements

- **FR-001**: Comparison entry point MUST be available in the multi-period view when ≥2 months are
  loaded; MUST be hidden or disabled when <2 months are loaded
- **FR-002**: User MUST be able to select any two months from the currently loaded fiscal year as
  Mes A and Mes B; same-month selection is allowed but produces zero deltas
- **FR-003**: Comparison MUST display headline differences: Δ retencion_mes, Δ bruto mensual,
  Δ deducciones aplicadas — each as a signed ARS amount
- **FR-004**: Comparison MUST decompose Δ retencion_mes into exactly four named cause components:
  (a) Cambio de salario bruto, (b) Cambio de tramo impositivo, (c) Rectificativa SIRADIG aplicada,
  (d) Efecto acumulativo fiscal
- **FR-005**: The four cause components MUST sum to total Δ retencion_mes within ±100 ARS
- **FR-006**: Comparison MUST display a classification badge: "Diferencia esperada ✓" when the
  unexplained residual is <10% of absolute Δ retencion_mes; "Revisar con empleador ⚠" otherwise,
  with the unexplained ARS amount shown
- **FR-007**: When F.572 data is absent for the session, the Rectificativa SIRADIG row MUST show
  0 ARS with a "Sin datos F.572" note; all other cause rows MUST still compute and display
- **FR-008**: Comparison MUST render in a modal or inline panel — no new top-level navigation,
  route, or tab is added
- **FR-009**: Decomposition computation MUST be implemented as a new engine function; no existing
  engine functions are modified

### Non-Functional Requirements

- Computation completes in < 200ms (pure client-side, no I/O or network)
- View renders without horizontal scroll on screens ≥375px wide
- No new runtime dependencies
- Inline styles only — no CSS framework
- Zero backend: no data leaves the browser

### Key Entities

- **DiferenciaAnalisis**: the result of a period comparison calculation:
  - `mesA`, `mesB`: month numbers (1–12)
  - `delta_retencion_mes`: total signed difference in monthly retention (ARS)
  - `delta_bruto_mensual`: signed difference in gross salary for the month (ARS)
  - `delta_deducciones_aplicadas`: signed difference in F.572 deductions applied (ARS)
  - `causa_salario`: portion of Δ attributable to gross salary change (ARS)
  - `causa_bracket`: portion of Δ attributable to tax bracket change (ARS)
  - `causa_rectificativa_siradig`: portion of Δ attributable to F.572 rectificativa (ARS)
  - `causa_efecto_acumulativo`: residual from cumulative fiscal-year calculation (ARS)
  - `residuo_inexplicado`: ARS amount not attributable to any rule-based cause
  - `clasificacion`: `"esperada"` (residual <10%) or `"revisar"` (residual ≥10%)

---

## Success Criteria

- **SC-001**: Given RECIBO_MAR + RECIBO_ABR (Fernando Albertengo 2026), comparing March → April,
  `causa_rectificativa_siradig` ≥ 680,000 ARS (target ~718K); `causa_salario` + `causa_bracket`
  account for <10% of total absolute Δ retencion_mes
- **SC-002**: Comparison computation completes in < 200ms for any two-month pair from a
  12-month fiscal year, measured in a modern browser without CPU throttling
- **SC-003**: Comparison panel renders without horizontal scroll on a 375px-wide viewport in
  Chrome, Firefox, and Safari
- **SC-004**: User can open the comparison panel in ≤2 interactions from the multi-period view
- **SC-005**: Cause components sum to Δ retencion_mes within ±100 ARS for all real fixture
  test cases (March/April 2026 data from WORMHOLE S.A.)

---

## Assumptions

- Both months must already be loaded in the `fiscalYear` Map (spec-004 prerequisite); spec-009
  adds no month-loading logic
- F.572 data used is the current session's F.572; per-month F.572 persistence is out of scope for v1
- P3 (year-over-year) is out of scope; the localStorage `rc_year_{YYYY}` schema already supports it
- When payslip `impuesto_determinado` disagrees with the engine's recomputed value (known ARCA
  table discrepancy for April 2026), the payslip value is authoritative for decomposition purposes
- "Consistent with SIRADIG rules" threshold: unexplained residual < 10% of absolute Δ retencion_mes
- The comparison panel is a new component; `App.tsx` wires it into the existing multi-period view
- New engine function pre-decided: `calcularDiferencia(mesA, mesB, f572)` returns `DiferenciaAnalisis`
- Spec-009 is independent of spec-005 (ARCA table fetch) and spec-006 (multimoneda)
