# Implementation Plan: Multi-Período, Históricos y Gráficos

**Branch**: `004-multi-periodo-historicos` | **Date**: 2026-04-24 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-multi-periodo-historicos/spec.md`

## Summary

Allow users to load payslips for multiple months of the same fiscal year, navigate between them,
and visualize cumulative retention as a bar chart. All data stored in localStorage — no backend,
no auth, no external service. Constitution-compliant descope: US3 (auth + Supabase) dropped
because it violates Principle I (NON-NEGOTIABLE). US1 + US2 implemented fully. US4 out of scope
per original spec.

## Technical Context

**Language/Version**: TypeScript (strict) ~6.0 + React 19
**Primary Dependencies**: React 19, pdfjs-dist, Zod, Vitest — no new runtime deps added
**Storage**: localStorage (browser-native; no server)
**Testing**: Vitest
**Target Platform**: Browser (Chrome/Firefox/Safari latest-2), offline-capable
**Project Type**: SPA (client-side only, Vercel static)
**Performance Goals**: Chart renders < 500ms on mobile with 12 data points
**Constraints**: Zero backend, inline styles only, no CSS framework, offline-first
**Scale/Scope**: Single user, up to 12 months per fiscal year

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Zero Backend | ✅ PASS | localStorage only; no server calls; no payslip data transmitted |
| II. Tax Math Authoritative | ✅ PASS | Engine unchanged; chart derives from engine output |
| III. Test-First for Engine | ✅ PASS | No engine changes; storage tests written before code |
| IV. Spec-Driven Workflow | ✅ PASS | Descope documented here; US3 explicitly dropped |
| V. YAGNI | ✅ PASS | No new runtime deps; inline SVG chart (no library) |

**Descope note**: US3 (email+password auth, Supabase persistence, httpOnly cookies) violates
Principle I NON-NEGOTIABLE. Dropped entirely. localStorage provides same-device cross-session
persistence without any server. No cross-device sync — acceptable for a privacy-first tool.

## Project Structure

### Documentation (this feature)

```text
specs/004-multi-periodo-historicos/
├── plan.md         # This file
├── research.md     # Phase 0 output
├── data-model.md   # Phase 1 output
└── tasks.md        # Phase 2 output (from /speckit-tasks)
```

### Source Code (repository root)

```text
src/
  storage/
    index.ts              # StorageAdapter interface
    local.ts              # LocalStorageAdapter (localStorage JSON)
    local.test.ts         # Vitest unit tests
  components/
    MonthNav.tsx          # Month selector UI (loaded months + "Agregar mes")
    RetentionChart.tsx    # Inline SVG bar chart (no library)
  App.tsx                 # Refactored: Map state + storage wiring
```

**Structure Decision**: Single project; extend existing `src/` layout. No new top-level dirs.

## Complexity Tracking

No constitution violations. No entries required.
