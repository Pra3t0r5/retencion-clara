# Implementation Plan: Dashboard de Impacto del F.572

**Branch**: `010-dashboard-impacto-f572` | **Date**: 2026-04-26 | **Spec**: [spec.md](./spec.md)

## Summary

Add a hero section with three impact numbers (Retenido / Recuperado / Pendiente) to the main screen, replacing the existing two stat-cards. Annotate the retention chart when F.572 application is detected. Make the F.572 history card always visible when F.572 data is present. Simplify language in the comparison modal (P2).

All logic is client-side. One new engine function (`calcularRecuperado`) and one new pure helper (`detectarF572Events`) are added. One new React component (`HeroStats.tsx`) renders the three-card hero. Existing engine functions and schemas are not modified.

## Technical Context

**Language/Version**: TypeScript 5+ strict, React 19  
**Primary Dependencies**: Zod (schema validation — existing), Vitest (tests — existing)  
**Storage**: `FiscalYearData = Map<number, PayslipData>` in React state + localStorage (no change)  
**Testing**: Vitest — `src/engine/calculator.test.ts` (existing pattern); new tests added here  
**Target Platform**: Browser (Vercel static deploy), mobile-first at 375px viewport  
**Project Type**: Client-side web application  
**Performance Goals**: Render hero section synchronously on every re-render — no async paths  
**Constraints**: Zero backend, zero new runtime dependencies, inline styles only, 375px no horizontal scroll  
**Scale/Scope**: Single-user, single fiscal year (2026). `FiscalYearData` has at most 12 entries.

## Constitution Check

*GATE: Must pass before implementation.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Zero Backend | ✅ PASS | All computation client-side. No new network calls. |
| II. Tax Math Authoritative | ✅ PASS | `calcularRecuperado` delegates to `calcularGap` (already verified). Labeled "est." in UI. |
| III. Test-First for Engine | ✅ PASS | Tests for `calcularRecuperado` and `detectarF572Events` written BEFORE implementation (T001). |
| IV. Spec-Driven | ✅ PASS | spec.md exists; this plan.md is the required artifact before tasks.md. |
| V. Simplicity — YAGNI | ⚠️ JUSTIFIED | `HeroStats.tsx` is a new abstraction. See Complexity Tracking below. |

## Project Structure

### Documentation (this feature)

```text
specs/010-dashboard-impacto-f572/
├── plan.md              ← this file
├── research.md          ← Phase 0 output (below)
├── data-model.md        ← Phase 1 output (below)
└── tasks.md             ← Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code

```text
src/
├── engine/
│   └── calculator.ts              ← ADD calcularRecuperado() (no other changes)
│   └── calculator.test.ts         ← ADD tests for calcularRecuperado + detectarF572Events (TDD, T001)
├── components/
│   ├── HeroStats.tsx              ← NEW component (T003)
│   ├── RetentionChart.tsx         ← EXTEND: add f572Events prop + annotation rendering (T004)
│   └── ComparacionSIRADIG.tsx     ← EDIT: rename 4 labels (P2, T007)
└── App.tsx                        ← EDIT: wire calcularRecuperado, detectarF572Events,
                                     HeroStats, updated TabResumen card visibility,
                                     button rename in MonthNav area (T005, T006, T007)
```

## Complexity Tracking

| Item | Why Needed | Simpler Alternative Rejected Because |
|------|------------|-------------------------------------|
| `HeroStats.tsx` new component | Three-card hero replaces two-card stat-grid. Distinct layout, badge logic, sublabel variants, and responsive 375px constraint. | Inlining in `App.tsx` would add 80+ lines of JSX to an already large file and make the badge/sublabel logic harder to test visually. Component boundary is justified by distinct responsibility and reuse isolation. |
| `detectarF572Events` as separate function | Must be called in `App.tsx` to pass `Set<string>` to `RetentionChart`. | Inlining in `RetentionChart` would require passing raw `FiscalYearData + F572Data` to the chart, breaking its existing clean `ChartPoint[]` API contract. |

---

## Phase 0: Research

### research.md

**Decision 1**: Location of `detectarF572Events`  
- **Decision**: Lives in `src/engine/calculator.ts` alongside `calcularRecuperado` (same input types, same detection logic, same test file).  
- **Rationale**: Both functions iterate `FiscalYearData` + `F572Data`. Co-locating them in the engine keeps the pure-function guarantee and makes them testable together.  
- **Alternative rejected**: Placing in `RetentionChart.tsx` would couple chart rendering to engine logic and prevent unit testing without a DOM.

**Decision 2**: `calcularRecuperado` estimation approach  
- **Decision**: `ahorro_estimado` of the last month M where `gap_M > 0` and `gap_{M+1} ≈ 0` (threshold: `gap_{M+1} < 1000`). Uses `tax_rate` of month M (not M+1).  
- **Rationale**: Pre-decided in spec.md. Approximation acceptable for v1. Real value in payslip can be higher (employer uses next-month rate and covers current-month deductions).  
- **Technical debt**: Label as "est." in UI. TODO in tasks.md to revisit when M+1 payslip tax_rate is accessible.

**Decision 3**: F.572 application detection thresholds  
- **Decision**: Gap cae de > $100.000 a < $1.000 between consecutive months M and M+1.  
- **Rationale**: $1.000 handles floating-point residuals. $100.000 minimum prior gap avoids false positives from minor rounding changes.  
- **Alternative rejected**: Also requiring > 20% retención drop (from original spec P1 FR-005). Dropped: a large salary increase in the same month could increase retención even as the gap is resolved. The gap transition alone is the cleaner signal.

**Decision 4**: Annotation rendering in `RetentionChart`  
- **Decision**: Render `<text>` SVG element above the bar in the existing SVG rendering loop. Existing `ChartPoint` type stays unchanged; chart receives `f572Events?: Set<string>` optional prop.  
- **Rationale**: No new chart library. Minimal diff on existing SVG rendering code. Optional prop means no breaking change.

**Decision 5**: `HeroStats` responsive layout  
- **Decision**: CSS `display: flex; flex-wrap: wrap; gap: 8px` inline style. Each card `flex: 1 1 80px; min-width: 80px`.  
- **Rationale**: Three cards in 375px = ~119px each including gaps. At narrowest, wrapping is safe. No CSS framework.

---

## Phase 1: Design & Contracts

### data-model.md

#### Existing types (unchanged)

```typescript
// src/storage/index.ts
type FiscalYearData = Map<number, PayslipData>  // key = meses (1–12)

// src/engine/schemas.ts — no changes
type PayslipData = { meses: number; retencion_acumulada: number; retencion_mes: number;
                     indumentaria_aplicada: number; cuota_medica_aplicada: number; ... }
type F572Data    = { conyuge: boolean; hijos: number;
                     cuota_medica: Record<string, number>; indumentaria: Record<string, number> }
type GapAnalysis = { total_gap: number; tax_rate: number; ahorro_estimado: number;
                     indumentaria_gap: number; cuota_medica_gap: number; ... }
```

#### New derived values (computed, not stored)

```typescript
// Computed in App.tsx, passed as props
recuperado: number     // calcularRecuperado(fiscalYear, f572) — $ already materialised
pendiente: number      // calcularGap(activePayslip, f572, activePayslip.meses).total_gap × tax_rate
f572Events: Set<string>  // detectarF572Events(fiscalYear, f572) — MES_ABBR labels e.g. {"Abr"}
```

#### New engine functions (src/engine/calculator.ts)

```typescript
// Returns the accumulated estimated savings already materialised via F.572 application.
// Iterates fiscal year months ascending. For each month M where gap_M.total_gap > 0
// and gap_{M+1}.total_gap < 1_000, adds gap_M.ahorro_estimado to the total.
export function calcularRecuperado(
  fiscalYear: FiscalYearData,
  f572: F572Data,
): number

// Returns the set of MES_ABBR labels (e.g. "Abr") for months where F.572 was applied.
// Detection: gap drops from > 100_000 to < 1_000 between consecutive months.
export function detectarF572Events(
  fiscalYear: FiscalYearData,
  f572: F572Data,
): Set<string>
```

#### New component contract (src/components/HeroStats.tsx)

```typescript
type HeroStatsProps = {
  retenido: number       // retencion_acumulada of active month
  recuperado: number     // from calcularRecuperado
  pendiente: number      // gap.ahorro_estimado of active month (0 = all credited)
  periodoLabel: string   // e.g. "Ene–Abr 2026"
}
export function HeroStats(props: HeroStatsProps): React.JSX.Element
```

#### Extended component contract (src/components/RetentionChart.tsx)

```typescript
// Existing ChartPoint stays unchanged
export function RetentionChart(props: {
  data: ChartPoint[]
  f572Events?: Set<string>   // NEW optional prop — no breaking change
}): React.JSX.Element | null
```

### contracts/

No external API contracts. App is entirely client-side; no public interface to document beyond component props (captured in data-model.md above).

### quickstart.md

**Prerequisites**: `node >= 20`, `npm install` already done.

**Run tests** (TDD — run before touching implementation):
```bash
npm test
```

**Run dev server** (verify UI after implementation):
```bash
npm run dev
# → open http://localhost:5173
# → click "Demo" to load Mar + Abr fixtures
# → verify: HeroStats shows Retenido / Recuperado (~$339K) / Pendiente ($0 / "todo acreditado ✓")
# → verify: chart shows "F.572 ✓" annotation on Abr bar
# → verify: F.572 history card visible with "Todo acreditado ✓" badge
# → verify: 375px viewport — no horizontal scroll
```

**Run typecheck**:
```bash
npm run build   # or npx tsc --noEmit if build script not present
```

**Test acceptance with real data** (Mar + Abr 2026 demo):
- `recuperado` ≈ $339.680 (±500)
- `pendiente` = $0 → sublabel "todo acreditado ✓"
- Chart bar "Abr" annotated with "F.572 ✓"
- F.572 history card shows "Todo acreditado ✓" badge
- 10-second UX test: person without tax knowledge can answer "¿cuánto recuperaste?" from main screen

---

## Agent Context

**Technologies added in this feature** (already in stack — no new additions):
- TypeScript strict + React 19 + Vitest + Zod — all pre-existing
- No new runtime dependencies

**Files to create**:
- `src/components/HeroStats.tsx`

**Files to modify**:
- `src/engine/calculator.ts` — add `calcularRecuperado`, `detectarF572Events`
- `src/engine/calculator.test.ts` — TDD tests (written first)
- `src/components/RetentionChart.tsx` — add `f572Events` prop + SVG annotation
- `src/components/ComparacionSIRADIG.tsx` — rename 4 labels (P2)
- `src/App.tsx` — wire new functions, replace stat-grid with `<HeroStats>`, fix card visibility, rename button (P2)

**Files NOT to touch**:
- `src/engine/schemas.ts`
- `src/components/DetalleCalculo.tsx`
- Existing `calcularGap`, `proyectarAbril`, `proyectarAnual`, `hasF572Data`, `calcularDiferencia`
