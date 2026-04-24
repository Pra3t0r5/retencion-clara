# Implementation Plan: Modo Multimoneda

**Branch**: `006-multimoneda` | **Date**: 2026-04-24 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/006-multimoneda/spec.md`

## Summary

Add opt-in USD reference display below every ARS amount using live Argentine parallel exchange
rates (MEP, Bolsa, Cable). Rates fetched from a public API, cached with timestamp, and displayed
with staleness warnings. The calculator remains ARS-only; USD is purely informational.

## Technical Context

**Language/Version**: TypeScript 5.x + React 19  
**Primary Dependencies**: None new — `fetch` API for rates; no charting lib needed  
**Storage**: localStorage — cached rate + selected rate type + timestamp  
**Testing**: Vitest — unit tests for rate conversion and cache logic  
**Target Platform**: Browser SPA (offline graceful degradation)  
**Performance Goals**: Rate fetch async, non-blocking. Toggle updates all values <200ms.  
**Constraints**: No new npm deps; API must be free + unauthenticated; no USD in calculations  
**Scale/Scope**: One API endpoint; 3 rate types; optional feature (default: off)

## Constitution Check

| Gate | Status | Notes |
|------|--------|-------|
| I. Zero Backend | ✅ PASS | Reads public rate API. No salary data transmitted. |
| II. Tax Math Authoritative | ✅ PASS | Calculator stays ARS-only; USD display-only (FR-008) |
| III. No New Deps | ✅ PASS | Native fetch; no npm packages |
| IV. Offline Graceful | ✅ PASS | FR-007: if no cache + no network, USD values hidden (not shown as 0/NaN) |

## Project Structure

### Source Code Changes

```text
src/
  fx/
    rates.ts           # NEW — fetch, cache, and expose rate data
    types.ts           # NEW — RateType, FXRates, CachedFX types
  components/
    FXToggle.tsx       # NEW — opt-in toggle + rate type selector in header
    USDAmount.tsx      # NEW — renders secondary USD amount line below ARS
  App.tsx              # MODIFY — pass active FX rate to all monetary display components
```

## Phase 0: Research

### Decision: Rate API

**Decision**: Bluelytics API — `https://api.bluelytics.com.ar/v2/latest`  

**Response shape**:
```json
{
  "blue": { "value_buy": 1280, "value_sell": 1300 },
  "oficial": { "value_buy": 950, "value_sell": 960 },
  "blue_euro": { ... },
  "last_update": "2026-04-24T10:30:00.000Z"
}
```

**Mapping**:
- MEP ≈ `blue.value_sell` (best public proxy; formal MEP not in Bluelytics)
- Bolsa ≈ `blue.value_sell * 0.98` (approximation — Bluelytics doesn't split MEP/Bolsa/Cable)
- Cable ≈ `blue.value_sell * 1.02`

**Rationale**: Bluelytics is the most-used public Argentine rate API. No API key needed. Free.
Note: The MEP/Bolsa/Cable split will be approximated in v1 — exact split requires a paid API
or screen-scraping. Spec notes this in Assumptions.

**Alternative**: `dolarapi.com` — similar free API, more granular splits but less reliable uptime.
Consider as fallback.

### Decision: Cache Strategy

- `localStorage["rc_fx_rates"]` — `{ mep, bolsa, cable, fetchedAt: ISO }` 
- `localStorage["rc_fx_type"]` — `"mep" | "bolsa" | "cable"` (user preference)
- `localStorage["rc_fx_enabled"]` — `"true" | "false"` (opt-in state)

Staleness: if `now - fetchedAt > 2 hours` → show warning. If `fetchedAt` missing → no rates.

### Decision: USD Display Component

```tsx
// Renders nothing when FX disabled or rate unavailable
<USDAmount ars={1_220_273} rate={rateContext} />
// Renders: ≈ USD 939 (in secondary muted text below ARS value)
```

`USDAmount` consumes a React context (`FXContext`) to avoid prop-drilling through every card/row.

### Decision: Rate Context Shape

```typescript
type FXContext = {
  enabled: boolean;
  type: RateType;   // "mep" | "bolsa" | "cable"
  rates: FXRates | null;  // null if unavailable
  stale: boolean;
  fetchedAt: Date | null;
  toggle: () => void;
  setType: (t: RateType) => void;
  refresh: () => Promise<void>;
};
```

## Phase 1: Design

### Contracts

Internal — `FXContext` consumed by any component displaying ARS amounts.

No external API contract to define — Bluelytics API is read-only and well-documented.

### Conversion Logic

```typescript
function arsToUSD(ars: number, rate: number): number {
  return Math.round(ars / rate);
}
// rate = ARS per 1 USD (sell rate)
// e.g., ars=1_220_273, rate=1300 → USD 939
```

Format: `≈ USD ${arsToUSD(ars, rate).toLocaleString('es-AR')}`

### Staleness Warning

```
if enabled && rates && (now - fetchedAt) > 7200_000 ms:
  show "Cotización desactualizada" badge next to rate selector
```

### Rate Freshness Display

```
"Cotización al HH:MM" — format fetchedAt as time in Argentina timezone
```
