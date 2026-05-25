import type { FinanceDB, Transaction, IncomeEntry, NetWorthSnapshot } from './engine/schemas';
import { FinanceDB as FinanceDBSchema } from './engine/schemas';

// Historical net worth snapshots extracted from FRP Balance General sheets
// Source priority: Capital Neto (USD) field is authoritative per file
// creditCardsARS = Total Pasivos ARS (all liabilities: cards + bills)
// creditCardsUSD = Total Pasivos USD
// tcForARS derived from: tcForARS = creditCardsARS / (totalAssetsUSD - creditCardsUSD - netWorthUSD)
const NET_WORTH_SEED: NetWorthSnapshot[] = [
  {
    date: '2025-09-30',
    assets: {
      cashPhysicalUSD:  3950,
      cashSantanderUSD: 5689.90,
      cashSantanderARS: 0,
      balanzUSD:        0,
      finzoUSD:         0,
      cryptoUSD:        1339.90,
      otherUSD:         307,    // Reales 38 + Libras 269
    },
    liabilities: {
      creditCardsARS: 2464264,
      creditCardsUSD: 1482,
      otherARS:       0,
      tcForARS:       1510,
    },
    netWorthUSD: 7865.95,
    notes: 'Balance General Sep 2025 — FRP (registrado 05/10/2025)',
  },
  {
    date: '2025-10-31',
    assets: {
      cashPhysicalUSD:  950,
      cashSantanderUSD: 5769.03,
      cashSantanderARS: 0,
      balanzUSD:        0,
      finzoUSD:         2139.96,
      cryptoUSD:        1411.71,
      otherUSD:         308,    // Reales 40 + Libras 268
    },
    liabilities: {
      creditCardsARS: 2006772,
      creditCardsUSD: 0,
      otherARS:       0,
      tcForARS:       1426,
    },
    netWorthUSD: 8779.75,
    notes: 'Balance General Oct 2025 — FRP',
  },
  {
    date: '2025-11-30',
    assets: {
      cashPhysicalUSD:  950,
      cashSantanderUSD: 4831.44,
      cashSantanderARS: 0,
      balanzUSD:        0,
      finzoUSD:         4152.56,
      cryptoUSD:        1308.30,
      otherUSD:         304,    // Reales 40 + Libras 264
    },
    liabilities: {
      creditCardsARS: 2417248,
      creditCardsUSD: 2,
      otherARS:       0,
      tcForARS:       1465,
    },
    netWorthUSD: 9590.24,
    notes: 'Balance General Nov 2025 — FRP',
  },
  {
    date: '2025-12-31',
    assets: {
      cashPhysicalUSD:  950,
      cashSantanderUSD: 5610.16,
      cashSantanderARS: 0,
      balanzUSD:        0,
      finzoUSD:         4153.85,
      cryptoUSD:        1323.42,
      otherUSD:         2415,   // Reales 40 + Libras 264 + Lemon Fer 1156 + Lemon Perla 955
    },
    liabilities: {
      creditCardsARS: 2377750,
      creditCardsUSD: 47,
      otherARS:       0,
      tcForARS:       1451,
    },
    netWorthUSD: 10352.01,
    notes: 'Balance General Dic 2025 — FRP',
  },
  {
    date: '2026-01-31',
    assets: {
      cashPhysicalUSD:  1150,
      cashSantanderUSD: 3059.01,
      cashSantanderARS: 40346,  // Santander 30346 + Lemon Perla 10000 ARS
      balanzUSD:        2000,
      finzoUSD:         5205.54,
      cryptoUSD:        1500,   // BTC 1256 + ETH 244
      otherUSD:         367,    // Reales 38 + Libras 270 + Lemon Fer 6 + Lemon Perla 54 USD
    },
    liabilities: {
      creditCardsARS: 3125631,
      creditCardsUSD: 0,
      otherARS:       0,
      tcForARS:       1462,
    },
    netWorthUSD: 11170.69,
    notes: 'Balance General Ene 2026 — FRP',
  },
  {
    date: '2026-02-28',
    assets: {
      cashPhysicalUSD:  1150,
      cashSantanderUSD: 4192.06,
      cashSantanderARS: 41012,  // Lemon Fer 40735 + Lemon Perla 277 ARS
      balanzUSD:        500,
      finzoUSD:         5231.68,
      cryptoUSD:        1192,   // BTC 1018 + ETH 174
      otherUSD:         309,    // Reales 40 + Libras 268 + Lemon Fer 1 USD
    },
    liabilities: {
      creditCardsARS: 2856344,
      creditCardsUSD: 543,
      otherARS:       0,
      tcForARS:       1430,
    },
    netWorthUSD: 10062.58,
    notes: 'Balance General Feb 2026 — FRP (registrado 05/03/2026)',
  },
  {
    date: '2026-03-31',
    assets: {
      cashPhysicalUSD:  1150,
      cashSantanderUSD: 3422.76,
      cashSantanderARS: 20277,  // Lemon Fer 20000 + Lemon Perla 277 ARS
      balanzUSD:        2500,
      finzoUSD:         5254.25,
      cryptoUSD:        1174,   // BTC 998 + ETH 176
      otherUSD:         309,    // Reales 40 + Libras 268 + Lemon Fer 1 USD
    },
    liabilities: {
      creditCardsARS: 3462640,
      creditCardsUSD: 50,
      otherARS:       0,
      tcForARS:       1384,
    },
    netWorthUSD: 11272.92,
    notes: 'Balance General Mar 2026 — FRP (registrado 25/03/2026)',
  },
  {
    date: '2026-04-30',
    assets: {
      cashPhysicalUSD:  1150,
      cashSantanderUSD: 5616.06,
      cashSantanderARS: 8722,   // Lemon Fer ARS
      balanzUSD:        3000,
      finzoUSD:         5495.04,
      cryptoUSD:        1240,   // BTC 1008 + ETH 191 + QQQ 42 + NEXO 0.22
      otherUSD:         313,    // Reales 42 + Libras 270 + Lemon Fer 1 USD
    },
    liabilities: {
      creditCardsARS: 3435584,
      creditCardsUSD: 203,
      otherARS:       0,
      tcForARS:       1431,
    },
    netWorthUSD: 14216.16,
    notes: 'Balance General Apr 2026 — FRP (Balance General 3004)',
  },
];

const EMPTY_DB: FinanceDB = {
  transactions:      [],
  incomeOverrides:   [],
  netWorthSnapshots: NET_WORTH_SEED,
  lastImport:        null,
};

const KEY = 'finance_v1';

function load(): FinanceDB {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY_DB;
    const parsed = FinanceDBSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return EMPTY_DB;
    // Merge: seed wins for seeded dates (FRP data is authoritative for historical months),
    // stored wins for any date not in the seed (user-added future snapshots preserved)
    const stored = parsed.data;
    const seedDates = new Set(NET_WORTH_SEED.map(s => s.date));
    const merged = [
      ...NET_WORTH_SEED,
      ...stored.netWorthSnapshots.filter(s => !seedDates.has(s.date)),
    ].sort((a, b) => a.date.localeCompare(b.date));
    return { ...stored, netWorthSnapshots: merged };
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
