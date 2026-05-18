import type { NetWorthSnapshot } from '../engine/schemas';

function fmtUSD(n: number) {
  return `$${Math.round(n).toLocaleString('es-AR')}`;
}

function fmtARS(n: number) {
  return `$${Math.round(n).toLocaleString('es-AR')} ARS`;
}

interface AssetRow { label: string; usd: number; color: string; }

function getAssetRows(s: NetWorthSnapshot): AssetRow[] {
  const { assets: a, liabilities: l } = s;
  const arsToUSD = (ars: number) => l.tcForARS > 0 ? ars / l.tcForARS : 0;
  return [
    { label: 'Efectivo físico USD',   usd: a.cashPhysicalUSD,  color: '#34d399' },
    { label: 'Santander USD',         usd: a.cashSantanderUSD, color: '#60a5fa' },
    { label: 'Santander ARS',         usd: arsToUSD(a.cashSantanderARS), color: '#93c5fd' },
    { label: 'Balanz FCI USD',        usd: a.balanzUSD,        color: '#a78bfa' },
    { label: 'Finzo (bolsa)',         usd: a.finzoUSD,         color: '#fb923c' },
    { label: 'Cripto',                usd: a.cryptoUSD,        color: '#fbbf24' },
    { label: 'Otros (billetes)',      usd: a.otherUSD,         color: '#94a3b8' },
  ].filter(r => r.usd > 0);
}

const SVG_SIZE = 140;
const CX = SVG_SIZE / 2;
const CY = SVG_SIZE / 2;
const R_OUTER = 56;
const R_INNER = 32;

function DonutChart({ rows, total }: { rows: AssetRow[]; total: number }) {
  if (total === 0) return null;
  let cumAngle = -Math.PI / 2;
  const slices = rows.map(r => {
    const pct = r.usd / total;
    const startA = cumAngle;
    const endA   = cumAngle + pct * 2 * Math.PI;
    cumAngle = endA;
    const x1 = CX + R_OUTER * Math.cos(startA);
    const y1 = CY + R_OUTER * Math.sin(startA);
    const x2 = CX + R_OUTER * Math.cos(endA);
    const y2 = CY + R_OUTER * Math.sin(endA);
    const xi1 = CX + R_INNER * Math.cos(endA);
    const yi1 = CY + R_INNER * Math.sin(endA);
    const xi2 = CX + R_INNER * Math.cos(startA);
    const yi2 = CY + R_INNER * Math.sin(startA);
    const large = pct > 0.5 ? 1 : 0;
    const path = `M ${x1} ${y1} A ${R_OUTER} ${R_OUTER} 0 ${large} 1 ${x2} ${y2} L ${xi1} ${yi1} A ${R_INNER} ${R_INNER} 0 ${large} 0 ${xi2} ${yi2} Z`;
    return { ...r, path, pct };
  });

  return (
    <svg viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`} style={{ width: SVG_SIZE, height: SVG_SIZE }}>
      {slices.map(s => (
        <path key={s.label} d={s.path} fill={s.color} opacity={0.85} />
      ))}
      <text x={CX} y={CY - 5} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--color-text)">
        Activos
      </text>
      <text x={CX} y={CY + 9} textAnchor="middle" fontSize={9} fill="var(--color-muted)">
        {fmtUSD(total)}
      </text>
    </svg>
  );
}

export function NetWorthView({ snapshots }: { snapshots: NetWorthSnapshot[] }) {
  if (snapshots.length === 0) return <p style={{ color: 'var(--color-muted)' }}>Sin snapshots de patrimonio.</p>;

  const snap = snapshots.at(-1)!;
  const rows = getAssetRows(snap);
  const totalAssets = rows.reduce((s, r) => s + r.usd, 0);
  const totalLiabUSD = snap.liabilities.creditCardsUSD +
    (snap.liabilities.creditCardsARS + snap.liabilities.otherARS) / snap.liabilities.tcForARS;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>Patrimonio Neto — {snap.date}</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#34d399' }}>{fmtUSD(snap.netWorthUSD)}</div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>Activos</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{fmtUSD(totalAssets)}</div>
          <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 4 }}>Pasivos</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#f87171' }}>−{fmtUSD(totalLiabUSD)}</div>
        </div>
      </div>

      {/* Donut + asset list */}
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <DonutChart rows={rows} total={totalAssets} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 200 }}>
          {rows.map(r => (
            <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, flex: 1, color: 'var(--color-muted)' }}>{r.label}</span>
              <span style={{ fontSize: 12, fontWeight: 600 }}>{fmtUSD(r.usd)}</span>
              <span style={{ fontSize: 11, color: 'var(--color-muted)', width: 36, textAlign: 'right' }}>
                {totalAssets > 0 ? `${((r.usd / totalAssets) * 100).toFixed(0)}%` : ''}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Liabilities */}
      <div>
        <h4 style={{ margin: '0 0 0.5rem', fontSize: 13, color: 'var(--color-muted)' }}>Pasivos</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-muted)' }}>Tarjetas ARS</span>
            <span style={{ color: '#f87171' }}>{fmtARS(snap.liabilities.creditCardsARS)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-muted)' }}>Tarjetas USD</span>
            <span style={{ color: '#f87171' }}>{fmtUSD(snap.liabilities.creditCardsUSD)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: 4 }}>
            <span style={{ color: 'var(--color-muted)' }}>Total pasivos (equiv USD)</span>
            <span style={{ color: '#f87171', fontWeight: 700 }}>{fmtUSD(totalLiabUSD)}</span>
          </div>
        </div>
      </div>

      {snap.notes && (
        <p style={{ fontSize: 11, color: 'var(--color-muted)', margin: 0, fontStyle: 'italic' }}>{snap.notes}</p>
      )}
    </div>
  );
}
