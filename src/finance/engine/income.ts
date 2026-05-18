import type { IncomeEntry, PowerPoint } from './schemas';
import { INCOME_SEED } from './income-seed';
import { getRealUSD } from '../tablas/cpi-us';
import { getCanastas } from '../tablas/cbt-indec';

export function toYearMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

// Merge seed with user overrides (override wins by year+month key)
export function getIncomeHistory(overrides: IncomeEntry[]): IncomeEntry[] {
  const map = new Map<string, IncomeEntry>();
  for (const e of INCOME_SEED) {
    map.set(toYearMonth(e.year, e.month), e);
  }
  for (const e of overrides) {
    map.set(toYearMonth(e.year, e.month), e);
  }
  return [...map.values()].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });
}

// Default MEP rates by year-month for entries without explicit tc
// Used when Salarios Fer had no TC recorded (contractor era, Deel era)
const APPROX_MEP: Record<string, number> = {
  '2022-05': 213, '2022-06': 230, '2022-07': 255, '2022-08': 285,
  '2022-09': 295, '2022-10': 295, '2022-11': 318, '2022-12': 330,
  '2023-01': 360, '2023-02': 380,
  // contractor era ends — gap Mar-May 2023 has no TC (ARS only, no USD recorded)
  '2025-03': 1200, '2025-04': 1200, '2025-05': 1200, '2025-06': 1225,
  '2025-07': 1280, '2025-08': 1300, '2025-09': 1350, '2025-10': 1380,
  '2025-11': 1400, '2025-12': 1400,
  '2026-01': 1400, '2026-02': 1410, '2026-03': 1420, '2026-04': 1430,
};

export function resolveTCMEP(entry: IncomeEntry): number {
  if (entry.tcMEP) return entry.tcMEP;
  if (entry.tcCCL) return entry.tcCCL * 0.97; // CCL ≈ MEP + 3%
  return APPROX_MEP[toYearMonth(entry.year, entry.month)] ?? 1400;
}

export function buildPowerCurve(overrides: IncomeEntry[]): PowerPoint[] {
  return getIncomeHistory(overrides)
    .filter(e => e.netUSD > 0)
    .map(e => {
      const ym = toYearMonth(e.year, e.month);
      const tc = resolveTCMEP(e);
      return {
        yearMonth:  ym,
        nominalUSD: e.netUSD,
        realUSD:    getRealUSD(e.netUSD, ym),
        canastas:   getCanastas(e.netUSD, tc, ym),
        modality:   e.modality,
      };
    });
}

export function getModalityLabel(m: IncomeEntry['modality']): string {
  switch (m) {
    case 'contractor':   return 'Contractor';
    case 'crehana-ars':  return 'Crehana ARS';
    case 'crehana-usd':  return 'Crehana USD';
    case 'deel':         return 'Crehana / Deel';
    case 'manual':       return 'Manual';
  }
}
