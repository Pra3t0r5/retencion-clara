// Fernando Albertengo — WORMHOLE S.A. — Marzo 2026
// Source: official payslip + F.572 rectificativa 04/06/2026
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

// Fernando Albertengo — WORMHOLE S.A. — Abril 2026
// Source: official payslip + F.572 rectificativa aplicada en este recibo
// retencion_mes = 498.656,99 (impuesto a retener); ajuste período ant. = -1.004.490,87 (devolución)
export const RECIBO_ABR: PayslipData = {
  periodo:  "Abril 2026",
  empleador: "WORMHOLE S.A.",
  meses: 4,
  bruto_acumulado:       36_423_969.49,
  aportes_acumulados:     2_940_076.27,
  indumentaria_aplicada:  1_192_767.97,
  cuota_medica_aplicada:  1_333_083.83,
  ded_especial:           8_242_884.00,
  gni:                    1_717_267.52,
  ded_conyuge:            1_617_321.56,
  ded_hijos:                815_621.16,
  ded_especial_12:        1_032_757.85,
  gnsi:                  17_532_189.33,
  impuesto_determinado:   4_048_291.16,
  retencion_acumulada:    4_048_291.16,
  retencion_mes:            498_656.99,
  neto_mes:               8_069_029.00,
};

export const F572: F572Data = {
  conyuge: true,
  hijos: 1,
  cuota_medica: {
    enero:   311_947.62,
    febrero: 330_173.05,
    marzo:   340_275.69,
    abril:   350_687.47,
    mayo:    363_171.14,
    junio:   373_194.03,
  },
  indumentaria: {
    enero:   407_605.13,  // Avila $35.999 + EPESF $292.114 + MeLi $35.998 + AMX $43.494
    febrero:  43_586.94,  // AMX
    marzo:    46_100.22,  // AMX
    abril:   753_438.20,  // EPESF $299.118 + AMX $51.357 + Berrini $57.962 + Imagen Digital $345.000
    mayo:  1_090_518.82,  // Ayala $260.000 + Strano $747.900 + Schiavi $33.000 + AMX $49.618
    junio:   297_798.50,  // EPESF $237.474 + AMX $60.323
  },
};
