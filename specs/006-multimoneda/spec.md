# Feature Specification: Modo Multimoneda

**Feature Branch**: `feature/006-multimoneda`
**Created**: 2026-04-24
**Status**: Draft

## Overview

Display all peso amounts alongside their USD equivalents using real-time Argentine parallel
exchange rates (MEP, Bolsa, Cable). This is a read-only reference feature — the calculator
always operates in ARS. The USD values are informational, helping users contextualise their
retention amount in a more stable unit.

---

## User Scenarios & Testing

### User Story 1 — USD Reference Values in Result Cards (Priority: P1)

Below each ARS amount in the Resumen tab, a small secondary line shows the equivalent in
USD MEP (default). User can toggle which rate type is displayed globally.

**Why this priority**: For Argentines, understanding a monthly retention of $1.2M ARS is
easier when they can see "≈ USD 900" next to it. This is the primary user insight.

**Independent Test**: Enable multimoneda with MEP rate of $1,350 → retención $1.220.273
shows "≈ USD 904" below it.

**Acceptance Scenarios**:
1. **Given** multimoneda enabled and MEP rate fetched, **When** Resumen renders, **Then**
   each monetary value shows ARS amount + USD equivalent in smaller text below
2. **Given** user changes rate type from MEP to Cable, **When** toggle applied, **Then**
   all USD equivalents update immediately using the new rate
3. **Given** rate fetch fails or app is offline, **When** multimoneda enabled, **Then**
   last cached rate used with a "Cotización desactualizada" label; if no cache, USD values
   hidden gracefully

---

### User Story 2 — Rate Type Selector (Priority: P1)

A small toggle in the app header or settings lets the user choose between MEP, Bolsa, and
Cable rates. The selected rate persists across sessions.

**Why this priority**: Different users prefer different reference rates. MEP is most common
for salary context, but some prefer Cable.

**Independent Test**: Select "Cable" → all USD values update; reload app → "Cable" still selected.

**Acceptance Scenarios**:
1. **Given** rate selector visible, **When** user picks "MEP", **Then** all conversions use MEP rate
2. **Given** user has selected "Bolsa", **When** app is reopened, **Then** "Bolsa" is still active
3. **Given** three rate types shown, **When** current rates fetched, **Then** all three values
   displayed in the selector so user can compare

---

### User Story 3 — Rate Freshness Indicator (Priority: P2)

Rates are shown with a "Cotización al HH:MM" timestamp. Rates older than 2 hours show a warning.
User can tap to refresh manually.

**Why this priority**: Stale rates are misleading. The timestamp and warning prevent user from
making decisions based on outdated information.

---

## Requirements

### Functional Requirements

- **FR-001**: App MUST fetch MEP, Bolsa, and Cable USD/ARS rates from a public API
- **FR-002**: Multimoneda mode MUST be opt-in (disabled by default)
- **FR-003**: When enabled, USD equivalent MUST appear below every ARS monetary value in the app
- **FR-004**: Rate type (MEP/Bolsa/Cable) MUST be selectable by the user and persisted
- **FR-005**: Rates MUST be cached locally with a timestamp; cached rates used when offline
- **FR-006**: Rates older than 2 hours MUST show a visual staleness warning
- **FR-007**: If no rate is available (no cache, no network), USD values MUST be hidden — not shown
  as zero or NaN
- **FR-008**: The calculator engine MUST remain ARS-only; USD is display-only

### Non-Functional Requirements

- Rate API must be free and unauthenticated (no API key required from user)
- Rate fetch must not block app load — rates load asynchronously after initial render
- Candidate API: bluelytics.com.ar or similar public Argentine rate aggregator

---

## Success Criteria

- **SC-001**: Within 2 seconds of enabling multimoneda, all ARS amounts show USD equivalent
- **SC-002**: Switching rate type updates all values in under 200ms (no new fetch required)
- **SC-003**: App loads and functions normally when rate API is unreachable
- **SC-004**: Displayed USD value matches manual calculation (ARS ÷ rate) within rounding error
- **SC-005**: No USD values shown when multimoneda is disabled

---

## Assumptions

- Exchange rates are fetched from a public unauthenticated API (bluelytics or equivalent)
- MEP, Bolsa, and Cable are the three relevant rates for this audience
- Official (BNA) rate is intentionally excluded — not relevant for salary purchasing power context
- Crypto rates (USDT) are out of scope for this spec
- The feature is a reference tool only — no conversions are stored or used in calculations
- Rate API returns separate buy/sell rates — app displays the sell (venta) rate for conservatism
