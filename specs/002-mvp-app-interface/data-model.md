# Data Model: MVP App Interface

**Feature**: `specs/002-mvp-app-interface`
**Date**: 2026-04-22

## Zod Schemas (src/engine/schemas.ts)

### PayslipData

Cumulative acumulado values from the "Detalle de Cálculo" page of the recibo de sueldo.
All amounts are in ARS (Argentine pesos, raw numbers — no formatting).

```typescript
const PayslipData = z.object({
  periodo: z.string(),              // "Marzo 2026"
  empleador: z.string().optional(), // "WORMHOLE S.A."
  meses: z.number().int().min(1).max(12),
  bruto_acumulado: z.number().positive(),
  aportes_acumulados: z.number().positive(),
  indumentaria_aplicada: z.number().min(0),
  cuota_medica_aplicada: z.number().min(0),
  ded_especial: z.number().min(0),
  gni: z.number().min(0),
  ded_conyuge: z.number().min(0),
  ded_hijos: z.number().min(0),
  ded_especial_12: z.number().min(0),   // 1/12 deducciones personales
  gnsi: z.number().min(0),              // Ganancia Neta Sujeta a Impuesto
  impuesto_determinado: z.number().min(0),
  retencion_acumulada: z.number().min(0),
  retencion_mes: z.number().min(0),
  neto_mes: z.number().min(0).optional(),
});
type PayslipData = z.infer<typeof PayslipData>;
```

### F572Data

Per-month deduction amounts declared by employee in SiRADIG (F.572 web form).
Keys are lowercase Spanish month names: `enero` through `diciembre`.

```typescript
const MesRecord = z.record(
  z.enum(['enero','febrero','marzo','abril','mayo','junio',
          'julio','agosto','septiembre','octubre','noviembre','diciembre']),
  z.number().min(0)
);

const F572Data = z.object({
  conyuge: z.boolean(),
  hijos: z.number().int().min(0),
  cuota_medica: MesRecord,    // amounts declared per month
  indumentaria: MesRecord,    // amounts declared per month
});
type F572Data = z.infer<typeof F572Data>;
```

### TaxResult

Output from the calculator engine.

```typescript
const TaxResult = z.object({
  gnsi: z.number(),
  impuesto_determinado: z.number(),
  retencion_mes: z.number(),
  retencion_acumulada_previa: z.number(),
});
type TaxResult = z.infer<typeof TaxResult>;
```

### GapAnalysis

Gap between F.572 declared deductions and what was actually applied in the recibo.

```typescript
const GapAnalysis = z.object({
  indumentaria_declarada: z.number(),
  indumentaria_aplicada: z.number(),
  indumentaria_gap: z.number(),
  cuota_medica_declarada: z.number(),
  cuota_medica_aplicada: z.number(),
  cuota_medica_gap: z.number(),
  total_gap: z.number(),
  tax_rate: z.number(),         // marginal rate at current GNSI bracket
  ahorro_estimado: z.number(),  // total_gap × tax_rate
});
type GapAnalysis = z.infer<typeof GapAnalysis>;
```

### ProyeccionAbril

Estimated April retention after retroactive gap deductions + April new deductions.

```typescript
type ProyeccionAbril = {
  nuevas_deducciones_ene_mar: number;  // retroactive gap from rectificativa
  nueva_indumentaria_abr: number;
  nueva_cuota_medica_abr: number;
  total_nuevas_deducciones: number;
  reduccion_retencion_estimada: number;
  retencion_abr_estimada: number;
};
```

### ProyeccionAnual

Full-year retention estimate based on March run-rate.

```typescript
type ProyeccionAnual = {
  bruto_anual: number;
  retencion_acumulada_mar: number;
  retencion_restante_estimada: number;
  retencion_total_anual: number;
  efectiva_rate: number;
};
```

## ARCA Tables (src/tablas/2026-H1.ts)

```typescript
type Tramo = {
  desde: number;
  hasta: number;      // Infinity for last tramo
  fijo: number;
  pct: number;        // decimal: 0.05, 0.09, ..., 0.35
};

type Tabla2026H1 = {
  tramos: Tramo[];
  gni_anual: number;
  gni_mensual: number;
  ded_especial_anual: number;
  ded_especial_mensual: number;
  ded_conyuge_anual: number;
  ded_hijo_anual: number;
};
```

All 10 tramos verified against ARCA RG 5008 (from spec 001):

| Tramo | Desde | Hasta | Fijo | % |
|-------|-------|-------|------|---|
| 1 | 0 | 1.149.340,31 | 0 | 5% |
| 2 | 1.149.340,31 | 2.298.680,63 | 57.467,02 | 9% |
| 3 | 2.298.680,63 | 3.448.020,94 | 161.010,26 | 12% |
| 4 | 3.448.020,94 | 5.172.031,41 | 298.912,78 | 15% |
| 5 | 5.172.031,41 | 6.896.041,88 | 557.716,89 | 19% |
| 6 | 6.896.041,88 | 10.344.062,82 | 885.213,96 | 23% |
| 7 | 10.344.062,82 | 13.792.083,76 | 1.678.057,43 | 27% |
| 8 | 13.792.083,76 | 20.688.125,64 | 2.609.499,93 | 31% |
| 9 | 20.688.125,64 | 27.584.167,52 | 4.745.025,38 | 35% |
| 10 | 27.584.167,52 | ∞ | 7.157.082,52 | 35% |

## UI State (App.tsx)

```typescript
type AppState = {
  payslip: PayslipData | null;
  f572: F572Data | null;
};

// Derived (computed from AppState when both are non-null)
type ComputedState = {
  result: TaxResult;
  gaps: GapAnalysis;
  abril: ProyeccionAbril;
  anual: ProyeccionAnual;
};
```

## State Transitions

```
Initial: { payslip: null, f572: null }
    ↓ user fills PayslipForm OR uploads recibo PDF
{ payslip: PayslipData, f572: null }
    ↓ user fills F572Form OR uploads F.572 PDF
{ payslip: PayslipData, f572: F572Data }
    → Calculator runs automatically
    → ResultadoCard + DetalleCalculo render with computed output
```

## Form Field Mapping

| Field | UI Label (Spanish) | Source in recibo |
|-------|-------------------|-----------------|
| meses | Meses acumulados | "Detalle de Cálculo" header |
| bruto_acumulado | Total remuneraciones gravadas | First line of detalle |
| aportes_acumulados | Aportes de ley | Jubilación + OS + OSPE |
| indumentaria_aplicada | Indumentaria aplicada | Deducciones section |
| cuota_medica_aplicada | Cuota médica aplicada | Deducciones section |
| ded_especial | Deducción especial | Personales section |
| gni | GNI | Personales section |
| ded_conyuge | Deducción cónyuge | Cargas de familia |
| ded_hijos | Deducción hijos | Cargas de familia |
| ded_especial_12 | 1/12 ded. personales | Cálculo final |
| gnsi | GNSI | Resultado final |
| impuesto_determinado | Impuesto determinado | Resultado final |
| retencion_acumulada | Retención acumulada | Retenciones |
| retencion_mes | Retención del mes | Retenciones |
