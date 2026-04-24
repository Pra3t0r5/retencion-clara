// Fernando Albertengo — WORMHOLE S.A. — Marzo 2026
// Source: official payslip + F.572 rectificativa 13/04/2026
// Used as test fixture and app demo default values — do not delete

import type { PayslipData, F572Data } from './engine/schemas';

export const RECIBO_MAR: PayslipData = {
  periodo:  "Marzo 2026",
  empleador: "WORMHOLE S.A.",
  meses: 3,
  bruto_acumulado:       27_432_062.23,
  aportes_acumulados:     2_173_406.54,
  indumentaria_aplicada:     71_997.00,  // solo ene (Avila + MeLi)
  cuota_medica_aplicada:    311_947.62,  // solo enero
  ded_especial:           6_182_163.00,
  gni:                    1_287_950.64,
  ded_conyuge:            1_212_991.17,
  ded_hijos:                611_715.87,
  ded_especial_12:          774_568.39,
  gnsi:                  14_805_322.00,
  impuesto_determinado:   3_549_634.17,
  retencion_acumulada:    3_549_634.17,
  retencion_mes:          1_220_273.92,
  neto_mes:               6_527_148.00,
};

export const F572: F572Data = {
  conyuge: true,
  hijos: 1,
  cuota_medica: {
    enero:   311_947.62,
    febrero: 330_173.05,
    marzo:   340_275.69,
    abril:   350_687.47,
  },
  indumentaria: {
    enero:   407_605.13,  // Avila $35.999 + EPESF $292.114 + MeLi $35.998 + AMX $43.494
    febrero:  43_586.94,  // AMX
    marzo:    46_100.22,  // AMX
    abril:   695_475.68,  // EPESF $299.118 + AMX $51.357 + Imagen Digital $345.000
  },
};
