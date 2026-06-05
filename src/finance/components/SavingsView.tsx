import { useState, useMemo } from 'react';
import type { IncomeEntry, NetWorthSnapshot } from '../engine/schemas';
import { computeSavingsAnalysis } from '../engine/savings';
import type { SavingsPoint } from '../engine/savings';

const SVG_W = 720;
const SVG_H = 220;
const PAD_L = 60;
const PAD_R = 16;
const PAD_T = 20;
const PAD_B = 32;
const CHART_W = SVG_W - PAD_L - PAD_R;
const CHART_H = SVG_H - PAD_T - PAD_B;

function fmtUSD(n: number) {
  return `$${Math.round(n).toLocaleString('es-AR')}`;
}

function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

function SavingsChart({ points }: { points: SavingsPoint[] }) {
  const [tooltip, setTooltip] = useState<{ mx: number; my: number; pt: SavingsPoint } | null>(null);
  const [expanded, setExpanded] = useState(false);

  if (points.length === 0) return null;

  const maxIncome = Math.max(...points.map(p => p.incomeUSD)) * 1.15 || 1;
  const slotW = CHART_W / points.length;
  const barW  = Math.min(20, slotW * 0.38);

  const yTicks = [0, 0.5, 1].map(f => ({
    y: PAD_T + CHART_H - f * CHART_H,
    label: `$${Math.round(maxIncome * f / 1000)}k`,
  }));

  const chart = (
    <div className="finance-chart-wrap" style={{ flex: expanded ? 1 : undefined }}>
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
        {/* Y grid */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={PAD_L} x2={SVG_W - PAD_R} y1={t.y} y2={t.y}
              stroke="var(--color-border)" strokeWidth={0.8} />
            <text x={PAD_L - 6} y={t.y + 4} textAnchor="end" fontSize={9}
              fill="var(--color-text-muted)">{t.label}</text>
          </g>
        ))}

        {/* Bars */}
        {points.map((pt, i) => {
          const cx    = PAD_L + slotW * i + slotW / 2;
          const baseY = PAD_T + CHART_H;
          const incH  = (pt.incomeUSD / maxIncome) * CHART_H;
          const dnwH  = Math.abs(pt.deltaNetWorthUSD / maxIncome * CHART_H);
          const dnwPositive = pt.deltaNetWorthUSD >= 0;

          return (
            <g key={pt.yearMonth} style={{ pointerEvents: 'none' }}>
              {/* Income bar (green) */}
              <rect x={cx - barW - 1} y={baseY - incH} width={barW} height={incH}
                fill="var(--color-success)" opacity={0.7} rx={2} />
              {/* Delta NW bar (blue positive, red negative) */}
              <rect
                x={cx + 1}
                y={dnwPositive ? baseY - dnwH : baseY}
                width={barW}
                height={dnwH}
                fill={dnwPositive ? 'var(--color-primary)' : 'var(--color-danger)'}
                opacity={0.8}
                rx={2}
              />
              {/* X label */}
              <text x={cx} y={SVG_H - 4} textAnchor="middle" fontSize={8}
                fill="var(--color-text-muted)">
                {pt.yearMonth.slice(5, 7)}/{pt.yearMonth.slice(2, 4)}
              </text>
              {/* Savings rate label above income bar */}
              <text x={cx - barW / 2 - 1} y={baseY - incH - 3} textAnchor="middle" fontSize={7.5}
                fill={pt.savingsRate >= 0 ? 'var(--color-success)' : 'var(--color-danger)'}>
                {pct(pt.savingsRate)}
              </text>
            </g>
          );
        })}

        {/* Invisible hit rects */}
        {points.map((pt, i) => (
          <rect
            key={`hit-${i}`}
            x={PAD_L + slotW * i}
            y={PAD_T}
            width={slotW}
            height={CHART_H}
            fill="transparent"
            style={{ cursor: 'pointer' }}
            onMouseEnter={e => setTooltip({ mx: e.clientX, my: e.clientY, pt })}
          />
        ))}

        {/* Legend */}
        <rect x={PAD_L + 4} y={PAD_T} width={8} height={8} fill="var(--color-success)" opacity={0.7} rx={1} />
        <text x={PAD_L + 15} y={PAD_T + 8} fontSize={9} fill="var(--color-text-muted)">Ingreso</text>
        <rect x={PAD_L + 60} y={PAD_T} width={8} height={8} fill="var(--color-primary)" opacity={0.8} rx={1} />
        <text x={PAD_L + 71} y={PAD_T + 8} fontSize={9} fill="var(--color-text-muted)">ΔPatrimonio</text>
      </svg>

      {tooltip && (
        <div style={{
          position: 'fixed',
          left: tooltip.mx + 14,
          top: tooltip.my - 10,
          transform: tooltip.mx > window.innerWidth - 240 ? 'translateX(-110%)' : undefined,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 12px',
          fontSize: 12,
          minWidth: 210,
          pointerEvents: 'none',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          zIndex: 9999,
          lineHeight: 1.7,
        }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{tooltip.pt.yearMonth}</div>
          <div style={{ color: 'var(--color-success)', fontSize: 11 }}>
            Ingreso: {fmtUSD(tooltip.pt.incomeUSD)}
          </div>
          <div style={{
            color: tooltip.pt.deltaNetWorthUSD >= 0 ? 'var(--color-primary)' : 'var(--color-danger)',
            fontSize: 11,
          }}>
            ΔPatrimonio: {fmtUSD(tooltip.pt.deltaNetWorthUSD)}
          </div>
          <div style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>
            Gasto implícito: {fmtUSD(tooltip.pt.impliedExpensesUSD)}
          </div>
          <div style={{
            borderTop: '1px solid var(--color-border)',
            marginTop: 4, paddingTop: 4,
            fontWeight: 600,
            color: tooltip.pt.savingsRate >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
          }}>
            Tasa de ahorro: {pct(tooltip.pt.savingsRate)}
          </div>
        </div>
      )}
    </div>
  );

  if (expanded) {
    return (
      <div className="finance-fullscreen">
        <div className="finance-fullscreen-header">
          <span className="finance-fullscreen-title">Ahorro efectivo — ingreso vs ΔPatrimonio</span>
          <button className="finance-fullscreen-close" onClick={() => setExpanded(false)}>✕ Cerrar</button>
        </div>
        {chart}
      </div>
    );
  }

  return chart;
}

export function SavingsView({
  snapshots,
  incomeOverrides,
}: {
  snapshots: NetWorthSnapshot[];
  incomeOverrides: IncomeEntry[];
}) {
  const points = useMemo(
    () => computeSavingsAnalysis(snapshots, incomeOverrides),
    [snapshots, incomeOverrides],
  );

  if (points.length === 0) {
    return (
      <p style={{ color: 'var(--color-text-muted)', padding: '1rem', fontSize: 'var(--text-sm)', margin: 0 }}>
        Sin datos. Se necesitan al menos 2 snapshots de patrimonio consecutivos con ingresos del mismo mes.
      </p>
    );
  }

  const totalIncome   = points.reduce((s, p) => s + p.incomeUSD, 0);
  const totalDeltaNW  = points.reduce((s, p) => s + p.deltaNetWorthUSD, 0);
  const totalExpenses = points.reduce((s, p) => s + p.impliedExpensesUSD, 0);
  const avgSavings    = totalIncome > 0 ? totalDeltaNW / totalIncome : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
        {[
          { label: 'Ingreso total',      value: fmtUSD(totalIncome),   color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
          { label: 'ΔPatrimonio total',  value: fmtUSD(totalDeltaNW),  color: 'var(--color-primary)', bg: 'var(--color-primary-bg)' },
          { label: 'Gasto implícito',    value: fmtUSD(totalExpenses), color: 'var(--color-danger)',  bg: 'var(--color-danger-bg)'  },
          { label: 'Tasa ahorro prom.',  value: pct(avgSavings),       color: avgSavings >= 0 ? 'var(--color-success)' : 'var(--color-danger)', bg: 'var(--color-surface)' },
        ].map(s => (
          <div key={s.label} style={{
            background: s.bg, border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)', padding: '0.75rem',
          }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{s.label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <SavingsChart points={points} />

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-xs)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              {['Período', 'Ingreso', 'ΔPatrimonio', 'Gasto implícito', 'Tasa ahorro'].map(h => (
                <th key={h} style={{
                  padding: '6px 8px', textAlign: 'right',
                  color: 'var(--color-text-muted)', fontWeight: 500,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...points].reverse().map(pt => (
              <tr key={pt.yearMonth} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '5px 8px', color: 'var(--color-text-muted)', textAlign: 'right' }}>
                  {pt.yearMonth}
                </td>
                <td style={{ padding: '5px 8px', textAlign: 'right', color: 'var(--color-success)', fontWeight: 600 }}>
                  {fmtUSD(pt.incomeUSD)}
                </td>
                <td style={{
                  padding: '5px 8px', textAlign: 'right', fontWeight: 600,
                  color: pt.deltaNetWorthUSD >= 0 ? 'var(--color-primary)' : 'var(--color-danger)',
                }}>
                  {fmtUSD(pt.deltaNetWorthUSD)}
                </td>
                <td style={{ padding: '5px 8px', textAlign: 'right', color: 'var(--color-text-muted)' }}>
                  {fmtUSD(pt.impliedExpensesUSD)}
                </td>
                <td style={{
                  padding: '5px 8px', textAlign: 'right', fontWeight: 600,
                  color: pt.savingsRate >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
                }}>
                  {pct(pt.savingsRate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
