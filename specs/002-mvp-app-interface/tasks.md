# Tasks: MVP App Interface

**Input**: `specs/002-mvp-app-interface/spec.md` + `specs/002-mvp-app-interface/plan.md`
**Prerequisites**: spec.md ✅ | plan.md ✅ | spec-001 engine ✅ (12/12 tests green)
**Tests**: Vitest unit tests for extractors; manual browser test for UI flows

**Organization**: Tasks grouped by user story. US2 + US3 already done via spec-001.

## Already Complete (from spec-001)

- [X] US2: Manual entry form (PayslipForm + F572Form)
- [X] US3: Gap analysis display (Resumen tab: indumentaria gap, cuota médica gap, ahorro estimado)
- [X] Recibo detail tab (bruto acumulado → GNSI → impuesto breakdown)

---

## Phase 1: Setup — pdfjs-dist

- [X] T001 Install pdfjs-dist: `bun add pdfjs-dist`
- [X] T002 Verify pdfjs-dist version and ESM import path — confirmed 5.6.205; worker path `pdfjs-dist/build/pdf.worker.min.mjs`

---

## Phase 2: User Story 1 — PDF Extraction Engine (Priority: P1)

**Goal**: Extract PayslipData and F572Data from WORMHOLE recibo and SiRADIG F.572 PDFs using pdfjs text layer + regex. No AI required.

**Independent Test**: Run extractor against `tests/fixtures/payslip-mar-2026.pdf` → output matches `RECIBO_MAR` values ± $100. Run against `tests/fixtures/f572-2026.pdf` → output matches `F572` values.

### Implementation for US1

- [X] T003 [US1] Create `src/extractors/recibo.ts`: `extractRecibo(file: File)` loads PDF via dynamic import of `_pdf.ts`; `parsePayslipText(text)` pure function; extracts all PayslipData fields via label-based line scan
- [X] T004 [US1] Add ARS field extraction to `src/extractors/recibo.ts`: `bruto_acumulado`, `aportes_acumulados`, `indumentaria_aplicada`, `cuota_medica_aplicada`, `ded_especial`, `gni`, `ded_conyuge`, `ded_hijos`, `ded_especial_12`, `gnsi`, `impuesto_determinado`, `retencion_mes`, `retencion_acumulada`
- [X] T005 [US1] Add periodo/meses/empleador extraction to `src/extractors/recibo.ts`: parse "Período a Pagar" header; derive meses from month name; detect employer from S.A. pattern
- [X] T006 [US1] Create `src/extractors/f572.ts`: `extractF572(file: File)` and `parseF572Text(text)` pure function; state-machine section tracking (cuota vs indumentaria); month accumulation per provider
- [X] T007 [US1] Add cónyuge/hijos/month extraction to `src/extractors/f572.ts`: detect "Cónyuge" line; count "Hijo/a" lines; accumulate per-month amounts in cuota_medica and indumentaria records
- [X] T008 [P] [US1] Create `src/extractors/recibo.test.ts`: tests `parsePayslipText` with hardcoded extracted text; 9 assertions — bruto, aportes, retencion_mes, ded_conyuge, ded_hijos, periodo, meses, empleador, no low-confidence fields
- [X] T009 [P] [US1] Create `src/extractors/f572.test.ts`: tests `parseF572Text` with hardcoded extracted text; 7 assertions — cónyuge, hijos, cuota enero, cuota abril, indumentaria enero, indumentaria abril, no low-confidence fields

**Checkpoint**: `bun test` — 28/28 tests green including all extractor assertions.

---

## Phase 3: User Story 1 — PDF Dropzone UI (Priority: P1)

**Goal**: Drop zone accepts a PDF file, runs extractor, and pre-fills the appropriate form.

### Implementation

- [X] T010 [US1] Create `src/components/PDFDropzone.tsx`: drag-over + click-to-upload; idle/loading/done/error states; low-confidence field display in warning style
- [X] T011 [US1] Wire `PDFDropzone` into `App.tsx` `TabDatos`: two dropzones above form sub-nav; dynamic import extractors; merge result into payslip/f572 state; low-confidence fields passed back
- [X] T012 [US1] `_lowConfidence: string[]` returned from both `parsePayslipText` and `parseF572Text`; fields flagged when regex returns NaN or 0 on expected-non-zero

**Checkpoint**: Drop Fernando's PDFs → Resumen tab auto-populates with correct values. Drop wrong file → error shown, form stays active.

---

## Phase 4: User Story 4 — DetalleCalculo Panel (Priority: P2)

**Goal**: Collapsible panel showing GNSI derivation step by step — allows user to verify app math against their physical recibo.

### Implementation

- [X] T013 [US4] Create `src/components/DetalleCalculo.tsx`: `<details>/<summary>` toggle; shows bruto → aportes → deductions → GNSI → active bracket (fijo + % × excedente) → impuesto → retención mes; `defaultOpen={false}`
- [X] T014 [US4] Wire `DetalleCalculo` into `TabResumen` below Proyección Anual card; remove `TabRecibo` function and "Recibo" tab from TABS array

**Checkpoint**: Expand panel → all line items match Fernando's recibo. Collapse → panel closes without page reload.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T015 [P] `bun run build` — zero TypeScript errors; pdfjs worker bundled as separate asset; main chunk 84kB gzip
- [X] T016 [P] `bun test` — 28/28 tests pass including 16 extractor assertions
- [ ] T017 Manual browser test: drop `tests/fixtures/payslip-mar-2026.pdf` → Resumen shows $1.220.273 retención; drop `tests/fixtures/f572-2026.pdf` → gap shows correct values; expand DetalleCalculo → GNSI $14.805.322

---

## Dependencies & Execution Order

- T001–T002 (setup): must complete before any PDF work
- T003–T007 (extractors): sequential — each builds on previous
- T008–T009 (extractor tests): parallel after T007; must pass before UI
- T010–T012 (dropzone UI): requires T007 complete
- T013–T014 (DetalleCalculo): independent of PDF work — can start any time
- T015–T017 (polish): requires all phases complete

## Notes

- `tests/fixtures/` is gitignored — real salary PDFs, never commit
- pdfjs lazy-loaded via dynamic import: only downloaded when user drops a PDF
- `parsePayslipText` and `parseF572Text` are pure functions — zero pdfjs dependency in tests
- WORMHOLE and SiRADIG are fixed employer formats — label-based line scan is deterministic
- If PDF text extraction returns empty (scanned PDF), extractor returns `_lowConfidence` with all fields; user reviews form
