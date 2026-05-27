// [AI] HeroStats uses semantic CSS classes (.stat-card.danger etc.) so dark mode
// token overrides in tokens.css apply automatically without component changes.

const $ = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);

type HeroStatsProps = {
  retenido: number;
  recuperado: number;
  pendiente: number;
  periodoLabel: string;
};

export function HeroStats({ retenido, recuperado, pendiente, periodoLabel }: HeroStatsProps) {
  return (
    <div className="stat-grid">
      <div className="stat-card danger">
        <div className="stat-label">Retenido</div>
        <div className="stat-value">{$(retenido)}</div>
        <div className="stat-sub">{periodoLabel}</div>
      </div>

      <div className={`stat-card ${recuperado > 0 ? 'success' : 'danger'}`}>
        <div className="stat-label">Recuperado</div>
        <div className="stat-value">{$(recuperado)}{recuperado > 0 ? ' est.' : ''}</div>
        <div className="stat-sub">
          {recuperado > 0 ? 'gracias al F.572 ✓' : 'sin datos F.572'}
        </div>
      </div>

      <div className={`stat-card ${pendiente === 0 ? 'success' : 'pending'}`}>
        <div className="stat-label">Pendiente</div>
        <div className="stat-value">{$(pendiente)}</div>
        <div className="stat-sub">
          {pendiente === 0 ? 'todo acreditado ✓' : 'sin acreditar'}
        </div>
      </div>
    </div>
  );
}
