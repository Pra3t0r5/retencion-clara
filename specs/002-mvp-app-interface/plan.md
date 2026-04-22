# Implementation Plan: MVP App Interface

**Branch**: `feature/001-tax-calculator` (active) | **Date**: 2026-04-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/002-mvp-app-interface/spec.md`

## Summary

Transform the existing hardcoded-data app into a dynamic user-driven interface. The app already
renders correct numbers for Fernando's March 2026 data; this plan wires up a manual entry form
and PDF extraction pipeline so any user can enter their own data. Ship the manual form first
(no new runtime dependencies beyond Zod), then add PDF extraction as a second iteration.

## Technical Context

**Language/Version**: TypeScript (strict) + React 19
**Primary Dependencies**:
- `zod` 3.x — schema validation (not yet installed)
- `pdfjs-dist` — PDF text extraction (not yet installed, Phase 3 only)
- `vitest` + `@vitest/ui` — unit testing (not yet installed)
**Storage**: N/A — all state in React `useState`, nothing persisted
**Testing**: Vitest unit tests for engine; manual browser testing for UI flows
**Target Platform**: Browser (desktop-first, PWA already scaffolded via vite-plugin-pwa)
**Project Type**: SPA (static deploy on Vercel)
**Performance Goals**: PDF parse < 5s; calculation < 10ms
**Constraints**: Zero backend, offline-capable manual path, salary data stays in browser
**Scale/Scope**: In-family app (1–5 users), single employer format, 2026 only

## Constitution Check

*GATE: Must pass before implementation begins.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Zero Backend | No network calls from engine; pdfjs runs locally; no telemetry | ✅ PASS |
| II. Tax Math Authoritative | UI only displays engine output; engine from spec 001 is prerequisite | ✅ PASS |
| III. Test-First for Engine | Engine tests required by spec 001; this spec adds integration smoke test | ✅ PASS |
| IV. Spec-Driven Workflow | Implements spec 002 user stories in priority order (P1 before P2) | ✅ PASS |
| V. Simplicity | useState only; pdfjs text layer (no AI); inline styles; no extra abstractions | ✅ PASS |

**Complexity justification**: pdfjs-dist is the only non-trivial addition. Pre-approved in
CLAUDE.md and spec 001. No viable alternative for digital PDF text extraction exists.

## Project Structure

### Documentation (this feature)

```text
specs/002-mvp-app-interface/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
└── tasks.md             # /speckit.tasks output
```

### Source Code

```text
src/
├── engine/                    # Spec 001 PREREQUISITE — must pass tests before spec 002 begins
│   ├── schemas.ts             # Zod: PayslipData, F572Data, TaxResult, GapAnalysis
│   ├── calculator.ts          # Pure functions, no React imports
│   └── calculator.test.ts     # Vitest assertions against Fernando Mar 2026 data
├── tablas/
│   └── 2026-H1.ts             # ARCA all 10 bracket tramos
├── extractors/                # New — Phase 3 only (PDF extraction)
│   ├── recibo.ts              # pdfjs + regex for WORMHOLE recibo format
│   └── f572.ts                # pdfjs + regex for SiRADIG F.572 format
├── components/
│   ├── PayslipForm.tsx        # Manual entry: PayslipData fields (Phase 1)
│   ├── F572Form.tsx           # Manual entry: F572Data per-month fields (Phase 1)
│   ├── ResultadoCard.tsx      # Summary display: retención + gap highlight (Phase 2)
│   ├── DetalleCalculo.tsx     # Collapsible GNSI derivation panel (Phase 2)
│   └── PDFDropzone.tsx        # Upload + extraction trigger (Phase 3)
├── App.tsx                    # Updated: form state → engine → display components
├── data.ts                    # Retained: Fernando data as demo/default pre-fill values
└── main.tsx
tests/
└── fixtures/                  # gitignored — real PDFs for manual extraction testing
```

**Structure Decision**: Single-project SPA. Engine separated (spec 001 constraint). Extractors
separated from components (pure TS, no React, testable in isolation).

## Phase 0: Research

**Decision: pdfjs-dist for PDF text extraction**
- Both test PDFs are digital (13k + 15k file size confirms text layer present)
- API: `getDocument(arrayBuffer) → page.getTextContent() → items[].str + transform`
- Vite/ESM: import `pdfjs-dist/build/pdf.mjs`; set `GlobalWorkerOptions.workerSrc` to bundled
  worker or CDN URL (`pdfjs-dist/build/pdf.worker.mjs`)
- Alternatives rejected: `pdf-parse` (Node-only), browser FileReader + canvas (lossy for text)
- Rationale: offline-capable, no API key, pre-approved in CLAUDE.md

**Decision: regex extraction over AI for initial version**
- WORMHOLE recibo and SiRADIG F.572 are structured employer/ARCA-generated forms
- Field labels are consistent across months — regex on extracted text is deterministic
- AI extraction deferred: add Claude API call as enhancement once regex baseline is validated
- Rationale: ship fast, no API key required, works offline

**Decision: useState + prop drilling (no context/Redux)**
- Single top-level state: `{ payslip: PayslipData | null, f572: F572Data | null }`
- At most 3 levels of component depth — no context needed
- Rationale: Simplicity principle; complexity not justified for family-scale app

**Decision: vitest for testing**
- Native Vite/ESM integration, no babel config, TypeScript out of the box
- Alternatives rejected: Jest (requires extra ESM config)

**Output**: All unknowns resolved. No blockers.

## Phase 1: Design & Contracts

### Data Model (see `data-model.md`)

```typescript
// Inputs (Zod schemas in src/engine/schemas.ts)
PayslipData   — cumulative acumulado data from recibo "Detalle de Cálculo" page
F572Data      — per-month declared deductions from SiRADIG

// Outputs (from engine)
TaxResult     — { gnsi, impuesto_determinado, retencion_mes, retencion_acumulada_previa }
GapAnalysis   — { indumentaria_gap, cuota_medica_gap, total_gap, ahorro_estimado, tax_rate }
ProyeccionAbril — estimated April retention after full gap + April deductions applied
ProyeccionAnual — full-year estimate at current salary run-rate

// UI state (App.tsx)
AppState      — { payslip: PayslipData | null; f572: F572Data | null }
```

### Component Contracts (prop types)

```typescript
ResultadoCard(props: { result: TaxResult; gaps: GapAnalysis })
DetalleCalculo(props: { payslip: PayslipData; result: TaxResult; defaultOpen?: boolean })
PayslipForm(props: { initial?: Partial<PayslipData>; onSubmit(d: PayslipData): void })
F572Form(props: { initial?: Partial<F572Data>; onSubmit(d: F572Data): void })
PDFDropzone(props: { label: string; onExtract(partial: Record<string, number>): void })
```

### Implementation Order — ship-fast first

**Iteration A — Manual Form (no PDF deps)**:
1. `npm install zod vitest @vitest/ui` — add test runner
2. Spec 001 engine: create `src/engine/schemas.ts` + `src/engine/calculator.ts` + tests
3. Run `npm test` — all 3 acceptance criteria green (GNSI, impuesto, retención mes ± $100)
4. `src/components/PayslipForm.tsx` + `src/components/F572Form.tsx`
5. `src/components/ResultadoCard.tsx` + `src/components/DetalleCalculo.tsx`
6. Update `App.tsx`: form state → engine → display; Fernando data as default pre-fill
7. Manual browser test — verify golden path with Fernando's data

**Iteration B — PDF Extraction (after A is shipped)**:
8. `npm install pdfjs-dist`
9. `src/extractors/recibo.ts` — WORMHOLE format regex
10. `src/extractors/f572.ts` — SiRADIG format regex
11. `src/components/PDFDropzone.tsx` — file input + extraction trigger
12. Update `App.tsx`: PDFDropzone output → pre-fills form
13. Validate against `tests/fixtures/` PDFs

**Rationale**: Each iteration is independently deployable. Family can use manual form on day 1.

## Complexity Tracking

No constitution violations.

| Dependency | Why Needed | Simpler Alternative Rejected Because |
|------------|------------|--------------------------------------|
| zod | Runtime validation of form inputs + PDF extraction output | TypeScript types don't validate at runtime |
| pdfjs-dist | Extract text from digital PDFs | Manual entry is the fallback; pdfjs needed for US1 (PDF golden path) |
| vitest | Unit test engine | No viable alternative for Vite/ESM project without extra config |
