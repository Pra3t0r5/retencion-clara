# Feature Specification: Compartir y Exportar Resultados

**Feature Branch**: `feature/008-compartir-exportar`
**Created**: 2026-04-24
**Status**: Draft

## Overview

Users can share their tax calculation results with others (e.g., an accountant, HR, or spouse)
via a shareable link or by exporting a formatted PDF/image snapshot. Shared views are read-only
and contain only the result data — no raw salary inputs are exposed unless explicitly chosen.

---

## User Scenarios & Testing

### User Story 1 — Export as PDF (Priority: P1)

User generates a formatted PDF of their RetenciónClara results: the gap analysis, projections,
and DetalleCalculo panel. The PDF is styled, branded, and ready to email to their accountant
or save for records.

**Why this priority**: Accountants and HR departments often request documentation. A clean PDF
is the most universally useful format.

**Independent Test**: Click "Exportar PDF" → browser downloads a PDF containing Resumen,
Gap F.572, and DetalleCalculo tables with current data.

**Acceptance Scenarios**:
1. **Given** calculator has results, **When** user clicks "Exportar PDF", **Then** PDF
   downloads with all result cards formatted in Spanish
2. **Given** PDF generated, **When** opened, **Then** contains: period, employer, retention
   amount, gap analysis, projected next month, and a "Generado por RetenciónClara" footer
3. **Given** user chooses "sin datos de sueldo bruto" option, **When** PDF generated, **Then**
   bruto acumulado and neto are omitted — only retention and deduction amounts shown

---

### User Story 2 — Copy as Image (Priority: P2)

User can copy the Resumen card as an image to the clipboard, ready to paste into WhatsApp,
Telegram, or email. The image is a clean, branded snapshot of the key numbers.

**Why this priority**: WhatsApp sharing is the dominant communication method in Argentina.
An image paste is faster than opening a PDF.

**Independent Test**: Click "Copiar imagen" → paste into WhatsApp → correctly formatted card
with RetenciónClara branding visible.

**Acceptance Scenarios**:
1. **Given** Resumen has data, **When** "Copiar imagen" clicked, **Then** clipboard contains
   a PNG of the Resumen card
2. **Given** image pasted into messaging app, **When** displayed, **Then** text is legible
   at mobile resolution and branding is visible

---

### User Story 3 — Shareable Link (Priority: P2)

User generates a time-limited read-only link that shows their results to anyone who opens it.
The link expires after 7 days. No account required to view the link.

**Why this priority**: Link sharing is the most frictionless way to share with someone who
doesn't have the app. An accountant receiving a link can review results without installing anything.

**Independent Test**: Generate link → open in incognito → Resumen displayed with correct data
→ link shows 7-day expiry warning → after 7 days link returns 404.

**Acceptance Scenarios**:
1. **Given** user clicks "Compartir enlace", **When** link generated, **Then** URL copied to
   clipboard and expiry date shown
2. **Given** link opened by recipient, **When** page loads, **Then** read-only Resumen with
   gap analysis shown — no edit controls visible
3. **Given** link older than 7 days, **When** opened, **Then** "Este enlace expiró" message shown
4. **Given** user wants to revoke access, **When** they click "Revocar enlace", **Then** link
   immediately stops working

---

## Requirements

### Functional Requirements

- **FR-001**: PDF export MUST include: period, gap analysis table, projection cards, DetalleCalculo
- **FR-002**: PDF MUST have an option to exclude raw salary amounts (privacy mode)
- **FR-003**: Image copy MUST use the Clipboard API to write PNG to clipboard
- **FR-004**: Shareable links MUST expire after 7 days maximum
- **FR-005**: Shared link views MUST be read-only — no calculator controls
- **FR-006**: Link generation MUST be possible for authenticated users only
- **FR-007**: Links MUST be revocable by the owner at any time
- **FR-008**: PDF and image generation MUST work offline (no server required)

### Non-Functional Requirements

- PDF generation: browser-native (print-to-PDF via CSS `@media print`) or jsPDF — no server
- Image copy: `html2canvas` or Canvas API — no server
- Share links require backend (spec 007 dependency) for storage and expiry
- PDF file size under 500kB
- Image resolution: minimum 2x for retina displays

---

## Success Criteria

- **SC-001**: PDF export produces a file under 500kB that renders correctly in iOS Preview and Adobe
- **SC-002**: Copied image is legible when pasted into WhatsApp at standard mobile resolution
- **SC-003**: Shared link accessible to someone without a RetenciónClara account
- **SC-004**: Link sharing unavailable to guest (unauthenticated) users — clear prompt to register
- **SC-005**: PDF generation works with no internet connection

---

## Assumptions

- PDF via CSS `@media print` is explored first — simpler than jsPDF, no dependency
- Image copy via `html2canvas` + Clipboard API — requires HTTPS (already PWA)
- Shareable links depend on spec 007 (remote storage) for the link data storage
- Links encode only result data (derived values) — never raw PayslipData (privacy)
- Link generation is rate-limited to 10 links per day per user to prevent abuse
- No social media sharing buttons — link copy covers the use case more generically
