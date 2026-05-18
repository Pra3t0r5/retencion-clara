import type { FinanceDB, Transaction, IncomeEntry, NetWorthSnapshot } from './engine/schemas';
import { FinanceDB as FinanceDBSchema } from './engine/schemas';

// Hardcoded April 2026 balance from estadocuenta2026-4-7.xlsx + vault notes
const INITIAL_SNAPSHOT: NetWorthSnapshot = {
  date: '2026-04-30',
  assets: {
    cashPhysicalUSD:  1150,
    cashSantanderUSD: 2541,
    cashSantanderARS: 7167,
    balanzUSD:        3000,
    finzoUSD:         5495,
    cryptoUSD:        1198,
    otherUSD:         312,   // Reales + Libras billete
  },
  liabilities: {
    creditCardsARS: 1706268,
    creditCardsUSD: 172,
    otherARS:       0,
    tcForARS:       1431,
  },
  netWorthUSD: 12386,
  notes: 'Balance inicial seeded — Balance General 30/04/2026 (estadocuenta2026-4-7.xlsx)',
};

const EMPTY_DB: FinanceDB = {
  transactions:      [],
  incomeOverrides:   [],
  netWorthSnapshots: [INITIAL_SNAPSHOT],
  lastImport:        null,
};

const KEY = 'finance_v1';

function load(): FinanceDB {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY_DB;
    const parsed = FinanceDBSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : EMPTY_DB;
  } catch {
    return EMPTY_DB;
  }
}

function save(db: FinanceDB): void {
  localStorage.setItem(KEY, JSON.stringify(db));
}

export const financeDB = {
  load,

  addTransactions(txs: Transaction[]): void {
    const db = load();
    // Deduplicate by date+description+amount
    const existing = new Set(db.transactions.map(t => `${t.date}|${t.description}|${t.amountARS}`));
    const fresh = txs.filter(t => !existing.has(`${t.date}|${t.description}|${t.amountARS}`));
    db.transactions = [...db.transactions, ...fresh];
    db.lastImport = new Date().toISOString();
    save(db);
  },

  saveIncomeOverride(entry: IncomeEntry): void {
    const db = load();
    const idx = db.incomeOverrides.findIndex(e => e.year === entry.year && e.month === entry.month);
    if (idx >= 0) db.incomeOverrides[idx] = entry;
    else db.incomeOverrides.push(entry);
    save(db);
  },

  addNetWorthSnapshot(snap: NetWorthSnapshot): void {
    const db = load();
    db.netWorthSnapshots = [...db.netWorthSnapshots.filter(s => s.date !== snap.date), snap]
      .sort((a, b) => a.date.localeCompare(b.date));
    save(db);
  },

  reset(): void {
    save(EMPTY_DB);
  },
};
