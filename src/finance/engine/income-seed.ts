import type { IncomeEntry } from './schemas';

// Seeded from: Cuentas Casa(2).xlsx > "Salarios Fer" + "Salarios Simplificado"
// Source: Fernando Daniel Albertengo — income history May 2022 → Feb 2025
// Gap 2018–Apr 2022: no data available.
// Subsequent months (Mar 2025+) imported from Deel PDFs via FRP / manual entry.

export const INCOME_SEED: IncomeEntry[] = [
  // === CONTRACTOR era (USD invoices INV-2022 / INV-2023) ===
  // Crehana pagó via contractor antes de la relación de dependencia
  { year: 2022, month: 5,  netUSD: 3416.12, grossARS: null, netARS: null, taxARS: null, tcMEP: null, tcCCL: null, modality: 'contractor' },
  { year: 2022, month: 6,  netUSD: 3530.00, grossARS: null, netARS: null, taxARS: null, tcMEP: null, tcCCL: null, modality: 'contractor' },
  { year: 2022, month: 7,  netUSD: 3530.00, grossARS: null, netARS: null, taxARS: null, tcMEP: null, tcCCL: null, modality: 'contractor' },
  { year: 2022, month: 8,  netUSD: 3530.00, grossARS: null, netARS: null, taxARS: null, tcMEP: null, tcCCL: null, modality: 'contractor' },
  { year: 2022, month: 9,  netUSD: 3530.00, grossARS: null, netARS: null, taxARS: null, tcMEP: null, tcCCL: null, modality: 'contractor' },
  { year: 2022, month: 10, netUSD: 3530.00, grossARS: null, netARS: null, taxARS: null, tcMEP: null, tcCCL: null, modality: 'contractor' },
  { year: 2022, month: 11, netUSD: 3530.00, grossARS: null, netARS: null, taxARS: null, tcMEP: null, tcCCL: null, modality: 'contractor' },
  { year: 2022, month: 12, netUSD: 3530.00, grossARS: null, netARS: null, taxARS: null, tcMEP: null, tcCCL: null, modality: 'contractor' },
  { year: 2023, month: 1,  netUSD: 3530.00, grossARS: null, netARS: null, taxARS: null, tcMEP: null, tcCCL: null, modality: 'contractor' },
  { year: 2023, month: 2,  netUSD: 4040.00, grossARS: null, netARS: null, taxARS: null, tcMEP: null, tcCCL: null, modality: 'contractor', notes: 'Última factura contractor antes de pase a dependencia' },

  // === CREHANA ARS era (relación de dependencia, convertido a USD via CCL) ===
  // Mar–May 2023: recibos de nómina ARS disponibles pero sin datos USD en Salarios Fer
  { year: 2023, month: 3, netUSD: 0, grossARS: null, netARS: null, taxARS: null, tcMEP: null, tcCCL: null, modality: 'crehana-ars', notes: 'Primer mes dependencia Crehana — sin dato USD en Salarios Fer' },
  { year: 2023, month: 4, netUSD: 0, grossARS: null, netARS: null, taxARS: null, tcMEP: null, tcCCL: null, modality: 'crehana-ars', notes: 'Sin dato USD' },
  { year: 2023, month: 5, netUSD: 0, grossARS: null, netARS: null, taxARS: null, tcMEP: null, tcCCL: null, modality: 'crehana-ars', notes: 'Sin dato USD' },

  // Jun 2023+: Salarios Fer tiene neto ARS + USD equiv al CCL
  { year: 2023, month: 6,  netUSD: 2067, grossARS: 1_644_303.69, netARS: 1_025_577.82, taxARS: 618_725.87, tcMEP: null, tcCCL: 496, modality: 'crehana-ars' },
  { year: 2023, month: 7,  netUSD: 1801, grossARS: 1_404_335.99, netARS:   996_069.94, taxARS: 408_266.05, tcMEP: null, tcCCL: 553, modality: 'crehana-ars' },
  { year: 2023, month: 8,  netUSD: 1703, grossARS: 1_905_110.18, netARS: 1_277_441.54, taxARS: 627_668.64, tcMEP: null, tcCCL: 750, modality: 'crehana-ars' },
  { year: 2023, month: 9,  netUSD: 1697, grossARS: 1_905_110.18, netARS: 1_311_882.62, taxARS: 593_227.56, tcMEP: null, tcCCL: 773, modality: 'crehana-ars' },
  { year: 2023, month: 10, netUSD: 1742, grossARS: 2_175_109.96, netARS: 1_725_193.84, taxARS: 449_916.12, tcMEP: null, tcCCL: 990, modality: 'crehana-ars' },
  { year: 2023, month: 11, netUSD: 2248, grossARS: 2_287_798.99, netARS: 2_125_054.58, taxARS: 162_744.41, tcMEP: null, tcCCL: 945, modality: 'crehana-ars' },
  { year: 2023, month: 12, netUSD: 2853, grossARS: 3_380_885.31, netARS: 2_810_917.27, taxARS: 569_968.04, tcMEP: null, tcCCL: 985, modality: 'crehana-ars', notes: 'Incluye aguinaldo' },

  // 2024 — transición a cláusula USD en marzo
  { year: 2024, month: 1,  netUSD: 2574, grossARS: 4_080_214.87, netARS: 3_205_392.13, taxARS:  874_822.74, tcMEP: null, tcCCL: 1245, modality: 'crehana-ars' },
  { year: 2024, month: 2,  netUSD: 2429, grossARS: 4_255_985.93, netARS: 2_636_307.60, taxARS: 1_619_678.33, tcMEP: null, tcCCL: 1085, modality: 'crehana-ars' },
  // Mar 2024: SPLIT PAY — $1,721,990 ARS + $2,978 USD en cuenta.
  // Capital Real (Salarios Simplificado, CCL 979): $1,721,990/979 + $2,978 = $4,737 USD
  { year: 2024, month: 3,  netUSD: 4737, grossARS: 4_845_286.69, netARS: 4_304_974.63, taxARS:  540_312.06, tcMEP: null, tcCCL: 979, modality: 'crehana-split', notes: 'Split pay: $1,721,990 ARS (÷979 CCL) + $2,978 USD = $4,737' },
  { year: 2024, month: 4,  netUSD: 3919, grossARS: 4_634_579.63, netARS: 3_427_498.89, taxARS: 1_207_080.74, tcMEP: 1055, tcCCL: null, modality: 'crehana-usd', notes: 'USD directo, sin componente ARS' },
  { year: 2024, month: 5,  netUSD: 2879, grossARS: null,          netARS: 3_455_877,    taxARS: 1_280_935.19, tcMEP: 1200, tcCCL: null, modality: 'crehana-usd', notes: 'MEP estimado' },
  { year: 2024, month: 6,  netUSD: 3866, grossARS: null,          netARS: null,          taxARS: null,         tcMEP: 1309, tcCCL: null, modality: 'crehana-usd', notes: 'Incluye aguinaldo' },
  { year: 2024, month: 7,  netUSD: 4557, grossARS: null,          netARS: null,          taxARS: null,         tcMEP: 1327, tcCCL: null, modality: 'crehana-usd', notes: 'Aguinaldo + sueldo' },
  { year: 2024, month: 8,  netUSD: 4271, grossARS: null,          netARS: null,          taxARS: null,         tcMEP: 1270, tcCCL: null, modality: 'crehana-usd' },
  { year: 2024, month: 9,  netUSD: 3295, grossARS: null,          netARS: null,          taxARS: null,         tcMEP: 1185, tcCCL: null, modality: 'crehana-usd' },
  { year: 2024, month: 10, netUSD: 5010, grossARS: null,          netARS: null,          taxARS: null,         tcMEP: 1135, tcCCL: null, modality: 'crehana-usd', notes: 'Bono o aguinaldo extra' },
  { year: 2024, month: 11, netUSD: 4499, grossARS: null,          netARS: null,          taxARS: null,         tcMEP: 1074, tcCCL: null, modality: 'crehana-usd' },
  { year: 2024, month: 12, netUSD: 7601, grossARS: null,          netARS: null,          taxARS: null,         tcMEP: 1150, tcCCL: null, modality: 'crehana-usd', notes: 'Aguinaldo diciembre' },

  // 2025 — Jan/Feb from Cuentas Casa (Salarios Simplificado)
  { year: 2025, month: 1, netUSD: 3967, grossARS: null, netARS: null, taxARS: null, tcMEP: 1163, tcCCL: null, modality: 'crehana-usd' },
  { year: 2025, month: 2, netUSD: 4200, grossARS: null, netARS: null, taxARS: null, tcMEP: 1220, tcCCL: null, modality: 'crehana-usd', notes: 'Estimado — Feb 2025 en Cuentas Casa sin monto preciso' },

  // Mar 2025+: Deel era — Deel payslips disponibles, $4,200 USD fijo
  // Estos se cargan via import o manual override; acá van como defaults
  { year: 2025, month: 3,  netUSD: 4200, grossARS: null, netARS: null, taxARS: null, tcMEP: null, tcCCL: null, modality: 'deel' },
  { year: 2025, month: 4,  netUSD: 4200, grossARS: null, netARS: null, taxARS: null, tcMEP: null, tcCCL: null, modality: 'deel' },
  { year: 2025, month: 5,  netUSD: 4200, grossARS: null, netARS: null, taxARS: null, tcMEP: null, tcCCL: null, modality: 'deel' },
  { year: 2025, month: 6,  netUSD: 4200, grossARS: null, netARS: null, taxARS: null, tcMEP: null, tcCCL: null, modality: 'deel' },
  { year: 2025, month: 7,  netUSD: 4200, grossARS: null, netARS: null, taxARS: null, tcMEP: null, tcCCL: null, modality: 'deel' },
  { year: 2025, month: 8,  netUSD: 4200, grossARS: null, netARS: null, taxARS: null, tcMEP: null, tcCCL: null, modality: 'deel' },
  { year: 2025, month: 9,  netUSD: 4200, grossARS: null, netARS: null, taxARS: null, tcMEP: null, tcCCL: null, modality: 'deel' },
  { year: 2025, month: 10, netUSD: 4200, grossARS: null, netARS: null, taxARS: null, tcMEP: null, tcCCL: null, modality: 'deel' },
  { year: 2025, month: 11, netUSD: 4200, grossARS: null, netARS: null, taxARS: null, tcMEP: null, tcCCL: null, modality: 'deel' },
  { year: 2025, month: 12, netUSD: 4200, grossARS: null, netARS: null, taxARS: null, tcMEP: null, tcCCL: null, modality: 'deel', notes: 'Incluye aguinaldo diciembre' },
  { year: 2026, month: 1,  netUSD: 4200, grossARS: null, netARS: null, taxARS: null, tcMEP: null, tcCCL: null, modality: 'deel' },
  { year: 2026, month: 2,  netUSD: 4200, grossARS: null, netARS: null, taxARS: null, tcMEP: null, tcCCL: null, modality: 'deel' },
  { year: 2026, month: 3,  netUSD: 4200, grossARS: null, netARS: null, taxARS: null, tcMEP: null, tcCCL: null, modality: 'deel' },
  { year: 2026, month: 4,  netUSD: 4200, grossARS: null, netARS: null, taxARS: null, tcMEP: null, tcCCL: null, modality: 'deel' },
];
