# Feature Specification: Multi-Período, Históricos y Gráficos

**Feature Branch**: `feature/004-multi-periodo-historicos`
**Created**: 2026-04-24
**Status**: Implemented (partial) — US3 descoped (Principle I violation)

## Overview

Allow users to load multiple payslips across different months of the same fiscal year, visualize
the cumulative retention progression as a chart, and compare month-over-month trends. All data
stays in the browser (localStorage) — no backend required. The tax engine already handles
cumulative calculations — this spec adds persistence, multi-entry UI, and visualization.

---

## Clarifications

### Session 2026-04-24

- Q: In multi-period context, is "deducción no acreditada" analysis shown per active selected month or as annual aggregate? → A: Per active selected month. Gap for month M = cumulative F.572 declared up to M minus applied in payslip M. Consistent with `calcularGap()` implementation.
- Q: When should the "Deducción no acreditada" section render? → A: Only when `F572.indumentaria > 0 OR F572.cuota_medica > 0`. Hidden entirely if user has not entered F.572 data.
- Q: What is the canonical UI label for `gap`? → A: "deducción no acreditada". Internal code identifier remains `gap` (rename is out of scope for this spec).

---

## User Scenarios & Testing

### User Story 1 — Load Multiple Months (Priority: P1)

User can add payslips for multiple months (e.g., January, February, March). The app stores all
of them in the session and lets the user navigate between months. Each month's payslip is
independently added via PDF upload or manual form.

**Why this priority**: The core value unlock — users can track how their retention grows month
by month and spot anomalies.

**Independent Test**: Load January + March payslips → month selector shows both → switching
between months shows correct retention values for each.

**Acceptance Scenarios**:
1. **Given** user has loaded a March payslip, **When** they click "Agregar mes", **Then** form
   resets and they can load an additional month
2. **Given** multiple months loaded, **When** user selects a month from the timeline, **Then**
   all cards update to reflect that month's data
3. **Given** two months with different retenciones, **When** user switches between them, **Then**
   the displayed values change correctly

---

### User Story 2 — Progression Chart (Priority: P1)

A line or bar chart shows the cumulative retention and monthly retention across all loaded months.
User can see at a glance whether their retention is growing, shrinking, or stable.

**Why this priority**: The chart is the "aha moment" — seeing retention as a visual trend is far
more intuitive than comparing numbers.

**Independent Test**: Load January ($800K retained) and March ($1.220K retained) → chart shows
two data points with correct values and upward trend line.

**Acceptance Scenarios**:
1. **Given** 3 months of data, **When** chart renders, **Then** shows one bar/point per month
   with retention amount labeled
2. **Given** multiple months loaded, **When** chart shown, **Then** cumulative YTD retention
   (`acumulado`) is shown as a dashed line series over the monthly bars
3. **Given** single month loaded, **When** chart shown, **Then** renders gracefully with one
   data point and a message "Agregá más meses para ver la progresión"

---

### ~~User Story 3 — Basic Authentication~~ (DESCOPED)

> **Dropped in plan phase.** US3 requires a backend (auth service, httpOnly cookies,
> server-side data storage) which violates Constitution **Principle I: Zero Backend
> (NON-NEGOTIABLE)**. localStorage provides same-device cross-session persistence without
> any server. See `plan.md` Constitution Check for full rationale.

---

### User Story 4 — Year-Over-Year Comparison (Priority: P3)

User can see a summary comparing the current fiscal year's total retention against the prior
year (if data exists). Shown as a simple comparison card, not a full chart.

**Why this priority**: Lower priority — requires at least two full years of data to be useful.
Designed now so the data model supports it.

---

## Requirements

### Functional Requirements

- **FR-001**: Session MUST support storing PayslipData for multiple months (January–December)
- **FR-002**: Month navigator MUST show all loaded months and allow switching between them
- **FR-003**: Chart MUST display monthly retention and cumulative YTD retention per loaded month
- ~~FR-004: Authentication MUST support email + password with session persistence (7-day cookie)~~ — **DESCOPED** (Principle I: Zero Backend NON-NEGOTIABLE)
- **FR-005**: All users MUST have localStorage persistence on the same device. No cross-device sync. No login required.
- ~~FR-006: Authenticated users' data MUST be isolated — no cross-user data leakage possible~~ — **DESCOPED** (Principle I: single-user localStorage; isolation by device)
- **FR-007**: Chart MUST render without external library (inline SVG) or via library < 50kB gzip, offline-capable
- **FR-008**: "Deducción no acreditada" section MUST render only when `F572.indumentaria > 0 OR F572.cuota_medica > 0`. Section is hidden if the user has not entered F.572 data.

### Non-Functional Requirements

- ~~Auth tokens stored in httpOnly cookies (not localStorage) to prevent XSS~~ — **DESCOPED** (Principle I)
- ~~All salary data encrypted at rest on the server~~ — **DESCOPED** (Principle I: no server)
- Chart renders in < 500ms on mobile with 12 data points
- ~~Login flow completes in < 3 seconds on standard connection~~ — **DESCOPED** (Principle I)

---

## Success Criteria

- **SC-001**: User loads 3 months of payslips and sees a chart with correct values for each
- ~~SC-002: After logout and re-login, previously loaded months are restored~~ — **DESCOPED** (Principle I: no auth)
- ~~SC-003: Two different users' data never intermingles~~ — **DESCOPED** (Principle I: single-user, no auth)
- **SC-004**: App works identically to prior single-month version when only one month is loaded (no regression)
- **SC-005**: Chart is readable on a 375px-wide phone screen

---

## Assumptions

- ~~Authentication backend required — this spec introduces the first server-side component~~ → dropped (Principle I)
- ~~Recommended: Supabase Auth (email+password, free tier) or Clerk~~ → dropped
- Chart implemented as inline SVG — no library (decision made in plan phase)
- F.572 data scoped to session only (not persisted in v1)
- The existing engine remains pure client-side — persistence via localStorage only
- Year-over-year (US4) is out of scope for first implementation — data model supports it via `rc_year_{YYYY}` key schema

---

## Glossary

- **gap** / **deducción no acreditada** (UI label): difference between the cumulative
  deductions declared by the employee in F.572 SiRADIG up to month M, and the deductions
  actually applied by the employer in the payslip for that same month M.  
  **Formula**: `gap_M = Σ(F.572 declarado hasta mes M) − aplicado_en_recibo_M` (always ≥ 0)  
  **Cause**: the employer applies F.572 changes in the **next** payslip (SIRADIG delay), not the
  current one. While the gap exists, it has not reduced the employee's taxable base — the
  employee paid more retention than they should have.  
  **Real example**: March 2026 indumentaria_aplicada = 71,997 ARS; F.572 declared 407,605 ARS
  (Jan) + 43,587 (Feb) + 46,100 (Mar) = 497,292 ARS. Gap = 497,292 − 71,997 = 425,295 ARS.
  In April, the employer applied retroactively, reducing retencion_mes from 1.22M → 498K
  despite a higher bruto.  
  **Multi-period context**: shown for the **active selected month** only. `calcularGap(payslip_M, f572, M)` already implements this.  
  **UI visibility**: "Deducción no acreditada" section renders only when
  `F572.indumentaria > 0 OR F572.cuota_medica > 0`. Hidden if no F.572 data entered.  
  **Code identifier**: `gap` (internal, per `calcularGap()`). UI label: "deducción no acreditada".
- **ahorro estimado**: tax reduction (in ARS) the user would obtain if the employer applied all
  F.572-declared deductions in the current period. Computed by `calcularGap()` as the marginal
  tax impact of the gap at the applicable bracket rate. Equivalent to "potential savings from
  pending deductions."
- **acumulado**: cumulative YTD (year-to-date) retention as reported on the payslip
  (`retencion_acumulada`). Shown as the dashed line series in the chart.
- **retencion_mes**: retention for the current month only, as reported on the payslip.
  Shown as bar height in the chart.
- **F.572 rectificativa**: updated F.572 SiRADIG declaration that the employer applies in the
  next payslip, retroactively covering prior months.
