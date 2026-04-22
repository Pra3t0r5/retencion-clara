# Feature Specification: MVP App Interface

**Feature Branch**: `feature/002-mvp-app-interface`
**Created**: 2026-04-22
**Status**: Draft
**Input**: User description from Obsidian project note — Mini app to preview tax deductions

## Overview

Build the complete user-facing MVP interface of RetenciónClara: two PDF drop zones (one for
recibo de sueldo, one for F.572), a manual data entry fallback form, a ResultadoCard summarizing
retention amounts, and a DetalleCalculo breakdown panel. The interface connects to the engine
(spec 001) and surfaces the gap analysis ("¿cuánto menos te van a retener el mes que viene?")
as the primary insight.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — PDF Upload → Tax Result (Priority: P1)

User uploads their recibo de sueldo PDF and their F.572 PDF. The app auto-populates all fields,
runs the calculator, and displays the monthly retention amount and the gap analysis.

**Why this priority**: This is the full golden path. Covers PDF extraction, Zod validation,
calculator integration, and result display in one flow.

**Independent Test**: Upload Fernando's real PDFs → verify ResultadoCard shows retención mes
$1.220.273,92 ± $100 and gap $1.095.744 ± $100. No manual input required.

**Acceptance Scenarios**:

1. **Given** digital recibo PDF (WORMHOLE format) dropped in the recibo dropzone, **When** file
   is processed, **Then** all PayslipData fields are auto-populated in the form within 5 seconds
2. **Given** F.572 PDF (SiRADIG format) dropped in the F.572 dropzone, **When** file is
   processed, **Then** cuota médica and indumentaria fields are auto-populated per month
3. **Given** both PDFs parsed, **When** user clicks "Calcular", **Then** ResultadoCard shows
   retención del mes, impuesto determinado, and gap analysis breakdown
4. **Given** extraction produces uncertain fields, **When** fields are ambiguous, **Then**
   uncertain fields are visually highlighted for manual review before calculation

---

### User Story 2 — Manual Entry → Tax Result (Priority: P1)

User fills in all salary and deduction fields manually (no PDF). App runs calculator and shows
the same result. Serves as fallback when PDFs are non-digital or extraction fails.

**Why this priority**: Zero-dependency path. Works offline, no AI API needed, guarantees the
app is always usable regardless of PDF format or API availability.

**Independent Test**: Enter Fernando's March 2026 data manually → verify same result as US1.

**Acceptance Scenarios**:

1. **Given** user enters all PayslipData values in the manual form, **When** "Calcular" is
   clicked, **Then** ResultadoCard shows correct retención del mes ± $100
2. **Given** required fields are missing, **When** user submits, **Then** validation errors
   highlight each missing field with a descriptive label
3. **Given** numeric fields contain Argentine-format numbers (e.g., `$1.220.273,92`),
   **When** values are entered, **Then** parser accepts ARS format and strips separators

---

### User Story 3 — Gap Analysis Display (Priority: P1)

ResultadoCard surfaces the gap between what the F.572 declared and what the employer actually
applied, and shows the estimated April retention reduction.

**Why this priority**: This is the primary user insight ("el número que importa"). Without it,
the app is just a calculator anyone can do in a spreadsheet.

**Independent Test**: Run with Fernando's data → gap panel shows $1.095.744, estimated savings
$339.680 ± $500, narrative "El empleador debería retener ~$340K menos en Abril".

**Acceptance Scenarios**:

1. **Given** F.572 cuota médica declared vs. applied, **When** result displayed, **Then** gap
   row shows declared total, applied total, and difference per deduction type
2. **Given** gap total of $1.095.744 at 31% marginal rate, **When** gap displayed, **Then**
   estimated next-month savings shown as ~$340K
3. **Given** no gap (F.572 fully applied by employer), **When** result displayed, **Then**
   gap panel shows "Sin brecha detectada" with neutral styling

---

### User Story 4 — DetalleCalculo Panel (Priority: P2)

Collapsible/expandable panel showing step-by-step breakdown of the tax calculation matching the
"Detalle de Cálculo" page on the recibo: each deduction, the GNSI, the bracket applied, and the
final retention.

**Why this priority**: Allows users to verify the app's math against their recibo. Secondary to
the main result but critical for trust.

**Independent Test**: Expand DetalleCalculo with Fernando's data → all line items match recibo
exactly (GNI $1.287.950,64, deducción especial $6.182.163, GNSI $14.805.322, etc.).

**Acceptance Scenarios**:

1. **Given** calculation complete, **When** user expands DetalleCalculo, **Then** all line items
   from the GNSI derivation are shown with ARS-formatted amounts
2. **Given** bracket applied is $13.792.083,76 → 31%, **When** panel shown, **Then** bracket
   row highlights the active tramo and shows fijo + % components
3. **Given** DetalleCalculo is collapsed, **When** page loads, **Then** panel is closed by
   default; toggle opens/closes without page reload

---

### Edge Cases

- What happens when a PDF is image-based (scanned) and pdfjs cannot extract text?
- What happens when the Claude API for PDF extraction is unavailable or rate-limited?
- What happens when indumentaria or cuota médica declared exceeds the ARCA cap?
- What happens when user uploads wrong PDF type (F.572 in recibo zone)?
- How does the form handle copy-pasted numbers with mixed ARS formats ($1.220.273,92 vs 1220273.92)?

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Interface MUST provide a drop zone for recibo de sueldo PDF that auto-populates
  PayslipData fields on successful extraction
- **FR-002**: Interface MUST provide a drop zone for F.572 PDF that auto-populates F572Data
  fields (cuota médica + indumentaria per month)
- **FR-003**: Interface MUST provide a complete manual entry form as fallback when no PDF is
  uploaded or extraction fails
- **FR-004**: Calculator MUST be invokable only when all required fields are valid (form
  validation gates the "Calcular" button)
- **FR-005**: ResultadoCard MUST display: retención del mes, impuesto determinado acumulado,
  retención acumulada previa, and gap analysis section
- **FR-006**: Gap analysis section MUST show per-deduction breakdown (indumentaria, cuota médica)
  with declared vs. applied amounts and the estimated next-month savings
- **FR-007**: DetalleCalculo panel MUST show full GNSI derivation (bruto → aportes → deductions
  → GNSI → bracket → impuesto) matching recibo line-item labels
- **FR-008**: PDF extraction MUST fall back gracefully: if Claude API unavailable, attempt
  pdfjs text extraction; if both fail, show error and keep manual form active
- **FR-009**: Uncertain/low-confidence extracted fields MUST be visually flagged for user review
  before calculation is triggered
- **FR-010**: All numeric inputs MUST accept Argentine peso format ($1.220.273,92) and parse
  correctly

### Key Entities

- **ResultadoCard**: Summary component — retención del mes, impuesto determinado, gap analysis
- **DetalleCalculo**: Collapsible panel — step-by-step GNSI + bracket derivation
- **ReciboPDFZone**: Drop zone + extraction pipeline for recibo PDFs
- **F572PDFZone**: Drop zone + extraction pipeline for F.572 PDFs
- **ManualEntryForm**: Fallback form with Zod-validated fields for PayslipData + F572Data

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Golden path (PDF upload → result) completes in under 10 seconds on a standard
  laptop with an active internet connection
- **SC-002**: Manual entry path (form fill → result) completes in under 30 seconds for a user
  who already has their recibo open
- **SC-003**: ResultadoCard values match the expected test case (Fernando March 2026) within
  ±$100 for all displayed amounts
- **SC-004**: Gap analysis correctly identifies and quantifies the declared-vs-applied gap when
  F.572 rectificativa was filed after payslip was processed
- **SC-005**: App remains fully functional with no internet connection (manual entry path + local
  calculator only; PDF AI extraction gracefully disabled)
- **SC-006**: User can verify every figure in DetalleCalculo against their physical recibo
  without needing to understand the underlying calculation rules

---

## Assumptions

- PDF extraction relies on pdfjs for text layer and optionally Claude API for structured parsing;
  both are already in the dependency list (spec 001)
- AI extraction requires user to have a Claude API key configured (environment variable);
  absence of key silently disables AI path, pdfjs-only extraction attempted first
- Only the WORMHOLE S.A. recibo format and SiRADIG F.572 format are in scope for PDF parsing
  in this iteration; other employer formats are out of scope
- Styling follows the existing inline-styles convention; no new CSS library introduced
- Interface is desktop-first (responsive mobile is already scaffolded via existing CSS, but
  mobile UX is not a primary acceptance criterion for this spec)
- The calculator engine (spec 001) is complete and passing all unit tests before UI work begins
- ARS number formatting uses `Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })`
  or equivalent; no external formatting library needed
