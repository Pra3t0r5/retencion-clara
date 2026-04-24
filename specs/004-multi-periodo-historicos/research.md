# Research: Multi-Período, Históricos y Gráficos (spec 004)

## Auth Backend

**Decision**: Supabase Auth (email + password)  
**Rationale**: Single dependency for both auth and storage. Free tier sufficient.
httpOnly cookie sessions via `@supabase/ssr`. RLS provides user data isolation.  
**Alternatives**: Clerk (better DX, extra service), Firebase Auth (Google vendor lock-in).

## Chart Library

**Decision**: Recharts ~46kB gzip  
**Rationale**: React-native JSX API, responsive out of the box, within 50kB spec limit.
`<BarChart>` + `<ResponsiveContainer>` covers all chart requirements.  
**Bundle impact**: ~46kB gzip added to JS bundle. Acceptable — chart is on a tab, code-splittable.

## Session Token Storage

**Decision**: httpOnly cookies via `@supabase/ssr`  
**Rationale**: NFR security requirement. Prevents XSS token theft. Supabase SSR package
handles cookie management in browser-only mode (no SSR needed for this SPA).

## Guest vs Auth Storage

**Decision**: Storage router pattern with `StorageAdapter` interface  
**Rationale**: Keeps App.tsx and engine pure — no auth knowledge leaks into business logic.
Guest users get localStorage; authenticated users get Supabase. Same API.

## Multi-Month State

**Decision**: `Map<number, PayslipData>` keyed by month number (1-12)  
**Rationale**: Sparse — user may have Jan, Mar, Jul without Feb, Apr-Jun. Map naturally
represents sparse data. React state: `useState<Map<number, PayslipData>>(new Map())`.

## Conflict Resolution

**Decision**: Last-write-wins per month (as per FR-008)  
**Rationale**: In-family app with one primary user per device. No collaborative editing.
Supabase `upsert` with `onConflict: 'user_id,year,month'` implements this automatically.

## Chart Data Derivation

Recharts data array derived from stored months + engine calculations:

```typescript
const chartData = Array.from(fiscalYear.entries())
  .sort(([a], [b]) => a - b)
  .map(([month, payslip]) => ({
    month: MONTH_NAMES[month],
    retencion: calcularRetención(payslip, /* ... */),
    acumulado: /* cumulative sum */
  }));
```

This derivation is pure (engine function) — no new backend calls.
