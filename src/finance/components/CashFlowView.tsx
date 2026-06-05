import { useState, useRef } from 'react';
import type { Transaction, MonthlyFlow } from '../engine/schemas';
import { aggregateByMonth, CATEGORY_COLORS, topCategories } from '../engine/cashflow';
import { parseFRPCSV } from '../importers/frp-csv';
import { financeDB } from '../storage';

const SVG_W = 680;
const SVG_H = 200;
const PAD_L = 52;
const PAD_R = 12;
const PAD_T = 16;
const PAD_B = 32;
const CHART_W = SVG_W - PAD_L - PAD_R;
const CHART_H = SVG_H - PAD_T - PAD_B;

function fmtUSD(n: number) {
  return `$${Math.round(n).toLocaleString('es-AR')}`;
}

function MonthlyBarChart({ flows }: { flows: MonthlyFlow[] }) {
  const [tooltip, setTooltip] = useState<{ mx: number; my: number; flow: MonthlyFlow } | null>(null);
  const [expanded, setExpanded] = useState(false);
  if (flows.length === 0) return null;

  const maxVal = Math.max(...flows.map(f => Math.max(f.incomeUSD, f.expensesUSD))) * 1.12 || 1;
  const slotW  = CHART_W / flows.length;
  const barW   = Math.min(22, slotW * 0.4);

  const yTicks = [0, 0.5, 1].map(f => ({
    y: PAD_T + CHART_H - f * CHART_H,
    label: `$${Math.round(maxVal * f / 1000)}k`,
  }));

  const chart = (
    <div className="finance-chart-wrap" style={{
      overflowX: 'auto',
      flex: expanded ? 1 : undefined,
    }}>
      {!expanded && (
        <button
          className="finance-chart-expand-btn"
          onClick={() => setExpanded(true)}
          title="Pantalla completa"
        >⛶</button>
      )}

      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        style={{ width: '100%', maxWidth: expanded ? '100%' : SVG_W, display: 'block' }}
        onMouseLeave={() => setTooltip(null)}
        onMouseMove={e => {
          if (tooltip) setTooltip(t => t ? { ...t, mx: e.clientX, my: e.clientY } : null);
        }}
      >
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={PAD_L} x2={SVG_W - PAD_R} y1={t.y} y2={t.y}
              stroke="var(--color-border)" strokeWidth={0.8} />
            <text x={PAD_L - 5} y={t.y + 4} textAnchor="end" fontSize={9}
              fill="var(--color-text-muted)">{t.label}</text>
          </g>
        ))}

        {flows.map((flow, i) => {
          const cx    = PAD_L + slotW * i + slotW / 2;
          const baseY = PAD_T + CHART_H;
          const incH  = (flow.incomeUSD   / maxVal) * CHART_H;
          const expH  = (flow.expensesUSD / maxVal) * CHART_H;

          return (
            <g key={flow.yearMonth} style={{ pointerEvents: 'none' }}>
              <rect x={cx - barW - 1} y={baseY - incH} width={barW} height={incH}
                fill="var(--color-success)" opacity={0.75} rx={2} />
              <rect x={cx + 1} y={baseY - expH} width={barW} height={expH}
                fill="var(--color-danger)" opacity={0.75} rx={2} />
              <text x={cx} y={SVG_H - 4} textAnchor="middle" fontSize={8}
                fill="var(--color-text-muted)">
                {flow.yearMonth.slice(5, 7)}/{flow.yearMonth.slice(2, 4)}
              </text>
            </g>
          );
        })}

        {/* Invisible hit rects — full column width per bar */}
        {flows.map((flow, i) => (
          <rect
            key={`hit-${i}`}
            x={PAD_L + slotW * i}
            y={PAD_T}
            width={slotW}
            height={CHART_H}
            fill="transparent"
            style={{ cursor: 'pointer' }}
            onMouseEnter={e => setTooltip({ mx: e.clientX, my: e.clientY, flow })}
          />
        ))}

        {/* Legend */}
        <rect x={SVG_W - 96} y={PAD_T} width={8} height={8}
          fill="var(--color-success)" opacity={0.75} rx={1} />
        <text x={SVG_W - 85} y={PAD_T + 8} fontSize={9} fill="var(--color-text-muted)">Ingreso</text>
        <rect x={SVG_W - 96} y={PAD_T + 13} width={8} height={8}
          fill="var(--color-danger)" opacity={0.75} rx={1} />
        <text x={SVG_W - 85} y={PAD_T + 21} fontSize={9} fill="var(--color-text-muted)">Egreso</text>
      </svg>

      {tooltip && (() => {
        const top = topCategories(tooltip.flow, 3);
        return (
          <div style={{
            position: 'fixed',
            left: tooltip.mx + 14,
            top: tooltip.my - 10,
            transform: tooltip.mx > window.innerWidth - 220 ? 'translateX(-110%)' : undefined,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            fontSize: 12,
            minWidth: 180,
            pointerEvents: 'none',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            zIndex: 9999,
            lineHeight: 1.7,
          }}>
            <div style={{ fontWeight: 700, marginBottom: 2 }}>{tooltip.flow.yearMonth}</div>
            <div style={{ color: 'var(--color-success)', fontSize: 11 }}>
              Ingreso: {fmtUSD(tooltip.flow.incomeUSD)}
            </div>
            <div style={{ color: 'var(--color-danger)', fontSize: 11 }}>
              Egreso: {fmtUSD(tooltip.flow.expensesUSD)}
            </div>
            {top.length > 0 && (
              <div style={{ marginTop: 4, borderTop: '1px solid var(--color-border)', paddingTop: 4 }}>
                {top.map(([cat, val]) => (
                  <div key={cat} style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>
                    {cat}: {fmtUSD(val)}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );

  if (expanded) {
    return (
      <div className="finance-fullscreen">
        <div className="finance-fullscreen-header">
          <span className="finance-fullscreen-title">Flujo mensual — ingresos y egresos</span>
          <button className="finance-fullscreen-close" onClick={() => setExpanded(false)}>✕ Cerrar</button>
        </div>
        {chart}
      </div>
    );
  }

  return chart;
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
      const result = parseFRPCSV(text, new Date().toISOString());
      financeDB.addTransactions(result.transactions);
      onImport(result.transactions);
      setImportMsg(`✓ ${result.transactions.length} transacciones importadas${result.skipped > 0 ? `, ${result.skipped} omitidas` : ''}`);
    } catch (e) {
      setImportMsg(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setImporting(false);
    }
  }

  const totalIncome   = flows.reduce((s, f) => s + f.incomeUSD, 0);
  const totalExpenses = flows.reduce((s, f) => s + f.expensesUSD, 0);
  const avgSavings    = flows.length > 0
    ? flows.reduce((s, f) => s + f.savingsRate, 0) / flows.length : 0;

  const catTotals: Record<string, number> = {};
  for (const f of flows) {
    for (const [cat, val] of Object.entries(f.byCategory)) {
      catTotals[cat] = (catTotals[cat] ?? 0) + val;
    }
  }
  const sortedCats = Object.entries(catTotals).sort(([, a], [, b]) => b - a);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Import drop zone */}
      <div
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        onDragOver={e => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        style={{
          border: `2px dashed var(--color-border)`,
          borderRadius: 'var(--radius)',
          padding: '1rem',
          textAlign: 'center',
          cursor: 'pointer',
          background: 'var(--color-bg)',
        }}
      >
        <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        {importing
          ? <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>Procesando…</span>
          : <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
              📂 Arrastrá o hacé clic — CSV del Financial Restructuring Plan
            </span>
        }
        {importMsg && (
          <div style={{
            marginTop: 8, fontSize: 'var(--text-xs)',
            color: importMsg.startsWith('✓') ? 'var(--color-success)' : 'var(--color-danger)',
          }}>
            {importMsg}
          </div>
        )}
      </div>

      {flows.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', margin: 0 }}>
          Sin datos. Importá el CSV del Google Sheet "Financial Restructuring Plan".
        </p>
      ) : (
        <>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            {[
              { label: 'Ingreso total',     value: fmtUSD(totalIncome),              color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
              { label: 'Egreso total',      value: fmtUSD(totalExpenses),            color: 'var(--color-danger)',  bg: 'var(--color-danger-bg)' },
              { label: 'Ahorro promedio',   value: `${(avgSavings * 100).toFixed(0)}%`, color: 'var(--color-primary)', bg: 'var(--color-primary-bg)' },
            ].map(s => (
              <div key={s.label} style={{
                background: s.bg,
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)',
                padding: '0.75rem',
              }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{s.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          <MonthlyBarChart flows={flows} />

          {/* Category bars */}
          <div>
            <p style={{ margin: '0 0 0.5rem', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              Egresos por categoría — total período
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {sortedCats.map(([cat, val]) => {
                const pct = totalExpenses > 0 ? val / totalExpenses : 0;
                return (
                  <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 90, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textAlign: 'right', flexShrink: 0 }}>
                      {cat}
                    </div>
                    <div style={{ flex: 1, height: 10, background: 'var(--color-border)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        width: `${pct * 100}%`, height: '100%',
                        background: CATEGORY_COLORS[cat] ?? 'var(--color-text-muted)',
                        borderRadius: 4,
                        opacity: 0.8,
                      }} />
                    </div>
                    <div style={{ width: 80, fontSize: 'var(--text-xs)', color: 'var(--color-text)', textAlign: 'right', flexShrink: 0 }}>
                      {fmtUSD(val)} <span style={{ color: 'var(--color-text-muted)' }}>({(pct * 100).toFixed(0)}%)</span>
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
