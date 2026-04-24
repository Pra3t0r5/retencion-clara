# Research: Compartir y Exportar Resultados (spec 008)

## PDF Generation

**Decision**: CSS `@media print` — no library  
**Rationale**: Zero bundle impact. Spec Assumptions favor this approach first. Browser print
dialog lets user choose PDF or paper — more flexible than forced download.  
**Privacy mode**: CSS class `.print-no-bruto` on `<body>` hides salary rows. Toggle shown
before "Exportar PDF" button action.  
**File size**: CSS-rendered PDF will be well under 500kB (text-only content).  
**Limitation**: No auto-download — browser print dialog appears. Acceptable for v1.

## Image Copy

**Decision**: `html2canvas` v1.x + Clipboard API  
**Rationale**: Spec explicitly mentions this combination. `html2canvas` captures DOM as canvas.
Clipboard API writes PNG to system clipboard.  
**Bundle**: ~200kB gzip. Lazy-loaded via dynamic import to avoid penalizing initial load.  
**Scale**: `html2canvas({ scale: 2 })` for retina displays (spec SC-002).  
**HTTPS**: Already satisfied by PWA + Vercel HTTPS deployment.  
**Fallback**: If Clipboard API unavailable (non-HTTPS dev), show "Copiá la imagen" modal
with the PNG displayed for manual long-press save.

## Shareable Links

**Decision**: Supabase `share_links` table with 32-char hex token, 7-day TTL  
**Rationale**: Minimal backend — same Supabase project already used for auth + storage.
No additional service required. RLS ensures only owner can create/revoke.  
**Token**: `gen_random_bytes(16)` in Postgres = cryptographically random 32-char hex.
Collision probability negligible.  
**Rate limit**: Postgres function `check_share_rate_limit(user_id)` — count links in last 24h.
Returns error if ≥10. Called before insert via trigger.  
**Expiry**: Stored in column, checked at read time. No cron job needed — expired links
simply return no rows from the read query.

## Privacy — What Goes in Share Links

**Decision**: `ShareLinkData` = derived result values only (period, employer name,
retention amount, gap, projections). No bruto, no aportes, no individual deduction amounts.

**Rationale**: FR-005, FR-003 (Assumptions). Links encode only what's needed to communicate
"how much tax" without revealing "how much is being earned."

## Read-Only Share Route

**Decision**: React Router v6 `<Route path="/share/:token">` + `<ShareView>` component  
**Rationale**: SPA routing handles this without any server-side rendering. The share page
fetches the link data from Supabase directly (RLS allows anonymous read of non-expired links).
Vercel already has `vercel.json` rewrite rules for SPA routing.

## React Router

**Decision**: Add `react-router-dom` v6 (if not already installed)  
**Rationale**: Needed for the `/share/:token` route. App currently has no routing — this
is the first feature requiring a second "page." If spec 008 is the first to add routing,
add minimal setup.
