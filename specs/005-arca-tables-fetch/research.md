# Research: Fetch Automático de Tablas ARCA (spec 005)

## Endpoint Strategy

**Decision**: GitHub raw file in same repo (`public/arca-tables/latest.json`)  
**Rationale**: Zero infrastructure. Maintainer pushes updated JSON to main branch.
GitHub raw CDN serves it globally. Free. No API key needed.  
**Alternative considered**: Separate GitHub Gist — rejected (harder to version control,
no PR review workflow for table updates).

## Table Format

**Decision**: Flat JSON matching existing `TABLAS_2026_H1` TypeScript structure  
**Rationale**: Minimal translation layer. Validation mirrors the TypeScript `satisfies TaxBracket[]`
constraint we already use.

## Fetch Timing

**Decision**: Never silent auto-fetch. Check version on load (instant, localStorage). Show
banner if outdated. Fetch only on user action.  
**Rationale**: Auto-fetching could change calculation behavior mid-session without user
awareness. User must consciously apply a new table. Spec PR-001 principle II (Tax Math
Authoritative) requires traceability.

## Cache Storage

**Decision**: `localStorage` — 3 keys: `rc_arca_table`, `rc_arca_version`, `rc_arca_fetched_at`  
**Rationale**: Sufficient for this use case. IndexedDB would be overkill for a single JSON blob.
ARCA tables are ~2kB — well within localStorage limits.

## History (US3)

**Decision**: Store last 3 applied tables as `rc_arca_history` (array of `{ version, data, appliedAt }`)  
**Rationale**: Spec US3 requires last 3 versions. Array in localStorage capped at 3 entries.
When user applies update: push new to front, pop if length > 3.

## Validation Rules

From spec Assumptions + existing `TaxBracket` type:
1. `tramos.length === 10`
2. All `pct` in [0.05, 0.35]
3. `tramos[0].desde === 0`
4. `tramos[i].hasta === tramos[i+1].desde` (contiguous)
5. `tramos[i].desde < tramos[i+1].desde` (monotonic)
6. All `fijo >= 0`
7. Annual deduction values all > 0

Validation is a pure function — fully unit testable.

## Semester Detection

```
H1 = months 1-6 (January-June)
H2 = months 7-12 (July-December)
expected = `${year}-${month <= 6 ? 'H1' : 'H2'}`
```

If `activeVersion !== expected` → show outdated banner.
No cross-year detection needed in v1 (manual update covers it).
