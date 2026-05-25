# Spec 012 — Mobile UX/UI Overhaul

**Branch**: `012-mobile-ux`
**Created**: 2026-05-25
**Status**: Research / Ready to plan

---

## Objetivo

Llevar RetenciónClara a estándares Mobile 2026: iOS HIG + Material Design 3.
App es usada principalmente en iPhone (PWA o Safari). Hoy tiene 10 problemas
concretos que rompen la experiencia mobile. Este spec los cataloga, prioriza,
y define criterios de aceptación.

---

## Hallazgos por área

### 1. Bugs de tokens CSS — MonthNav (CRÍTICO)

`src/components/MonthNav.tsx` usa tokens inexistentes:

| Usa | Token correcto |
|-----|---------------|
| `var(--border)` | `var(--color-border)` |
| `var(--primary)` | `var(--color-primary)` |
| `var(--muted)` | `var(--color-text-muted)` |
| `var(--surface)` | `var(--color-surface)` |
| `var(--primary-bg)` | `var(--color-primary-bg)` |

Resultado: MonthNav renderiza sin colores (transparent/black fallback).
Visible inmediatamente en cualquier dispositivo.

**Fix**: rename 5 variables en MonthNav.tsx. 5 minutos.

---

### 2. Colores hardcoded en HeroStats (CRÍTICO para dark mode)

`src/components/HeroStats.tsx` usa hex directamente:

```tsx
var(--card-bg, #1e293b)   // en light mode: fondo oscuro sobre fondo claro — bug
'#f87171'                  // debería ser var(--color-danger)
'#4ade80'                  // debería ser var(--color-success)
'#94a3b8'                  // debería ser var(--color-text-muted)
'#fb923c'                  // sin token equivalente — pendiente
```

HeroStats es el primer componente visible. Tiene fondo oscuro en modo claro.
Dark mode automático (prefers-color-scheme) está roto para esta sección.

**Fix**: migrar a tokens. Crear `--color-warning-alt: #fb923c` si hace falta.

---

### 3. Touch targets demasiado pequeños (CRÍTICO — iOS HIG: mínimo 44pt)

| Componente | Padding | Alto real | Gap al mínimo |
|------------|---------|-----------|----------------|
| MonthNav buttons | 4px 12px | ~22px | **-22px** |
| Tabs (`.tab`) | 9px 4px | ~31px | **-13px** |
| Finance metric selector | 4px 10px | ~22px | **-22px** |
| Finance sub-tabs | igual que `.tab` | ~31px | **-13px** |
| "Pantalla completa" button | 3px 8px | ~17px | **-27px** |

Los botones de MonthNav y el selector de métricas son virtualmente imposibles
de tocar con precisión en un iPhone estándar.

**Fix por componente**:
- MonthNav: `min-height: 44px`, padding vertical a `12px`
- `.tab`: padding a `12px var(--space-2)` → ~38px + line-height OK
- Finance metric pills: `min-height: 36px` (contexto secundario, no primario)
- Expand button: `min-height: 36px`, icono más grande

---

### 4. Forms sin atributos de teclado móvil (ALTO)

`PayslipForm.tsx` y `F572Form.tsx` no tienen:
- `inputMode="decimal"` en campos numéricos → muestra teclado QWERTY en iOS
- `type="number"` o `pattern="[0-9]*"` → sin validación de entrada
- `enterKeyHint="next"` / `enterKeyHint="done"` → sin contexto de flujo
- `autoComplete="off"` → sugerencias de autocomplete inapropiadas en campos de salario

Un usuario cargando su recibo manualmente necesita ingresar ~8 campos numéricos.
Sin `inputMode="decimal"` cada campo abre el teclado full — experiencia lenta.

**Fix**: 2 líneas por input en PayslipForm + F572Form.

---

### 5. SVG charts — legibilidad a 375px (ALTO)

Todos los charts usan `viewBox` fijo + `width: 100%`. El SVG escala, pero:

| Chart | viewBox W | viewBox H | Ratio | A 375px → |
|-------|-----------|-----------|-------|-----------|
| IncomeCurveView | 760 | 240 | 3.17:1 | 119px alto, labels 8px |
| CashFlowView | 680 | 200 | 3.4:1 | 110px alto, labels 7px |
| SavingsView | 720 | 220 | 3.27:1 | 114px alto, labels 8px |
| NetWorthView (history) | — | — | — | pendiente de check |

A 375px de ancho, todos los charts colapsan a ~110-120px de alto.
El texto Y-axis (labels) cae a 7-8px — ilegible. Los puntos del line chart
quedan tan juntos que el hover/tap no resuelve nada.

**Opciones**:

**A — viewBox responsive con JS** (recomendado para este stack):
Usar `ResizeObserver` o CSS container queries para cambiar el `viewBox` y
padding según el ancho del contenedor. A <480px, reducir CHART_W divisor
y aumentar PAD_L para labels más visibles.

**B — Chart height mínimo garantizado**:
Wrapping div con `min-height: 180px` + `aspect-ratio: unset` en mobile.
SVG usa altura fija en mobile (`height={200}` en lugar de `height="100%"`).

**C — Chart alternativo scroll horizontal** (solo para más de 24 puntos):
Mantener SVG nativo width pero hacer el container scrollable con
`overflowX: scroll` + `scrollbar-width: none`. Agregar fade gradient en bordes.

Approach C ya está implementado como fallback (`overflowX: 'auto'`).
Approach A da mejor resultado pero requiere más trabajo.
**Recomendación**: A para IncomeCurveView (línea temporal larga = más datos),
C mejorado para CashFlowView y SavingsView (barras = scroll natural).

---

### 6. Arquitectura de navegación — doble tab bar (ALTO)

Jerarquía actual en mobile:

```
[Resumen] [F.572] [✏️ Datos] [$ Finanzas]   ← tab bar principal
                                    ↓ al entrar a Finanzas:
          [Ingresos] [Gastos] [Patrimonio] [Ahorro]   ← segunda tab bar
```

Dos tab bars apiladas consumen ~80px antes del contenido en mobile.
La navegación anidada no es idiomática en iOS (iOS usa push navigation o
segmented controls para niveles secundarios).

**Alternativas**:

**A — Segmented control en lugar de segunda tab bar** (recomendado):
Finance sub-tabs se convierten en un segmented control estilo iOS dentro
del contenido. Una sola tab bar principal. El scroll selector no ocupa
espacio de navegación primario.

**B — Bottom navigation bar** (más nativo, más trabajo):
Las 4 secciones principales van a una bottom nav fija. Finance sub-sections
van a un picker en el header de la sección. Requiere mover el `.tab` a bottom.

**C — Status quo mejorado**:
Mantener doble tab pero reducir altura de cada una a 36px, y que la segunda
quede sticky bajo el header. Mínimo cambio, mínimo impacto.

**Recomendación**: A (segmented control en Finance) como paso inmediato.
Bottom nav puede ser spec 013 si el uso mobile crece.

---

### 7. Inline styles en componentes Finance (MEDIO)

Todos los componentes `src/finance/components/` usan inline styles extensivamente
en lugar de las clases CSS del sistema (`src/index.css`).

Impacto:
- Inconsistencia visual vs sección principal (dark mode puede tener diferencias)
- Sin poder hacer override global desde tokens
- Hard to audit / refactor

Inventario de componentes afectados:
- `IncomeCurveView.tsx` — ~100% inline
- `CashFlowView.tsx` — ~100% inline
- `NetWorthView.tsx` — ~100% inline
- `SavingsView.tsx` — ~100% inline
- `FinanceDashboard.tsx` — mayormente inline
- `MonthNav.tsx` — 100% inline (+ tokens rotos, ver #1)
- `HeroStats.tsx` — 100% inline (+ hardcoded colors, ver #2)

**Fix**: crear `src/finance/finance.css` con clases para los patrones repetidos,
y migrar inline → className gradualmente. No rompe nada; es refactor.

---

### 8. Fullscreen chart expand — safe areas (BAJO-MEDIO)

Los charts usan `position: fixed, inset: 0` para pantalla completa.
No compensan `env(safe-area-inset-*)` → el contenido queda bajo el notch en
iPhone 14+ y bajo la home indicator al fondo.

Fix: en el container fullscreen, agregar:
```css
padding-top: env(safe-area-inset-top, 0);
padding-bottom: env(safe-area-inset-bottom, 0);
```

---

### 9. No hay scroll bounce / overscroll containment (BAJO)

Listas de cards y panels sin `overscroll-behavior: contain` permiten que el
scroll se propague al body en iOS, causando el "rubber band" en el contenedor
equivocado.

Fix: agregar `overscroll-behavior-y: contain` a `.panel-left` y `.panel-right`.

---

### 10. Sin skeleton / loading states en Finance (BAJO)

Finance views calculan sincronamente (data en localStorage), así que no hay
lag real. Pero si `buildPowerCurve` o `computeSavingsAnalysis` se vuelve lento
con más datos, no hay feedback visual.

Fix preventivo: `<Suspense>` con fallback de skeleton para las secciones de chart.
Baja prioridad hasta que haya datos de performance reales.

---

## Prioridades de implementación

| # | Issue | Impacto | Esfuerzo | Sprint |
|---|-------|---------|---------|--------|
| 1 | Token names en MonthNav | CRÍTICO visual | 5min | Ahora |
| 2 | HeroStats hardcoded colors | CRÍTICO dark mode | 20min | Ahora |
| 3 | Touch targets | CRÍTICO mobile | 1h | Sprint 1 |
| 4 | Form inputMode | Alto | 30min | Sprint 1 |
| 5 | SVG chart legibilidad mobile | Alto | 2-3h | Sprint 1 |
| 6 | Doble tab bar → segmented | Alto | 1.5h | Sprint 1 |
| 7 | CSS classes en Finance | Medio | 3-4h | Sprint 2 |
| 8 | Fullscreen safe areas | Bajo-Medio | 15min | Sprint 1 |
| 9 | Overscroll containment | Bajo | 10min | Sprint 1 |
| 10 | Skeletons | Bajo | — | Backlog |

---

## PWA / instalación (fuera de scope pero a notar)

`index.html` ya tiene:
- `viewport-fit=cover` ✓
- `apple-mobile-web-app-capable` ✓
- `apple-touch-icon` referencia a `icon-192.png` (verificar si existe)
- `theme-color: #2563eb` ✓

Falta:
- `manifest.json` (para Android PWA / add to home screen)
- Service worker / offline caching
- Iconos en múltiples tamaños

No urgente para uso personal, pero trivial de agregar si se quiere instalar
como PWA en Android.

---

## Criterios de aceptación generales (spec 012)

1. MonthNav renderiza con los colores correctos del sistema de tokens
2. HeroStats usa variables CSS — correcto en light y dark mode
3. Todos los touch targets en el flujo primario ≥ 44px de alto
4. PayslipForm y F572Form muestran teclado numérico en iOS/Android
5. Charts legibles (labels ≥ 11px) en iPhone SE (375px ancho)
6. Finance no muestra dos tab bars apiladas en mobile
7. Fullscreen chart no queda bajo notch ni home indicator
8. `overscroll-behavior: contain` en panels con scroll
