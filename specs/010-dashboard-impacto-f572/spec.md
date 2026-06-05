# Feature Specification: Dashboard de Impacto del F.572 — "¿Cuánto recuperé?"

**Feature Branch**: `010-dashboard-impacto-f572`  
**Created**: 2026-04-26  
**Status**: Draft  

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Hero section: 3 números de impacto (Priority: P1)

Un usuario que ya cargó sus recibos y su F.572 abre la pantalla principal. Sin hacer ningún click adicional ve tres cifras grandes en la parte superior: cuánto le retuvieron en total, cuánto ya recuperó gracias al F.572, y cuánto queda pendiente de acreditar. Esto reemplaza las dos stat-cards actuales ("Retenido acumulado" y "Ahorro próx. mes est.").

**Why this priority**: Es la respuesta directa a las 3 preguntas que cualquier usuario hace al abrir la app. Sin este bloque el número "recuperado" no aparece en ningún lugar de la pantalla.

**Independent Test**: Con datos Mar + Abr cargados (el caso real de Fernando Albertengo 2026), la pantalla principal muestra las tres cifras sin ningún click. Un usuario sin conocimiento de impuestos puede responder "¿cuánto recuperaste?" en menos de 10 segundos mirando la pantalla.

**Acceptance Scenarios**:

1. **Given** el usuario tiene datos de al menos un mes cargados y datos F.572 cargados, **When** abre la pantalla principal, **Then** ve tres cards en la parte superior: "Retenido", "Recuperado" y "Pendiente" — en ese orden.

2. **Given** datos Ene–Abr cargados y F.572 aplicado en Abril (gap anterior > 0, gap actual = 0), **When** ve la card "Recuperado", **Then** muestra el ahorro materializado estimado (total_gap × tax_rate del último mes que tenía gap > 0) con badge "✓" y sublabel "gracias al F.572 est.".

3. **Given** gap actual = 0 (F.572 ya acreditado), **When** ve la card "Pendiente", **Then** muestra $0 con sublabel "todo acreditado ✓" (no desaparece).

4. **Given** gap actual > 0 (F.572 aún pendiente), **When** ve la card "Pendiente", **Then** muestra el monto pendiente con sublabel "sin acreditar".

5. **Given** viewport de 375px de ancho, **When** abre la pantalla principal, **Then** las tres cards son visibles sin scroll horizontal.

---

### User Story 2 — Anotación en el gráfico cuando se detecta aplicación de F.572 (Priority: P1)

El gráfico de barras mensual muestra el mes donde el empleador aplicó el F.572 retroactivamente, con una etiqueta visible directamente sobre la barra (no requiere hover ni tooltip).

**Why this priority**: Sin esta anotación el usuario ve que en Abril la retención bajó fuerte pero no puede distinguir "bajó por aumento de sueldo" de "bajó por F.572 aplicado". El gráfico queda sin explicación del evento más importante.

**Independent Test**: Con datos Mar + Abr cargados donde el gap cayó de > 100K a ≈ 0, el gráfico muestra la anotación "F.572 aplicado" visible sobre la barra de Abril sin ninguna interacción del usuario.

**Acceptance Scenarios**:

1. **Given** datos de dos meses consecutivos donde entre el primero y el segundo el gap total cayó de > $100.000 a ≈ $0 y la retención mensual bajó significativamente (> 20%), **When** el usuario ve el gráfico, **Then** el segundo mes (el de la aplicación) tiene una etiqueta visible "F.572 aplicado" sobre su barra.

2. **Given** datos donde no existe ese patrón (gap no cae de > 100K a ≈ 0 en ningún mes), **When** el usuario ve el gráfico, **Then** no aparece ninguna anotación espuria.

3. **Given** el usuario hace hover sobre una barra anotada, **When** aparece el tooltip, **Then** incluye el texto "Tu empleador aplicó el F.572 retroactivamente aquí".

---

### User Story 3 — Card de historial F.572 siempre visible (Priority: P1)

Una card que muestra el resumen del F.572 (Declarado | Acreditado | Pendiente) permanece visible mientras haya datos F.572 cargados, independientemente de si el gap es 0 o no. Cuando el gap es 0 muestra "Todo acreditado ✓" y el monto del ahorro. Cuando el gap > 0 muestra proyección de ahorro potencial.

**Why this priority**: La card actual ("Deducción no acreditada") desaparece cuando el gap = 0, eliminando la visibilidad justamente en el momento de mayor satisfacción para el usuario (el F.572 ya funcionó).

**Independent Test**: Con datos Abr cargados y gap = 0, la card F.572 historial es visible en pantalla mostrando "Todo acreditado ✓" y el monto materializado.

**Acceptance Scenarios**:

1. **Given** datos F.572 cargados y gap = 0, **When** el usuario ve la pantalla principal, **Then** la card F.572 muestra las tres cifras (Declarado, Acreditado, Pendiente = $0) y un badge "Todo acreditado ✓".

2. **Given** datos F.572 cargados y gap > 0, **When** el usuario ve la pantalla principal, **Then** la card F.572 muestra las tres cifras y la proyección de ahorro potencial ("si lo acredita, ahorrarías ~$X").

3. **Given** no hay datos F.572 cargados, **When** el usuario ve la pantalla principal, **Then** la card F.572 no aparece (comportamiento sin cambios respecto al estado actual).

---

### User Story 4 — Lenguaje simplificado en modal de comparación (Priority: P2)

El botón que abre el modal de comparación entre períodos usa lenguaje accesible, y dentro del modal los conceptos técnicos están reemplazados por frases comprensibles para alguien sin conocimiento de impuestos.

**Why this priority**: Mejora la comprensión del modal para usuarios no técnicos, pero no bloquea la funcionalidad P1 que resuelve el problema principal.

**Independent Test**: Mostrando la pantalla a alguien sin conocimiento de impuestos, puede entender qué esperar del botón antes de hacer click, y puede interpretar las filas del modal sin ayuda.

**Acceptance Scenarios**:

1. **Given** el usuario tiene dos meses para comparar, **When** ve el botón de comparación, **Then** el texto del botón es comprensible sin conocimiento de impuestos (ej. "¿Por qué cambió mi retención? →").

2. **Given** el usuario abre el modal de comparación, **When** lee las filas de desglose, **Then** ve "El impuesto se calcula desde enero" (no "Efecto acumulativo fiscal"), "F.572 aplicado en este período" (no "Rectificativa SIRADIG aplicada"), "Cambio en tu sueldo" (no "Cambio de salario bruto"), "Cambio de alícuota" (no "Cambio de tramo impositivo").

---

### Edge Cases

- ¿Qué muestra la card "Recuperado" si nunca hubo gap > 0? → muestra $0 sin badge, sublabel neutral.
- ¿Qué muestra si solo hay un mes cargado (no hay par de meses para detectar aplicación en gráfico)? → gráfico sin anotación.
- ¿Qué pasa si el gap cayó pero la retención no bajó significativamente (el umbral del 20%)? → no se anota como "F.572 aplicado" para evitar falsos positivos.
- ¿Funciona en modo demo (sin datos reales)? → las cards muestran los mismos datos demo que el resto de la pantalla.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La pantalla principal DEBE mostrar una hero section con tres cards (Retenido, Recuperado, Pendiente) reemplazando las dos stat-cards actuales.
- **FR-002**: La card "Retenido" DEBE mostrar `retencion_acumulada` del mes activo con sublabel "Ene–{mes}".
- **FR-003**: La card "Recuperado" DEBE mostrar el ahorro materializado estimado (`total_gap × tax_rate` del último mes que tenía gap > 0), etiquetado como "est.", con badge "✓" cuando > 0.
- **FR-004**: La card "Pendiente" DEBE mostrar el gap actual; cuando gap = 0 DEBE mostrar sublabel "todo acreditado ✓" (no puede desaparecer mientras haya datos F.572).
- **FR-005**: El gráfico DEBE detectar automáticamente los meses donde se aplicó el F.572 retroactivo (gap cayó de > $100.000 a ≈ $0 entre dos meses consecutivos y la retención mensual bajó > 20%).
- **FR-006**: El gráfico DEBE mostrar una etiqueta "F.572 aplicado" directamente visible sobre la barra del mes detectado, sin requerir interacción del usuario.
- **FR-007**: El tooltip de la barra anotada DEBE incluir el texto "Tu empleador aplicó el F.572 retroactivamente aquí".
- **FR-008**: La card de historial F.572 (Declarado | Acreditado | Pendiente) DEBE permanecer visible siempre que haya datos F.572 cargados, independientemente de si gap = 0.
- **FR-009**: Cuando gap = 0, la card historial F.572 DEBE mostrar badge "Todo acreditado ✓" y el monto del ahorro materializado.
- **FR-010**: Cuando gap > 0, la card historial F.572 DEBE mostrar proyección de ahorro potencial.
- **FR-011**: El botón de acceso al modal de comparación DEBE usar lenguaje accesible sin términos técnicos impositivos.
- **FR-012**: Las etiquetas internas del modal de comparación DEBEN usar lenguaje simplificado: "El impuesto se calcula desde enero", "F.572 aplicado en este período", "Cambio en tu sueldo", "Cambio de alícuota".
- **FR-013**: Todo el layout DEBE funcionar en viewport de 375px sin scroll horizontal.

### Key Entities

- **GapResult**: Resultado de `calcularGap()` — incluye `total_gap`, `tax_rate`, `ahorro_estimado`, `indumentaria_gap`, `cuota_medica_gap`, `indumentaria_declarada`, `indumentaria_aplicada`, `cuota_medica_declarada`, `cuota_medica_aplicada`.
- **PayslipData (mes activo)**: Incluye `retencion_acumulada`, `retencion_mes`, y la lista de meses históricos para el gráfico.
- **F572ApplicationEvent**: Derivado — mes donde se detecta que el gap cayó de > $100K a ≈ $0 y la retención mensual bajó significativamente.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Con datos Mar + Abr 2026 cargados, el número "Recuperado" es visible en la pantalla principal sin ningún click adicional (primera pantalla visible, primer scroll).
- **SC-002**: En el gráfico, el mes donde se detecta aplicación del F.572 tiene una anotación visible sin interacción del usuario.
- **SC-003**: La card F.572 muestra "Todo acreditado ✓" cuando gap = 0 — nunca desaparece mientras haya datos F.572.
- **SC-004**: Una persona sin conocimiento de impuestos puede responder "¿cuánto recuperaste?" mirando la pantalla en menos de 10 segundos.
- **SC-005**: El layout completo funciona en 375px de ancho sin scroll horizontal.
- **SC-006**: (P2) El botón de comparación y las etiquetas del modal son comprensibles para usuarios sin conocimiento impositivo.

## Assumptions

- "Recuperado" v1 se calcula como `total_gap × tax_rate` del último mes que tenía gap > 0. Es una aproximación conservadora (el empleador puede aplicar a tasa del mes siguiente y cubrir deducciones adicionales). Se etiqueta como "est." para comunicar la aproximación.
- La hero section reemplaza las dos stat-cards actuales — no se agrega encima de ellas.
- La detección de aplicación de F.572 en el gráfico usa los umbrales: gap previo > $100.000 → gap actual ≈ $0, retención mensual baja > 20%. Estos umbrales evitan falsos positivos por variaciones normales de sueldo.
- No se agregan nuevas dependencias runtime; el gráfico usa el componente `RetentionChart.tsx` existente extendido con anotaciones.
- Todo el estilo es inline (sin CSS framework), consistente con el resto del proyecto.
- `src/engine/schemas.ts` y las funciones existentes de `calculator.ts` no se modifican.
- P2 (lenguaje del modal) es deseable pero no bloquea P1.
- Spec número 010 (009 "comparacion-periodos" ya mergeado).
