# Implementation Plan: Multi-Período, Históricos y Gráficos

**Branch**: `004-multi-periodo-historicos` | **Date**: 2026-04-24 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-multi-periodo-historicos/spec.md`

## Summary

Allow users to store payslip data for multiple months of the same fiscal year, visualize
cumulative retention as a chart, and log in with email + password so data persists across
sessions. Introduces the first server-side component (auth + data storage).

## Technical Context

**Language/Version**: TypeScript 5.x + React 19 (frontend); Node.js backend via Supabase  
**Primary Dependencies**: Supabase (Auth + Postgres + RLS), Recharts (chart, <50kB gz)  
**Storage**: Supabase Postgres (server) + localStorage (guest fallback)  
**Testing**: Vitest 4.x — engine tests unchanged; new integration tests for storage layer  
**Target Platform**: Browser SPA + Supabase hosted backend  
**Project Type**: SPA with BaaS (Backend as a Service)  
**Performance Goals**: Chart renders <500ms on mobile with 12 data points; login <3s  
**Constraints**: Auth tokens in httpOnly cookies (not localStorage); salary data encrypted at rest  
**Scale/Scope**: In-family app, single fiscal year in v1

## Constitution Check

| Gate | Status | Notes |
|------|--------|-------|
| I. Zero Backend | ⚠️ PARTIAL | Auth + persistence requires backend; **salary data encrypted at rest** (Supabase RLS). This spec is the planned relaxation of the pure client-side constraint. Guest mode preserves zero-backend path. |
| II. Tax Math Authoritative | ✅ PASS | Engine unchanged — multi-period adds persistence, not calculation logic |
| III. Test-First for Engine | ✅ PASS | Engine tests unchanged; new storage layer tests added |
| IV. Lightweight Deps | ✅ PASS | Supabase JS SDK + Recharts both reasonable; Recharts <50kB gz |
| V. Guest Mode | ✅ PASS | FR-005 requires guest mode to work identically to current app |

**Rationale for Gate I partial**: Spec 004 explicitly introduces auth. Constitution principle I is
written for the calculator engine. The guest path continues to satisfy it fully. The authenticated
path encrypts salary data at rest per NFR.

## Project Structure

### Documentation (this feature)

```text
specs/004-multi-periodo-historicos/
├── plan.md          # This file
├── research.md      # Library choices: Supabase, Recharts
├── data-model.md    # PayslipEntry, UserProfile
├── tasks.md         # /speckit.tasks output
└── checklists/
```

### Source Code Changes

```text
src/
  auth/
    supabase.ts      # NEW — Supabase client initialization
    AuthProvider.tsx # NEW — React context for auth state
    LoginModal.tsx   # NEW — email+password login form
  storage/
    local.ts         # NEW — localStorage guest storage
    remote.ts        # NEW — Supabase CRUD for PayslipEntry
    index.ts         # NEW — router: authenticated→remote, guest→local
  components/
    MonthNav.tsx     # NEW — month selector/navigator
    RetentionChart.tsx # NEW — Recharts bar chart
  App.tsx            # MODIFY — multi-month state, auth context, month navigator
```

## Phase 0: Research

### Decision: Auth Backend — Supabase vs Clerk

**Decision**: Supabase Auth (email+password)  
**Rationale**:
- Already planned for storage (Postgres + RLS)
- Single SDK for auth + storage
- Free tier generous for in-family app
- httpOnly cookie sessions via `@supabase/ssr`

**Clerk considered**: Better DX but adds a second external service. Rejected.

### Decision: Chart Library — Recharts vs Chart.js vs Visx

**Decision**: Recharts  
**Rationale**:
- React-native API (JSX components, not canvas direct)
- ~46kB gzip (within <50kB spec constraint)
- No D3 knowledge required
- Responsive by default via `ResponsiveContainer`

**Chart.js considered**: Non-React API, requires imperative setup. Rejected.  
**Visx considered**: Powerful but D3-based, steeper learning curve. Over-engineered for 1-2 charts.

### Decision: Session Storage — httpOnly Cookies

**Decision**: Supabase `@supabase/ssr` package manages session tokens in httpOnly cookies  
**Rationale**: NFR requires httpOnly cookies to prevent XSS token theft. `@supabase/ssr` handles
this automatically when configured correctly for SPA (client-side only, no SSR needed).

### Decision: Guest vs Authenticated Storage

**Decision**: Storage router pattern — same `savePayslip(month, data)` interface, different
implementations:
- Guest: `localStorage.setItem('payslips', JSON.stringify(...))`
- Authenticated: `supabase.from('payslips').upsert(...)`

This keeps App.tsx agnostic to the storage backend.

### Decision: Multi-Month State Shape

```typescript
type FiscalYearData = {
  [month: number]: PayslipData; // 1=January, 12=December
};
```

Session state holds one fiscal year. Month navigator selects the active month for display.
Calculator engine receives the full year array and current month index (already supports this).

## Phase 1: Design

### Data Model

See `data-model.md`.

**Entities**:
- `PayslipEntry`: `{ user_id, year, month, data: PayslipData (encrypted JSON) }`
- `UserProfile`: managed by Supabase Auth (email, id)

### Supabase Schema

```sql
-- payslips table
CREATE TABLE payslips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  year INT NOT NULL,
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  data JSONB NOT NULL, -- encrypted on client in spec 007; plaintext in spec 004
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, year, month)
);

-- Row Level Security
ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their payslips"
  ON payslips FOR ALL
  USING (auth.uid() = user_id);
```

### Contracts

No external API — Supabase JS SDK abstracts the REST/realtime layer. The storage interface
contract is internal:

```typescript
interface StorageAdapter {
  loadYear(year: number): Promise<FiscalYearData>;
  saveMonth(year: number, month: number, data: PayslipData): Promise<void>;
  deleteMonth(year: number, month: number): Promise<void>;
}
```
