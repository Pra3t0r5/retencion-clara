import { useMemo, useState } from 'react';
import type { IncomeEntry } from '../engine/schemas';
import { buildPowerCurve, getModalityLabel } from '../engine/income';
import type { PowerPoint } from '../engine/schemas';

const MODALITY_COLOR: Record<string, string> = {
  'contractor':    '#a78bfa',
  'crehana-ars':   '#fb923c',
  'crehana-split': '#fbbf24',  // amarillo — transición ARS+USD
  'crehana-usd':   '#16a34a',
  'deel':          '#2563eb',
  'manual':        '#64748b',
};

type Metric = 'nominalUSD' | 'realUSD' | 'realARS' | 'canastas';

const METRIC_LABELS: Record<Metric, string> = {
  nominalUSD: 'USD nominal',
  realUSD:    'USD real (CPI-USA, base ene 2022)',
  realARS:    'ARS real (IPC INDEC, base ene 2022)',
  canastas:   'Canastas básicas/mes',
};

function fmtUSD(n: number) {
  return `$${Math.round(n).toLocaleString('es-AR')}`;
}

const SVG_W = 760;
const SVG_H = 240;
const PAD_L = 60;
const PAD_R = 16;
const PAD_T = 20;
const PAD_B = 32;
const CHART_W = SVG_W - PAD_L - PAD_R;
const CHART_H = SVG_H - PAD_T - PAD_B;

export function IncomeCurveView({ overrides }: { overrides: IncomeEntry[] }) {
  const [metric, setMetric] = useState<Metric>('nominalUSD');
  const [tooltip, setTooltip] = useState<{ x: number; y: number; pt: PowerPoint } | null>(null);

  const curve = useMemo(() => buildPowerCurve(overrides), [overrides]);

  if (curve.length === 0) {
    return <p style={{ color: 'var(--color-text-muted)', padding: '1rem' }}>Sin datos.</p>;
  }

  const values = curve.map(p => p[metric]);
  const maxVal = Math.max(...values) * 1.1 || 1;

  const pts = curve.map((p, i) => ({
    x: PAD_L + (i / Math.max(curve.length - 1, 1)) * CHART_W,
    y: PAD_T + CHART_H - (p[metric] / maxVal) * CHART_H,
    p,
  }));

  const path = pts.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(' ');

  const xLabels = pts.filter((_, i) => i % 6 === 0 || i === pts.length - 1);

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => {
    const val = maxVal * f;
    return {
      y: PAD_T + CHART_H - f * CHART_H,
      label: metric === 'canastas'
        ? val.toFixed(1)
        : metric === 'realARS'
          ? `$${Math.round(val / 1_000_000)}M`
          : `$${Math.round(val / 1000)}k`,
    };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Metric selector */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {(Object.keys(METRIC_LABELS) as Metric[]).map(m => (
          <button
            key={m}
            onClick={() => setMetric(m)}
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              border: `1px solid ${metric === m ? 'var(--color-primary)' : 'var(--color-border)'}`,
              cursor: 'pointer',
              background: metric === m ? 'var(--color-primary-bg)' : 'var(--color-surface)',
              color: metric === m ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontSize: 'var(--text-xs)',
              fontWeight: metric === m ? 600 : 400,
            }}
          >
            {METRIC_LABELS[m]}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div style={{ overflowX: 'auto', background: 'var(--color-surface)', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', padding: '0.75rem' }}>
        <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ width: '100%', maxWidth: SVG_W, display: 'block' }}>
          {/* Y grid */}
          {yTicks.map((t, i) => (
            <g key={i}>
              <line x1={PAD_L} x2={SVG_W - PAD_R} y1={t.y} y2={t.y}
                stroke="var(--color-border)" strokeWidth={0.8} />
              <text x={PAD_L - 6} y={t.y + 4} textAnchor="end" fontSize={9}
                fill="var(--color-text-muted)">{t.label}</text>
            </g>
          ))}

          {/* Area fill */}
          <path
            d={`${path} L ${pts.at(-1)!.x} ${PAD_T + CHART_H} L ${pts[0].x} ${PAD_T + CHART_H} Z`}
            fill="var(--color-primary)"
            opacity={0.06}
          />

          {/* Line */}
          <path d={path} fill="none" stroke="var(--color-primary)" strokeWidth={2} />

          {/* Dots colored by modality */}
          {pts.map((pt, i) => (
            <circle
              key={i}
              cx={pt.x} cy={pt.y} r={5}
              fill={MODALITY_COLOR[pt.p.modality] ?? 'var(--color-primary)'}
              stroke="var(--color-surface)"
              strokeWidth={1.5}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setTooltip({ x: pt.x, y: pt.y, pt: pt.p })}
              onMouseLeave={() => setTooltip(null)}
            />
          ))}

          {/* X labels */}
          {xLabels.map((pt, i) => (
            <text key={i} x={pt.x} y={SVG_H - 4} textAnchor="middle" fontSize={9}
              fill="var(--color-text-muted)">
              {pt.p.yearMonth}
            </text>
          ))}

          {/* Tooltip */}
          {tooltip && (() => {
            const tx = Math.min(Math.max(tooltip.x - 75, PAD_L), SVG_W - 160);
            const ty = Math.max(tooltip.y - 84, PAD_T);
            return (
              <g>
                <rect x={tx} y={ty} width={165} height={80} rx={4}
                  fill="var(--color-surface)" stroke="var(--color-border)" strokeWidth={1} />
                <text x={tx + 8} y={ty + 16} fontSize={10} fontWeight={700}
                  fill="var(--color-text)">{tooltip.pt.yearMonth}</text>
                <text x={tx + 8} y={ty + 30} fontSize={9}
                  fill={MODALITY_COLOR[tooltip.pt.modality] ?? 'var(--color-primary)'}>
                  {getModalityLabel(tooltip.pt.modality)}
                </text>
                <text x={tx + 8} y={ty + 44} fontSize={10} fill="var(--color-text)">
                  {`Nominal: ${fmtUSD(tooltip.pt.nominalUSD)}`}
                </text>
                <text x={tx + 8} y={ty + 58} fontSize={9} fill="var(--color-text-muted)">
                  {`Real USD: ${fmtUSD(tooltip.pt.realUSD)} | CBs: ${tooltip.pt.canastas.toFixed(2)}`}
                </text>
                <text x={tx + 8} y={ty + 70} fontSize={9} fill="var(--color-text-muted)">
                  {`ARS real: $${Math.round(tooltip.pt.realARS / 1000).toLocaleString('es-AR')}k`}
                </text>
              </g>
            );
          })()}
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {Object.entries(MODALITY_COLOR).map(([mod, color]) => (
          <div key={mod} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 'var(--text-xs)' }}>
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: color }} />
            <span style={{ color: 'var(--color-text-muted)' }}>
              {getModalityLabel(mod as IncomeEntry['modality'])}
            </span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-xs)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              {['Período', 'Modalidad', 'USD nominal', 'USD real (CPI-USA)', 'ARS real (IPC)', 'Canastas'].map(h => (
                <th key={h} style={{
                  padding: '6px 8px', textAlign: 'right',
                  color: 'var(--color-text-muted)', fontWeight: 500,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...curve].reverse().map(p => (
              <tr key={p.yearMonth}
                style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '5px 8px', color: 'var(--color-text-muted)', textAlign: 'right' }}>
                  {p.yearMonth}
                </td>
                <td style={{ padding: '5px 8px', textAlign: 'right' }}>
                  <span style={{ color: MODALITY_COLOR[p.modality], fontWeight: 600 }}>
                    {getModalityLabel(p.modality)}
                  </span>
                </td>
                <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 600, color: 'var(--color-text)' }}>
                  {fmtUSD(p.nominalUSD)}
                </td>
                <td style={{ padding: '5px 8px', textAlign: 'right', color: 'var(--color-text-muted)' }}>
                  {fmtUSD(p.realUSD)}
                </td>
                <td style={{ padding: '5px 8px', textAlign: 'right', color: 'var(--color-text-muted)' }}>
                  {`$${Math.round(p.realARS / 1000).toLocaleString('es-AR')}k`}
                </td>
                <td style={{ padding: '5px 8px', textAlign: 'right', color: 'var(--color-text-muted)' }}>
                  {p.canastas.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
