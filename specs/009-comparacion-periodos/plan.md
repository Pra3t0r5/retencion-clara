# Implementation Plan: Comparación de Períodos con Reglas SIRADIG

**Branch**: `009-comparacion-periodos` | **Date**: 2026-04-25 | **Spec**: [spec.md](./spec.md)

## Summary

Add a comparison panel to the multi-period view (spec-004) that decomposes the month-to-month
retention difference into four named SIRADIG causes. Primary driver: the March→April 2026
pattern where a higher gross salary produces lower retention because the employer applied F.572
deductions retroactively. The decomposition must identify that ~718K of the -721K delta is
attributable to `causa_rectificativa_siradig`, not to salary change.

New engine function `calcularDiferencia(mesA, mesB, f572A, f572B) → DiferenciaAnalisis`.
New component `ComparacionSIRADIG.tsx`. No new runtime dependencies. No existing engine
functions modified.

## Technical Context

**Language/Version**: TypeScript 5+ strict + React 19  
**Primary Dependencies**: Zod (schema validation — already in use)  
**Storage**: N/A — no new persistence (comparison is in-session only)  
**Testing**: Vitest — TDD (Principle III): tests for `calcularDiferencia` written before implementation  
**Target Platform**: Browser (Vite/Vercel static, offline-capable)  
**Project Type**: Client-side web application  
**Performance Goals**: Decomposition computation < 200ms (pure arithmetic, no I/O)  
**Constraints**: Inline styles only; no CSS framework; no new runtime dependencies; ≥375px viewport  
**Scale/Scope**: Single fiscal year (≤12 months); two-payslip comparison per interaction

## Constitution Check

*GATE: Must pass before Phase 0 research.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Zero Backend | ✓ PASS | All decomposition is pure client-side arithmetic using payslip fields already in browser |
| II. Tax Math Authoritative | ✓ PASS | Uses `buscarTramo()` + existing ARCA tables; `impuesto_determinado` from payslip is ground truth per spec Assumption 4 |
| III. Test-First Engine | ✓ PASS | `calcularDiferencia` tests (with RECIBO_MAR + RECIBO_ABR fixtures) written before implementation |
| IV. Spec-Driven | ✓ PASS | This plan derives from spec-009; no scope beyond spec |
| V. YAGNI | ✓ PASS | US3 (year-over-year) is P3/out-of-scope; `causa_bracket = 0` documented v1 simplification; no modal routing or history added |

*Post-design re-check:* Same result. No violations.

## Project Structure

### Documentation (this feature)

```text
specs/009-comparacion-periodos/
├── plan.md              # This file
├── research.md          # Phase 0: decomposition algorithm decisions
├── data-model.md        # Phase 1: DiferenciaAnalisis type + derivation
└── tasks.md             # Phase 2 (/speckit.tasks — not created here)
```

### Source Code (repository root)

```text
src/
  engine/
    calculator.ts          # ADD: calcularDiferencia() export (no existing fn modified)
    schemas.ts             # ADD: DiferenciaAnalisis Zod schema
  components/
    ComparacionSIRADIG.tsx # NEW: decomposition table + classification badge
    MonthNav.tsx           # MODIFY: add "Comparar" button (visible when size ≥ 2)
  App.tsx                  # MODIFY: add comparacionMeses state + wire component

src/engine/calculator.test.ts   # ADD: TDD tests for calcularDiferencia
```

**Structure Decision**: Single project (Option 1). All changes stay in `src/engine/` and
`src/components/`. No new directories. Consistent with existing spec-004 structure.

## Complexity Tracking

> No constitution violations — table not required.
>
> **Documented v1 simplification**: `causa_bracket` is always 0. Bracket changes are folded
> into `causa_salario` (the residual after removing cumulative and rectificativa effects).
> Separating bracket from salary would require recomputing GNSI twice with different
> salary/bracket assumptions — out of scope per YAGNI. Captured in research.md §4.
