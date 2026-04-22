// Extracted from Fernando's Payslip Mar 2026 + F.572 rectificativa 13/04/2026

export const RECIBO_MAR = {
  periodo: "Marzo 2026",
  empleador: "WORMHOLE S.A.",
  // Acumulado Ene-Mar (from "Detalle de Calculo")
  meses: 3,
  bruto_acumulado: 27_432_062.23,
  aportes_acumulados: 2_173_406.54,
  indumentaria_aplicada: 71_997.00,   // solo ene (Avila + MeLi)
  cuota_medica_aplicada: 311_947.62,  // solo enero
  ded_especial: 6_182_163.00,
  gni: 1_287_950.64,
  ded_conyuge: 1_212_991.17,
  ded_hijos: 611_715.87,
  ded_especial_12: 774_568.39,
  total_ded_personales: 10_069_389.07,
  gnsi: 14_805_322.00,
  impuesto_determinado: 3_549_634.17,
  retencion_acumulada: 3_549_634.17,
  retencion_mes: 1_220_273.92,
  neto_mes: 6_527_148.00,
};

export const F572 = {
  fecha: "13/04/2026",
  conyuge: true,
  hijos: 1,
  cuota_medica: {
    enero:   311_947.62,
    febrero: 330_173.05,
    marzo:   340_275.69,
    abril:   350_687.47,
    total:   1_333_083.83,
  },
  indumentaria: {
    enero:   407_605.13, // Avila $35.999 + EPESF $292.114 + MeLi $35.998 + AMX $43.494
    febrero:  43_586.94, // AMX
    marzo:    46_100.22, // AMX
    abril:   695_475.68, // EPESF $299.118 + AMX $51.357 + Imagen Digital $345.000
    total:  1_192_767.97,
  },
};

export const TABLAS_2026_H1 = {
  gni_mensual: 429_317.08,
  ded_especial_mensual: 2_060_721.00,
  ded_conyuge_anual: 4_851_964.66,
  ded_hijo_anual: 2_446_863.48,
  // Bracket where Fernando sits at Mar: base $10.125.152,33 → 31%
  tramo_actual: { base: 10_125_152.33, fijo: 2_098_781.57, pct: 0.31 },
};
