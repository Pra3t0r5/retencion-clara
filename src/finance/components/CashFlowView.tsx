import { useState, useRef } from 'react';
import type { Transaction, MonthlyFlow } from '../engine/schemas';
import { aggregateByMonth, CATEGORY_COLORS, topCategories } from '../engine/cashflow';
import { parseFRPCSV } from '../importers/frp-csv';
import { financeDB } from '../storage';

const SVG_W = 700;
const SVG_H = 220;
const PAD_L = 56;
const PAD_R = 16;
const PAD_T = 16;
const PAD_B = 36;
const CHART_W = SVG_W - PAD_L - PAD_R;
const CHART_H = SVG_H - PAD_T - PAD_B;

function fmtUSD(n: number) {
  return `$${Math.round(n).toLocaleString('es-AR')}`;
}

function MonthlyBarChart({ flows }: { flows: MonthlyFlow[] }) {
  const [tooltip, setTooltip] = useState<{ x: number; flow: MonthlyFlow } | null>(null);
  if (flows.length === 0) return null;

  const maxVal = Math.max(...flows.map(f => Math.max(f.incomeUSD, f.expensesUSD))) * 1.1;
  const barW   = Math.min(28, CHART_W / flows.length - 4);

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => ({
    y:     PAD_T + CHART_H - f * CHART_H,
    label: `$${Math.round(maxVal * f / 1000)}k`,
  }));

  return (
    <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ width: '100%', maxWidth: SVG_W, display: 'block' }}>
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={PAD_L} x2={SVG_W - PAD_R} y1={t.y} y2={t.y} stroke="var(--color-border)" strokeWidth={0.5} />
          <text x={PAD_L - 4} y={t.y + 4} textAnchor="end" fontSize={9} fill="var(--color-muted)">{t.label}</text>
        </g>
      ))}

      {flows.map((flow, i) => {
        const cx = PAD_L + (i / flows.length) * CHART_W + CHART_W / flows.length / 2;
        const incH  = (flow.incomeUSD   / maxVal) * CHART_H;
        const expH  = (flow.expensesUSD / maxVal) * CHART_H;
        const baseY = PAD_T + CHART_H;

        return (
          <g key={flow.yearMonth}
            onMouseEnter={() => setTooltip({ x: cx, flow })}
            onMouseLeave={() => setTooltip(null)}
            style={{ cursor: 'pointer' }}
          >
            {/* Income bar */}
            <rect x={cx - barW / 2 - 1} y={baseY - incH} width={barW / 2} height={incH}
              fill="#34d399" opacity={0.8} rx={2} />
            {/* Expense bar */}
            <rect x={cx + 1} y={baseY - expH} width={barW / 2} height={expH}
              fill="#f87171" opacity={0.8} rx={2} />
            {/* X label */}
            <text x={cx} y={SVG_H - 4} textAnchor="middle" fontSize={8} fill="var(--color-muted)">
              {flow.yearMonth.slice(5, 7)}/{flow.yearMonth.slice(2, 4)}
            </text>
          </g>
        );
      })}

      {tooltip && (() => {
        const tx = Math.min(Math.max(tooltip.x - 75, PAD_L), SVG_W - 160);
        const ty = PAD_T + 4;
        const top = topCategories(tooltip.flow, 4);
        const h = 40 + top.length * 14;
        return (
          <g>
            <rect x={tx} y={ty} width={155} height={h} rx={4}
              fill="var(--color-surface)" stroke="var(--color-border)" strokeWidth={1} />
            <text x={tx + 8} y={ty + 14} fontSize={10} fontWeight={700} fill="var(--color-text)">
              {tooltip.flow.yearMonth}
            </text>
            <text x={tx + 8} y={ty + 26} fontSize={9} fill="#34d399">
              {`Ing: ${fmtUSD(tooltip.flow.incomeUSD)}`}
            </text>
            <text x={tx + 80} y={ty + 26} fontSize={9} fill="#f87171">
              {`Eg: ${fmtUSD(tooltip.flow.expensesUSD)}`}
            </text>
            {top.map(([cat, val], i) => (
              <text key={cat} x={tx + 8} y={ty + 38 + i * 14} fontSize={8} fill="var(--color-muted)">
                {`${cat}: ${fmtUSD(val)}`}
              </text>
            ))}
          </g>
        );
      })()}

      {/* Legend */}
      <rect x={SVG_W - 100} y={PAD_T} width={8} height={8} fill="#34d399" rx={1} />
      <text x={SVG_W - 89} y={PAD_T + 8} fontSize={9} fill="var(--color-muted)">Ingreso</text>
      <rect x={SVG_W - 100} y={PAD_T + 14} width={8} height={8} fill="#f87171" rx={1} />
      <text x={SVG_W - 89} y={PAD_T + 22} fontSize={9} fill="var(--color-muted)">Egreso</text>
    </svg>
  );
}

export function CashFlowView({ transactions, onImport }: {
  transactions: Transaction[];
  onImport: (txs: Transaction[]) => void;
}) {
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const flows = aggregateByMonth(transactions);

  async function handleFile(file: File) {
    setImporting(true);
    setImportMsg(null);
    try {
      const text = await file.text();
      const batch = new Date().toISOString();
      const result = parseFRPCSV(text, batch);
      financeDB.addTransactions(result.transactions);
      onImport(result.transactions);
      setImportMsg(`✓ ${result.transactions.length} transacciones importadas${result.skipped > 0 ? `, ${result.skipped} omitidas` : ''}`);
    } catch (e) {
      setImportMsg(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setImporting(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  // Summary totals
  const totalIncome   = flows.reduce((s, f) => s + f.incomeUSD, 0);
  const totalExpenses = flows.reduce((s, f) => s + f.expensesUSD, 0);
  const avgSavings    = flows.length > 0 ? flows.reduce((s, f) => s + f.savingsRate, 0) / flows.length : 0;

  // Category totals
  const catTotals: Record<string, number> = {};
  for (const f of flows) {
    for (const [cat, val] of Object.entries(f.byCategory)) {
      catTotals[cat] = (catTotals[cat] ?? 0) + val;
    }
  }
  const sortedCats = Object.entries(catTotals).sort(([, a], [, b]) => b - a);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Import zone */}
      <div
        onDrop={onDrop}
        onDragOver={e => e.preventDefault()}
        style={{
          border: '2px dashed var(--color-border)',
          borderRadius: 8,
          padding: '1rem',
          textAlign: 'center',
          cursor: 'pointer',
          background: 'var(--color-surface-2)',
        }}
        onClick={() => fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" accept=".csv,.xlsx" style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        {importing
          ? <span style={{ color: 'var(--color-muted)' }}>Procesando...</span>
          : <span style={{ color: 'var(--color-muted)', fontSize: 13 }}>
              Arrastrá o hacé click para importar CSV del Financial Restructuring Plan
            </span>
        }
        {importMsg && (
          <div style={{ marginTop: 8, fontSize: 12, color: importMsg.startsWith('✓') ? '#34d399' : '#f87171' }}>
            {importMsg}
          </div>
        )}
      </div>

      {flows.length === 0 ? (
        <p style={{ color: 'var(--color-muted)', fontSize: 13 }}>Sin transacciones. Importá un CSV del FRP.</p>
      ) : (
        <>
          {/* Summary stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            {[
              { label: 'Ingreso total', value: fmtUSD(totalIncome), color: '#34d399' },
              { label: 'Egreso total',  value: fmtUSD(totalExpenses), color: '#f87171' },
              { label: 'Ahorro promedio', value: `${(avgSavings * 100).toFixed(1)}%`, color: '#60a5fa' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'var(--color-surface-2)', borderRadius: 8, padding: '0.75rem',
                display: 'flex', flexDirection: 'column', gap: 4,
              }}>
                <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>{s.label}</span>
                <span style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>

          <MonthlyBarChart flows={flows} />

          {/* Category breakdown */}
          <div>
            <h4 style={{ margin: '0 0 0.5rem', fontSize: 13, color: 'var(--color-muted)' }}>Egresos por categoría (total período)</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {sortedCats.map(([cat, val]) => {
                const pct = totalExpenses > 0 ? val / totalExpenses : 0;
                return (
                  <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 80, fontSize: 11, color: 'var(--color-muted)', textAlign: 'right' }}>{cat}</div>
                    <div style={{ flex: 1, height: 12, background: 'var(--color-border)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        width: `${pct * 100}%`, height: '100%',
                        background: CATEGORY_COLORS[cat] ?? '#6b7280',
                        borderRadius: 4,
                      }} />
                    </div>
                    <div style={{ width: 72, fontSize: 11, color: 'var(--color-text)', textAlign: 'right' }}>
                      {fmtUSD(val)} <span style={{ color: 'var(--color-muted)' }}>({(pct * 100).toFixed(0)}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
