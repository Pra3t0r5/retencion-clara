# Research: Modo Multimoneda (spec 006)

## Rate API Selection

**Decision**: Bluelytics `https://api.bluelytics.com.ar/v2/latest`  
**Rationale**: Free, no API key, widely used in Argentine developer community. Returns blue
dollar buy/sell rates with timestamp.  
**Limitation**: Does not provide precise MEP/Bolsa/Cable split. v1 approximates:
  - MEP = `blue.value_sell`
  - Bolsa = MEP × 0.98
  - Cable = MEP × 1.02
This is disclosed in UI ("valor referencial").  
**Fallback**: `dolarapi.com/v1/dolares/blue` — same free tier. Used if Bluelytics returns 5xx.

## Rate Sell vs Buy

**Decision**: Display sell rate (`value_sell`)  
**Rationale**: Spec Assumptions state "app displays the sell (venta) rate for conservatism."
Sell rate is what users effectively pay when converting salary purchasing power to USD.

## Caching

**Decision**: localStorage with 3 keys + 2-hour staleness threshold  
**Rationale**: Rates change slowly enough that 2h cache is accurate. localStorage avoids
sessionStorage loss on tab close. Max storage: ~200 bytes — negligible.

## React Architecture: Context vs Props

**Decision**: `FXContext` React context consumed by `USDAmount` component  
**Rationale**: ARS amounts appear in 8+ places across App.tsx and component tree.
Prop-drilling the rate through every level is error-prone. Context is appropriate here
(the FX rate is genuinely global display state).  
**Pattern**: `FXProvider` wraps the app; `USDAmount` reads context automatically.

## USDAmount Component

**Decision**: Renders nothing if `!enabled || !rates` — no zero/NaN display  
**Rationale**: FR-007 explicit: "if no rate is available, USD values MUST be hidden — not
shown as zero or NaN." Rendering nothing is the safest implementation.

## Fetch Timing

**Decision**: Lazy — fetch only when user enables multimoneda for the first time, or when
"Actualizar cotización" tapped, or on app load if already enabled + cache stale.  
**Rationale**: Not all users enable this feature. Don't make network requests for disabled features.
Non-blocking: fetch happens in background after initial render.
