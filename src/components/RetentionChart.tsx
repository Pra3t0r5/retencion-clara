export type ChartPoint = {
  month: string;
  retencion: number;
  acumulado: number;
};

const SVG_W = 560;
const SVG_H = 180;
const PAD_T = 28;
const PAD_B = 28;
const PAD_LR = 8;
const BAR_W_MAX = 36;

function fmtK(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  return `${Math.round(n / 1_000)}K`;
}

export function RetentionChart({ data }: { data: ChartPoint[] }) {
  if (data.length === 0) return null;

  if (data.length === 1) {
    return (
      <p style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', margin: '12px 0 0' }}>
        Agregá más meses para ver la progresión
      </p>
    );
  }

  const chartH = SVG_H - PAD_T - PAD_B;
  const chartW = SVG_W - 2 * PAD_LR;
  const slotW = chartW / data.length;
  const barW = Math.min(slotW * 0.55, BAR_W_MAX);

  const maxRet = Math.max(...data.map(d => d.retencion));
  const maxAcum = Math.max(...data.map(d => d.acumulado));

  const linePoints = data
    .map((d, i) => {
      const cx = PAD_LR + i * slotW + slotW / 2;
      const cy = PAD_T + chartH - (maxAcum > 0 ? (d.acumulado / maxAcum) * chartH : 0);
      return `${cx},${cy}`;
    })
    .join(' ');

  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      width="100%"
      aria-label="Progresión de retención mensual"
      style={{ overflow: 'visible', display: 'block' }}
    >
      {data.map((d, i) => {
        const barH = maxRet > 0 ? (d.retencion / maxRet) * chartH : 0;
        const x = PAD_LR + i * slotW + (slotW - barW) / 2;
        const y = PAD_T + chartH - barH;
        const cx = PAD_LR + i * slotW + slotW / 2;

        return (
          <g key={d.month}>
            <rect
              x={x} y={y} width={barW} height={barH} rx={3}
              style={{ fill: 'var(--primary)', opacity: 0.85 }}
            />
            <text
              x={x + barW / 2} y={y - 5}
              textAnchor="middle" fontSize={8}
              style={{ fill: 'var(--muted)' }}
            >
              {fmtK(d.retencion)}
            </text>
            <text
              x={cx} y={SVG_H - 6}
              textAnchor="middle" fontSize={9}
              style={{ fill: 'var(--muted)' }}
            >
              {d.month}
            </text>
          </g>
        );
      })}

      <polyline
        points={linePoints}
        fill="none"
        stroke="#f59e0b"
        strokeWidth={1.5}
        strokeDasharray="4 2"
        strokeLinecap="round"
      />
      {data.map((d, i) => {
        const cx = PAD_LR + i * slotW + slotW / 2;
        const cy = PAD_T + chartH - (maxAcum > 0 ? (d.acumulado / maxAcum) * chartH : 0);
        return <circle key={`dot-${i}`} cx={cx} cy={cy} r={3} fill="#f59e0b" />;
      })}
    </svg>
  );
}
