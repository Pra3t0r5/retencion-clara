# Tasks: Modo Multimoneda

**Input**: Design documents from `/specs/006-multimoneda/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅

---

## Phase 1: Setup

- [ ] T001 Create `src/fx/types.ts`: define `RateType = "mep" | "bolsa" | "cable"`,
      `FXRates = { mep: number; bolsa: number; cable: number }`,
      `CachedFX = { rates: FXRates; fetchedAt: string }`,
      `FXContextValue` type (enabled, type, rates, stale, fetchedAt, toggle, setType, refresh)

---

## Phase 2: Foundational — Rate Fetch + Cache

- [ ] T002 Write tests for rate logic in `src/fx/rates.test.ts`:
      - `arsToUSD(1_220_273, 1300)` returns 939
      - `isStale(Date.now() - 7_200_001)` returns true
      - `isStale(Date.now() - 3_600_000)` returns false
      - cache round-trip: save then load returns correct values
- [ ] T003 Create `src/fx/rates.ts`:
      - `arsToUSD(ars: number, rate: number): number` — pure conversion
      - `isStale(fetchedAt: number): boolean` — >2h threshold
      - `fetchRates(): Promise<FXRates>` — calls Bluelytics API, maps to MEP/Bolsa/Cable
      - `getCachedRates(): CachedFX | null` — reads localStorage
      - `saveCachedRates(rates: FXRates): void` — writes localStorage with timestamp

**Checkpoint**: Rate fetch + cache tested.

---

## Phase 3: User Story 1 — USD Reference Values in Result Cards (Priority: P1) 🎯 MVP

**Goal**: When multimoneda enabled and rates fetched, every ARS amount shows USD equivalent.

**Independent Test**: Enable toggle with MEP rate 1350 → retención 1.220.273 shows "≈ USD 904"
below it. Disable toggle → USD lines disappear.

### Implementation

- [ ] T004 [US1] Create `src/fx/FXProvider.tsx`: React context provider wrapping `FXContextValue`
      — manages enabled state, selected type, cached rates, staleness; exposes toggle/setType/refresh
- [ ] T005 [US1] Wrap `<App />` in `<FXProvider>` in `src/main.tsx`
- [ ] T006 [US1] Create `src/components/USDAmount.tsx`:
      - reads `FXContext` via `useFX()` hook
      - renders nothing if `!enabled || !rates`
      - renders `≈ USD {arsToUSD(ars, activeRate)}` in muted secondary style
      - prop: `ars: number`
- [ ] T007 [US1] Add `<USDAmount ars={value} />` below each monetary display in Resumen
      section of `App.tsx`: retención, gap, proyección próximo mes, proyección anual
- [ ] T008 [US1] Add enable/disable toggle button to app header (`src/components/FXToggle.tsx`)
      — shows/hides USD amounts globally
- [ ] T009 [US1] Manual test: toggle on → USD amounts appear. Toggle off → disappear.
      Check retención calculation: ARS ÷ rate = correct USD.

**Checkpoint**: US1 — USD display working.

---

## Phase 4: User Story 2 — Rate Type Selector (Priority: P1)

**Goal**: User selects MEP / Bolsa / Cable; all USD amounts update instantly; preference persists.

**Independent Test**: Select Cable → all USD values update. Reload → Cable still selected.

### Implementation

- [ ] T010 [US2] Add rate type selector to `FXToggle.tsx` (3 buttons: MEP / Bolsa / Cable)
      — only visible when multimoneda enabled
      — calls `setType()` from context
- [ ] T011 [US2] Show all 3 current rate values in selector (e.g., "MEP $1.290 | Bolsa $1.265 | Cable $1.316")
      so user can compare
- [ ] T012 [US2] Persist selected `RateType` in localStorage — loaded by `FXProvider` on init
- [ ] T013 [US2] Manual test: switch between types → all USD values update instantly without
      new fetch. Reload app → previously selected type still active.

**Checkpoint**: US2 — rate selector working.

---

## Phase 5: User Story 3 — Rate Freshness Indicator (Priority: P2)

**Goal**: Rate timestamp shown; >2h rates flagged as stale; manual refresh available.

**Independent Test**: Wait 2h+ (or manually set stale timestamp in DevTools localStorage) →
"Cotización desactualizada" warning appears. Click refresh → rates updated → warning gone.

### Implementation

- [ ] T014 [US3] Show "Cotización al HH:MM" timestamp in `FXToggle.tsx` when rates loaded
- [ ] T015 [US3] Show "Cotización desactualizada" warning badge when `isStale(fetchedAt)` true
- [ ] T016 [US3] Add "Actualizar" button in `FXToggle.tsx` — calls `refresh()` from context,
      shows loading spinner, updates timestamp

**Checkpoint**: US3 — freshness indicator complete.

---

## Phase 6: Polish

- [ ] T017 [P] Run `bun test` — all existing + new FX tests pass
- [ ] T018 [P] Offline graceful: with no network and no cache → `rates === null` → no USD amounts
      shown (not zero/NaN) — verify in DevTools offline mode
- [ ] T019 [P] Verify toggle defaults to disabled: fresh localStorage → no USD amounts on load

---

## Dependencies

- T001 (types) → T002/T003 (rates logic) → T004/T005 (FXProvider) → T006-T008 (US1 UI)
- T010-T012 (US2) after FXProvider exists
- T014-T016 (US3) after FXToggle exists
- T002 tests before T003 implementation (TDD)
