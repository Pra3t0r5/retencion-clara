# Spec 012 — Information Architecture & User Flows

**Fecha**: 2026-05-25
**Fuentes**: Frank Rausch iOS Navigation Patterns, Apple HIG Tab Bars,
Eleken Fintech Design Guide, Prift case study, análisis del codebase.

---

## Estado actual — IA existente

```
┌─ Welcome (sin datos) ──────────────────────────────────┐
│  Pasos 1/2/3  +  UploadForms                           │
│  "Probar con datos de ejemplo →"                        │
└──────────────────────────────────────────────────────── ┘
        ↓ (carga recibo)

┌─ App principal ────────────────────────────────────────┐
│  Header: nombre empleador · período                    │
│  MonthNav: [Ene][Feb]...[+ Agregar mes]                │
│                                                        │
│  TABS NIVEL 1:                                         │
│  [Resumen] [F.572] [✏️ Datos] [$ Finanzas]             │
│                                                        │
│  ├── Resumen    → HeroStats + RetentionChart + Cards   │
│  ├── F.572      → Detalle deducciones declaradas       │
│  ├── Datos      → PDFDropzone × 2 + PayslipForm        │
│  └── Finanzas                                          │
│        TABS NIVEL 2 (anidadas):                        │
│        [Ingresos][Gastos][Patrimonio][Ahorro]           │
│        ├── Ingresos   → línea USD nominal/real         │
│        ├── Gastos     → barras income vs expenses      │
│        ├── Patrimonio → donut + snapshot form          │
│        └── Ahorro     → barras income vs ΔPatrimonio   │
└──────────────────────────────────────────────────────── ┘
```

### Problemas estructurales (IA level, no UI level)

| # | Problema | Principio violado |
|---|----------|-------------------|
| A | "Datos" es una acción, no un destino | HIG: tabs = navigation, not actions |
| B | Tabs nivel 2 dentro de Finanzas | Frank Rausch: anti-pattern, "nested tab bars" |
| C | Tax Calculator y Finance Dashboard son herramientas distintas mezcladas en mismo nivel | HIG: tabs para peers de igual jerarquía |
| D | Welcome screen es flujo step-by-step embebido en shell de la app | HIG: onboarding = modal step-by-step, no estructura paralela |
| E | MonthNav vive fuera de tabs → aplica globalmente incluso en Finanzas (donde no tiene sentido) | Jerarquía incorrecta: elemento de contexto aparece fuera de su scope |
| F | En desktop, Resumen siempre visible en panel derecho — pero tab "Resumen" existe en mobile con misma info | Duplicación estructural: mismo contenido en dos lugares según breakpoint |

---

## Propuesta — IA rediseñada

### Principio guía

**Dos herramientas, dos flujos distintos:**

- **Retención** = tarea puntual mensual. Usuario entra, carga o revisa datos del mes, ve resultado, sale. Flujo goal-oriented, no exploración.
- **Finanzas** = panel de monitoreo continuo. Usuario explora tendencias, no hay "tarea" a completar. Flujo exploratory.

Estos dos modos de uso justifican separación en tabs de primer nivel.

---

### Estructura propuesta

```
┌─ App ─────────────────────────────────────────────────────┐
│                                                           │
│  TABS NIVEL 1 (bottom nav o top, 2 items):                │
│  [🧾 Retención]  [📊 Finanzas]                            │
│                                                           │
│  ─── TAB: Retención ───────────────────────────────────   │
│                                                           │
│  MonthNav: [Ene][Feb]...[+ Nuevo mes]   (scope correcto) │
│                                                           │
│  SEGMENTED CONTROL (no tab bar):                          │
│  [Resumen | F.572 | Detalle]                              │
│                                                           │
│  ├── Resumen  → HeroStats + RetentionChart + Proyección  │
│  ├── F.572    → Deducciones declaradas vs aplicadas      │
│  └── Detalle  → DetalleCalculo expandido                 │
│                                                           │
│  FAB / Botón primario: "Cargar recibo"                    │
│    → Modal sheet (step-by-step):                          │
│      Paso 1: PDF dropzone recibo                          │
│      Paso 2: PDF dropzone F.572 (o saltar)               │
│      Paso 3: Confirmación / revisión manual               │
│      → dismiss → regresa a Retención con data cargada    │
│                                                           │
│  ─── TAB: Finanzas ────────────────────────────────────   │
│                                                           │
│  SEGMENTED CONTROL (no tab bar):                          │
│  [Ingresos | Gastos | Patrimonio | Ahorro]                │
│                                                           │
│  ├── Ingresos   → IncomeCurveView (sin cambios)          │
│  ├── Gastos     → CashFlowView (sin cambios)             │
│  ├── Patrimonio → NetWorthView (sin cambios)             │
│  └── Ahorro     → SavingsView (sin cambios)              │
│                                                           │
└─────────────────────────────────────────────────────────── ┘
```

---

## Flujos de usuario

### Flujo 1 — Primera vez (onboarding)

```
App abre (sin datos localStorage)
      │
      ▼
Welcome screen (estructura actual OK)
  ├── "Probar con demo →"  ──────────────────────────┐
  │                                                  ▼
  └── [PDF dropzone]                         Carga demo data
        │                                           │
        ▼                                           │
  Extracción PDF                                    │
        │                                           │
        ▼                                           ▼
  Revisión campos ──────────────────────────► TAB Retención
  (modal o inline)                            MonthNav visible
                                              Resumen con data
```

### Flujo 2 — Usuario recurrente (uso mensual típico)

```
App abre (tiene datos de meses anteriores)
      │
      ▼
TAB Retención — MonthNav muestra meses previos
      │
      ├── [Mes anterior seleccionado] → ve Resumen del mes
      │         ├── quiere ver F.572 → Segmented → F.572
      │         └── quiere ver más detalle → Segmented → Detalle
      │
      └── "Cargar recibo" (FAB)
              │
              ▼
          Modal step-by-step
          Paso 1: drop recibo PDF → extrae → muestra campos
          Paso 2: drop F.572 PDF → extrae → muestra campos
          Paso 3: confirmar / editar campos manuales
          [Guardar]
              │
              ▼
          Modal dismiss → Retención muestra nuevo mes
          MonthNav agrega nuevo chip
```

### Flujo 3 — Exploración de finanzas

```
TAB Finanzas
      │
      ├── Segmented: [Ingresos] seleccionado por default
      │       └── ve curva USD nominal/real desde 2022
      │             ├── tap en punto → tooltip con detalle mes
      │             └── expand → fullscreen chart
      │
      ├── tap [Gastos]
      │       └── ve barras income vs expenses
      │             └── si no hay CSV → empty state con CTA "Importar CSV"
      │
      ├── tap [Patrimonio]
      │       └── ve donut + history
      │             └── botón "Agregar snapshot" → inline form expand
      │                 (no modal — los datos son simples)
      │
      └── tap [Ahorro]
              └── ve barras ingreso vs ΔPatrimonio
```

### Flujo 4 — Comparar meses (flujo actual, mantener)

```
TAB Retención → MonthNav (≥ 2 meses)
      │
      └── "¿Por qué cambió mi retención? →"
              │
              ▼
          Modal overlay: ComparacionSIRADIG
          (estructura actual está bien — es modal correcto)
              │
              ▼
          Dismiss → vuelve a Retención
```

---

## Cambios estructurales requeridos

### 1 — Convertir tabs anidadas de Finanzas a segmented control

**Antes** (`FinanceDashboard.tsx`):
```tsx
<div className="tabs">
  {SUB_TABS.map(t => <button className={`tab...`} />)}
</div>
```

**Después** — segmented control separado visualmente del tab bar principal:
```tsx
<div className="segmented-control">
  {SUB_TABS.map(t => <button className={`segment...`} />)}
</div>
```

CSS diferencia: `.segmented-control` tiene border-radius total (pill shape),
height 32px (no 44px — es control secundario), background sólido activo.
Contrasta visualmente con `.tabs` principal.

---

### 2 — Mover "Datos" de tab a modal step-by-step

Tab actual "✏️ Datos" = `UploadForms` component.
Convertir a modal sheet con 3 pasos: recibo PDF → F.572 PDF → revisión.

Ventajas:
- Tab bar baja de 4 items a 3 (mejor densidad de info)
- Carga de datos es una tarea, no un destino → modal es el patrón correcto (HIG)
- El flujo step-by-step guided es más claro que dos dropzones sueltas

**Trigger**: botón "Cargar recibo" en Retención tab, visible siempre.
En mobile: botón sticky al fondo del panel. En desktop: en el header.

---

### 3 — Restringir MonthNav al scope de Retención

MonthNav hoy vive en `App.tsx` fuera de cualquier tab → renderiza en todos los tabs.
En Finanzas no tiene sentido (Finanzas opera sobre toda la historia, no un mes).

Mover MonthNav adentro de la vista de Retención.

---

### 4 — Reducir tabs principales de 4 a 2

Antes: `[Resumen][F.572][Datos][Finanzas]`
Después: `[🧾 Retención][📊 Finanzas]`

- Retención contiene: MonthNav + segmented [Resumen|F.572|Detalle] + FAB "Cargar"
- Finanzas contiene: segmented [Ingresos|Gastos|Patrimonio|Ahorro]

En desktop: mantener 2-column layout. Panel izquierdo = tab navigation.
Panel derecho = Resumen (siempre visible). Sin cambios en breakpoint lógica.

---

## Comparación: antes vs después

| Aspecto | Antes | Después |
|---------|-------|---------|
| Tabs nivel 1 | 4 items | 2 items |
| Tabs nivel 2 | 4 (en Finanzas) | 0 (segmented control) |
| Niveles de navegación | 2 | 1 |
| Carga de datos | Tab permanente | Modal step-by-step |
| MonthNav scope | Global (toda la app) | Solo Retención |
| Flujo onboarding | Screen paralela | Welcome → data → app (igual) |
| Comparar meses | Botón en MonthNav → modal | Igual (está bien) |

---

## Lo que NO cambia

- Welcome screen (funciona, no romper)
- ComparacionSIRADIG (modal correcto, mantener)
- Desktop 2-column layout (correcto, mantener)
- Dark mode / tokens (mantener)
- Todo el engine / calculadora (sin cambios)
- FinanceDashboard sub-views internamente (sin cambios de lógica)
