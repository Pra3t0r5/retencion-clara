# Plan: Core Tax Calculator

**Status**: Ready to Implement  
**Estimated effort**: 2–3 days  
**Blockers**: None — real test data available, spec approved

---

## Architecture Overview

```
src/
├── tablas/
│   └── 2026-H1.ts          ← ARCA tax tables (already exist in data.ts, needs extraction)
├── engine/
│   ├── schemas.ts           ← Zod schemas: PayslipData, F572Data, TaxResult
│   ├── calculator.ts        ← Pure functions: calcularGNSI, calcularImpuesto, calcularGap
│   └── calculator.test.ts   ← Vitest unit tests with Fernando's real data
└── App.tsx                  ← React UI (already working, display-only)
    data.ts                  ← Current hardcoded data → move to tablas/ + schemas
    calculator.ts            ← Current calculator → refactor into engine/
```

**Key constraint**: `src/engine/` must be pure TypeScript — zero React imports. This lets the engine be reused in React Native later.

---

## Technology Stack

- **Language**: TypeScript (strict, no `any`)
- **Validation**: Zod 3.x
- **Testing**: Vitest
- **PDF parsing** (phase 3): pdfjs-dist
- **No backend**: all logic runs in browser

---

## Implementation Phases

### Phase 1: Engine Refactor [Est. 1 day]

Move hardcoded data into proper typed structures. Implement full Art. 94 calculator from scratch (not observation-based).

**Current problem**: `calculator.ts` uses a hardcoded `tramo_actual` observation (31% bracket inferred from real recibo). Correct approach: implement full tax scale lookup from `tablas/`.

**Files to create/modify**:
- `src/tablas/2026-H1.ts` — extract ARCA tables from `data.ts`, add all 10 brackets verified
- `src/engine/schemas.ts` — Zod schemas for `PayslipData`, `F572Data`, `TaxResult`, `GapAnalysis`
- `src/engine/calculator.ts` — pure functions with full bracket lookup
- `src/engine/calculator.test.ts` — tests against Fernando's March 2026 real data

**Verified brackets** (from real recibo, bracket that contains GNSI $14.805.322):
```
Bracket 8: $13.792.083,76 → fijo $2.609.499,93 + 31%
Recibo shows: fijo $10.125.152,33 + $2.098.781,57 → different base
```
> NOTE: recibo shows accumulation from January. The bracket base in the recibo
> ($10.125.152,33) is NOT the bracket threshold — it's the cumulative GNSI at
> start of that bracket for 3 months. Full bracket table needed from ARCA RG publication.

**Phase 1 success criteria**:
- [ ] `src/engine/calculator.ts` computes GNSI matching recibo ± $100
- [ ] `src/engine/calculator.ts` computes impuesto matching $3.549.634 ± $100
- [ ] `src/engine/calculator.ts` computes retención mes matching $1.220.273,92 ± $100
- [ ] All Vitest tests green: `make test`

### Phase 2: Gap Analysis + Projections [Est. 0.5 days]

Complete gap analysis and April/annual projections using engine functions.

**Files to create/modify**:
- `src/engine/calculator.ts` — add `calcularGap()`, `proyectarMes()`, `proyectarAnual()`
- `src/data.ts` — replace hardcoded objects with typed `PayslipData` + `F572Data` instances
- `src/App.tsx` — wire to new engine interfaces (should be minimal changes)

**Phase 2 success criteria**:
- [ ] Gap analysis: indumentaria gap = $425.295 ± $100
- [ ] Gap analysis: cuota médica gap = $670.449 ± $100
- [ ] April projection computes without errors
- [ ] App.tsx shows same numbers as before refactor

### Phase 3: Manual Entry Form [Est. 1 day]

Replace hardcoded `data.ts` with an input form so any user can enter their data.

**Files to create**:
- `src/components/PayslipForm.tsx` — fields matching `PayslipData` schema
- `src/components/F572Form.tsx` — fields matching `F572Data` schema
- `src/App.tsx` — add "Ingresar datos" tab, store state, pass to calculator

**Phase 3 success criteria**:
- [ ] User can enter their own payslip cumulative data
- [ ] User can enter F.572 deductions by month
- [ ] Calculator shows result for any input
- [ ] Fernando's data pre-loaded as default (for demo)

---

## Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| ARCA bracket thresholds not verified | Medium | High | Cross-check with AFIP RG publication, use recibo as ground truth |
| Cuota médica cap calculation complex | Medium | Medium | Implement cap check, test with values near 5% boundary |
| Indumentaria annual cap varies per ARCA update | Low | Medium | Hardcode 2026 H1 value, add comment to update each semester |

---

## Non-functional Requirements

- **Performance**: Calculator must run in < 10ms (pure math, no I/O)
- **Accuracy**: Results must match employer's recibo ± $100 for test data
- **Privacy**: No data leaves the browser — no analytics, no API calls from engine
- **Portability**: `src/engine/` must compile without DOM types (future React Native reuse)

---

## Testing Strategy

### Unit Tests (`src/engine/calculator.test.ts`)
- Input: Fernando's real March 2026 cumulative data
- Assert: GNSI, impuesto determinado, retención mes all match recibo ± $100
- Assert: gap analysis matches expected values ± $100
- Assert: zero input edge cases (GNSI = 0, max deductions)

### Manual Testing
- Open app on desktop browser: verify numbers match current recibo
- Open app on iPhone Safari: verify responsive layout
- "Add to Home Screen" on iPhone: verify PWA installs

---

## Open Questions

- ARCA bracket thresholds for H1 2026: need official RG number to verify all 10 brackets
- Does `ded_especial_12` (1/12 deduc. personales) need to be computed or is it always from recibo?

---

## Sign-Off

- [x] Spec approved
- [x] Real test data available
- [ ] ARCA bracket table fully verified (partial — bracket 8 confirmed from recibo)
- [x] Ready to implement Phase 1

**Next**: Proceed to `tasks.md`
