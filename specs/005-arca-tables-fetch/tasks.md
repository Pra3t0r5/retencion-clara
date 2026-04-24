# Tasks: Fetch Automático de Tablas ARCA

**Input**: Design documents from `/specs/005-arca-tables-fetch/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅

---

## Phase 1: Setup

- [ ] T001 Create `public/arca-tables/latest.json` — copy current H1 data from
      `src/tablas/2026-H1.ts` into versioned JSON format per plan.md schema
- [ ] T002 Create `src/tablas/types.ts`: define `ARCATableJSON` type (matches JSON schema),
      `ARCATable` type (internal runtime form), `CachedTableMeta` type

---

## Phase 2: Foundational — Validation + Version Detection

**⚠️ CRITICAL**: Validation and version logic needed by all stories.

- [ ] T003 Write tests FIRST in `src/tablas/validator.test.ts`:
      - valid table passes validation
      - table with 9 tramos fails
      - non-contiguous brackets fail
      - negative fijo fails
      - zero gni_anual fails
      - pct out of range fails
- [ ] T004 Create `src/tablas/validator.ts`: `validateARCATable(json: unknown): ARCATableJSON`
      — throws `ValidationError` with message if any rule fails; returns typed object if valid
- [ ] T005 Write tests for version detection in `src/tablas/fetcher.test.ts`:
      - month 3 → expected "2026-H1"
      - month 8 → expected "2026-H2"
      - active = expected → not outdated
      - active ≠ expected → outdated
- [ ] T006 Create `src/tablas/fetcher.ts`: implement
      - `getExpectedVersion(date: Date): string` — pure, unit-testable
      - `getActiveTable(): ARCATable` — reads localStorage or falls back to bundled
      - `checkForUpdate(): { outdated: boolean; expectedVersion: string; activeVersion: string }`
      - `fetchAndApply(url?: string): Promise<FetchResult>` — fetch → validate → cache → apply

**Checkpoint**: Core fetch + validation logic tested and working.

---

## Phase 3: User Story 1 — Auto-Detect Outdated Table (Priority: P1) 🎯 MVP

**Goal**: Banner shown when active table doesn't match expected semester.

**Independent Test**: With active version "2026-H1" and date in August → banner visible.
Click "Actualizar" → new table fetched → banner disappears → calculator uses new table.

### Implementation

- [ ] T007 [US1] Create `src/components/TableVersionBanner.tsx`:
      - shows when `checkForUpdate().outdated === true`
      - displays expected vs active version
      - "Actualizar" button triggers `fetchAndApply()` with loading/error state
      - "Sin conexión" variant when `navigator.onLine === false`
      - dismissible (hides for session but doesn't mark as resolved)
- [ ] T008 [US1] Wire `TableVersionBanner` into `App.tsx` — check on mount via
      `useEffect`, pass result to banner component
- [ ] T009 [US1] Update `App.tsx` to use `getActiveTable()` from `fetcher.ts` instead of
      direct import of `TABLAS_2026_H1` — engine receives dynamic table
- [ ] T010 [US1] Manual test: temporarily set `localStorage["rc_arca_version"] = "2025-H2"`
      → banner appears → click Actualizar → fetches from GitHub raw → validates →
      banner disappears → active version updated

**Checkpoint**: US1 complete — auto-detection and one-click update working.

---

## Phase 4: User Story 2 — Manual Table Update from Settings (Priority: P1)

**Goal**: Settings panel with "Verificar tablas ARCA" and optional custom URL.

**Independent Test**: Settings → click "Verificar" → shows current vs available version →
confirm → update applied. Custom URL field → enter URL → fetch from custom endpoint.

### Implementation

- [ ] T011 [US2] Create `src/components/SettingsPanel.tsx` (or add to existing Settings if it
      exists): section "Tablas ARCA" showing:
      - Active version label (e.g., "H1 2026")
      - "Verificar ahora" button → calls `fetchAndApply()` → shows result
      - Custom URL text input (stored in localStorage as `rc_arca_custom_url`)
      - "Restaurar bundled" button → clears cache → reverts to built-in table
- [ ] T012 [US2] Add Settings link/button to app header → opens `SettingsPanel`
- [ ] T013 [US2] Manual test: enter custom URL pointing to a local test JSON → table fetches
      and validates correctly

**Checkpoint**: US2 complete — manual update + custom URL working.

---

## Phase 5: User Story 3 — Table Version History (Priority: P2)

**Goal**: Last 3 applied tables stored; user can switch back to a previous version.

**Independent Test**: Apply H1 → apply H2 → Settings → History shows H1 and H2 →
select H1 → calculator uses H1 brackets.

### Implementation

- [ ] T014 [US3] Update `fetchAndApply()` in `fetcher.ts` to push to history:
      `rc_arca_history` localStorage array capped at 3 entries
- [ ] T015 [US3] Add `switchToVersion(meta: CachedTableMeta): void` function to `fetcher.ts` —
      loads cached table by version and sets it as active
- [ ] T016 [US3] Add version history list to `SettingsPanel.tsx` — shows last 3 versions
      with timestamps, each with "Usar esta versión" button

**Checkpoint**: All 3 user stories complete.

---

## Phase 6: Polish

- [ ] T017 [P] Show active ARCA version in app footer: "Tablas H1 2026 activas"
- [ ] T018 [P] Run `bun test` — all existing tests pass + new validation/version tests pass
- [ ] T019 Manual offline test: disable network → app loads → uses cached table → no errors

---

## Dependencies

- Phase 1 (types) → Phase 2 (validator + fetcher) → Phase 3 (banner + app wiring)
- Phase 4 (Settings) depends on Phase 3 (fetcher must exist)
- Phase 5 (history) depends on Phase 4 (settings panel exists)
- T003 (tests) before T004 (implementation) — TDD for validator
- T005 (tests) before T006 (implementation) — TDD for version detection
