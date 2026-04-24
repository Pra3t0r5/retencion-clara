# Tasks: Compartir y Exportar Resultados

**Input**: Design documents from `/specs/008-compartir-exportar/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅
**Hard dependency for US3**: spec 007 (Supabase + auth) must be implemented

---

## Phase 1: Setup

- [ ] T001 Install dependencies: `bun add html2canvas react-router-dom` (html2canvas for US2;
      react-router-dom for /share/:token route in US3)
- [ ] T002 Create `src/print.css`: `@media print` rules — hide non-print elements (header buttons,
      tabs, forms, FXToggle, PDFDropzone); show Resumen + DetalleCalculo + footer;
      `.print-no-bruto .bruto-row { display: none }` privacy mode selector
- [ ] T003 Import `src/print.css` in `src/main.tsx`

---

## Phase 2: User Story 1 — Export as PDF (Priority: P1) 🎯 MVP

**Goal**: "Exportar PDF" opens browser print dialog with styled results. Privacy toggle hides
bruto/neto.

**Independent Test**: Click "Exportar PDF" → print dialog opens → PDF contains Resumen,
gap analysis, DetalleCalculo. Privacy mode selected → bruto/neto hidden in PDF.

### Implementation

- [ ] T004 [US1] Add print-specific classes to Resumen rows in `App.tsx`: `.bruto-row` on the
      bruto acumulado row, `.neto-row` on neto row (for privacy mode CSS targeting)
- [ ] T005 [US1] Create `src/components/ExportBar.tsx`:
      - "Exportar PDF" button: privacy mode checkbox + `window.print()` call
      - on privacy mode: `document.body.classList.add('print-no-bruto')` before print,
        remove after (listen to `afterprint` event)
      - "Copiar imagen" button: placeholder for US2
      - "Compartir enlace" button: placeholder for US3 (disabled if unauthenticated)
- [ ] T006 [US1] Place `<ExportBar />` below results section in `App.tsx` (visible only when
      `hasData === true`)
- [ ] T007 [US1] Manual test: enter data → click "Exportar PDF" → verify PDF contains:
      period, employer, retention, gap table, DetalleCalculo, "Generado por RetenciónClara" footer.
      Enable privacy → verify bruto/neto rows absent from PDF.

**Checkpoint**: US1 — PDF export working offline.

---

## Phase 3: User Story 2 — Copy as Image (Priority: P2)

**Goal**: "Copiar imagen" copies Resumen card as PNG to clipboard.

**Independent Test**: Click "Copiar imagen" → paste into Notes/WhatsApp → branded Resumen card
visible, text legible at mobile resolution.

### Implementation

- [ ] T008 [US2] Add `data-capture="resumen"` attribute to Resumen card div in `App.tsx`
      (target for html2canvas)
- [ ] T009 [US2] Implement "Copiar imagen" handler in `ExportBar.tsx`:
      - dynamic import: `const html2canvas = (await import('html2canvas')).default`
      - `html2canvas(document.querySelector('[data-capture="resumen"]'), { scale: 2 })`
      - `canvas.toBlob()` → `navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])`
      - show "¡Imagen copiada!" toast on success
      - fallback if Clipboard API unavailable: show canvas image in modal for manual save
- [ ] T010 [US2] Manual test: click "Copiar imagen" → paste in iMessage/WhatsApp simulator →
      card visible, text legible at 375px equivalent size

**Checkpoint**: US2 — image copy working on HTTPS.

---

## Phase 4: User Story 3 — Shareable Link (Priority: P2)

**Goal**: Authenticated user generates 7-day read-only link. Recipient views results without
account.

**Independent Test**: Generate link → open in incognito → Resumen shown → expiry warning visible.
After 7 days (or revoke) → "Este enlace expiró" message.

### Implementation

- [ ] T011 [US3] Run Supabase migration: create `share_links` table + RLS policies +
      `check_share_rate_limit` function (SQL per plan.md schema)
- [ ] T012 [US3] Create `src/types/share.ts`: define `ShareLinkData` type (derived values only)
      and `ShareLink` Supabase row type
- [ ] T013 [US3] Write tests for share link expiry logic in `src/components/ShareLinkModal.test.ts`:
      - `isExpired(link)` returns true when `expires_at < now()`
      - `isExpired(link)` returns false when 6 days in future
- [ ] T014 [US3] Create `src/components/ShareLinkModal.tsx`:
      - shows on "Compartir enlace" click (authenticated only)
      - builds `ShareLinkData` from current result state (omits raw salary fields)
      - calls Supabase insert on `share_links`
      - displays generated URL + expiry date
      - "Copiar enlace" button → `navigator.clipboard.writeText(url)`
      - "Revocar enlace" button → sets `revoked = true` via Supabase update
- [ ] T015 [US3] Set up React Router in `src/main.tsx`:
      - `<BrowserRouter>` wrapping app
      - routes: `"/"` → current `<App />`, `"/share/:token"` → `<ShareView />`
- [ ] T016 [US3] Create `src/components/ShareView.tsx`:
      - reads `:token` from URL params
      - fetches from `share_links` where `token = :token AND revoked = false AND expires_at > now()`
      - on success: renders read-only Resumen with `result_data` — no tabs, no forms, no edit controls
      - shows expiry date ("Este enlace vence el DD/MM/YYYY")
      - on no result: renders "Este enlace expiró o fue revocado"
- [ ] T017 [US3] Update `vercel.json` rewrites to handle `/share/*` routes in SPA mode
- [ ] T018 [US3] Manual test: generate link → open incognito → Resumen visible without login →
      click "Revocar" → link returns expired message

**Checkpoint**: US3 — shareable links working.

---

## Phase 5: Polish

- [ ] T019 [P] Run `bun test` — all existing + share link expiry tests pass
- [ ] T020 [P] Offline test for US1: disable network → enter data → "Exportar PDF" → works correctly
- [ ] T021 PDF footer: add "Generado por RetenciónClara · {date}" to print CSS in fixed position
- [ ] T022 Disable "Compartir enlace" button with tooltip when user is not authenticated:
      "Iniciá sesión para generar un enlace"

---

## Dependencies

- T002/T003 (print CSS setup) → T004/T005/T006 (US1 buttons + behavior)
- T001 (html2canvas install) → T008/T009 (US2 implementation)
- Spec 007 MUST be complete → T011-T018 (US3 everything)
- T013 tests before T014 implementation (TDD for expiry logic)
- T015 (React Router setup) before T016 (ShareView route)
