# Research: Multi-Período, Históricos y Gráficos (spec 004)

**Scope**: Constitution-compliant descope — US1 (multi-month load + nav) + US2 (chart) only.
US3 (auth + Supabase) dropped — violates Constitution Principle I (NON-NEGOTIABLE).

## Chart Approach

**Decision**: Inline SVG (no library)
**Rationale**: Max 12 data points per fiscal year. SVG is browser-native, costs zero bundle bytes,
works offline, and styled with inline styles per project convention (Principle V YAGNI). A 46kB
Recharts dependency is not justified for 12 static bars.
**Alternatives**: Recharts (rejected — unnecessary dep), Chart.js (rejected — larger, imperative API).

## Multi-Month State

**Decision**: `Map<number, PayslipData>` keyed by month number (1–12)
**Rationale**: Sparse — user may have Jan, Mar, Jul without Feb, Apr–Jun. Map naturally represents
sparse data. React state: `useState<Map<number, PayslipData>>(new Map())`.

## Persistence

**Decision**: localStorage, key `rc_year_{YYYY}`
**Rationale**: Constitution Principle I prohibits server storage. localStorage provides cross-session
persistence on same device with zero backend dependency. Data never leaves the browser.
**Limitation**: No cross-device sync. Acceptable — privacy-first, single-user tool.

## StorageAdapter Interface

Thin interface kept for testability even with one implementation. Decouples App.tsx from
`window.localStorage` calls directly and trivializes future implementations if needed.

## Chart Data Derivation

Pure computation from `FiscalYearData` + engine — no new engine API required:

```typescript
const chartData = Array.from(fiscalYear.entries())
  .sort(([a], [b]) => a - b)
  .map(([month, payslip]) => ({
    month: MONTH_NAMES[month - 1],  // "Ene", "Feb", ...
    retencion: /* engine output for this month */,
    acumulado: /* cumulative sum up to this month */,
  }));
```
