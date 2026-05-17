# CLAUDE.md — RetenciónClara

AI agent context for this repository.

## What This Is

React + TypeScript client-side app for previewing Argentine income tax deductions (Art. 94, 4ta categoría). No backend — all calculation runs in the browser.

## Spec-Driven Workflow

1. Read `specs/NNN-feature/spec.md` before implementing any feature
2. Review `specs/NNN-feature/plan.md` for approach
3. Check `specs/NNN-feature/tasks.md` for current work items
4. Implement → test → commit → PR

## Stack

| Layer | Tech |
|-------|------|
| UI | React 19 + TypeScript |
| Bundler | Vite 6 |
| Styling | Inline styles (no CSS framework — keep it simple) |
| Validation | Zod |
| PDF parsing | pdfjs-dist (offline) |
| AI extraction | Claude API (optional, PDF fallback) |
| Tests | Vitest |
| Deploy | Vercel (static) |

## Key Constraints

- **Zero backend** — all logic client-side, salary data never leaves the browser
- **Offline-first calculator** — tax math has zero AI dependency
- **AI is optional** — only for PDF extraction convenience; manual form always available
- **ARCA tables** — tax scale and deductions hardcoded per H1/H2 ARCA publication. Update `src/tablas/` when ARCA publishes new values

## Tax Domain Rules (Art. 94)

- Calculation is CUMULATIVE from January each fiscal year
- Monthly: recalculate Jan→current month, subtract prior retentions
- Deduction caps:
  - Cuota médica: 5% of net income (before this deduction)
  - Indumentaria: up to GNI annual value
  - GNI, Deducción Especial, cargas de familia: from ARCA tables
- Brackets: 5% → 35% (10 tramos), updated each semester
- F.572 rectificativas: employer applies in NEXT payslip, retroactively

## Folder Structure

```
src/
  engine/         # Pure calculator logic (no React imports)
    calculator.ts
    schemas.ts
  tablas/         # ARCA tax tables per semester
    2026-H1.ts
  components/     # React UI components
  data.ts         # Extracted data types
specs/
  001-tax-calculator/   # Core calculator spec
tests/            # Vitest unit tests for engine/
```

## AGENTS.md Governs Permissions

See AGENTS.md for what agents can/cannot do.

## Active Technologies
- TypeScript (strict) + React 19 (feature/001-tax-calculator)
- N/A — all state in React `useState`, nothing persisted (feature/001-tax-calculator)
- TypeScript (strict) ~6.0 + React 19 + React 19, pdfjs-dist, Zod, Vitest — no new runtime deps added (004-multi-periodo-historicos)
- localStorage (browser-native; no server) (004-multi-periodo-historicos)
- TypeScript 5+ strict + React 19 + Zod (schema validation — already in use) (004-multi-periodo-historicos)
- N/A — no new persistence (comparison is in-session only) (004-multi-periodo-historicos)
- TypeScript 5+ strict, React 19 + Zod (schema validation — existing), Vitest (tests — existing) (010-dashboard-impacto-f572)
- `FiscalYearData = Map<number, PayslipData>` in React state + localStorage (no change) (010-dashboard-impacto-f572)

## Recent Changes
- feature/001-tax-calculator: Added TypeScript (strict) + React 19
