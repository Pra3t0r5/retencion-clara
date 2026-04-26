# Research: Comparación de Períodos — Decomposition Algorithm

**Phase 0 output for plan.md**  
**Date**: 2026-04-25

---

## §1 — Core Accounting Identity

The cumulative Argentine retention system means that for consecutive months A and B:

```
retencion_mes_B = impuesto_determinado_B − retencion_acumulada_A
```

Therefore:

```
delta_retencion_mes = retencion_mes_B − retencion_mes_A
                    = (impuesto_B − impuesto_A) + (−retencion_mes_A)
                                                 ↑ causa_efecto_acumulativo (exact)
```

**Decision**: `causa_efecto_acumulativo = −mesA.retencion_mes`  
**Rationale**: Exact by accounting identity for consecutive months. Uses only payslip data, no engine recomputation.  
**Alternatives considered**: Computing from Jan-accumulation separately — adds complexity with no benefit.

---

## §2 — F.572 Rectificativa Effect (causa_rectificativa_siradig)

When the employer applies retroactive F.572 deductions in month B, the cumulative applied
deductions increase dramatically. That increase reduces GNSI, which reduces `impuesto_determinado`.

```
delta_ded_aplicadas = (mesB.indumentaria_aplicada + mesB.cuota_medica_aplicada)
                    − (mesA.indumentaria_aplicada + mesA.cuota_medica_aplicada)

causa_rectificativa_siradig = −(delta_ded_aplicadas × buscarTramo(mesB.gnsi).pct)
```

**Verification (March → April 2026):**
- Δ_ded = (1,192,768 + 1,333,084) − (71,997 + 311,948) = 2,525,851 − 383,945 = 2,141,906
- Rate at April GNSI (17,532,189 → tramo 9, 35%): `buscarTramo(17_532_189).pct = 0.35`
- `causa_rectificativa = −(2,141,906 × 0.35) = −749,667`
- SC-001 requires ≥ 680,000 ARS → **749,667 > 680,000 ✓**

**ARCA table discrepancy note**: The target ~718K from the spec Overview uses the true effective
marginal rate implied by the payslip's own values. Our computation uses the ARCA table rate (35%),
which gives 749K — larger, still satisfies SC-001. The discrepancy (749K vs 718K) reflects the
same known intra-semester rate gap documented in `src/tablas/2026-H1.ts`.

**Decision**: Use `buscarTramo(mesB.gnsi).pct` as marginal rate approximation.  
**Rationale**: Consistent with how `calcularGap()` computes `ahorro_estimado` — same approximation
already accepted in the codebase.  
**When F.572 absent**: `hasF572Data(f572B) === false` → `causa_rectificativa = 0`.

---

## §3 — Salary Growth Residual (causa_salario)

After extracting the cumulative and F.572 effects, the remaining delta in `impuesto_determinado`
is attributable to gross salary growth:

```
delta_impuesto = mesB.impuesto_determinado − mesA.impuesto_determinado

delta_impuesto = causa_from_f572 + causa_salario
              where causa_from_f572 = causa_rectificativa_siradig (negative when ded increases)

∴ causa_salario = delta_impuesto − causa_rectificativa_siradig
```

**Verification (March → April 2026):**
- delta_impuesto = 4,048,291 − 3,549,634 = 498,657
- causa_rectificativa_siradig = −749,667
- causa_salario = 498,657 − (−749,667) = **1,248,324**

**Verification — full sum:**
```
causa_efecto_acumulativo + causa_rectificativa + causa_salario + causa_bracket
= −1,220,274 + (−749,667) + 1,248,324 + 0
= −721,617 = delta_retencion_mes ✓
```

**Decision**: `causa_salario = delta_impuesto − causa_rectificativa_siradig`  
**Rationale**: Residual-by-construction ensures the four causes always sum to `delta_retencion_mes`
exactly (residuo = 0 for consecutive months), satisfying FR-005 ±100 ARS.

---

## §4 — Bracket Change (causa_bracket)

**Decision**: `causa_bracket = 0` for v1.  
**Rationale**: Separating bracket effect from salary effect requires recomputing GNSI twice with
different salary/deduction assumptions while holding the bracket boundary fixed — adds significant
complexity for a narrow edge case (bracket transitions are rare within a single fiscal year).  
Folded into `causa_salario` per YAGNI (Principle V).  
**Marked as v2 enhancement** when bracket progression spec is created.

---

## §5 — Residuo and Classification

```
suma_causas = causa_efecto_acumulativo + causa_rectificativa + causa_salario + causa_bracket

residuo_inexplicado = delta_retencion_mes − suma_causas

clasificacion = Math.abs(residuo_inexplicado) < 0.1 × Math.abs(delta_retencion_mes)
  ? "esperada"
  : "revisar"
```

**For consecutive months**: `residuo_inexplicado = 0` always (by construction), `clasificacion = "esperada"`.

**For non-consecutive months** (e.g., January vs March): residuo = sum of intermediate months'
retention, which can be large → `clasificacion = "revisar"`. This is a **known v1 limitation**:
the four-cause model assumes consecutive months. Non-consecutive pairs may show spurious "Revisar"
badge. Acceptable for v1 because the primary user story and all test fixtures use consecutive months.

**When F.572 absent**: `causa_rectificativa = 0`, `causa_salario = delta_impuesto`, residuo = 0,
`clasificacion = "esperada"`. The "Sin datos F.572" note on the row is the signal to the user.
The "Revisar" badge does not fire for missing F.572 — this is intentional (the badge means
"unexplained by rules", not "you forgot to enter data").

---

## §6 — Headline Differences

```
delta_bruto_mensual = (mesB.bruto_acumulado / mesB.meses) − (mesA.bruto_acumulado / mesA.meses)

delta_ded_aplicadas = (mesB.indumentaria_aplicada + mesB.cuota_medica_aplicada)
                    − (mesA.indumentaria_aplicada + mesA.cuota_medica_aplicada)
```

Both are informational (FR-003). Not used in cause decomposition.

---

## §7 — Month Ordering

Spec US2-AC3: normalize silently so earlier month = A, later month = B.

```typescript
if (mesA.meses > mesB.meses) { [mesA, mesB] = [mesB, mesA]; [f572A, f572B] = [f572B, f572A]; }
```

Same-month selection: all deltas = 0; causes = 0; `clasificacion = "esperada"`.

---

## §8 — Component Architecture

- `ComparacionSIRADIG.tsx` receives `mesA: PayslipData, mesB: PayslipData, f572A: F572Data, f572B: F572Data` as props
- Calls `calcularDiferencia()` internally (no caller needs to pre-compute)
- Renders: headline row (Δ retencion, Δ bruto, Δ deducciones) + 4 cause rows + badge
- Rendered in a modal overlay triggered from MonthNav "Comparar" button
- Modal close: `comparacionMeses` state set back to `null` in `App.tsx`

**Decision**: Pass both f572A and f572B for forward-compatibility, even though v1 only uses `f572B`.  
**Rationale**: Year-over-year comparison (US3, P3) will need both. Zero cost now, avoids a prop API break later.
