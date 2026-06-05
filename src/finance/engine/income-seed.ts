import type { IncomeEntry } from './schemas';

// Seeded from: Cuentas Casa.xlsx (Sep 2025) > "Salarios Fer" + "Salarios Simplificado"
// Source: Fernando Daniel Albertengo — income history May 2022 → Aug 2025
// Gap 2018–Apr 2022: no data available.
// Authoritative source priority: Salarios Simplificado Capital Real > Santander bank statement > Salarios Fer Neto USD
// NOTE: Jun 2023–Jan 2024 crehana-ars era has INCOMPLETE data — Salarios Fer only captured ARS component.
// User confirmed USD deposits also existed; 2023 Santander statements needed to complete those months.

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

  // === CREHANA SPLIT era (relación de dependencia con AMBOS componentes ARS + USD) ===
  // TODOS los meses tienen: "Pago haberes interbanking externa" (ARS account) +
  //                         "Credito transf online banking emp De wormhole sa" (USD account)
  // netUSD = netARS_recibo/CCL + USD_Santander (fuente: extractos bancarios confirmados)
  // Mar–May 2023: ARS neto desconocido (recibos no digitalizados) → solo USD banco
  { year: 2023, month: 3, netUSD: 2596, grossARS: null, netARS: null, taxARS: null, tcMEP: null, tcCCL: null, modality: 'crehana-split', notes: 'Santander 28/03/23: $2,596 USD (Wormhole) + ARS desconocido' },
  { year: 2023, month: 4, netUSD: 2129, grossARS: null, netARS: null, taxARS: null, tcMEP: null, tcCCL: null, modality: 'crehana-split', notes: 'Santander 28/04/23: $2,129 USD (Wormhole) + ARS desconocido' },
  { year: 2023, month: 5, netUSD: 2064, grossARS: null, netARS: null, taxARS: null, tcMEP: null, tcCCL: null, modality: 'crehana-split', notes: 'Santander 30/05/23: $2,064 USD (Wormhole) + ARS desconocido' },

  // Jun 2023+: ARS neto confirmado via recibo + USD confirmado via extracto Santander
  // netUSD = netARS/CCL + USD_banco
  { year: 2023, month: 6,  netUSD: 4581, grossARS: 1_644_303.69, netARS: 1_025_577.82, taxARS: 618_725.87, tcMEP: null, tcCCL: 496, modality: 'crehana-split', notes: 'ARS: 1,025,578/496=$2,068 + USD banco 28/06+29/06=$2,513 → $4,581' },
  { year: 2023, month: 7,  netUSD: 3935, grossARS: 1_404_335.99, netARS:   996_069.94, taxARS: 408_266.05, tcMEP: null, tcCCL: 553, modality: 'crehana-split', notes: 'ARS: 996,070/553=$1,801 + USD banco 27/07=$2,134 → $3,935' },
  { year: 2023, month: 8,  netUSD: 3800, grossARS: 1_905_110.18, netARS: 1_277_441.54, taxARS: 627_668.64, tcMEP: null, tcCCL: 750, modality: 'crehana-split', notes: 'ARS: 1,277,442/750=$1,703 + USD banco 29/08=$2,097 → $3,800' },
  // Sep–Nov 2023: sin extracto bancario — USD estimado por interpolación (~$2,100–$2,300)
  { year: 2023, month: 9,  netUSD: 3797, grossARS: 1_905_110.18, netARS: 1_311_882.62, taxARS: 593_227.56, tcMEP: null, tcCCL: 773, modality: 'crehana-split', notes: 'ARS: 1,311,883/773=$1,697 + USD estimado ~$2,100 (sin extracto sep)' },
  { year: 2023, month: 10, netUSD: 3942, grossARS: 2_175_109.96, netARS: 1_725_193.84, taxARS: 449_916.12, tcMEP: null, tcCCL: 990, modality: 'crehana-split', notes: 'ARS: 1,725,194/990=$1,742 + USD estimado ~$2,200 (sin extracto oct)' },
  { year: 2023, month: 11, netUSD: 4548, grossARS: 2_287_798.99, netARS: 2_125_054.58, taxARS: 162_744.41, tcMEP: null, tcCCL: 945, modality: 'crehana-split', notes: 'ARS: 2,125,055/945=$2,248 + USD estimado ~$2,300 (sin extracto nov)' },
  { year: 2023, month: 12, netUSD: 7064, grossARS: 3_380_885.31, netARS: 2_810_917.27, taxARS: 569_968.04, tcMEP: null, tcCCL: 985, modality: 'crehana-split', notes: 'Incluye aguinaldo. ARS: 2,810,917/985=$2,853 + USD banco 18/12=$4,211 → $7,064' },

  // 2024 — desde enero split confirmado, marzo pasa a USD directo vía Santander
  { year: 2024, month: 1,  netUSD: 4868, grossARS: 4_080_214.87, netARS: 3_205_392.13, taxARS:  874_822.74, tcMEP: null, tcCCL: 1245, modality: 'crehana-split', notes: 'ARS: 3,205,392/1245=$2,574 + USD banco 25/01=$2,294 → $4,868' },
  { year: 2024, month: 2,  netUSD: 4291, grossARS: 4_255_985.93, netARS: 2_636_307.60, taxARS: 1_619_678.33, tcMEP: null, tcCCL: 1085, modality: 'crehana-split', notes: 'ARS: 2,636,308/1085=$2,430 + USD banco 23/02=$1,861 → $4,291' },
  // Mar 2024: USD directo $4,678 via "Acreditacion de haberes" Santander (+ ARS separado no cuantificado)
  { year: 2024, month: 3,  netUSD: 4678, grossARS: 4_845_286.69, netARS: 4_304_974.63, taxARS:  540_312.06, tcMEP: null, tcCCL: 979, modality: 'crehana-split', notes: 'Santander Mar 27 2024: $4,678 USD "Acreditacion de haberes" + ARS separado' },
  { year: 2024, month: 4,  netUSD: 3919, grossARS: 4_634_579.63, netARS: 3_427_498.89, taxARS: 1_207_080.74, tcMEP: 1055, tcCCL: null, modality: 'crehana-usd', notes: 'USD directo, sin componente ARS' },
  { year: 2024, month: 5,  netUSD: 3866, grossARS: null,          netARS: null,          taxARS: null,         tcMEP: 1159, tcCCL: null, modality: 'crehana-usd', notes: 'Acreditacion haberes Santander USD 24/05/24; Salarios Simplificado confirma $3,866' },
  { year: 2024, month: 6,  netUSD: 6212, grossARS: null,          netARS: null,          taxARS: null,         tcMEP: 1309, tcCCL: null, modality: 'crehana-usd', notes: 'Incluye aguinaldo junio; Salarios Simplificado $6,212.51' },
  { year: 2024, month: 7,  netUSD: 4557, grossARS: null,          netARS: null,          taxARS: null,         tcMEP: 1327, tcCCL: null, modality: 'crehana-usd' },
  { year: 2024, month: 8,  netUSD: 4271, grossARS: null,          netARS: null,          taxARS: null,         tcMEP: 1270, tcCCL: null, modality: 'crehana-usd' },
  { year: 2024, month: 9,  netUSD: 3295, grossARS: null,          netARS: null,          taxARS: null,         tcMEP: 1185, tcCCL: null, modality: 'crehana-usd' },
  { year: 2024, month: 10, netUSD: 5010, grossARS: null,          netARS: null,          taxARS: null,         tcMEP: 1135, tcCCL: null, modality: 'crehana-usd', notes: 'Bono o aguinaldo extra' },
  { year: 2024, month: 11, netUSD: 4499, grossARS: null,          netARS: null,          taxARS: null,         tcMEP: 1074, tcCCL: null, modality: 'crehana-usd' },
  { year: 2024, month: 12, netUSD: 7601, grossARS: null,          netARS: null,          taxARS: null,         tcMEP: 1150, tcCCL: null, modality: 'crehana-usd', notes: 'Aguinaldo diciembre' },

  // 2025 — from Cuentas Casa.xlsx (Sep 2025) Salarios Simplificado Capital Real
  { year: 2025, month: 1, netUSD: 3967, grossARS: null, netARS: null, taxARS: null, tcMEP: 1163, tcCCL: null, modality: 'crehana-usd' },
  { year: 2025, month: 2, netUSD: 4141, grossARS: null, netARS: null, taxARS: null, tcMEP: 1220, tcCCL: null, modality: 'crehana-usd' },

  // Mar 2025+: Deel era — Capital Real from Salarios Simplificado (Sep 2025 version)
  { year: 2025, month: 3,  netUSD: 4220, grossARS: null, netARS: null, taxARS: null, tcMEP: null, tcCCL: null, modality: 'deel' },
  { year: 2025, month: 4,  netUSD: 4011, grossARS: null, netARS: null, taxARS: null, tcMEP: null, tcCCL: null, modality: 'deel', notes: 'Santander "Acreditacion de haberes" 30/04/25: $4,011.15' },
  { year: 2025, month: 5,  netUSD: 3985, grossARS: null, netARS: null, taxARS: null, tcMEP: null, tcCCL: null, modality: 'deel' },
  { year: 2025, month: 6,  netUSD: 6336, grossARS: null, netARS: null, taxARS: null, tcMEP: null, tcCCL: null, modality: 'deel', notes: 'Incluye aguinaldo junio; Santander 26/06/25: $6,336.30' },
  { year: 2025, month: 7,  netUSD: 3938, grossARS: null, netARS: null, taxARS: null, tcMEP: null, tcCCL: null, modality: 'deel' },
  { year: 2025, month: 8,  netUSD: 4122, grossARS: null, netARS: null, taxARS: null, tcMEP: null, tcCCL: null, modality: 'deel' },
  // Sep 2025+: confirmado via Santander "Acreditacion de haberes" (Wormhole SA CUIT 30710395566)
  { year: 2025, month: 9,  netUSD: 5589, grossARS: null, netARS: null, taxARS: null, tcMEP: null, tcCCL: null, modality: 'deel', notes: 'Santander Oct 02 2025: $5,589.14 (posible bono/ajuste)' },
  { year: 2025, month: 10, netUSD: 4552, grossARS: null, netARS: null, taxARS: null, tcMEP: null, tcCCL: null, modality: 'deel', notes: 'Santander Oct 30 2025: $4,551.96' },
  { year: 2025, month: 11, netUSD: 3392, grossARS: null, netARS: null, taxARS: null, tcMEP: null, tcCCL: null, modality: 'deel', notes: 'Santander Nov 27 2025: $3,391.97' },
  { year: 2025, month: 12, netUSD: 6848, grossARS: null, netARS: null, taxARS: null, tcMEP: null, tcCCL: null, modality: 'deel', notes: 'Santander Dec 30 2025: $2,378.04 (15/12) + $4,469.99 (19/12) — incluye aguinaldo' },
  { year: 2026, month: 1,  netUSD: 4293, grossARS: null, netARS: null, taxARS: null, tcMEP: null, tcCCL: null, modality: 'deel', notes: 'Santander Jan 29 2026: $4,293.05' },
  { year: 2026, month: 2,  netUSD: 4660, grossARS: null, netARS: null, taxARS: null, tcMEP: null, tcCCL: null, modality: 'deel', notes: 'Santander Feb 26 2026: $4,660.26' },
  { year: 2026, month: 3,  netUSD: 4420, grossARS: null, netARS: null, taxARS: null, tcMEP: null, tcCCL: null, modality: 'deel', notes: 'Santander Mar 26 2026: $4,419.70' },
  { year: 2026, month: 4,  netUSD: 5464, grossARS: null, netARS: null, taxARS: null, tcMEP: null, tcCCL: null, modality: 'deel', notes: 'Santander Apr 30 2026: $5,463.75 (posible bono/ajuste)' },
  { year: 2026, month: 5,  netUSD: 4396.45, grossARS: 8_214_128.46, netARS: 6_492_808.00, taxARS: 991_705.92, tcMEP: null, tcCCL: null, modality: 'deel', notes: 'Santander May 22 2026: $4,396.45' },
];
