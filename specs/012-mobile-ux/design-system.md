# RetenciónClara — Design System

**Versión**: 1.0
**Fecha**: 2026-05-25
**Fuentes**: Apple HIG, Frank Rausch iOS Navigation Patterns, Eleken Fintech Guide,
análisis del codebase, spec 012 UX audit.

Este documento es la fuente de verdad para decisiones de diseño e implementación.
Todo PR que toque UI debe respetar estas reglas. Si la regla no cubre el caso → agregar la regla aquí antes de implementar.

---

## 1. Principios

### 1.1 Una fuente de verdad visual
Todo valor visual (color, espacio, radio, sombra, tipografía) vive en `src/styles/tokens.css`.
**Regla**: cero hex hardcodeados fuera de `tokens.css`. Cero valores numéricos de px hardcodeados en JSX. Sin excepciones.

### 1.2 Clases CSS sobre inline styles
Los componentes usan `className` + clases en `src/index.css` o `src/finance/finance.css`.
Inline `style={}` solo para valores dinámicos que no se pueden expresar con clases (ej: `width: ${pct}%` en barras de chart). No para colores, espaciado, o tipografía estáticos.

### 1.3 Tokens antes que variantes hardcodeadas
Si un nuevo color semántico aparece, se agrega a `tokens.css` con nombre semántico. No se escribe el hex en el componente.

### 1.4 Mobile first, progressive enhancement
Breakpoint único: `768px`. Todo lo de abajo es mobile. Todo lo de arriba es desktop enhancement. Desktop no quita features — agrega espacio.

### 1.5 Teclado mínimo 44px
Todo elemento interactivo debe tener hit area ≥ 44px de alto en mobile. Controles secundarios pueden bajar a 36px si están en contexto claramente secundario (metric pills, expand buttons).

### 1.6 Progressive disclosure
El dashboard muestra lo esencial. El detalle se accede con una interacción. Nunca esconder información necesaria para tomar una decisión — si el usuario necesita el dato para actuar, está en el primer nivel.

---

## 2. Tokens — `src/styles/tokens.css`

### 2.1 Colores (estado actual — correcto)

```css
/* Neutrals */
--color-bg:           #f8fafc   /* slate-50  */
--color-surface:      #ffffff
--color-border:       #e2e8f0   /* slate-200 */
--color-border-input: #cbd5e1   /* slate-300 */
--color-text:         #0f172a   /* slate-950 */
--color-text-muted:   #64748b   /* slate-500 */
--color-text-subtle:  #94a3b8   /* slate-400 */

/* Primary */
--color-primary:       #2563eb
--color-primary-dark:  #1d4ed8
--color-primary-bg:    #eff6ff
--color-primary-border: #bfdbfe

/* Semantic */
--color-danger:      #dc2626   --color-danger-bg:   #fef2f2
--color-success:     #16a34a   --color-success-bg:  #f0fdf4
--color-warning:     #d97706   --color-warning-bg:  #fffbeb
```

### 2.2 Tokens faltantes — AGREGAR a `tokens.css`

```css
/* Orange para "Pendiente" / warning-alt (actualmente hardcoded en HeroStats) */
--color-pending:     #ea580c   /* orange-600 */
--color-pending-bg:  #fff7ed   /* orange-50  */

/* Surface elevado — cards dentro de cards, tooltips */
--color-surface-elevated: #f8fafc  /* light: same as bg; dark: slightly lighter */

/* Chart colors — paleta fija para modalities y categorías */
--color-chart-contractor:  #a78bfa   /* violet-400 */
--color-chart-ars:         #fb923c   /* orange-400 */
--color-chart-split:       #fbbf24   /* amber-400 */
--color-chart-usd:         #16a34a   /* green-600 */
--color-chart-deel:        #2563eb   /* blue-600  */
--color-chart-manual:      #64748b   /* slate-500 */
```

Dark mode: agregar overrides correspondientes en el bloque `prefers-color-scheme: dark`.

### 2.3 Espaciado — 4px base grid (correcto, no modificar)

```
--space-1: 4px   --space-2: 8px    --space-3: 12px   --space-4: 16px
--space-5: 20px  --space-6: 24px   --space-8: 32px   --space-10: 40px
--space-12: 48px --space-16: 64px
```

**Regla**: todo margin, padding, gap usa una variable `--space-N`. Nada intermedio. Si hace falta 6px → usar `--space-1` + `--space-2` como padding. Si hace falta un valor nuevo → agregar al scale y documentar aquí.

### 2.4 Tipografía (correcto, no modificar)

```
--text-xs:   11px   caption, badges, sub-labels
--text-sm:   13px   body small, rows, tabs
--text-base: 16px   body
--text-lg:   20px   stat values
--text-xl:   24px   large values
--text-2xl:  28px   display
```

**Regla mínima**: ningún texto visible al usuario debajo de `--text-xs` (11px). Labels de chart axis: `--text-xs` mínimo.

### 2.5 Shape

```
--radius-sm:  8px    inputs, botones, chips
--radius:    14px    cards, panels
--radius-lg: 20px    modales, bottom sheets
```

### 2.6 Sombras

```
--shadow-sm: 0 1px 2px rgba(0,0,0,.06)         inputs en focus
--shadow:    0 1px 3px rgba(0,0,0,.08), ...     cards
```

---

## 3. Componentes — Catálogo y Reglas

### 3.1 Card `.card`

**Cuándo usar**: agrupar información relacionada con título visible.
**Cuándo NO usar**: listas largas (usar rows directamente), contenido que debería ser inline.

```css
.card {
  background: var(--color-surface);
  border-radius: var(--radius);
  border: 1px solid var(--color-border);
  padding: var(--space-4);
  margin-bottom: 14px;
  box-shadow: var(--shadow);
}
.card-title { font-size: 14px; font-weight: 600; margin-bottom: var(--space-3); }
```

**Regla**: padding siempre `var(--space-4)`. Margin-bottom siempre `14px` (valor calibrado — no tocar). Title siempre 14px/600.

---

### 3.2 Row `.row` / `.row.highlight`

**Cuándo usar**: par label:value dentro de una Card.
**Regla**: no agregar bordes entre rows — el espaciado (7px vertical) separa. Usar `.divider` para separar secciones dentro de una card.

```css
.row            { display: flex; justify-content: space-between; padding: 7px 0; font-size: 13px; }
.row-label      { color: var(--color-text-muted); }
.row-value      { color: var(--color-text); }
.row.highlight  { font-weight: 600; color: var(--color-primary); }  /* ambas columnas */
.divider        { height: 1px; background: var(--color-border); margin: var(--space-1) 0; }
```

---

### 3.3 Tab Bar `.tabs` / `.tab`

**Cuándo usar**: navegación de primer nivel entre secciones peer. Máximo 4 items en mobile.
**Cuándo NO usar**: selección de opciones dentro de una vista (→ usar Segmented Control). Acciones (→ usar Button). Subsecciones de un tab (→ anti-pattern, usar Segmented).

```css
.tabs {
  display: flex; gap: var(--space-1);
  background: var(--color-border);
  border-radius: 10px; padding: var(--space-1);
  margin-bottom: var(--space-5);
}
.tab {
  flex: 1; padding: 12px var(--space-2);   /* ← 12px vertical para hit area ≥ 44px */
  border: none; border-radius: var(--radius-sm);
  font-size: var(--text-sm); font-weight: 500;
  background: transparent; color: var(--color-text-muted);
  -webkit-tap-highlight-color: transparent;
  transition: background 150ms ease, color 150ms ease;
}
.tab.active { background: var(--color-surface); color: var(--color-text); box-shadow: var(--shadow); }
```

**Regla crítica**: `padding-top/bottom: 12px` mínimo para hit area ≥ 44px. Actual (9px) es incorrecto.

---

### 3.4 Segmented Control `.segmented` / `.segment` ← NUEVO

**Cuándo usar**: selector de vista/modo dentro de una sección. Subsecciones de Finance. Toggles de métrica en charts. Reemplaza los "sub-tabs" nested.
**Cuándo NO usar**: navegación primaria (→ Tab Bar). Más de 4 opciones con texto largo (→ considerar picker).

```css
.segmented {
  display: flex; gap: 2px;
  background: var(--color-border);
  border-radius: var(--radius-sm);
  padding: 2px;
  margin-bottom: var(--space-4);
}
.segment {
  flex: 1; padding: 6px var(--space-2);   /* 32px alto — control secundario OK */
  border: none; border-radius: 6px;
  font-size: var(--text-xs); font-weight: 500;
  background: transparent; color: var(--color-text-muted);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 150ms ease, color 150ms ease;
}
.segment.active { background: var(--color-surface); color: var(--color-text); box-shadow: var(--shadow-sm); }
```

**Diferencia visual con Tab Bar**: más pequeño (xs vs sm), sin margen inferior grande, pill más compacto. El usuario distingue "estoy dentro de una sección" vs "estoy eligiendo sección".

---

### 3.5 Month Chip `.month-chip` / `.month-chip.active` ← NUEVO (reemplaza MonthNav inline)

**Cuándo usar**: selector de mes en la vista de Retención.
**Regla**: hit area mínimo 44px.

```css
.month-nav { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-bottom: var(--space-4); padding-bottom: var(--space-3); border-bottom: 1px solid var(--color-border); }
.month-chip {
  padding: 10px 14px;   /* 44px hit area con line-height */
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-size: var(--text-sm); font-weight: 400;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: border-color 150ms, color 150ms;
}
.month-chip.active {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
  color: var(--color-primary);
  font-weight: 600;
}
.month-chip.add {
  border-style: dashed;
  color: var(--color-text-subtle);
}
```

---

### 3.6 Hero Stat Card `.stat-card`

**Cuándo usar**: métricas primarias de la vista de Retención (retenido, recuperado, pendiente).
**Regla**: 3 cards máximo. Usar tokens semánticos, nunca hex. Grid 3 columnas en mobile con `min-width: 0` para prevenir overflow.

Colores por semántica:
- Retenido → `--color-danger` / `--color-danger-bg`
- Recuperado → `--color-success` / `--color-success-bg`
- Pendiente → `--color-pending` / `--color-pending-bg`

```css
.stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-2); margin-bottom: 14px; }
.stat-card { border-radius: var(--radius); padding: var(--space-3) var(--space-2); text-align: center; min-width: 0; }
.stat-card.danger  { background: var(--color-danger-bg); }
.stat-card.success { background: var(--color-success-bg); }
.stat-card.pending { background: var(--color-pending-bg); }
.stat-label { font-size: var(--text-xs); opacity: .8; margin-bottom: var(--space-1); }
.stat-value { font-size: clamp(14px, 4vw, 20px); font-weight: 700; }
.stat-sub   { font-size: var(--text-xs); opacity: .65; margin-top: var(--space-1); }
```

---

### 3.7 Form Inputs `.form-input`

**Regla mobile crítica**: todo `<input>` numérico debe tener:
```tsx
inputMode="decimal"
autoComplete="off"
```
Campos de texto libre: `autoComplete="off"` si es dato financiero privado.
Último campo de un flujo: `enterKeyHint="done"`. Campos intermedios: `enterKeyHint="next"`.

**Hit area**: el `<label>` debe ser clickable y extender el área del input.

---

### 3.8 Charts — SVG

**Regla de dimensiones**: ningún chart tiene `SVG_W` hardcodeado sin compensar viewBox responsive.

**Patrón correcto**:
```tsx
const SVG_W = 680;  // viewBox reference width
const SVG_H = 220;  // viewBox reference height — mantener aspect ratio ≥ 0.28 (220/680 mínimo)
// ...
<svg
  viewBox={`0 0 ${SVG_W} ${SVG_H}`}
  style={{ width: '100%', display: 'block' }}
  preserveAspectRatio="xMidYMid meet"
/>
```

**Regla de labels**: font-size en SVG text elements mínimo `10` (equivale a ~10px en viewBox = ~6px en mobile, al límite). Para labels críticos usar `12`. Para axis ticks: `9` en viewBox (escala a ~6px en mobile — aceptable para referencia, no para datos).

**Regla de padding**: `PAD_L` suficiente para labels Y-axis (mínimo 48px en viewBox). `PAD_B` suficiente para labels X-axis (mínimo 28px).

**Patrón de expand a fullscreen**:
```tsx
// Safe areas en fullscreen:
position: 'fixed', inset: 0,
paddingTop: 'env(safe-area-inset-top, 0px)',
paddingBottom: 'env(safe-area-inset-bottom, 16px)',
```

**Colores de chart**: usar variables `--color-chart-*` definidas en tokens. No hex inline.

---

### 3.9 Empty State `.empty-state`

Sin cambios en estructura actual. Siempre incluye: icono + título + descripción. Opcionalmente: CTA button. Centrado vertical con padding generoso.

---

### 3.10 Modal / Sheet

**Cuándo usar**: tareas autocontenidas (cargar datos, confirmar acción destructiva). Flujos step-by-step.
**Cuándo NO usar**: contenido informacional que se puede mostrar inline. Subsecciones de navegación.

Implementar como `position: fixed; inset: 0; z-index: 100` con backdrop semitransparente. Bottom sheet en mobile (slide desde abajo, border-radius top).

---

### 3.11 FAB (Floating Action Button) `.fab` ← NUEVO

**Cuándo usar**: acción primaria de la vista (cargar recibo en Retención).
**Cuándo NO usar**: acciones secundarias o destructivas.

```css
.fab {
  position: sticky; bottom: calc(var(--space-5) + env(safe-area-inset-bottom, 0px));
  display: block; width: 100%;
  padding: var(--space-3) var(--space-4);
  background: var(--color-primary);
  color: #fff; border: none;
  border-radius: var(--radius-sm);
  font-size: var(--text-sm); font-weight: 600;
  cursor: pointer; text-align: center;
  box-shadow: 0 4px 12px rgba(37, 99, 235, .35);
  transition: background 150ms;
}
.fab:hover { background: var(--color-primary-dark); }
```

En desktop: no sticky, inline en el header.

---

## 4. Navegación — Reglas Absolutas

### 4.1 Tab Bar (nivel 1)

- **Máximo 4 items** en la tab bar principal de mobile.
- **Solo navegación**, nunca acciones. Cargar datos = modal, no tab.
- **Tab bar nunca anidada**. Si una sección necesita sub-selección → Segmented Control.
- **Siempre visible** en todas las pantallas excepto bajo modal fullscreen.
- Cada tab **mantiene su estado** (scroll position, sub-tab activo) al volver.

### 4.2 Segmented Control (nivel 2)

- Reemplaza sub-tabs en Finance Dashboard.
- Máximo 4 segmentos.
- Tipografía `--text-xs` (distinguible del Tab Bar `--text-sm`).
- Estado activo: surface blanco con shadow-sm. Estado inactivo: transparente.

### 4.3 Push / Drill-down

- Para jerarquías: lista → detalle, mes → detalle mes.
- Back button visible con título del padre.
- Swipe right to go back (nativo, no implementar manualmente).

### 4.4 Modal

- Para tareas autocontenidas con principio y fin.
- Siempre dismissable (tap backdrop, swipe down, o botón X/Cancelar explícito).
- Datos en proceso: confirmar antes de dismiss si hay cambios no guardados.

---

## 5. Arquitectura de Información — Reglas

### 5.1 Estructura de tabs

```
[🧾 Retención]    [📊 Finanzas]
```

Dos tabs. No más. "Datos" es tarea (modal), no destino (tab).

### 5.2 Scope de componentes

| Componente | Scope correcto |
|------------|----------------|
| MonthNav | Solo dentro de la vista Retención |
| HeroStats | Solo en Retención › Resumen |
| FinanceDashboard | Solo dentro de la tab Finanzas |
| ComparacionSIRADIG | Modal (correcto — mantener) |

### 5.3 Jerarquía de información por vista

**Retención › Resumen** (orden visual top → bottom):
1. HeroStats (3 métricas clave) — lo más importante, inmediatamente visible
2. RetentionChart — progresión mensual
3. Gap F.572 card (si hay data)
4. Proyección próximo mes card
5. Proyección anual card
6. DetalleCalculo (collapsed por default — progressive disclosure)

**Finanzas › Ingresos**:
1. Segmented control métrica (nominalUSD | realUSD | realARS | canastas)
2. Chart
3. Tabla de datos (collapsed o scrollable)

**Finanzas › Patrimonio**:
1. Snapshot más reciente → donut + total
2. Historia (chart)
3. "Agregar snapshot" → inline expand (no modal — es simple)

### 5.4 Qué va en primer nivel vs drill-down

| Primer nivel (visible sin tap) | Drill-down (requiere tap) |
|-------------------------------|--------------------------|
| Retención del mes | Cálculo paso a paso |
| Recuperado estimado F.572 | Detalle cuota médica mes a mes |
| Pendiente de acreditar | Proyección con todas las variables |
| Tendencia de ingreso (chart) | Tabla de datos históricos |
| Patrimonio neto total | Desglose por activo |

---

## 6. Overflow y Scroll

### 6.1 Containment

Todo panel con scroll propio debe tener:
```css
overscroll-behavior-y: contain;
```
Previene que el bounce de iOS se propague al body.

### 6.2 Charts horizontales

Charts con muchos datos (>18 puntos) pueden usar scroll horizontal en mobile.
Container:
```css
overflow-x: auto;
scroll-snap-type: x proximity;
scrollbar-width: none;     /* Firefox */
-ms-overflow-style: none;  /* IE/Edge */
```
```css
::-webkit-scrollbar { display: none; }
```

Siempre agregar fade gradient en el borde derecho para indicar scroll disponible:
```css
mask-image: linear-gradient(to right, black 85%, transparent 100%);
```

---

## 7. Archivos CSS — Estructura

```
src/
  styles/
    tokens.css       ← ÚNICA fuente de tokens. Todo PR que agrega token lo pone aquí.
  index.css          ← Componentes del Tax Calculator (main app)
  finance/
    finance.css      ← Componentes del Finance Dashboard ← CREAR
```

**Regla de importación**: `finance.css` importado en `FinanceDashboard.tsx` con `import './finance.css'`.
**Regla de naming**: clases del namespace `finance-` para evitar colisiones con `index.css`.

Ejemplo:
```css
/* finance.css */
.finance-chart-container { ... }
.finance-table { ... }
.finance-metric-pill { ... }   /* reemplaza inline metric selector */
```

---

## 8. Dark Mode

Ya implementado vía `prefers-color-scheme: dark`. Reglas:

1. **Nunca** usar hex fuera de `tokens.css` — dark mode es imposible con hex hardcodeados.
2. Todo nuevo token tiene su override en el bloque dark de `tokens.css`.
3. Verificar contraste en dark mode antes de mergear cualquier nuevo componente visual.
4. Colores de chart: la paleta `--color-chart-*` ya está ajustada para dark mode (colores 400 en vez de 600 para mayor contraste sobre dark surface).

---

## 9. Checklist de PR — UI/UX

Antes de abrir un PR con cambios de UI, verificar:

- [ ] Cero hex hardcodeados fuera de `tokens.css`
- [ ] Cero inline styles para valores estáticos (color, font-size, spacing)
- [ ] Todo elemento interactivo ≥ 44px hit area (36px aceptable para controles secundarios)
- [ ] Inputs numéricos tienen `inputMode="decimal"`
- [ ] Charts tienen `viewBox` + `width: '100%'` (no width fijo)
- [ ] Charts fullscreen compensan `env(safe-area-inset-*)`
- [ ] MonthNav no aparece fuera del scope de Retención
- [ ] Tab bar principal ≤ 4 items
- [ ] No hay tab bars anidadas (sub-secciones usan Segmented Control)
- [ ] Nuevo token documentado en este archivo bajo sección 2.x
- [ ] Dark mode probado (o al menos inspeccionado)
- [ ] `overscroll-behavior: contain` en nuevos scroll containers

---

## 10. Deuda técnica catalogada

| Archivo | Deuda | Prioridad |
|---------|-------|-----------|
| `MonthNav.tsx` | Tokens rotos (`--border` en vez de `--color-border` etc.) + inline styles | CRÍTICA |
| `HeroStats.tsx` | Hex hardcodeados + `--card-bg` inexistente + dark mode roto | CRÍTICA |
| `FinanceDashboard.tsx` | Sub-tabs anidadas → convertir a Segmented Control | ALTA |
| `App.tsx` | Tab "Datos" → convertir a modal. 4 tabs → 2 tabs. MonthNav movido | ALTA |
| `PayslipForm.tsx` | Sin `inputMode`, sin `enterKeyHint` | ALTA |
| `F572Form.tsx` | Sin `inputMode`, sin `enterKeyHint` | ALTA |
| `IncomeCurveView.tsx` | Inline styles → `finance.css` | MEDIA |
| `CashFlowView.tsx` | Inline styles → `finance.css` | MEDIA |
| `NetWorthView.tsx` | Inline styles → `finance.css` | MEDIA |
| `SavingsView.tsx` | Inline styles → `finance.css` | MEDIA |
| Todos los charts | Fullscreen sin `env(safe-area-inset-*)` | MEDIA |
| `.panel-left`, `.panel-right` | Sin `overscroll-behavior: contain` | BAJA |
