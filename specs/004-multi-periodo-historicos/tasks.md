# Tasks: Multi-Período, Históricos y Gráficos

**Input**: Design documents from `/specs/004-multi-periodo-historicos/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅

**Note on tests**: Engine tests continue unchanged. New tests cover StorageAdapter implementations
and auth context behavior. Chart rendering tested manually (browser).

---

## Phase 1: Setup

- [ ] T001 Install dependencies: `bun add @supabase/supabase-js @supabase/ssr recharts`
- [ ] T002 Create Supabase project (free tier) and run migration SQL from data-model.md
      — creates `payslips` table with RLS policy
- [ ] T003 Add env vars to `.env.local`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- [ ] T004 Create `src/auth/supabase.ts`: initialize Supabase client with `createClient()`,
      export as singleton

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: Auth context and storage interface must exist before any story implementation.

- [ ] T005 Create `src/storage/index.ts`: define `StorageAdapter` interface
      (`loadYear`, `saveMonth`, `deleteMonth`)
- [ ] T006 Create `src/storage/local.ts`: `LocalStorageAdapter` implementing `StorageAdapter`
      — localStorage key pattern `rc_year_{YYYY}`, JSON serialization
- [ ] T007 Create `src/storage/remote.ts`: `SupabaseAdapter` implementing `StorageAdapter`
      — wraps Supabase JS SDK `payslips` table CRUD with `upsert` for conflict resolution
- [ ] T008 Create `src/auth/AuthProvider.tsx`: React context providing `AuthState`
      (`user`, `loading`, `signIn`, `signOut`) — wraps Supabase `onAuthStateChange` listener
- [ ] T009 Wrap `<App />` in `<AuthProvider>` in `src/main.tsx`
- [ ] T010 Write tests for `LocalStorageAdapter` in `src/storage/local.test.ts`:
      - `saveMonth` persists data under correct key
      - `loadYear` returns correct Map
      - `deleteMonth` removes entry
- [ ] T011 Write tests for auth context initial state in `src/auth/AuthProvider.test.tsx`:
      - initial `user` is null, `loading` true then false

**Checkpoint**: Storage layer and auth context ready.

---

## Phase 3: User Story 1 — Load Multiple Months (Priority: P1) 🎯 MVP

**Goal**: User adds payslips for multiple months; navigator lets them switch between months.

**Independent Test**: Load January + March payslips → month selector shows both → switching
between months shows correct data for each.

### Implementation

- [ ] T012 [US1] Refactor `App.tsx` state: replace single `payslip` state with
      `fiscalYear: FiscalYearData` (Map) + `activeMonth: number | null`
- [ ] T013 [US1] Add `StorageAdapter` usage in `App.tsx`:
      - on mount: load current year via adapter
      - on payslip save: `adapter.saveMonth(year, month, data)` then update Map
      - on clear: `adapter.deleteMonth(year, month)`
- [ ] T014 [US1] Create `src/components/MonthNav.tsx`:
      - displays loaded months as buttons (e.g., "Ene", "Mar", "Abr")
      - active month highlighted
      - "+ Agregar mes" button resets form for new month entry
- [ ] T015 [US1] Wire `MonthNav` into `App.tsx` — show above tabs; switching month updates
      `activeMonth` which drives Resumen/DetalleCalculo display
- [ ] T016 [US1] Manual test: add January data → add March data → switch months → correct
      values displayed for each

**Checkpoint**: Multi-month loading and navigation works for guest users.

---

## Phase 4: User Story 3 — Authentication (Priority: P1)

**Goal**: Email + password login. Authenticated users get persistent data across sessions.
Guest mode unchanged.

**Independent Test**: Log in → add month → close browser → reopen → data still there.
Log out → as guest, no data from authenticated session visible.

### Implementation

- [ ] T017 [US3] Create `src/auth/LoginModal.tsx`:
      - email + password form fields
      - calls `signIn(email, password)` from auth context
      - shows error on wrong credentials
      - "Continuar como invitado" link closes modal without login
- [ ] T018 [US3] Show `LoginModal` on app load if user is guest AND has no local data
      — if guest has local data, don't force login (FR-005 compliance)
- [ ] T019 [US3] On successful sign-in: switch `App.tsx` to `SupabaseAdapter`, reload year
      data from Supabase, migrate any localStorage data
- [ ] T020 [US3] On sign-out: switch back to `LocalStorageAdapter`, clear in-memory Map
- [ ] T021 [US3] Add "Cerrar sesión" button in app header (visible when authenticated)
- [ ] T022 [US3] Manual test: register → add months → log out → log in → months restored.
      Two different accounts → no data cross-contamination (check Supabase RLS).

**Checkpoint**: Auth + persistent storage working.

---

## Phase 5: User Story 2 — Progression Chart (Priority: P1)

**Goal**: Bar chart shows monthly retention and cumulative retention for all loaded months.

**Independent Test**: Load Jan ($800K) + Mar ($1.220K) → chart shows 2 bars with correct
values and upward trend.

### Implementation

- [ ] T023 [US2] Create `src/components/RetentionChart.tsx`:
      - `<ResponsiveContainer>` wrapping `<BarChart>` from Recharts
      - `chartData`: derived from `FiscalYearData` by running engine per month
      - Two series: monthly retention + cumulative
      - Spanish axis labels, ARS formatted values
      - Graceful single-point state: message "Agregá más meses para ver la progresión"
- [ ] T024 [US2] Add `RetentionChart` to Resumen tab/panel in `App.tsx` — below existing
      summary cards
- [ ] T025 [US2] Manual test: load 3 months → chart renders with 3 bars → correct values
      → readable at 375px width

**Checkpoint**: Chart visible and correct.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T026 [P] Run `bun test` — all existing 28 + new storage/auth tests pass
- [ ] T027 [P] Verify guest mode: fresh browser session with no login → full calculator
      works → no Supabase calls in Network tab
- [ ] T028 Add 7-day session persistence check — Supabase handles this automatically;
      verify by testing `supabase.auth.getSession()` on fresh page load

---

## Dependencies & Execution Order

- **Phase 1 (Setup)**: Must complete before any Supabase usage
- **Phase 2 (Foundational)**: Blocks all stories — storage interface + auth context
- **Phase 3 (US1)**: After Phase 2; guest-only multi-month works without Phase 4
- **Phase 4 (US3)**: After Phase 2; auth is prerequisite for Supabase storage
- **Phase 5 (US2)**: After Phase 3 (needs `FiscalYearData` to exist for chart derivation)
- **Phase 6 (Polish)**: After all stories

## Implementation Strategy

**MVP**: Phase 1 + 2 + 3 delivers multi-month for guest users. No auth required.
Add auth (Phase 4) for persistence. Add chart (Phase 5) for visualization.

**Key risk**: Supabase setup (T001–T004) requires external account creation. Block on this first.
