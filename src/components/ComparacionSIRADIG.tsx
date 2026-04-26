import type { PayslipData, F572Data } from '../engine/schemas';
import { calcularDiferencia, hasF572Data } from '../engine/calculator';

const MES_ABBR = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function fmt(n: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(n);
}

function signed(n: number, el?: boolean): React.ReactNode {
  const color = n < 0 ? '#dc2626' : n > 0 ? '#16a34a' : 'inherit';
  const text = (n > 0 ? '+' : '') + fmt(n);
  return el ? <span style={{ color }}>{text}</span> : text;
}

type Props = {
  mesA: PayslipData;
  mesB: PayslipData;
  f572A: F572Data;
  f572B: F572Data;
  allMonths: number[];
  onChangeMonths: (a: number, b: number) => void;
  onClose: () => void;
};

export function ComparacionSIRADIG({ mesA, mesB, f572A, f572B, allMonths, onChangeMonths, onClose }: Props) {
  const result = calcularDiferencia(mesA, mesB, f572A, f572B);
  const sameMonth = mesA.meses === mesB.meses;

  const selectStyle: React.CSSProperties = {
    padding: '4px 8px',
    borderRadius: 6,
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text)',
    fontSize: 13,
    cursor: 'pointer',
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 0',
    fontSize: 13,
  };

  const highlightRowStyle: React.CSSProperties = {
    ...rowStyle,
    fontWeight: 600,
    borderTop: '1px solid var(--border)',
    marginTop: 2,
    paddingTop: 8,
  };

  const badgeBase: React.CSSProperties = {
    display: 'inline-block',
    padding: '6px 14px',
    borderRadius: 20,
    fontWeight: 600,
    fontSize: 13,
    marginTop: 12,
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
      zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{
        background: 'var(--surface)',
        borderRadius: 12,
        padding: 24,
        width: '100%',
        maxWidth: 480,
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Comparar meses</span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--muted)', padding: 4 }}
            aria-label="Cerrar"
          >✕</button>
        </div>

        {/* Month selectors (T009 — US2) */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
          <select
            value={mesA.meses}
            onChange={e => onChangeMonths(Number(e.target.value), mesB.meses)}
            style={selectStyle}
          >
            {allMonths.map(m => (
              <option key={m} value={m}>{MES_ABBR[m - 1]}</option>
            ))}
          </select>
          <span style={{ color: 'var(--muted)', fontSize: 13 }}>vs</span>
          <select
            value={mesB.meses}
            onChange={e => onChangeMonths(mesA.meses, Number(e.target.value))}
            style={selectStyle}
          >
            {allMonths.map(m => (
              <option key={m} value={m}>{MES_ABBR[m - 1]}</option>
            ))}
          </select>
        </div>

        {sameMonth ? (
          <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>
            Seleccioná dos meses distintos para ver la comparación
          </p>
        ) : (
          <>
            {/* Headline (FR-003) */}
            <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
              <div style={rowStyle}>
                <span style={{ color: 'var(--muted)' }}>Δ Retención mes</span>
                {signed(result.delta_retencion_mes, true)}
              </div>
              <div style={rowStyle}>
                <span style={{ color: 'var(--muted)' }}>Δ Bruto mensual</span>
                {signed(result.delta_bruto_mensual, true)}
              </div>
              <div style={rowStyle}>
                <span style={{ color: 'var(--muted)' }}>Δ Deducciones aplicadas</span>
                {signed(result.delta_ded_aplicadas, true)}
              </div>
            </div>

            {/* Cause breakdown (FR-004) */}
            <p style={{ fontWeight: 600, fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              Descomposición
            </p>
            <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '4px 16px', marginBottom: 12 }}>
              <div style={rowStyle}>
                <span>Efecto acumulativo fiscal</span>
                {signed(result.causa_efecto_acumulativo, true)}
              </div>
              <div style={{ ...rowStyle, borderTop: '1px solid var(--border)' }}>
                <span style={{ flex: 1 }}>
                  Rectificativa SIRADIG aplicada
                  {!hasF572Data(f572B) && (
                    <span style={{ display: 'block', fontSize: 11, color: 'var(--muted)' }}>Sin datos F.572</span>
                  )}
                </span>
                <span style={{ color: result.causa_rectificativa_siradig < 0 ? '#dc2626' : 'inherit' }}>
                  {result.causa_rectificativa_siradig === 0
                    ? fmt(0)
                    : signed(result.causa_rectificativa_siradig)}
                </span>
              </div>
              <div style={{ ...rowStyle, borderTop: '1px solid var(--border)' }}>
                <span>Cambio de salario bruto</span>
                {signed(result.causa_salario, true)}
              </div>
              <div style={{ ...rowStyle, borderTop: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--muted)' }}>Cambio de tramo impositivo</span>
                <span style={{ color: 'var(--muted)' }}>{fmt(result.causa_bracket)}</span>
              </div>
              <div style={highlightRowStyle}>
                <span>Total</span>
                {signed(result.delta_retencion_mes, true)}
              </div>
            </div>

            {/* Classification badge (FR-006) */}
            <div style={{ textAlign: 'center' }}>
              {result.clasificacion === 'esperada' ? (
                <span style={{ ...badgeBase, background: '#dcfce7', color: '#15803d' }}>
                  Diferencia esperada ✓
                </span>
              ) : (
                <div>
                  <span style={{ ...badgeBase, background: '#fef9c3', color: '#854d0e' }}>
                    Revisar con empleador ⚠
                  </span>
                  <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
                    Diferencia no explicada: {fmt(Math.abs(result.residuo_inexplicado))}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
