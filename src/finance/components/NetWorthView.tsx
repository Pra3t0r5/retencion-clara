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
    { label: 'Efectivo físico USD',  usd: a.cashPhysicalUSD,       color: '#16a34a' },
    { label: 'Santander USD',        usd: a.cashSantanderUSD,      color: '#2563eb' },
    { label: 'Santander ARS',        usd: arsToUSD(a.cashSantanderARS), color: '#60a5fa' },
    { label: 'Balanz FCI USD',       usd: a.balanzUSD,             color: '#7c3aed' },
    { label: 'Finzo (bolsa)',        usd: a.finzoUSD,              color: '#d97706' },
    { label: 'Cripto',               usd: a.cryptoUSD,             color: '#f59e0b' },
    { label: 'Otros billetes',       usd: a.otherUSD,              color: '#94a3b8' },
  ].filter(r => r.usd > 0);
}

const SZ = 140;
const CX = SZ / 2;
const CY = SZ / 2;
const RO = 56;
const RI = 32;

function DonutChart({ rows, total }: { rows: AssetRow[]; total: number }) {
  if (total === 0) return null;
  let cumA = -Math.PI / 2;

  const slices = rows.map(r => {
    const pct  = r.usd / total;
    const sa   = cumA;
    const ea   = cumA + pct * 2 * Math.PI;
    cumA = ea;
    const x1 = CX + RO * Math.cos(sa), y1 = CY + RO * Math.sin(sa);
    const x2 = CX + RO * Math.cos(ea), y2 = CY + RO * Math.sin(ea);
    const xi1 = CX + RI * Math.cos(ea), yi1 = CY + RI * Math.sin(ea);
    const xi2 = CX + RI * Math.cos(sa), yi2 = CY + RI * Math.sin(sa);
    const lg = pct > 0.5 ? 1 : 0;
    return {
      ...r, pct,
      path: `M ${x1} ${y1} A ${RO} ${RO} 0 ${lg} 1 ${x2} ${y2} L ${xi1} ${yi1} A ${RI} ${RI} 0 ${lg} 0 ${xi2} ${yi2} Z`,
    };
  });

  return (
    <svg viewBox={`0 0 ${SZ} ${SZ}`} style={{ width: SZ, height: SZ, flexShrink: 0 }}>
      {slices.map(s => <path key={s.label} d={s.path} fill={s.color} opacity={0.88} />)}
      <text x={CX} y={CY - 4} textAnchor="middle" fontSize={9} fontWeight={700}
        fill="var(--color-text)">Activos</text>
      <text x={CX} y={CY + 10} textAnchor="middle" fontSize={9}
        fill="var(--color-text-muted)">{fmtUSD(total)}</text>
    </svg>
  );
}

export function NetWorthView({ snapshots }: { snapshots: NetWorthSnapshot[] }) {
  if (snapshots.length === 0) {
    return <p style={{ color: 'var(--color-text-muted)' }}>Sin snapshots de patrimonio.</p>;
  }

  const snap  = snapshots.at(-1)!;
  const rows  = getAssetRows(snap);
  const total = rows.reduce((s, r) => s + r.usd, 0);
  const liabUSD = snap.liabilities.creditCardsUSD +
    (snap.liabilities.creditCardsARS + snap.liabilities.otherARS) / snap.liabilities.tcForARS;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Net worth hero */}
      <div style={{
        background: 'var(--color-success-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius)',
        padding: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.5rem',
      }}>
        <div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            Patrimonio Neto — {snap.date}
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-success)' }}>
            {fmtUSD(snap.netWorthUSD)}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Activos</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>{fmtUSD(total)}</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 4 }}>Pasivos</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-danger)' }}>−{fmtUSD(liabUSD)}</div>
        </div>
      </div>

      {/* Donut + asset list */}
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <DonutChart rows={rows} total={total} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 180 }}>
          {rows.map(r => (
            <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
              <span style={{ fontSize: 'var(--text-xs)', flex: 1, color: 'var(--color-text-muted)' }}>{r.label}</span>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text)' }}>{fmtUSD(r.usd)}</span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', width: 32, textAlign: 'right' }}>
                {total > 0 ? `${((r.usd / total) * 100).toFixed(0)}%` : ''}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Liabilities */}
      <div style={{
        background: 'var(--color-danger-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius)',
        padding: '0.75rem',
      }}>
        <p style={{ margin: '0 0 0.5rem', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 600 }}>
          Pasivos
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 'var(--text-xs)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Tarjetas ARS</span>
            <span style={{ color: 'var(--color-danger)' }}>{fmtARS(snap.liabilities.creditCardsARS)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Tarjetas USD</span>
            <span style={{ color: 'var(--color-danger)' }}>{fmtUSD(snap.liabilities.creditCardsUSD)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: 4 }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Total equiv USD</span>
            <span style={{ color: 'var(--color-danger)', fontWeight: 700 }}>{fmtUSD(liabUSD)}</span>
          </div>
        </div>
      </div>

      {snap.notes && (
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-subtle)', margin: 0, fontStyle: 'italic' }}>
          {snap.notes}
        </p>
      )}
    </div>
  );
}
