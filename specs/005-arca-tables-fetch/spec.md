# Feature Specification: Fetch Automático de Tablas ARCA

**Feature Branch**: `feature/005-arca-tables-fetch`
**Created**: 2026-04-24
**Status**: Draft

## Overview

ARCA (formerly AFIP) publishes updated tax bracket tables twice per year (H1 and H2). Currently,
these values are hardcoded in `src/tablas/2026-H1.ts` and require a code change to update.
This spec adds a mechanism to fetch the latest published table automatically (or with one click),
validate it, and update the calculator without deploying new code.

---

## User Scenarios & Testing

### User Story 1 — Auto-Detect Outdated Table (Priority: P1)

When the user opens the app, it checks whether the currently loaded ARCA table matches the latest
published semester. If a newer table is available, a banner notifies the user and offers a one-click
update.

**Why this priority**: Silently using wrong tax brackets is the most dangerous failure mode —
calculations appear correct but are systematically wrong. The user must always know if their
brackets are current.

**Independent Test**: Set app clock to 2026-08-01 (H2 expected) → banner appears saying
"Tablas H2 2026 disponibles — actualizá para cálculos correctos".

**Acceptance Scenarios**:
1. **Given** app has H1 2026 table and today is after 2026-07-01, **When** app loads, **Then**
   banner shown: "Tablas ARCA desactualizadas — H2 disponibles"
2. **Given** banner shown, **When** user clicks "Actualizar", **Then** new table fetched,
   validated, and calculator reloads with updated brackets
3. **Given** app is offline, **When** app loads with outdated table, **Then** banner shown
   with note "Sin conexión — actualizá cuando tengas internet"

---

### User Story 2 — Manual Table Update (Priority: P1)

User can trigger a manual fetch and update of ARCA tables from a Settings panel, independent
of the automatic detection. Useful when ARCA publishes mid-semester corrections.

**Why this priority**: Automatic detection relies on date heuristics. Manual update gives the
user full control and covers edge cases (corrections, re-publications).

**Independent Test**: Go to Settings → click "Verificar tablas ARCA" → app fetches, shows
current vs. available version, allows confirming update.

---

### User Story 3 — Table Version History (Priority: P2)

App stores the last 3 applied ARCA tables and allows the user to switch between them. Useful
for recalculating a past month using the brackets that were active at that time.

**Why this priority**: A payslip from January 2026 should be calculated with H1 2026 brackets,
not H2. When multi-period (spec 004) is active, each month's payslip links to the correct
bracket version.

---

## Requirements

### Functional Requirements

- **FR-001**: App MUST display which ARCA table version is currently active (e.g., "H1 2026")
  in the UI (Settings or footer)
- **FR-002**: App MUST detect when a newer semester table is expected based on current date
  (H1 active Jan–Jun, H2 active Jul–Dec)
- **FR-003**: App MUST fetch ARCA table data from a trusted source and validate numeric sanity
  (10 tramos, percentages sum correctly, brackets monotonically increasing)
- **FR-004**: Fetched table MUST be cached locally (IndexedDB or localStorage) so repeated opens
  don't require network
- **FR-005**: If fetch fails, app MUST continue with the bundled fallback table and show a warning
- **FR-006**: User MUST be able to manually trigger a table refresh from Settings
- **FR-007**: Table data source MUST be configurable (default: app-maintained JSON endpoint;
  user can point to custom URL)

### Non-Functional Requirements

- Fetch timeout: 5 seconds — if exceeded, use cached/bundled table silently
- Table JSON format versioned so the parser can reject incompatible schemas
- All ARCA table fetches logged with timestamp for debugging

---

## Success Criteria

- **SC-001**: When a new ARCA table is published, user can update without a new app deployment
- **SC-002**: Outdated table detected within 1 second of app load
- **SC-003**: Table update completes in under 5 seconds on standard connection
- **SC-004**: Calculator produces identical results with fetched table vs. bundled table for
  the same semester
- **SC-005**: App works correctly offline with the last cached or bundled table

---

## Assumptions

- ARCA does not provide a public machine-readable API for bracket tables — a maintainer-managed
  JSON endpoint (GitHub raw file or similar) will serve as the source
- The JSON endpoint is maintained by the project team and updated manually when ARCA publishes
- Semester detection uses a simple date rule: H1 = Jan–Jun, H2 = Jul–Dec
- The existing `src/tablas/2026-H1.ts` becomes the bundled fallback (always present)
- Table validation checks: 10 tramos, percentages 5%–35%, desde/hasta monotonically increasing,
  all fijo values non-negative
