import type { Transaction, MonthlyFlow } from './schemas';

function txYearMonth(tx: Transaction): string {
  return tx.date.slice(0, 7); // "YYYY-MM"
}

export function aggregateByMonth(txs: Transaction[]): MonthlyFlow[] {
  const map = new Map<string, MonthlyFlow>();

  for (const tx of txs) {
    if (tx.type === 'Transferencia' || tx.type === 'Inversión') continue;
    const ym = txYearMonth(tx);
    if (!map.has(ym)) {
      map.set(ym, {
        yearMonth:   ym,
        incomeUSD:   0,
        expensesUSD: 0,
        savingsUSD:  0,
        savingsRate: 0,
        byCategory:  {},
      });
    }
    const flow = map.get(ym)!;
    if (tx.type === 'Ingreso') {
      flow.incomeUSD += tx.amountUSD;
    } else if (tx.type === 'Egreso') {
      flow.expensesUSD += tx.amountUSD;
      flow.byCategory[tx.category] = (flow.byCategory[tx.category] ?? 0) + tx.amountUSD;
    }
  }

  for (const flow of map.values()) {
    flow.savingsUSD  = flow.incomeUSD - flow.expensesUSD;
    flow.savingsRate = flow.incomeUSD > 0 ? flow.savingsUSD / flow.incomeUSD : 0;
  }

  return [...map.values()].sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
}

export const CATEGORY_COLORS: Record<string, string> = {
  'Supermercado':  '#60a5fa',
  'Alimentos':     '#34d399',
  'Salud':         '#a78bfa',
  'Transporte':    '#fbbf24',
  'Suscripciones': '#f87171',
  'Servicios':     '#fb923c',
  'Viajes':        '#e879f9',
  'Salidas / Ocio':'#2dd4bf',
  'Inversiones':   '#94a3b8',
  'Impuestos':     '#f43f5e',
  'Kiosco':        '#d9f99d',
  'Otros':         '#6b7280',
};

export function topCategories(flow: MonthlyFlow, n = 6): [string, number][] {
  return Object.entries(flow.byCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, n);
}
