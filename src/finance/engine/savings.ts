import type { IncomeEntry, NetWorthSnapshot } from './schemas';
import { buildPowerCurve } from './income';

export interface SavingsPoint {
  yearMonth: string;
  incomeUSD: number;
  nwStart: number;
  nwEnd: number;
  deltaNetWorthUSD: number;
  impliedExpensesUSD: number;
  savingsRate: number; // fraction, can be negative
}

export function computeSavingsAnalysis(
  snapshots: NetWorthSnapshot[],
  incomeOverrides: IncomeEntry[],
): SavingsPoint[] {
  if (snapshots.length < 2) return [];

  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));

  // Map yearMonth → netWorthUSD
  const nwByMonth = new Map<string, number>();
  for (const s of sorted) {
    const ym = s.date.slice(0, 7); // 'YYYY-MM'
    nwByMonth.set(ym, s.netWorthUSD);
  }

  // Map yearMonth → nominalUSD from income curve
  const incomeByMonth = new Map<string, number>();
  for (const pt of buildPowerCurve(incomeOverrides)) {
    incomeByMonth.set(pt.yearMonth, pt.nominalUSD);
  }

  const result: SavingsPoint[] = [];

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const ym   = curr.date.slice(0, 7);

    const incomeUSD = incomeByMonth.get(ym);
    if (incomeUSD === undefined) continue; // no income data for this month

    const nwStart         = prev.netWorthUSD;
    const nwEnd           = curr.netWorthUSD;
    const deltaNetWorthUSD   = nwEnd - nwStart;
    const impliedExpensesUSD = incomeUSD - deltaNetWorthUSD;
    const savingsRate        = incomeUSD > 0 ? deltaNetWorthUSD / incomeUSD : 0;

    result.push({ yearMonth: ym, incomeUSD, nwStart, nwEnd, deltaNetWorthUSD, impliedExpensesUSD, savingsRate });
  }

  return result;
}
