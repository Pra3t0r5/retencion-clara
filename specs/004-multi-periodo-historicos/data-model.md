# Data Model: Multi-Período, Históricos y Gráficos

## Entities

### FiscalYearData (React state + localStorage)

In-memory representation — sparse, only months with loaded payslips present:

```typescript
type FiscalYearData = Map<number, PayslipData>; // key: month 1–12
```

### StorageAdapter (interface)

```typescript
interface StorageAdapter {
  loadYear(year: number): Promise<FiscalYearData>;
  saveMonth(year: number, month: number, data: PayslipData): Promise<void>;
  deleteMonth(year: number, month: number): Promise<void>;
}
```

Single implementation: `LocalStorageAdapter`.

### ChartPoint

```typescript
type ChartPoint = {
  month: string;    // "Ene", "Feb", ..., "Dic"
  retencion: number; // monthly retention in ARS
  acumulado: number; // cumulative YTD retention in ARS
};
```

Derived at render time from `FiscalYearData` by running the engine per month — not persisted.

## localStorage Schema

```json
{
  "rc_year_2026": {
    "3": { /* PayslipData for March */ },
    "4": { /* PayslipData for April */ }
  }
}
```

Key format: `rc_year_{YYYY}`. Integer month keys (1–12). Only current fiscal year in v1.

## State Transitions

```
App load
  → LocalStorageAdapter.loadYear(currentYear)
  → populate fiscalYear Map
  → if empty: show empty-state hint

User saves payslip for month M
  → saveMonth(year, M, data)  → update Map[M] = data
  → MonthNav re-renders with M highlighted

User clicks "+ Agregar mes"
  → activeMonth = null  → form resets for new month entry

User clicks month button in MonthNav
  → activeMonth = M
  → Resumen + DetalleCalculo display data for Map[M]

User clears/deletes month M
  → deleteMonth(year, M)  → remove Map[M]
  → if activeMonth === M: activeMonth = null
```

## Multi-Year Support

The `rc_year_{YYYY}` localStorage key format implicitly supports multiple fiscal years — each
year is a separate key with no schema migration required. In v1, only the current fiscal year
(2026) is written or read. Year-over-year comparison (US4) can be added in a future spec by
reading multiple `rc_year_*` keys without any breaking change to the existing schema.
