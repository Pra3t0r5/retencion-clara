import { z } from 'zod';

export const MES_NAMES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
] as const;

export type Mes = typeof MES_NAMES[number];

const MesRecord = z.record(z.string(), z.number().min(0));

export const PayslipData = z.object({
  periodo:                 z.string(),
  empleador:               z.string().optional(),
  meses:                   z.number().int().min(1).max(12),
  bruto_acumulado:         z.number().positive(),
  aportes_acumulados:      z.number().positive(),
  indumentaria_aplicada:   z.number().min(0),
  cuota_medica_aplicada:   z.number().min(0),
  ded_especial:            z.number().min(0),
  gni:                     z.number().min(0),
  ded_conyuge:             z.number().min(0),
  ded_hijos:               z.number().min(0),
  ded_especial_12:         z.number().min(0),
  gnsi:                    z.number().min(0),
  impuesto_determinado:    z.number().min(0),
  retencion_acumulada:     z.number().min(0),
  retencion_mes:           z.number().min(0),
  neto_mes:                z.number().min(0).optional(),
});
export type PayslipData = z.infer<typeof PayslipData>;

export const F572Data = z.object({
  conyuge:       z.boolean(),
  hijos:         z.number().int().min(0),
  cuota_medica:  MesRecord,
  indumentaria:  MesRecord,
});
export type F572Data = z.infer<typeof F572Data>;

export const GapAnalysis = z.object({
  indumentaria_declarada:   z.number(),
  indumentaria_aplicada:    z.number(),
  indumentaria_gap:         z.number(),
  cuota_medica_declarada:   z.number(),
  cuota_medica_aplicada:    z.number(),
  cuota_medica_gap:         z.number(),
  total_gap:                z.number(),
  tax_rate:                 z.number(),
  ahorro_estimado:          z.number(),
});
export type GapAnalysis = z.infer<typeof GapAnalysis>;

export const DiferenciaAnalisis = z.object({
  mesA: z.number().int().min(1).max(12),
  mesB: z.number().int().min(1).max(12),
  delta_retencion_mes:          z.number(),
  delta_bruto_mensual:          z.number(),
  delta_ded_aplicadas:          z.number(),
  causa_efecto_acumulativo:     z.number(),
  causa_rectificativa_siradig:  z.number(),
  causa_salario:                z.number(),
  causa_bracket:                z.number(),
  residuo_inexplicado:          z.number(),
  clasificacion:                z.enum(['esperada', 'revisar']),
});
export type DiferenciaAnalisis = z.infer<typeof DiferenciaAnalisis>;

export const TaxResult = z.object({
  gnsi:                      z.number(),
  impuesto_determinado:      z.number(),
  retencion_mes:             z.number(),
  retencion_acumulada_previa: z.number(),
});
export type TaxResult = z.infer<typeof TaxResult>;
