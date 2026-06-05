import { useState } from 'react';
import type { NetWorthSnapshot, AssetSnapshot, LiabilitySnapshot } from '../engine/schemas';

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
    { label: 'Efectivo físico USD',  usd: a.cashPhysicalUSD,           color: '#16a34a' },
    { label: 'Santander USD',        usd: a.cashSantanderUSD,          color: '#2563eb' },
    { label: 'Santander ARS',        usd: arsToUSD(a.cashSantanderARS), color: '#60a5fa' },
    { label: 'Balanz FCI USD',       usd: a.balanzUSD,                 color: '#7c3aed' },
    { label: 'Finzo (bolsa)',        usd: a.finzoUSD,                  color: '#d97706' },
    { label: 'Cripto',              usd: a.cryptoUSD,                 color: '#f59e0b' },
    { label: 'Otros billetes',      usd: a.otherUSD,                  color: '#94a3b8' },
  ].filter(r => r.usd > 0);
}

// ─── Donut ────────────────────────────────────────────────────────────────────
const SZ = 140; const CX = SZ / 2; const CY = SZ / 2; const RO = 56; const RI = 32;

function DonutChart({ rows, total }: { rows: AssetRow[]; total: number }) {
  if (total === 0) return null;
  let cumA = -Math.PI / 2;
  const slices = rows.map(r => {
    const pct = r.usd / total;
    const sa = cumA; const ea = cumA + pct * 2 * Math.PI; cumA = ea;
    const x1 = CX + RO * Math.cos(sa), y1 = CY + RO * Math.sin(sa);
    const x2 = CX + RO * Math.cos(ea), y2 = CY + RO * Math.sin(ea);
    const xi1 = CX + RI * Math.cos(ea), yi1 = CY + RI * Math.sin(ea);
    const xi2 = CX + RI * Math.cos(sa), yi2 = CY + RI * Math.sin(sa);
    const lg = pct > 0.5 ? 1 : 0;
    return { ...r, pct, path: `M ${x1} ${y1} A ${RO} ${RO} 0 ${lg} 1 ${x2} ${y2} L ${xi1} ${yi1} A ${RI} ${RI} 0 ${lg} 0 ${xi2} ${yi2} Z` };
  });
  return (
    <svg viewBox={`0 0 ${SZ} ${SZ}`} style={{ width: SZ, height: SZ, flexShrink: 0 }}>
      {slices.map(s => <path key={s.label} d={s.path} fill={s.color} opacity={0.88} />)}
      <text x={CX} y={CY - 4} textAnchor="middle" fontSize={9} fontWeight={700} fill="var(--color-text)">Activos</text>
      <text x={CX} y={CY + 10} textAnchor="middle" fontSize={9} fill="var(--color-text-muted)">{fmtUSD(total)}</text>
    </svg>
  );
}

// ─── Projection ───────────────────────────────────────────────────────────────

function addMonths(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 10);
}

interface ProjPoint { date: string; nw: number; projected: boolean; }

function buildProjection(
  snapshots: NetWorthSnapshot[],
  targetUSD: number,
  trailing: number,
): { points: ProjPoint[]; avgDelta: number; reachDate: string | null } {
  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
  const slice  = sorted.slice(-(trailing + 1));
  const deltas = slice.slice(1).map((s, i) => s.netWorthUSD - slice[i].netWorthUSD);
  const avgDelta = deltas.length > 0 ? deltas.reduce((s, d) => s + d, 0) / deltas.length : 0;

  const historical: ProjPoint[] = sorted.map(s => ({ date: s.date, nw: s.netWorthUSD, projected: false }));

  const lastDate = sorted.at(-1)!.date;
  const currentNW = sorted.at(-1)!.netWorthUSD;
  const projected: ProjPoint[] = [];
  let nw = currentNW;
  let reachDate: string | null = null;

  for (let m = 1; m <= 48; m++) {
    nw += avgDelta;
    const d = addMonths(lastDate, m);
    projected.push({ date: d, nw, projected: true });
    if (reachDate === null) {
      if (avgDelta > 0 && nw >= targetUSD) reachDate = d;
      if (avgDelta < 0 && nw <= targetUSD) reachDate = d;
    }
    if (reachDate && m >= 3) break; // at least 3 proj pts shown, stop after crossing
    if (!reachDate && m >= 24) break; // cap at 24 if never reached
  }

  return { points: [...historical, ...projected], avgDelta, reachDate };
}

const PW = 760; const PH = 200; const PPL = 60; const PPR = 16; const PPT = 20; const PPB = 36;
const PCW = PW - PPL - PPR; const PCH = PH - PPT - PPB;

function ProjectionSection({ snapshots }: { snapshots: NetWorthSnapshot[] }) {
  const currentNW = snapshots.at(-1)!.netWorthUSD;
  const defaultTarget = Math.ceil(currentNW / 5000) * 5000 + 5000;

  const [targetStr, setTargetStr] = useState(String(defaultTarget));
  const [trailing, setTrailing] = useState(3);
  const [tip, setTip] = useState<{ mx: number; my: number; pt: ProjPoint } | null>(null);

  const target = parseFloat(targetStr) || defaultTarget;
  const { points, avgDelta, reachDate } = buildProjection(snapshots, target, trailing);

  const vals  = points.map(p => p.nw);
  const minV  = Math.min(...vals, target) * 0.95;
  const maxV  = Math.max(...vals, target) * 1.05 || 1;
  const range = maxV - minV || 1;

  const toX = (i: number) => PPL + (i / Math.max(points.length - 1, 1)) * PCW;
  const toY = (v: number) => PPT + PCH - ((v - minV) / range) * PCH;

  const histPts = points.filter(p => !p.projected);
  const projPts = points.filter(p => p.projected);
  const joinPt  = histPts.at(-1)!; // last historical = first proj anchor

  const histPath = histPts.map((p, i) => {
    const idx = points.indexOf(p);
    return `${i === 0 ? 'M' : 'L'} ${toX(idx).toFixed(1)} ${toY(p.nw).toFixed(1)}`;
  }).join(' ');

  const projPath = [joinPt, ...projPts].map((p, i) => {
    const idx = points.indexOf(p);
    return `${i === 0 ? 'M' : 'L'} ${toX(idx).toFixed(1)} ${toY(p.nw).toFixed(1)}`;
  }).join(' ');

  const targetY = toY(target);

  const xLabels = points.filter((_, i) => i === 0 || i === points.length - 1 ||
    (points.length > 8 ? i % Math.ceil(points.length / 6) === 0 : true));

  const yTicks = [0, 0.5, 1].map(f => ({
    y: PPT + PCH - f * PCH,
    label: fmtUSD(minV + f * range),
  }));

  const monthsToTarget = reachDate
    ? (() => {
        const a = new Date(snapshots.at(-1)!.date);
        const b = new Date(reachDate);
        return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
      })()
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 600 }}>Meta USD</span>
        <input
          type="number"
          value={targetStr}
          onChange={e => setTargetStr(e.target.value)}
          style={{
            padding: '4px 8px', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)', background: 'var(--color-bg)',
            color: 'var(--color-text)', fontSize: 'var(--text-xs)', width: 110,
          }}
        />
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Promedio trailing</span>
        {([3, 6, 9] as const).map(n => (
          <button key={n} onClick={() => setTrailing(n)} style={{
            padding: '3px 10px', fontSize: 'var(--text-xs)', cursor: 'pointer',
            borderRadius: 'var(--radius-sm)',
            border: `1px solid ${trailing === n ? 'var(--color-primary)' : 'var(--color-border)'}`,
            background: trailing === n ? 'var(--color-primary-bg)' : 'var(--color-surface)',
            color: trailing === n ? 'var(--color-primary)' : 'var(--color-text-muted)',
            fontWeight: trailing === n ? 600 : 400,
          }}>{n}m</button>
        ))}
      </div>

      {/* Summary */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)', padding: '0.6rem 1rem',
          fontSize: 'var(--text-xs)',
        }}>
          <span style={{ color: 'var(--color-text-muted)' }}>ΔNW promedio/mes </span>
          <strong style={{ color: avgDelta >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
            {avgDelta >= 0 ? '+' : ''}{fmtUSD(avgDelta)}
          </strong>
        </div>
        <div style={{
          background: reachDate ? 'var(--color-primary-bg)' : 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)', padding: '0.6rem 1rem',
          fontSize: 'var(--text-xs)',
        }}>
          {reachDate && monthsToTarget !== null ? (
            <>
              <span style={{ color: 'var(--color-text-muted)' }}>Meta {fmtUSD(target)} en </span>
              <strong style={{ color: 'var(--color-primary)' }}>
                {monthsToTarget} {monthsToTarget === 1 ? 'mes' : 'meses'} — {reachDate.slice(0, 7)}
              </strong>
            </>
          ) : (
            <span style={{ color: 'var(--color-text-muted)' }}>
              {avgDelta <= 0 ? 'ΔNW negativo — meta no alcanzable' : 'Meta no alcanzada en 24 meses'}
            </span>
          )}
        </div>
      </div>

      {/* Chart */}
      <div style={{
        position: 'relative', background: 'var(--color-surface)',
        border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
        padding: '0.75rem', overflowX: 'auto',
      }}>
        <svg
          viewBox={`0 0 ${PW} ${PH}`}
          style={{ width: '100%', maxWidth: PW, display: 'block' }}
          onMouseLeave={() => setTip(null)}
          onMouseMove={e => { if (tip) setTip(t => t ? { ...t, mx: e.clientX, my: e.clientY } : null); }}
        >
          {/* Y grid */}
          {yTicks.map((t, i) => (
            <g key={i}>
              <line x1={PPL} x2={PW - PPR} y1={t.y} y2={t.y} stroke="var(--color-border)" strokeWidth={0.8} />
              <text x={PPL - 6} y={t.y + 4} textAnchor="end" fontSize={9} fill="var(--color-text-muted)">{t.label}</text>
            </g>
          ))}

          {/* Target line */}
          <line x1={PPL} x2={PW - PPR} y1={targetY} y2={targetY}
            stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="5 4" opacity={0.8} />
          <text x={PW - PPR - 2} y={targetY - 4} textAnchor="end" fontSize={8.5} fill="#f59e0b" fontWeight={600}>
            Meta {fmtUSD(target)}
          </text>

          {/* Historical area + line */}
          <path
            d={`${histPath} L ${toX(histPts.length - 1).toFixed(1)} ${PPT + PCH} L ${PPL} ${PPT + PCH} Z`}
            fill="var(--color-success)" opacity={0.06}
          />
          <path d={histPath} fill="none" stroke="var(--color-success)" strokeWidth={2} />

          {/* Projected line — dashed blue */}
          <path d={projPath} fill="none" stroke="var(--color-primary)" strokeWidth={1.5} strokeDasharray="6 3" opacity={0.75} />

          {/* Hit areas */}
          {points.map((p, i) => (
            <rect
              key={`hit-${i}`}
              x={toX(i) - (i === 0 ? 0 : (toX(i) - toX(i - 1)) / 2)}
              y={PPT}
              width={
                (i === 0 ? toX(1) - toX(0) : toX(i) - toX(i - 1)) / 2 +
                (i === points.length - 1 ? 0 : (toX(i + 1) - toX(i)) / 2)
              }
              height={PCH}
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onMouseEnter={e => setTip({ mx: e.clientX, my: e.clientY, pt: p })}
            />
          ))}

          {/* Dots */}
          {points.map((p, i) => (
            <circle key={i} cx={toX(i)} cy={toY(p.nw)} r={4}
              fill={p.projected ? 'var(--color-bg)' : 'var(--color-success)'}
              stroke={p.projected ? 'var(--color-primary)' : 'var(--color-success)'}
              strokeWidth={1.5}
              style={{ pointerEvents: 'none' }}
            />
          ))}

          {/* X labels */}
          {xLabels.map((p, i) => (
            <text key={i} x={toX(points.indexOf(p))} y={PH - 6} textAnchor="middle" fontSize={8.5}
              fill={p.projected ? 'var(--color-primary)' : 'var(--color-text-muted)'}
              opacity={p.projected ? 0.7 : 1}>
              {p.date.slice(0, 7)}
            </text>
          ))}
        </svg>

        {tip && (
          <div style={{
            position: 'fixed', left: tip.mx + 14, top: tip.my - 10,
            transform: tip.mx > window.innerWidth - 200 ? 'translateX(-110%)' : undefined,
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)', padding: '8px 12px',
            fontSize: 12, minWidth: 160, pointerEvents: 'none',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)', zIndex: 9999, lineHeight: 1.7,
          }}>
            <div style={{ fontWeight: 700, marginBottom: 2 }}>{tip.pt.date.slice(0, 7)}</div>
            <div style={{
              color: tip.pt.projected ? 'var(--color-primary)' : 'var(--color-success)',
              fontWeight: 700, fontSize: 14,
            }}>{fmtUSD(tip.pt.nw)}</div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: 10 }}>
              {tip.pt.projected ? 'Proyectado' : 'Real'}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1rem', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
        <span>— Real</span>
        <span style={{ color: 'var(--color-primary)' }}>- - Proyectado</span>
        <span style={{ color: '#f59e0b' }}>- - Meta</span>
      </div>
    </div>
  );
}

// ─── History chart ────────────────────────────────────────────────────────────
const W = 760; const H = 180; const PL = 56; const PR = 16; const PT = 16; const PB = 28;
const CW = W - PL - PR; const CH = H - PT - PB;

function HistoryChart({ snapshots }: { snapshots: NetWorthSnapshot[] }) {
  const [tip, setTip] = useState<{ mx: number; my: number; s: NetWorthSnapshot } | null>(null);
  const [expanded, setExpanded] = useState(false);
  if (snapshots.length < 2) return null;

  const vals = snapshots.map(s => s.netWorthUSD);
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals) * 1.1 || 1;
  const pad  = (maxV - minV) * 0.15;
  const lo   = Math.max(0, minV - pad);
  const range = maxV - lo || 1;

  const pts = snapshots.map((s, i) => ({
    x: PL + (i / (snapshots.length - 1)) * CW,
    y: PT + CH - ((s.netWorthUSD - lo) / range) * CH,
    s,
  }));

  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => ({
    y: PT + CH - f * CH,
    label: fmtUSD(lo + f * range),
  }));

  return (
    <div className={expanded ? 'finance-fullscreen' : ''}>
      {expanded && (
        <div className="finance-fullscreen-header">
          <span className="finance-fullscreen-title">Patrimonio neto — histórico</span>
          <button className="finance-fullscreen-close" onClick={() => setExpanded(false)}>✕ Cerrar</button>
        </div>
      )}
      <div className="finance-chart-wrap" style={{ flex: expanded ? 1 : undefined }}>
        {!expanded && (
          <button className="finance-chart-expand-btn" onClick={() => setExpanded(true)} title="Pantalla completa">
            ⛶
          </button>
        )}
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: '100%', maxWidth: expanded ? '100%' : W, display: 'block' }}
          onMouseLeave={() => setTip(null)}
        >
          {yTicks.map((t, i) => (
            <g key={i}>
              <line x1={PL} x2={W - PR} y1={t.y} y2={t.y} stroke="var(--color-border)" strokeWidth={0.8} />
              <text x={PL - 6} y={t.y + 4} textAnchor="end" fontSize={9} fill="var(--color-text-muted)">{t.label}</text>
            </g>
          ))}
          <path d={`${path} L ${pts.at(-1)!.x} ${PT + CH} L ${pts[0].x} ${PT + CH} Z`} fill="var(--color-success)" opacity={0.07} />
          <path d={path} fill="none" stroke="var(--color-success)" strokeWidth={2} />
          {/* Hit areas */}
          {pts.map((p, i) => (
            <rect
              key={`hit-${i}`}
              x={p.x - (i === 0 ? 0 : (p.x - pts[i-1].x) / 2)}
              y={PT}
              width={
                (i === 0 ? (pts[1]?.x ?? p.x) - p.x : p.x - pts[i-1].x) / 2 +
                (i === pts.length - 1 ? 0 : (pts[i+1].x - p.x) / 2)
              }
              height={CH}
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onMouseEnter={e => setTip({ mx: e.clientX, my: e.clientY, s: p.s })}
            />
          ))}
          {pts.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={5}
              fill="var(--color-success)" stroke="var(--color-surface)" strokeWidth={1.5}
              style={{ pointerEvents: 'none' }}
            />
          ))}
          {pts.map((p, i) => (
            <text key={i} x={p.x} y={H - 4} textAnchor="middle" fontSize={9} fill="var(--color-text-muted)">
              {p.s.date.slice(0, 7)}
            </text>
          ))}
        </svg>
        {tip && (
          <div style={{
            position: 'fixed', left: tip.mx + 14, top: tip.my - 10,
            transform: tip.mx > window.innerWidth - 200 ? 'translateX(-110%)' : undefined,
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)', padding: '8px 12px',
            fontSize: 12, minWidth: 170, pointerEvents: 'none',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)', zIndex: 9999, lineHeight: 1.7,
          }}>
            <div style={{ fontWeight: 700, marginBottom: 2 }}>{tip.s.date}</div>
            <div style={{ color: 'var(--color-success)', fontWeight: 700, fontSize: 14 }}>
              {fmtUSD(tip.s.netWorthUSD)}
            </div>
            {tip.s.notes && (
              <div style={{ color: 'var(--color-text-muted)', fontSize: 11, marginTop: 2 }}>
                {tip.s.notes}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Add snapshot form ─────────────────────────────────────────────────────────
type FormState = {
  date: string;
  cashPhysicalUSD: string; cashSantanderUSD: string; cashSantanderARS: string;
  balanzUSD: string; finzoUSD: string; cryptoUSD: string; otherUSD: string;
  creditCardsARS: string; creditCardsUSD: string; otherARS: string; tcForARS: string;
  notes: string;
};

function emptyForm(last?: NetWorthSnapshot): FormState {
  const a = last?.assets;
  const l = last?.liabilities;
  return {
    date: new Date().toISOString().slice(0, 10),
    cashPhysicalUSD:  String(a?.cashPhysicalUSD  ?? 0),
    cashSantanderUSD: String(a?.cashSantanderUSD ?? 0),
    cashSantanderARS: String(a?.cashSantanderARS ?? 0),
    balanzUSD:        String(a?.balanzUSD        ?? 0),
    finzoUSD:         String(a?.finzoUSD         ?? 0),
    cryptoUSD:        String(a?.cryptoUSD        ?? 0),
    otherUSD:         String(a?.otherUSD         ?? 0),
    creditCardsARS:   String(l?.creditCardsARS   ?? 0),
    creditCardsUSD:   String(l?.creditCardsUSD   ?? 0),
    otherARS:         String(l?.otherARS         ?? 0),
    tcForARS:         String(l?.tcForARS         ?? 1400),
    notes: '',
  };
}

function calcNetWorth(f: FormState): number {
  const n = (s: string) => parseFloat(s) || 0;
  const tc = n(f.tcForARS) || 1;
  const assets = n(f.cashPhysicalUSD) + n(f.cashSantanderUSD) + n(f.cashSantanderARS) / tc
    + n(f.balanzUSD) + n(f.finzoUSD) + n(f.cryptoUSD) + n(f.otherUSD);
  const liabs = n(f.creditCardsUSD) + (n(f.creditCardsARS) + n(f.otherARS)) / tc;
  return assets - liabs;
}

const fieldStyle: React.CSSProperties = {
  padding: '4px 8px', borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)', background: 'var(--color-bg)',
  color: 'var(--color-text)', fontSize: 'var(--text-xs)', width: '100%', boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 2,
};

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={labelStyle}>{label}</span>
      <input type="number" step="any" value={value} onChange={e => onChange(e.target.value)} style={fieldStyle} />
    </div>
  );
}

function AddSnapshotForm({ last, onAdd }: { last?: NetWorthSnapshot; onAdd: (s: NetWorthSnapshot) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(() => emptyForm(last));

  function set(key: keyof FormState, val: string) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  function submit() {
    const n = (s: string) => parseFloat(s) || 0;
    const assets: AssetSnapshot = {
      cashPhysicalUSD:  n(form.cashPhysicalUSD),
      cashSantanderUSD: n(form.cashSantanderUSD),
      cashSantanderARS: n(form.cashSantanderARS),
      balanzUSD:        n(form.balanzUSD),
      finzoUSD:         n(form.finzoUSD),
      cryptoUSD:        n(form.cryptoUSD),
      otherUSD:         n(form.otherUSD),
    };
    const liabilities: LiabilitySnapshot = {
      creditCardsARS: n(form.creditCardsARS),
      creditCardsUSD: n(form.creditCardsUSD),
      otherARS:       n(form.otherARS),
      tcForARS:       n(form.tcForARS) || 1400,
    };
    onAdd({ date: form.date, assets, liabilities, netWorthUSD: calcNetWorth(form), notes: form.notes || undefined });
    setOpen(false);
    setForm(emptyForm(last));
  }

  const preview = calcNetWorth(form);

  return (
    <div>
      <button
        onClick={() => { setOpen(o => !o); if (!open) setForm(emptyForm(last)); }}
        style={{
          padding: '6px 14px', borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border)', cursor: 'pointer',
          background: open ? 'var(--color-primary-bg)' : 'var(--color-surface)',
          color: open ? 'var(--color-primary)' : 'var(--color-text)',
          fontSize: 'var(--text-xs)', fontWeight: 600,
        }}
      >
        {open ? '✕ Cancelar' : '+ Agregar snapshot'}
      </button>

      {open && (
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem',
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)', padding: '1rem' }}>

          {/* Date */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={labelStyle}>Fecha</span>
            <input type="date" value={form.date} onChange={e => set('date', e.target.value)} style={{ ...fieldStyle, width: 'auto' }} />
          </div>

          {/* Assets */}
          <div>
            <p style={{ margin: '0 0 8px', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text)' }}>Activos (USD)</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.5rem' }}>
              <Field label="Efectivo físico USD" value={form.cashPhysicalUSD} onChange={v => set('cashPhysicalUSD', v)} />
              <Field label="Santander USD"       value={form.cashSantanderUSD} onChange={v => set('cashSantanderUSD', v)} />
              <Field label="Santander ARS"       value={form.cashSantanderARS} onChange={v => set('cashSantanderARS', v)} />
              <Field label="Balanz FCI USD"      value={form.balanzUSD}        onChange={v => set('balanzUSD', v)} />
              <Field label="Finzo (bolsa)"       value={form.finzoUSD}         onChange={v => set('finzoUSD', v)} />
              <Field label="Cripto USD"          value={form.cryptoUSD}        onChange={v => set('cryptoUSD', v)} />
              <Field label="Otros USD"           value={form.otherUSD}         onChange={v => set('otherUSD', v)} />
            </div>
          </div>

          {/* Liabilities */}
          <div>
            <p style={{ margin: '0 0 8px', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text)' }}>Pasivos</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.5rem' }}>
              <Field label="TC ARS→USD"        value={form.tcForARS}       onChange={v => set('tcForARS', v)} />
              <Field label="Tarjetas ARS"      value={form.creditCardsARS} onChange={v => set('creditCardsARS', v)} />
              <Field label="Tarjetas USD"      value={form.creditCardsUSD} onChange={v => set('creditCardsUSD', v)} />
              <Field label="Otros pasivos ARS" value={form.otherARS}       onChange={v => set('otherARS', v)} />
            </div>
          </div>

          {/* Notes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={labelStyle}>Notas (opcional)</span>
            <input type="text" value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="e.g. Balance cierre trimestre" style={fieldStyle} />
          </div>

          {/* Preview + submit */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              Patrimonio calculado:&nbsp;
              <strong style={{ color: preview >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                {fmtUSD(preview)}
              </strong>
            </span>
            <button
              onClick={submit}
              disabled={!form.date}
              style={{
                padding: '6px 16px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                border: 'none', background: 'var(--color-primary)', color: '#fff',
                fontSize: 'var(--text-xs)', fontWeight: 600,
              }}
            >
              Guardar snapshot
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────
export function NetWorthView({
  snapshots,
  onAdd,
}: {
  snapshots: NetWorthSnapshot[];
  onAdd?: (snap: NetWorthSnapshot) => void;
}) {
  if (snapshots.length === 0) {
    return <p style={{ color: 'var(--color-text-muted)' }}>Sin snapshots de patrimonio.</p>;
  }

  const snap  = snapshots.at(-1)!;
  const rows  = getAssetRows(snap);
  const total = rows.reduce((s, r) => s + r.usd, 0);
  const liabUSD = snap.liabilities.creditCardsUSD +
    (snap.liabilities.creditCardsARS + snap.liabilities.otherARS) / snap.liabilities.tcForARS;

  // Growth vs previous snapshot
  const prev = snapshots.length > 1 ? snapshots.at(-2)! : null;
  const delta = prev ? snap.netWorthUSD - prev.netWorthUSD : null;
  const deltaSign = delta != null && delta >= 0 ? '+' : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* History chart */}
      {snapshots.length > 1 && <HistoryChart snapshots={snapshots} />}

      {/* Projection */}
      {snapshots.length > 1 && (
        <div style={{
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)', padding: '1rem',
        }}>
          <p style={{ margin: '0 0 0.75rem', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text)' }}>
            Proyección de patrimonio
          </p>
          <ProjectionSection snapshots={snapshots} />
        </div>
      )}

      {/* Net worth hero */}
      <div style={{
        background: 'var(--color-success-bg)', border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius)', padding: '1rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem',
      }}>
        <div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            Patrimonio Neto — {snap.date}
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-success)' }}>
            {fmtUSD(snap.netWorthUSD)}
          </div>
          {delta != null && (
            <div style={{ fontSize: 'var(--text-xs)', color: delta >= 0 ? 'var(--color-success)' : 'var(--color-danger)', marginTop: 2 }}>
              {deltaSign}{fmtUSD(delta)} vs {prev!.date}
            </div>
          )}
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
        background: 'var(--color-danger-bg)', border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius)', padding: '0.75rem',
      }}>
        <p style={{ margin: '0 0 0.5rem', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 600 }}>Pasivos</p>
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
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', margin: 0, fontStyle: 'italic' }}>
          {snap.notes}
        </p>
      )}

      {/* Snapshot history table */}
      {snapshots.length > 1 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-xs)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Fecha', 'Patrimonio neto', 'Δ vs anterior', 'Notas'].map(h => (
                  <th key={h} style={{ padding: '6px 8px', textAlign: 'right', color: 'var(--color-text-muted)', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...snapshots].reverse().map((s, i, arr) => {
                const prevSnap = arr[i + 1];
                const d = prevSnap ? s.netWorthUSD - prevSnap.netWorthUSD : null;
                return (
                  <tr key={s.date} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '5px 8px', color: 'var(--color-text-muted)', textAlign: 'right' }}>{s.date}</td>
                    <td style={{ padding: '5px 8px', fontWeight: 700, color: 'var(--color-success)', textAlign: 'right' }}>{fmtUSD(s.netWorthUSD)}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', color: d == null ? 'var(--color-text-muted)' : d >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      {d == null ? '—' : `${d >= 0 ? '+' : ''}${fmtUSD(d)}`}
                    </td>
                    <td style={{ padding: '5px 8px', color: 'var(--color-text-muted)', textAlign: 'right', fontStyle: 'italic' }}>{s.notes ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add snapshot */}
      {onAdd && <AddSnapshotForm last={snap} onAdd={onAdd} />}
    </div>
  );
}
