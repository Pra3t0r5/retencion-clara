# Workflow Session — Terminología Gap + Spec SIRADIG Comparison

**Proyecto**: RetenciónClara  
**Rama activa**: `004-multi-periodo-historicos`  
**Fecha**: 2026-04-24  
**Feature activa en .specify**: `specs/004-multi-periodo-historicos`

## Contexto para el agente

Estás trabajando en RetenciónClara, una app React+TypeScript client-side (zero backend) para
previsualizar retenciones de impuesto a las ganancias 4ta categoría argentina (Art. 94 ARCA).

Esta sesión tiene tres objetivos en secuencia:

1. **Analizar** el estado actual de spec-004 (post-implementación parcial)
2. **Corregir terminología** "gap" → "deducción no acreditada" en spec-004
3. **Crear spec nueva** para comparación de períodos con reglas SIRADIG
4. **Agregar tasks de testing** a spec-004 usando datos reales de recibos

Ejecutar en orden. Cada paso es gate del siguiente. No saltar adelante si el paso anterior
produce hallazgos CRITICAL sin resolución.

---

## PASO 1 — Analizar spec-004 (read-only)

**Comando**: `/speckit-analyze`

**Contexto para el analyze**:
- spec-004 está parcialmente implementado (T001–T011 completos, T008/T012/T014 pendientes)
- Se hicieron correcciones sobre la marcha no capturadas en tasks.md:
  - `RetentionChart.tsx` recibió cambios de responsividad no planificados
  - `calculator.test.ts` tiene tests nuevos agregados fuera del ciclo TDD original
  - `data.ts` y `App.tsx` modificados (ver `git status`)
- El término "gap" se usa en spec, plan, tasks, código y UI pero nunca fue definido
  formalmente en el spec

**Qué buscar en el análisis**:
- ¿Hay FRs sin cobertura de tasks?
- ¿"gap" aparece como término definido en spec.md o es drift terminológico?
- ¿Los cambios en RetentionChart y calculator.test están dentro del scope de spec-004?
- ¿Hay violaciones de la constitución (especialmente Principio III — Test-First)?

**Gate**: Si hay issues CRITICAL, resolverlos antes de continuar. Si son solo HIGH/MEDIUM/LOW,
documentarlos y continuar.

---

## PASO 2 — Corregir terminología "gap" en spec-004

**Comando**: `/speckit-clarify`

**Argumento a pasar**:
> Clarify the term "gap" throughout the spec. Currently undefined. The correct domain
> definition is: "gap" = deducción declarada en F.572 - deducción efectivamente acreditada en
> el recibo de sueldo por el empleador. This represents deductions the employee declared but the
> employer has not yet applied. Preferred user-facing term: "deducción no acreditada" (or
> "no acreditado" abbreviated). Internally in code: keep `gap` as identifier OR rename to
> `no_acreditado` — decision needed. Also clarify: the gap analysis section in the UI should
> only be visible when F.572 data is present (indumentaria/cuota médica are optional inputs,
> not always relevant). Ask max 3 clarification questions focused on: (1) code identifier name
> preference, (2) UI visibility rule for gap section, (3) whether gap applies per-month or
> cumulative-year in the multi-period context.

**Qué esperar**: speckit-clarify hará hasta 5 preguntas y esperará respuesta antes de
actualizar spec.md. Responder con las decisiones de diseño y proceder.

**Gate**: spec.md de spec-004 actualizado con "gap" definido formalmente y término UI
establecido.

---

## PASO 3 — Nueva spec: Comparación de períodos con reglas SIRADIG

**Comando**: `/speckit-specify`

**Argumento completo a pasar**:

> Feature: Comparación de períodos fiscales con particularidades del SIRADIG
>
> Usuarios empleados en relación de dependencia pueden comparar su retención entre períodos
> separados (meses del mismo año fiscal, o potencialmente años fiscales distintos) teniendo en
> cuenta las reglas del sistema SIRADIG y la reglamentación vigente:
>
> - **Regla SIRADIG clave**: cuando el empleado rectifica su F.572 (Formulario de declaración
>   de deducciones), el empleador aplica los cambios en el PRÓXIMO recibo de sueldo, no en el
>   mismo mes. Los meses previos se recalculan retroactivamente en ese próximo recibo.
>   Esto genera que comparar dos recibos consecutivos puede mostrar una diferencia no explicada
>   por el salario bruto sino por la aplicación retroactiva de deducciones.
>
> - **Períodos separados**: el usuario puede querer comparar enero vs. marzo del mismo año,
>   o comparar el mismo mes en distintos años fiscales (si tiene datos de ambos).
>
> - **Cálculo acumulativo**: la retención de cada mes no es independiente — es el resultado de
>   restar las retenciones ya practicadas en meses anteriores del impuesto determinado
>   acumulado desde enero. Por esto, comparar dos meses aislados sin contexto del acumulado
>   es engañoso.
>
> - **Visualización**: el usuario debería poder ver, dado dos meses seleccionados, cuál es la
>   diferencia en retención y QUÉ la explica (¿cambio de salario?, ¿nueva deducción F.572?,
>   ¿aplicación retroactiva SIRADIG?, ¿cambio de tramo impositivo?).
>
> - **Restricción de constitución**: zero backend, todo client-side. No transmitir datos de
>   sueldo a ningún servidor.
>
> - **Alcance inicial (P1)**: comparación entre dos meses del mismo año fiscal ya cargados en
>   el multi-período (spec-004). Desglose de por qué difieren.
>
> - **Alcance secundario (P2)**: comparación año-sobre-año si el usuario tiene datos de
>   ambos años (requiere tablas ARCA de ambos semestres relevantes).
>
> Número de spec a asignar: revisar cuál es el siguiente disponible en `specs/` (005–008 ya
> existen, usar el siguiente libre).

**Qué esperar**: speckit-specify creará `specs/NNN-siradig-comparison/spec.md` y el checklist
de calidad. Puede hacer hasta 3 preguntas de clarificación. Responder con preferencias de
diseño y proceder.

**Después de /speckit-specify**: ejecutar `/speckit-plan` sobre la nueva spec para generar
`plan.md` con decisiones de arquitectura. Luego `/speckit-tasks` para generar `tasks.md`.

---

## PASO 4 — Agregar tasks de testing a spec-004

**No requiere comando speckit nuevo.** Editar `specs/004-multi-periodo-historicos/tasks.md`
directamente, agregar al final de Phase 4 (Polish):

```markdown
- [ ] T016 [P] Golden-file tests para RetentionChart:
      - Fixture: payslips de Enero + Marzo 2026 (datos reales de Fernando Albertengo)
      - Verificar que ChartPoint[] generado coincide con valores esperados
      - Verificar que acumulado se calcula correctamente entre meses no contiguos
- [ ] T017 [P] Test de integración storage + engine:
      - Guardar 3 meses en LocalStorageAdapter → recargar → ejecutar calcularRetención
        por mes → verificar que resultados coinciden con cálculo directo
      - Cubrir edge case: gap (deducción no acreditada) persiste correctamente entre meses
- [ ] T018 Test manual completo de spec-004:
      - Completar T008 (multi-month nav manual)
      - Completar T012 (chart 3 meses en 375px)
      - Completar T014 (localStorage persistence cross-tab-reload)
```

**Razón de no usar speckit-tasks**: speckit-tasks regenera todo tasks.md desde spec+plan.
Los tasks T001–T015 están parcialmente completados con estado [X]. Una regeneración perdería
ese estado. Editar manualmente es más seguro aquí.

---

## Restricciones que aplican a todo el workflow

Del `.specify/memory/constitution.md` de este proyecto:

- **Principio I**: Zero backend. Ningún spec nuevo puede requerir servidor para datos de sueldo
- **Principio II**: Cualquier nuevo cálculo de retención debe ser trazable a publicación ARCA
- **Principio III**: Tests del engine ANTES de la implementación (TDD). Si spec-004 violó esto,
  documentarlo en el análisis pero no bloquearse — agregar tests retroactivos en T016/T017
- **Principio IV**: No implementar fuera del scope del spec activo
- **Principio V**: No agregar abstracciones no requeridas por el spec actual

---

## Decisiones pre-tomadas (no necesitan clarificación)

Para ahorrarte preguntas innecesarias:

- Término UI: **"deducción no acreditada"** (short: "no acreditado")
- Identificador en código: mantener `gap` por compatibilidad (renombrar es scope nuevo)
- Gap applies: **acumulado del año** en contexto multi-período, no por mes aislado
- SIRADIG comparison: alcance P1 = mismo año fiscal, P2 = año anterior (datos opcionales)
- Tablas ARCA: cada año fiscal requiere su propio archivo en `src/tablas/` (e.g., `2025-H1.ts`,
  `2025-H2.ts`) — ya contemplado en plan existente

---

## Orden de ejecución resumido

```
/speckit-analyze                          → hallazgos spec-004
  ↓ (si no CRITICAL)
/speckit-clarify [ver argumento Paso 2]   → spec-004 con "gap" definido
  ↓
/speckit-specify [ver argumento Paso 3]   → specs/NNN-siradig-comparison/spec.md
  ↓
/speckit-plan                             → specs/NNN-siradig-comparison/plan.md
  ↓
/speckit-tasks                            → specs/NNN-siradig-comparison/tasks.md
  ↓
editar specs/004-multi-periodo-historicos/tasks.md  → agregar T016-T018
```
