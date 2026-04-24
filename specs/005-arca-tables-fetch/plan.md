# Implementation Plan: Fetch Automático de Tablas ARCA

**Branch**: `005-arca-tables-fetch` | **Date**: 2026-04-24 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/005-arca-tables-fetch/spec.md`

## Summary

Add a mechanism to detect when ARCA has published a new semester table (H1/H2), fetch and
validate the new data from a maintainer-managed JSON endpoint, cache it locally, and switch
the calculator to use it — all without requiring a new app deployment.

## Technical Context

**Language/Version**: TypeScript 5.x + React 19  
**Primary Dependencies**: None new — `fetch` API + `localStorage` for cache  
**Storage**: localStorage (cached table) + IndexedDB considered but localStorage sufficient  
**Testing**: Vitest — unit tests for table validation logic and version detection  
**Target Platform**: Browser SPA (offline-capable; bundled table is always fallback)  
**Performance Goals**: Fetch timeout 5s; outdated detection within 1s of app load  
**Constraints**: No new npm deps; bundled 2026-H1 table must always work as fallback  
**Scale/Scope**: Single JSON endpoint (GitHub raw or equivalent); parse + validate

## Constitution Check

| Gate | Status | Notes |
|------|--------|-------|
| I. Zero Backend | ✅ PASS | Fetch is from public read-only JSON endpoint; no salary data transmitted |
| II. Tax Math Authoritative | ✅ PASS | Validation gates (10 tramos, monotonic brackets) prevent malformed tables |
| III. Test-First for Engine | ✅ PASS | Validation function gets unit tests before implementation |
| IV. No New Deps | ✅ PASS | Native `fetch` + localStorage only |
| V. Bundled Fallback | ✅ PASS | FR-005: existing `2026-H1.ts` remains bundled fallback |

## Project Structure

### Documentation (this feature)

```text
specs/005-arca-tables-fetch/
├── plan.md
├── research.md
├── tasks.md
└── checklists/
```

### Source Code Changes

```text
src/
  tablas/
    2026-H1.ts         # EXISTING — bundled fallback (unchanged)
    fetcher.ts         # NEW — fetch + parse + validate + cache
    validator.ts       # NEW — validateARCATable() pure function
    types.ts           # NEW — ARCATableJSON type definition
  components/
    TableVersionBanner.tsx  # NEW — outdated table banner + update button
  App.tsx              # MODIFY — on mount: check table version, show banner if needed
```

## Phase 0: Research

### Decision: JSON Schema for ARCA Table

**Decision**: Versioned JSON with metadata + tramos array.

```json
{
  "version": "2026-H1",
  "semestre": "H1",
  "year": 2026,
  "published": "2026-01-15",
  "tramos": [
    { "desde": 0, "hasta": 843762.69, "fijo": 0, "pct": 0.05 },
    ...
  ],
  "gni_anual": 5151802.50,
  "gni_mensual": 429317.08,
  "ded_especial_anual": 24728652.00,
  "ded_especial_mensual": 2060721.00,
  "ded_conyuge_anual": 4851964.66,
  "ded_hijo_anual": 2446863.48
}
```

Validation rules (from spec Assumptions):
- `tramos.length === 10`
- `pct` values: first = 0.05, last = 0.35, all between 0.05 and 0.35
- `desde` values monotonically increasing, starting at 0
- `hasta[i] === desde[i+1]` (contiguous brackets)
- All `fijo` values ≥ 0
- `gni_anual`, `ded_especial_anual`, `ded_conyuge_anual`, `ded_hijo_anual` all > 0

### Decision: Endpoint URL

**Decision**: GitHub raw file — `https://raw.githubusercontent.com/{owner}/retencion-clara/main/public/arca-tables/latest.json`

**Rationale**: Zero infrastructure cost. Maintainer (project author) updates the JSON file when
ARCA publishes. No server needed.

**Fallback URL config**: `VITE_ARCA_TABLE_URL` env var overrides default (spec FR-007).

### Decision: Version Detection Algorithm

```
current semester = today.month <= 6 ? "H1" : "H2"
current year = today.year
expected version = `${current year}-${current semester}`
active version = localStorage["rc_arca_version"] ?? bundled version ("2026-H1")
if expected version !== active version → show outdated banner
```

**Edge case**: No automatic cross-year detection (e.g., 2027-H1). Manual update from Settings
covers this (US2). Date rule only triggers banner, user confirms update.

### Decision: Cache Strategy

- Cached table: `localStorage["rc_arca_table"]` — serialized JSON
- Cached version: `localStorage["rc_arca_version"]` — e.g., "2026-H1"
- Cached timestamp: `localStorage["rc_arca_fetched_at"]` — ISO string

On app load: check version (instant). If outdated + online: show banner. Fetch only happens
when user clicks "Actualizar" or manually triggers from Settings. Never auto-fetches silently.

## Phase 1: Design

### Contracts

Internal interface for the active table:

```typescript
interface TableLoader {
  getActiveTable(): ARCATable; // current table (bundled or cached)
  checkForUpdate(): { outdated: boolean; expectedVersion: string };
  fetchAndApply(url?: string): Promise<{ success: boolean; version: string; error?: string }>;
  listCached(): CachedTableMeta[]; // for US3 history
}
```

### Test Scenarios (quickstart)

1. **Fresh install, H1 season**: App loads Jan 15 → no banner (H1 expected, H1 bundled active)
2. **H2 season**: App loads Aug 1 → banner "H2 2026 disponibles" → click "Actualizar" →
   fetch validates → calculator reloads with new table → banner disappears
3. **Offline + outdated**: App loads Aug 1 with no connection → banner shown with "Sin conexión"
   note → "Actualizar" button disabled or shows offline warning
4. **Invalid JSON from endpoint**: Fetch returns malformed table → validation fails → error shown →
   bundled fallback continues to be used → no crash
5. **Custom endpoint (FR-007)**: Settings → custom URL entered → fetch from custom URL →
   same validation applied
