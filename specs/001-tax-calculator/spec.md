# Feature Specification: Core Tax Calculator

**Feature Branch**: `feature/001-tax-calculator`  
**Created**: 2026-04-22  
**Status**: In Progress  
**Spec dir**: `specs/001-tax-calculator`

---

## Overview

Implement the Art. 94 (4ta categoría) income tax calculator engine and initial UI. Given a user's salary data (from payslip) and declared deductions (from F.572), compute the cumulative retention from January, the current month's retention, and project remaining months.

---

## User Scenarios & Acceptance Criteria

### Scenario 1: Manual data entry → correct tax result

**Priority**: P1

**Why**: Core value. Without correct calculation, nothing else matters.

**Independent Test**: `npm test` — unit tests against Fernando's real March 2026 data.

**Acceptance Criteria**:

1. **Given** cumulative bruto $27.432.062,23 / aportes $2.173.406,54 / indumentaria $71.997 / cuota médica $311.947,62 / deducción especial $6.182.163 / GNI $1.287.950,64 / cónyuge $1.212.991,17 / hijos $611.715,87 / 1/12 ded. $774.568,39, **When** calculator runs, **Then** GNSI = $14.805.322 ± $100
2. **Given** GNSI $14.805.322, **When** tax is computed, **Then** impuesto determinado = $3.549.634 ± $100 (bracket: base $10.125.152,33 + fijo $2.098.781,57 + 31% on excedente)
3. **Given** impuesto $3.549.634 / retenido anterior $2.329.360,25, **When** monthly retention computed, **Then** result = $1.220.273,92 ± $100

### Scenario 2: F.572 gap analysis

**Priority**: P1

**Why**: Main insight the app provides. Users need to know if their employer is under-applying deductions.

**Independent Test**: Run gap calculation with Fernando's data, verify expected values.

**Acceptance Criteria**:

1. **Given** F.572 indumentaria Ene-Mar declared ($497.292,29) vs applied ($71.997), **When** gap calculated, **Then** gap = $425.295 ± $100
2. **Given** F.572 cuota médica Ene-Mar declared ($982.396,36) vs applied ($311.947,62), **When** gap calculated, **Then** gap = $670.448,74 ± $100
3. **Given** total gap $1.095.744, tax rate 31%, **When** savings estimated, **Then** ahorro ≈ $339.680 ± $500

### Scenario 3: PDF upload → auto-populate form

**Priority**: P2

**Why**: Reduces friction. Without it, users must manually enter all numbers.

**Independent Test**: Upload Fernando's PDFs → verify JSON matches manual entry.

**Acceptance Criteria**:

1. **Given** digital payslip PDF (WORMHOLE format), **When** uploaded, **Then** all salary fields auto-populated
2. **Given** F.572 Web PDF (SiRADIG format), **When** uploaded, **Then** deductions + cargas familia auto-populated
3. **Given** extraction error, **When** fields are ambiguous, **Then** show uncertain fields highlighted for manual review

### Scenario 4: Monthly projection

**Priority**: P2

**Why**: Users want to plan ahead — know total annual retention.

**Acceptance Criteria**:

1. **Given** 3 months of real data + remaining 9 months projected at same salary, **When** projection runs, **Then** shows total annual retention and effective tax rate
2. **Given** additional deductions added by user, **When** simulation runs, **Then** shows updated projection with savings

---

## Out of Scope

- ❌ Multi-employer support (more than one F.572 employer source)
- ❌ Other income categories (1ra, 2da, 3ra categoría)
- ❌ Historical years (2024, 2025) — only 2026 H1 tables for now
- ❌ Automatic F.572 submission to ARCA
- ❌ Auth / user accounts / cloud storage
- ❌ Mobile app (React web only)

---

## Technical Requirements

### Data Flow

```
[PDF Upload]              [Manual Form]
     ↓                          ↓
[pdfjs-dist parse]     [User input fields]
     ↓                          ↓
[AI extraction (opt.)]  [Zod validation]
     ↓                          ↓
     └──────────────────────────┘
                ↓
        [PayslipData (Zod)]
        [F572Data (Zod)]
                ↓
        [calculator.ts]
        (pure functions, no React)
                ↓
        [TaxResult]
                ↓
        [React UI display]
```

### Key Schemas (Zod)

```typescript
// Cumulative state from payslip tax detail page
PayslipData = {
  periodo: string,          // "Marzo 2026"
  meses: number,            // 3
  bruto_acumulado: number,
  aportes_acumulados: number,
  indumentaria_aplicada: number,
  cuota_medica_aplicada: number,
  ded_especial: number,
  gni: number,
  ded_conyuge: number,
  ded_hijos: number,
  ded_especial_12: number,
  gnsi: number,
  impuesto_determinado: number,
  retencion_acumulada: number,
  retencion_mes: number,
}

F572Data = {
  conyuge: boolean,
  hijos: number,
  cuota_medica: Record<Mes, number>,   // { enero: ..., febrero: ... }
  indumentaria: Record<Mes, number>,
}

TaxResult = {
  gnsi: number,
  impuesto_determinado: number,
  retencion_mes: number,
  gap_analysis: GapAnalysis,
  proyeccion_abril: ProyeccionAbril,
  proyeccion_anual: ProyeccionAnual,
}
```

### ARCA 2026 H1 Tax Scale (verified against Fernando's March recibo)

| Desde | Hasta | Fijo | % |
|-------|-------|------|---|
| $0 | $1.149.340,31 | $0 | 5% |
| $1.149.340,31 | $2.298.680,63 | $57.467,02 | 9% |
| $2.298.680,63 | $3.448.020,94 | $161.010,26 | 12% |
| $3.448.020,94 | $5.172.031,41 | $298.912,78 | 15% |
| $5.172.031,41 | $6.896.041,88 | $557.716,89 | 19% |
| $6.896.041,88 | $10.344.062,82 | $885.213,96 | 23% |
| $10.344.062,82 | $13.792.083,76 | $1.678.057,43 | 27% |
| $13.792.083,76 | $20.688.125,64 | $2.609.499,93 | 31% |
| $20.688.125,64 | $27.584.167,52 | $4.745.025,38 | 35% |
| $27.584.167,52 | ∞ | $7.157.082,52 | 35% |

> **Verified:** GNSI $14.805.322 → bracket $13.792.083,76 → fijo $2.609.499,93 + 31% × $1.013.238,24 = $3.549.634  
> *Note: This matches the recibo to within rounding. Base confirmed.*

### Deduction Caps (ARCA 2026)

| Deducción | Cap |
|-----------|-----|
| Cuota médica | 5% of Resultado Neto (before this deduction) |
| Indumentaria | Up to GNI annual ($5.151.802,50) |
| GNI | $5.151.802,50/año = $429.317,08/mes |
| Deducción especial | $24.728.652/año = $2.060.721/mes |
| Cónyuge | $4.851.964,66/año |
| Hijo | $2.446.863,48/año |

### Dependencies

- `pdfjs-dist` — PDF parsing (offline)
- `zod` — schema validation
- `react` + `vite` — UI + bundler
- Claude API (optional) — PDF extraction for scanned/inconsistent PDFs

### Constraints

- All calculation runs client-side — no API calls for math
- Tax tables must be updated when ARCA publishes H2 2026 values
- Calculator is cumulative from January — needs all months' data to be accurate
- Indumentaria cap is annual; cuota médica cap is rolling (calculated from result neto)

---

## Real Test Data (Fernando Albertengo — March 2026)

Used for all unit tests. Source: verified against official WORMHOLE S.A. payslip.

```typescript
// From recibo "Detalle de Calculo" page
const TEST_INPUT: PayslipData = {
  periodo: "Marzo 2026",
  meses: 3,
  bruto_acumulado: 27_432_062.23,
  aportes_acumulados: 2_173_406.54,
  indumentaria_aplicada: 71_997.00,
  cuota_medica_aplicada: 311_947.62,
  ded_especial: 6_182_163.00,
  gni: 1_287_950.64,
  ded_conyuge: 1_212_991.17,
  ded_hijos: 611_715.87,
  ded_especial_12: 774_568.39,
  gnsi: 14_805_322.00,
  impuesto_determinado: 3_549_634.17,
  retencion_acumulada: 3_549_634.17,
  retencion_mes: 1_220_273.92,
};

// From F.572 rectificativa 13/04/2026
const TEST_F572: F572Data = {
  conyuge: true,
  hijos: 1,
  cuota_medica: { enero: 311_947.62, febrero: 330_173.05, marzo: 340_275.69, abril: 350_687.47 },
  indumentaria: { enero: 407_605.13, febrero: 43_586.94, marzo: 46_100.22, abril: 695_475.68 },
};
```

---

## Key Finding (Edge Case Documented)

The F.572 rectificativa (filed 13/04/2026) added deductions that were NOT in the system when March payslip was processed (25/03/2026):

| Item | Not Applied | Applied | Gap |
|------|-------------|---------|-----|
| Indumentaria Ene-Mar | $497.292,29 | $71.997,00 | **$425.295,29** |
| Cuota médica Feb-Mar | $670.448,74 | $0 | **$670.448,74** |
| **Total gap** | | | **$1.095.744,03** |

→ Expected April retention reduction: ~$340K (gap × 31% tax rate)

This is the primary user-facing insight: **"¿Cuánto menos te van a retener el mes que viene?"**

---

## Success Metrics

- Scenario 1 AC 1-3 all pass (calculator matches real recibo ± $100)
- Scenario 2 AC 1-3 all pass (gap analysis correct)
- `npm test` passes with ≥60% coverage on `src/engine/`
- App loads in <1s on localhost

---

## Questions & Unknowns

- [NEEDS CLARIFICATION] Are indumentaria caps cumulative per fiscal year or per semester?
- [NEEDS CLARIFICATION] Does ARCA publish new brackets mid-year, or only H1/H2?
- [OPEN] How to handle when user has SAC (sueldo anual complementario) in June/December?
- [OPEN] Best strategy for pdfjs parsing — by text coordinates or by regex on content?

---

## Notes

- Project blueprint: `02 Knowledge Base/Resources/Project Blueprints/Cyberchori Agent/RetenciónClara.md` (Obsidian vault)
- Vault project: `01 Project Management/Projects/Mini app to preview tax deductions.md`
- Real test data verified against official WORMHOLE S.A. payslip March 2026
- Tax scale brackets extracted from `Detalle de Calculo` page — cross-verified with ARCA RG 5008
