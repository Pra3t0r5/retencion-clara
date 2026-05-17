const $ = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);

type HeroStatsProps = {
  retenido: number;
  recuperado: number;
  pendiente: number;
  periodoLabel: string;
};

const cardStyle: React.CSSProperties = {
  flex: '1 1 80px',
  minWidth: 80,
  background: 'var(--card-bg, #1e293b)',
  borderRadius: 10,
  padding: '12px 10px',
  textAlign: 'center',
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: 4,
};

const valueStyle = (color: string): React.CSSProperties => ({
  fontSize: 18,
  fontWeight: 700,
  color,
  lineHeight: 1.2,
});

const subStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#94a3b8',
  marginTop: 4,
};

export function HeroStats({ retenido, recuperado, pendiente, periodoLabel }: HeroStatsProps) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
      <div style={cardStyle}>
        <div style={labelStyle}>Retenido</div>
        <div style={valueStyle('#f87171')}>{$(retenido)}</div>
        <div style={subStyle}>{periodoLabel}</div>
      </div>

      <div style={cardStyle}>
        <div style={labelStyle}>Recuperado</div>
        <div style={valueStyle(recuperado > 0 ? '#4ade80' : '#94a3b8')}>
          {$(recuperado)}{recuperado > 0 ? ' est.' : ''}
        </div>
        <div style={subStyle}>
          {recuperado > 0 ? (
            <>
              gracias al F.572{' '}
              <span style={{
                background: '#16a34a',
                color: 'white',
                borderRadius: 9999,
                padding: '1px 6px',
                fontSize: 10,
              }}>✓</span>
            </>
          ) : 'sin datos F.572'}
        </div>
      </div>

      <div style={cardStyle}>
        <div style={labelStyle}>Pendiente</div>
        <div style={valueStyle(pendiente > 0 ? '#fb923c' : '#4ade80')}>{$(pendiente)}</div>
        <div style={subStyle}>
          {pendiente === 0 ? 'todo acreditado ✓' : 'sin acreditar'}
        </div>
      </div>
    </div>
  );
}
