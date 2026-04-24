# Feature Specification: Multi-Período, Históricos y Gráficos

**Feature Branch**: `feature/004-multi-periodo-historicos`
**Created**: 2026-04-24
**Status**: Draft

## Overview

Allow users to load multiple payslips across different months of the same fiscal year, visualize
the cumulative retention progression as a chart, and compare month-over-month trends. Requires
basic authentication so each user's data is isolated. The tax engine already handles cumulative
calculations — this spec adds persistence, multi-entry UI, and visualization.

---

## User Scenarios & Testing

### User Story 1 — Load Multiple Months (Priority: P1)

User can add payslips for multiple months (e.g., January, February, March). The app stores all
of them in the session and lets the user navigate between months. Each month's payslip is
independently added via PDF upload or manual form.

**Why this priority**: The core value unlock — users can track how their retention grows month
by month and spot anomalies.

**Independent Test**: Load January + March payslips → month selector shows both → switching
between months shows correct retention values for each.

**Acceptance Scenarios**:
1. **Given** user has loaded a March payslip, **When** they click "Agregar mes", **Then** form
   resets and they can load an additional month
2. **Given** multiple months loaded, **When** user selects a month from the timeline, **Then**
   all cards update to reflect that month's data
3. **Given** two months with different retenciones, **When** user switches between them, **Then**
   the displayed values change correctly

---

### User Story 2 — Progression Chart (Priority: P1)

A line or bar chart shows the cumulative retention and monthly retention across all loaded months.
User can see at a glance whether their retention is growing, shrinking, or stable.

**Why this priority**: The chart is the "aha moment" — seeing retention as a visual trend is far
more intuitive than comparing numbers.

**Independent Test**: Load January ($800K retained) and March ($1.220K retained) → chart shows
two data points with correct values and upward trend line.

**Acceptance Scenarios**:
1. **Given** 3 months of data, **When** chart renders, **Then** shows one bar/point per month
   with retention amount labeled
2. **Given** gap analysis per month, **When** chart shown, **Then** "ahorro estimado" is
   overlaid or shown in a second series
3. **Given** single month loaded, **When** chart shown, **Then** renders gracefully with one
   data point and a message "Agregá más meses para ver la progresión"

---

### User Story 3 — Basic Authentication (Priority: P1)

Users log in with email + password to access their data. Data is scoped to the authenticated
user. No data is accessible without login. Guest mode (no login) continues to work but data
is not persisted between sessions.

**Why this priority**: Without auth, multi-period history cannot be persisted across sessions
or across devices — all value of this feature depends on it.

**Independent Test**: Log in as user A, add January data → log out → log in as user B →
January data from user A is not visible.

**Acceptance Scenarios**:
1. **Given** unauthenticated user, **When** they open the app, **Then** login prompt shown
   with option to continue as guest (data not saved)
2. **Given** authenticated user, **When** they add a month and close the browser, **Then**
   data is available on next login
3. **Given** wrong password, **When** login attempted, **Then** error shown, no access granted

---

### User Story 4 — Year-Over-Year Comparison (Priority: P3)

User can see a summary comparing the current fiscal year's total retention against the prior
year (if data exists). Shown as a simple comparison card, not a full chart.

**Why this priority**: Lower priority — requires at least two full years of data to be useful.
Designed now so the data model supports it.

---

## Requirements

### Functional Requirements

- **FR-001**: Session MUST support storing PayslipData for multiple months (January–December)
- **FR-002**: Month navigator MUST show all loaded months and allow switching between them
- **FR-003**: Chart MUST display monthly retention and cumulative retention per loaded month
- **FR-004**: Authentication MUST support email + password with session persistence (7-day cookie)
- **FR-005**: Guest mode MUST continue to work with full calculator functionality but no persistence
- **FR-006**: Authenticated users' data MUST be isolated — no cross-user data leakage possible
- **FR-007**: Chart library MUST be lightweight (< 50kB gzip) and render offline

### Non-Functional Requirements

- Auth tokens stored in httpOnly cookies (not localStorage) to prevent XSS
- All salary data encrypted at rest on the server
- Chart renders in < 500ms on mobile with 12 data points
- Login flow completes in < 3 seconds on standard connection

---

## Success Criteria

- **SC-001**: User loads 3 months of payslips and sees a chart with correct values for each
- **SC-002**: After logout and re-login, previously loaded months are restored
- **SC-003**: Two different users' data never intermingles
- **SC-004**: Guest mode works identically to current app (no regression)
- **SC-005**: Chart is readable on a 375px-wide phone screen

---

## Assumptions

- Authentication backend required — this spec introduces the first server-side component
- Recommended: Supabase Auth (email+password, free tier) or Clerk — decision deferred to plan phase
- Chart library candidates: Recharts, Chart.js, or Visx — decision deferred to plan phase
- F.572 data is also stored per-user and linked to fiscal year
- The existing engine remains pure client-side — only persistence layer moves to server
- Year-over-year (US4) is out of scope for first implementation — data model must support it
