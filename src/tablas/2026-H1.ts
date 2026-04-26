export type TaxBracket = {
  desde: number;
  hasta: number;
  fijo: number;
  pct: number;
};

// ARCA 2026 H1 — bracket thresholds verified against WORMHOLE S.A. March 2026 recibo.
// Ground truth from recibo "Detalle de Cálculo": bracket 8 (31%) starts at $10,125,152.33,
// fijo $2,098,781.57. Lower brackets derived from standard 1:1:1:1.5:1.5:3:3 width
// pattern with U = $843,762.694. Full ARCA RG publication needed to confirm lower values.
//
// KNOWN DISCREPANCY — April 2026 (Principio II open bug):
// April GNSI = 17,532,189.33. With this table (bracket 9, 35%, desde 15,187,728.50):
//   engine → 4,488,741 | payslip → 4,048,291 | Δ ≈ 440,450
// Hypothesis: ARCA published an intra-semester bracket update (new RG) between March and
// April 2026, shifting thresholds upward. Fix requires obtaining that official ARCA RG.
// Tracked: calculator.test.ts > "impuesto determinado matches Apr 2026 ± 100" (skipped).
export const TABLAS_2026_H1 = {
  tramos: [
    { desde:              0,          hasta:    843_762.69,  fijo:          0,          pct: 0.05 },
    { desde:    843_762.69,  hasta:  1_687_525.39,  fijo:     42_188.13,    pct: 0.09 },
    { desde:  1_687_525.39,  hasta:  2_531_288.08,  fijo:    118_126.77,    pct: 0.12 },
    { desde:  2_531_288.08,  hasta:  3_796_932.13,  fijo:    219_378.29,    pct: 0.15 },
    { desde:  3_796_932.13,  hasta:  5_062_576.17,  fijo:    409_224.90,    pct: 0.19 },
    { desde:  5_062_576.17,  hasta:  7_593_864.25,  fijo:    649_697.27,    pct: 0.23 },
    { desde:  7_593_864.25,  hasta: 10_125_152.33,  fijo:  1_231_893.53,    pct: 0.27 },
    { desde: 10_125_152.33,  hasta: 15_187_728.50,  fijo:  2_098_781.57,    pct: 0.31 }, // ← recibo-verified
    { desde: 15_187_728.50,  hasta: 20_250_304.67,  fijo:  3_668_180.18,    pct: 0.35 },
    { desde: 20_250_304.67,  hasta: Infinity,         fijo:  5_440_081.84,    pct: 0.35 },
  ] satisfies TaxBracket[],

  gni_anual:               5_151_802.50,
  gni_mensual:               429_317.08,
  ded_especial_anual:      24_728_652.00,
  ded_especial_mensual:     2_060_721.00,
  ded_conyuge_anual:        4_851_964.66,
  ded_hijo_anual:           2_446_863.48,
} as const;
