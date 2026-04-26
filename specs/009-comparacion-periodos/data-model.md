# Data Model: Comparación de Períodos

**Phase 1 output for plan.md**  
**Date**: 2026-04-25

---

## New Type: DiferenciaAnalisis

Returned by `calcularDiferencia()`. All monetary values are ARS (signed, negative = retention decreased).

### Zod Schema (add to `src/engine/schemas.ts`)

```typescript
export const DiferenciaAnalisis = z.object({
  // Month identifiers (1–12, normalized so mesA < mesB or mesA === mesB)
  mesA: z.number().int().min(1).max(12),
  mesB: z.number().int().min(1).max(12),

  // Headline differences (FR-003)
  delta_retencion_mes:    z.number(),  // mesB.retencion_mes − mesA.retencion_mes
  delta_bruto_mensual:    z.number(),  // per-month bruto (acumulado / meses), signed
  delta_ded_aplicadas:    z.number(),  // Δ cumulative F.572 applied on payslip, signed

  // Four named causes (FR-004); sum = delta_retencion_mes ± 100 ARS (FR-005)
  causa_efecto_acumulativo:      z.number(),  // −mesA.retencion_mes (exact identity)
  causa_rectificativa_siradig:   z.number(),  // −(Δ_ded_applied × marginal_rate); 0 if no F.572
  causa_salario:                 z.number(),  // delta_impuesto − causa_rectificativa (residual)
  causa_bracket:                 z.number(),  // always 0 in v1

  // Classification (FR-006)
  residuo_inexplicado:  z.number(),  // delta_retencion − sum(all four causes)
  clasificacion:        z.enum(["esperada", "revisar"]),
});
export type DiferenciaAnalisis = z.infer<typeof DiferenciaAnalisis>;
```

### Field Invariants

| Field | Invariant |
|-------|-----------|
| `mesA ≤ mesB` | Always enforced by function; same-month allowed |
| `causa_efecto_acumulativo` | Equals `−mesA.retencion_mes`; always ≤ 0 |
| `causa_rectificativa_siradig` | 0 when no F.572 data; ≤ 0 when F.572 increases deductions |
| `causa_salario` | May be positive (salary growth increases impuesto) |
| `causa_bracket` | Always 0 in v1 |
| `residuo_inexplicado` | 0 for consecutive months by construction; non-zero for non-consecutive |
| `clasificacion` | `"esperada"` iff `|residuo| < 0.1 × |delta_retencion_mes|` |

### Sample Values (March → April 2026, WORMHOLE S.A.)

| Field | Value |
|-------|-------|
| `mesA` | 3 |
| `mesB` | 4 |
| `delta_retencion_mes` | −721,617 |
| `delta_bruto_mensual` | +3,000,635 |
| `delta_ded_aplicadas` | +2,141,907 |
| `causa_efecto_acumulativo` | −1,220,274 |
| `causa_rectificativa_siradig` | −749,667 |
| `causa_salario` | +1,248,324 |
| `causa_bracket` | 0 |
| `residuo_inexplicado` | 0 |
| `clasificacion` | `"esperada"` |

---

## New Engine Function: calcularDiferencia

**Location**: `src/engine/calculator.ts` — new export, no existing function modified (FR-009)

```typescript
export function calcularDiferencia(
  rawA: PayslipData,
  rawB: PayslipData,
  f572A: F572Data,
  f572B: F572Data,
): DiferenciaAnalisis {
  // Normalize: earlier month = A
  const [mesA, mesB, , fb] = rawA.meses <= rawB.meses
    ? [rawA, rawB, f572A, f572B]
    : [rawB, rawA, f572B, f572A];

  const delta_retencion_mes  = mesB.retencion_mes - mesA.retencion_mes;
  const delta_bruto_mensual  = (mesB.bruto_acumulado / mesB.meses) - (mesA.bruto_acumulado / mesA.meses);
  const delta_ded_aplicadas  = (mesB.indumentaria_aplicada + mesB.cuota_medica_aplicada)
                             - (mesA.indumentaria_aplicada + mesA.cuota_medica_aplicada);

  const causa_efecto_acumulativo    = -mesA.retencion_mes;
  const rate_B                      = buscarTramo(mesB.gnsi).pct;
  const causa_rectificativa_siradig = hasF572Data(fb) ? -(delta_ded_aplicadas * rate_B) : 0;
  const delta_impuesto              = mesB.impuesto_determinado - mesA.impuesto_determinado;
  const causa_salario               = delta_impuesto - causa_rectificativa_siradig;
  const causa_bracket               = 0;

  const residuo_inexplicado = delta_retencion_mes
    - (causa_efecto_acumulativo + causa_rectificativa_siradig + causa_salario + causa_bracket);

  const abs_delta    = Math.abs(delta_retencion_mes);
  const clasificacion: "esperada" | "revisar" =
    abs_delta === 0 || Math.abs(residuo_inexplicado) < 0.1 * abs_delta
      ? "esperada"
      : "revisar";

  return {
    mesA: mesA.meses, mesB: mesB.meses,
    delta_retencion_mes, delta_bruto_mensual, delta_ded_aplicadas,
    causa_efecto_acumulativo, causa_rectificativa_siradig, causa_salario, causa_bracket,
    residuo_inexplicado, clasificacion,
  };
}
```

---

## App State Addition

```typescript
// In App.tsx
const [comparacionMeses, setComparacionMeses] =
  useState<{ a: number; b: number } | null>(null);
```

- `null` = comparison panel closed
- `{ a, b }` = months to compare (month numbers 1–12)
- Set from MonthNav "Comparar" button (only visible when `fiscalYear.size >= 2`)
- Cleared when user closes the panel

---

## Existing Types Used (unchanged)

| Type | Source | Usage |
|------|--------|-------|
| `PayslipData` | `src/engine/schemas.ts` | Both month payslips |
| `F572Data` | `src/engine/schemas.ts` | Deduction declarations |
| `buscarTramo` | `src/engine/calculator.ts` | Marginal rate lookup |
| `hasF572Data` | `src/engine/calculator.ts` | F.572 presence check (FR-007) |

No modifications to existing types or functions.
