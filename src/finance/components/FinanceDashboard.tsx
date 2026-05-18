import { useState, useEffect } from 'react';
import type { Transaction, IncomeEntry } from '../engine/schemas';
import { financeDB } from '../storage';
import { IncomeCurveView } from './IncomeCurveView';
import { CashFlowView } from './CashFlowView';
import { NetWorthView } from './NetWorthView';

type SubTab = 'ingresos' | 'flujo' | 'patrimonio';

const SUB_TABS: { id: SubTab; label: string }[] = [
  { id: 'ingresos',   label: 'Ingresos' },
  { id: 'flujo',      label: 'Flujo' },
  { id: 'patrimonio', label: 'Patrimonio' },
];

export function FinanceDashboard() {
  const [subTab, setSubTab] = useState<SubTab>('ingresos');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [incomeOverrides, setIncomeOverrides] = useState<IncomeEntry[]>([]);
  const [snapshots, setSnapshots] = useState(financeDB.load().netWorthSnapshots);

  useEffect(() => {
    const db = financeDB.load();
    setTransactions(db.transactions);
    setIncomeOverrides(db.incomeOverrides);
    setSnapshots(db.netWorthSnapshots);
  }, []);

  function handleImport(newTxs: Transaction[]) {
    setTransactions(prev => {
      const existing = new Set(prev.map(t => `${t.date}|${t.description}|${t.amountARS}`));
      const fresh = newTxs.filter(t => !existing.has(`${t.date}|${t.description}|${t.amountARS}`));
      return [...prev, ...fresh];
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Sub-tab navigation */}
      <div style={{ display: 'flex', gap: 4 }}>
        {SUB_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            style={{
              flex: 1,
              padding: '8px 4px',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              background: subTab === t.id ? 'var(--color-accent)' : 'var(--color-surface-2)',
              color: subTab === t.id ? '#000' : 'var(--color-muted)',
              fontWeight: subTab === t.id ? 700 : 400,
              fontSize: 13,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {subTab === 'ingresos' && (
        <IncomeCurveView overrides={incomeOverrides} />
      )}
      {subTab === 'flujo' && (
        <CashFlowView transactions={transactions} onImport={handleImport} />
      )}
      {subTab === 'patrimonio' && (
        <NetWorthView snapshots={snapshots} />
      )}
    </div>
  );
}
