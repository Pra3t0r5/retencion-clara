# Research: MVP App Interface

**Feature**: `specs/002-mvp-app-interface`
**Date**: 2026-04-22

## Decision Log

### PDF Text Extraction Library

**Decision**: pdfjs-dist
**Rationale**: Only offline-capable PDF text extraction library for browser ESM. Pre-approved
in CLAUDE.md. Both test PDFs are digital (13k / 15k — confirmed text layer exists).
**Alternatives considered**:
- `pdf-parse`: Node.js only, ruled out
- Raw canvas rendering: lossy for text, no structured output
- Claude API: requires network + API key; deferred to future iteration
**Usage pattern**:
```typescript
import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs', import.meta.url
).toString();

async function extractText(file: File): Promise<string[]> {
  const buffer = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: buffer }).promise;
  const lines: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    lines.push(...content.items.map((item: any) => item.str));
  }
  return lines;
}
```

### State Management

**Decision**: `useState` with single top-level state object; prop drilling max 2 levels
**Rationale**: App has one data flow — form input → engine → display. No cross-cutting state.
**Alternatives considered**:
- React Context: overkill for 2-level component tree
- Zustand/Redux: constitution violation (adds complexity without need)

### PDF Field Extraction Strategy

**Decision**: Label-proximity regex on extracted text items array
**Rationale**: WORMHOLE recibo and SiRADIG forms are structured ARCA-compliant outputs.
Field labels are stable across months (same employer, same ARCA format).
**Pattern**:
```typescript
// Find value adjacent to label in text array
function findAfterLabel(lines: string[], label: string): number | null {
  const idx = lines.findIndex(l => l.includes(label));
  if (idx === -1) return null;
  // Value is typically in next 1-3 items
  for (let i = idx + 1; i < Math.min(idx + 4, lines.length); i++) {
    const n = parseARS(lines[i]);
    if (n !== null) return n;
  }
  return null;
}

function parseARS(str: string): number | null {
  // Handle: $1.220.273,92 or 1.220.273,92 or 1220273.92
  const cleaned = str.replace(/[$\s]/g, '').replace(/\./g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}
```

### Testing Approach

**Decision**: Vitest unit tests for engine; manual browser testing for UI
**Rationale**: Engine is pure math — 100% unit-testable. UI correctness verified by human
(family context). Integration tests for PDF extraction deferred (fixtures are gitignored).
**Test file location**: `src/engine/calculator.test.ts`

### ARS Number Formatting

**Decision**: `Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })`
**Rationale**: Native browser API, zero dependencies, correct locale-aware formatting.
**Input parsing**: custom `parseARS()` (see above) — handles mixed formats from PDFs/clipboard.

## Open Questions Resolved

| Question | Resolution |
|----------|-----------|
| pdfjs-dist Vite/ESM setup? | Use `pdfjs-dist/build/pdf.mjs` + worker URL via `import.meta.url` |
| SiRADIG PDF structure? | Validate against `tests/fixtures/f572-2026.pdf` during extractors implementation |
| WORMHOLE recibo PDF structure? | Validate against `tests/fixtures/payslip-mar-2026.pdf` during extractors implementation |
| Indumentaria cap per-year vs per-semester? | TODO — deferred; use annual cap for now |
| SAC handling? | Out of scope for this iteration |
