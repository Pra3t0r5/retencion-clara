import { useState, useEffect } from 'react';
import type { Transaction, IncomeEntry } from '../engine/schemas';
import { financeDB } from '../storage';
import { IncomeCurveView } from './IncomeCurveView';
import { CashFlowView } from './CashFlowView';
import { NetWorthView } from './NetWorthView';
import { SavingsView } from './SavingsView';
import '../finance.css';

// [AI] Sub-tabs use .segmented/.segment (not .tabs/.tab) to visually signal
// "secondary selector within this section" vs primary app navigation.
// See specs/012-mobile-ux/design-system.md §3.4

type SubTab = 'ingresos' | 'flujo' | 'patrimonio' | 'ahorro';

const SUB_TABS: { id: SubTab; label: string; desc: string }[] = [
  { id: 'ingresos',   label: 'Ingresos',   desc: 'Curva de sueldo desde May 2022' },
  { id: 'flujo',      label: 'Gastos',     desc: 'Flujo mensual — importá el CSV del FRP' },
  { id: 'patrimonio', label: 'Patrimonio', desc: 'Activos y pasivos' },
  { id: 'ahorro',     label: 'Ahorro',     desc: 'Ingreso vs ΔPatrimonio — tasa de retención real' },
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

  const active = SUB_TABS.find(t => t.id === subTab)!;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div className="segmented">
        {SUB_TABS.map(t => (
          <button
            key={t.id}
            className={`segment${subTab === t.id ? ' active' : ''}`}
            onClick={() => setSubTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
        {active.desc}
      </p>

      {subTab === 'ingresos'   && <IncomeCurveView overrides={incomeOverrides} />}
      {subTab === 'flujo'      && <CashFlowView transactions={transactions} onImport={handleImport} />}
      {subTab === 'patrimonio' && (
        <NetWorthView
          snapshots={snapshots}
          onAdd={snap => {
            financeDB.addNetWorthSnapshot(snap);
            setSnapshots(financeDB.load().netWorthSnapshots);
          }}
        />
      )}
      {subTab === 'ahorro' && (
        <SavingsView snapshots={snapshots} incomeOverrides={incomeOverrides} />
      )}
    </div>
  );
}
