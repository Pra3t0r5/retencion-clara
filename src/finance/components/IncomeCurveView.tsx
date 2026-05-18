import { useMemo, useState } from 'react';
import type { IncomeEntry, PowerPoint } from '../engine/schemas';
import { buildPowerCurve, getModalityLabel } from '../engine/income';

const MODALITY_COLOR: Record<string, string> = {
  'contractor':  '#a78bfa',
  'crehana-ars': '#fb923c',
  'crehana-usd': '#34d399',
  'deel':        '#60a5fa',
  'manual':      '#94a3b8',
};

type Metric = 'nominalUSD' | 'realUSD' | 'canastas';

const METRIC_LABELS: Record<Metric, string> = {
  nominalUSD: 'USD nominal',
  realUSD:    'USD real (base 2022)',
  canastas:   'Canastas básicas',
};

function fmtUSD(n: number) {
  return `$${Math.round(n).toLocaleString('es-AR')}`;
}



const SVG_W = 800;
const SVG_H = 260;
const PAD_L = 64;
const PAD_R = 16;
const PAD_T = 16;
const PAD_B = 36;
const CHART_W = SVG_W - PAD_L - PAD_R;
const CHART_H = SVG_H - PAD_T - PAD_B;

export function IncomeCurveView({ overrides }: { overrides: IncomeEntry[] }) {
  const [metric, setMetric] = useState<Metric>('nominalUSD');
  const [tooltip, setTooltip] = useState<{ x: number; y: number; pt: PowerPoint } | null>(null);

  const curve = useMemo(() => buildPowerCurve(overrides), [overrides]);

  if (curve.length === 0) return <p style={{ color: 'var(--color-muted)', padding: '1rem' }}>Sin datos de ingresos.</p>;

  const values = curve.map(p => p[metric]);
  const maxVal = Math.max(...values) * 1.08;

  const pts = curve.map((p, i) => {
    const x = PAD_L + (i / (curve.length - 1)) * CHART_W;
    const y = PAD_T + CHART_H - (p[metric] / maxVal) * CHART_H;
    return { x, y, p };
  });

  // Build polyline path
  const path = pts.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(' ');

  // X-axis labels: show every 6 months
  const xLabels = pts.filter((_, i) => i % 6 === 0 || i === pts.length - 1);

  // Y-axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => ({
    y: PAD_T + CHART_H - f * CHART_H,
    label: metric === 'canastas' ? (maxVal * f).toFixed(1) : `$${Math.round(maxVal * f / 1000)}k`,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Metric selector */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {(Object.keys(METRIC_LABELS) as Metric[]).map(m => (
          <button
            key={m}
            onClick={() => setMetric(m)}
            style={{
              padding: '4px 12px',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              background: metric === m ? 'var(--color-accent)' : 'var(--color-surface-2)',
              color: metric === m ? '#000' : 'var(--color-text)',
              fontSize: 13,
              fontWeight: metric === m ? 700 : 400,
            }}
          >
            {METRIC_LABELS[m]}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div style={{ overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ width: '100%', maxWidth: SVG_W, display: 'block' }}>
          {/* Y grid + labels */}
          {yTicks.map((t, i) => (
            <g key={i}>
              <line x1={PAD_L} x2={SVG_W - PAD_R} y1={t.y} y2={t.y} stroke="var(--color-border)" strokeWidth={0.5} />
              <text x={PAD_L - 6} y={t.y + 4} textAnchor="end" fontSize={9} fill="var(--color-muted)">{t.label}</text>
            </g>
          ))}

          {/* Modality regions */}
          {['contractor','crehana-ars','crehana-usd','deel'].map(mod => {
            const mpts = pts.filter(pt => pt.p.modality === mod);
            if (mpts.length === 0) return null;
            return (
              <g key={mod}>
                {mpts.map((pt, i) => (
                  <circle
                    key={i}
                    cx={pt.x} cy={pt.y} r={4}
                    fill={MODALITY_COLOR[mod]}
                    opacity={0.85}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setTooltip({ x: pt.x, y: pt.y, pt: pt.p })}
                    onMouseLeave={() => setTooltip(null)}
                  />
                ))}
              </g>
            );
          })}

          {/* Line */}
          <path d={path} fill="none" stroke="var(--color-accent)" strokeWidth={2} opacity={0.7} />

          {/* X labels */}
          {xLabels.map((pt, i) => (
            <text key={i} x={pt.x} y={SVG_H - 4} textAnchor="middle" fontSize={9} fill="var(--color-muted)">
              {pt.p.yearMonth.slice(0, 7)}
            </text>
          ))}

          {/* Tooltip */}
          {tooltip && (() => {
            const tx = Math.min(Math.max(tooltip.x - 70, PAD_L), SVG_W - 160);
            const ty = Math.max(tooltip.y - 68, PAD_T);
            return (
              <g>
                <rect x={tx} y={ty} width={150} height={60} rx={4} fill="var(--color-surface)" stroke="var(--color-border)" strokeWidth={1} />
                <text x={tx + 8} y={ty + 16} fontSize={10} fontWeight={700} fill="var(--color-text)">{tooltip.pt.yearMonth}</text>
                <text x={tx + 8} y={ty + 30} fontSize={9} fill="var(--color-muted)">{getModalityLabel(tooltip.pt.modality)}</text>
                <text x={tx + 8} y={ty + 44} fontSize={10} fill="var(--color-accent)">
                  {`USD nom: ${fmtUSD(tooltip.pt.nominalUSD)}`}
                </text>
                <text x={tx + 8} y={ty + 56} fontSize={9} fill="var(--color-muted)">
                  {`Real: ${fmtUSD(tooltip.pt.realUSD)} | CBs: ${tooltip.pt.canastas.toFixed(2)}`}
                </text>
              </g>
            );
          })()}
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: 12 }}>
        {Object.entries(MODALITY_COLOR).map(([mod, color]) => (
          <div key={mod} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
            <span style={{ color: 'var(--color-muted)' }}>{getModalityLabel(mod as IncomeEntry['modality'])}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              {['Período','Modalidad','USD nominal','USD real','Canastas'].map(h => (
                <th key={h} style={{ padding: '4px 8px', textAlign: 'right', color: 'var(--color-muted)', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...curve].reverse().map(p => (
              <tr key={p.yearMonth} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '4px 8px', color: 'var(--color-muted)', textAlign: 'right' }}>{p.yearMonth}</td>
                <td style={{ padding: '4px 8px', textAlign: 'right' }}>
                  <span style={{ color: MODALITY_COLOR[p.modality], fontWeight: 600 }}>
                    {getModalityLabel(p.modality)}
                  </span>
                </td>
                <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 600 }}>{fmtUSD(p.nominalUSD)}</td>
                <td style={{ padding: '4px 8px', textAlign: 'right', color: 'var(--color-muted)' }}>{fmtUSD(p.realUSD)}</td>
                <td style={{ padding: '4px 8px', textAlign: 'right', color: 'var(--color-muted)' }}>{p.canastas.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
