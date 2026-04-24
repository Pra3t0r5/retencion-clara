# Implementation Plan: Compartir y Exportar Resultados

**Branch**: `008-compartir-exportar` | **Date**: 2026-04-24 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/008-compartir-exportar/spec.md`

## Summary

Three export mechanisms: (1) PDF via CSS `@media print` — no server, no new dep; (2) copy
Resumen as PNG image via `html2canvas` + Clipboard API; (3) 7-day shareable link via Supabase
backend (requires spec 007).

**Dependencies**: US3 (shareable link) depends on spec 007 (remote storage + auth). US1 and US2
are fully client-side and can ship independently.

## Technical Context

**Language/Version**: TypeScript 5.x + React 19  
**Primary Dependencies**: `html2canvas` (~200kB gz) for US2; no new dep for US1  
**Storage**: Supabase (share links table) for US3 only  
**Testing**: Vitest — unit tests for share link expiry logic; US1/US2 browser-tested only  
**Target Platform**: Browser SPA (HTTPS — required for Clipboard API)  
**Performance Goals**: PDF <500kB; image generation <3s  
**Constraints**: PDF/image generation offline (FR-008); no server for US1 or US2  
**Scale/Scope**: Rate-limit 10 links/day/user (US3)

## Constitution Check

| Gate | Status | Notes |
|------|--------|-------|
| I. Zero Backend | ✅ PASS (US1, US2) | PDF via CSS print and image via canvas are purely client-side |
| I. Partial (US3) | ⚠️ | Shareable links store derived result data on server — NOT raw salary inputs. Privacy preserved. |
| II. Tax Math | ✅ PASS | No engine changes |
| III. Offline (US1, US2) | ✅ PASS | FR-008: PDF + image work offline |
| IV. Privacy Mode | ✅ REQUIRED | FR-002: PDF option to exclude bruto/neto amounts |

## Project Structure

### Source Code Changes

```text
src/
  components/
    ExportBar.tsx          # NEW — bar with PDF / Copy Image / Share Link buttons
    ShareLinkModal.tsx     # NEW — generates + displays shareable link (US3)
  print.css                # NEW — @media print stylesheet for PDF export
supabase/
  migrations/
    004_share_links.sql    # NEW — share_links table + RLS + rate limit
```

## Phase 0: Research

### Decision: PDF — CSS Print vs jsPDF

**Decision**: CSS `@media print` — no library

**Rationale**:
- Zero dependency
- Zero bundle size increase
- Browser handles pagination, fonts, and rendering
- User controls print destination (PDF, paper) via browser print dialog
- Spec Assumptions: "PDF via CSS @media print is explored first"

**Implementation**:
- `print.css` imported in `main.tsx`; only active when `@media print`
- Hides: tabs, header buttons, forms, PDFDropzone, FXToggle
- Shows: Resumen cards, DetalleCalculo, footer
- Privacy mode: add `.print-no-bruto` class to `<body>` → CSS hides bruto/neto rows

**Limitation**: User sees browser print dialog, not auto-download. Acceptable for v1.
Privacy mode toggle shown before clicking "Exportar PDF".

### Decision: Image — html2canvas

**Decision**: `html2canvas` v1.x

**Rationale**: Spec explicitly mentions it. Established library. Captures the rendered DOM
element as canvas, then converts to PNG blob for Clipboard API.

**Bundle impact**: ~200kB gzip. Load lazily (dynamic import) — only loads when user clicks
"Copiar imagen".

**HTTPS requirement**: Clipboard API (`navigator.clipboard.write()`) requires HTTPS.
Already satisfied (PWA/Vercel).

**Implementation**:
```typescript
const canvas = await html2canvas(document.querySelector('.resumen-card'));
const blob = await new Promise<Blob>(resolve => canvas.toBlob(resolve, 'image/png'));
await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
```

**2x resolution**: `html2canvas({ scale: 2 })` for retina.

### Decision: Shareable Links — Supabase

**Decision**: `share_links` table in Supabase with 7-day TTL + rate limiting

**Schema**:
```sql
CREATE TABLE share_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  result_data JSONB NOT NULL, -- derived values only, never raw PayslipData
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '7 days',
  revoked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: only owner can create/revoke; anyone can read non-expired non-revoked links
```

**Rate limit**: Postgres function counts links created in last 24h per user; rejects if ≥10.

**URL format**: `https://retencionclara.app/share/{token}`

**Reader route**: React Router `<Route path="/share/:token">` → fetch link data → render read-only Resumen.

### Decision: Privacy — Result Data Only in Links

**Decision**: `result_data` JSONB stores only derived values, never `PayslipData`

```typescript
type ShareLinkData = {
  periodo: string;
  empleador: string;
  retencion_mes: number;
  gap_572: number;
  proyeccion_prox_mes: number;
  proyeccion_anual: number;
  // NO: bruto, neto, aportes, individual deduction amounts
};
```

This matches FR-005: "shared views contain only result data — no raw salary inputs."

## Phase 1: Design

### Data Model (US3)

```text
share_links:
  id: UUID PK
  token: TEXT UNIQUE (16-byte hex = 32 chars)
  user_id: UUID FK → auth.users
  result_data: JSONB (ShareLinkData type)
  expires_at: TIMESTAMPTZ (7 days from creation)
  revoked: BOOLEAN
  created_at: TIMESTAMPTZ
```

### Contracts (US3)

Read-only share page: `/share/:token`
- Fetches `share_links` where `token = :token AND revoked = false AND expires_at > now()`
- On success: render read-only Resumen with `result_data`
- On miss/expired: render "Este enlace expiró" message
- No authentication required to view
