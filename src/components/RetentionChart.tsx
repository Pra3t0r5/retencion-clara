import { useState } from "react";

export type ChartPoint = {
  month: string;
  retencion: number;
  acumulado: number;
};

const SVG_W = 560;
const SVG_H = 200;
const PAD_T = 44;
const PAD_B = 32;
const PAD_L = 12;
const PAD_R = 12;
const CHART_H = SVG_H - PAD_T - PAD_B;
const CHART_W = SVG_W - PAD_L - PAD_R;
const BAR_W_MAX = 48;
const BAR_COLOR = "#3b82f6";
const LINE_COLOR = "#f59e0b";
const TEXT_COLOR = "#94a3b8";
const BASELINE_COLOR = "rgba(148,163,184,0.15)";

const $ = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);

function fmtShort(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  return `${Math.round(n / 1_000)}K`;
}

type TooltipData = { month: string; retencion: number; acumulado: number; x: number };

export function RetentionChart({ data }: { data: ChartPoint[] }) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  if (data.length === 0) return null;

  if (data.length === 1) {
    return (
      <p style={{ fontSize: 12, color: TEXT_COLOR, textAlign: "center", margin: "12px 0 0" }}>
        Agregá más meses para ver la progresión
      </p>
    );
  }

  // Single scale anchored to max cumulative so bars + line are comparable
  const yMax = Math.max(...data.map(d => d.acumulado));
  const slotW = CHART_W / data.length;
  const barW = Math.min(slotW * 0.45, BAR_W_MAX);

  const linePoints = data
    .map((d, i) => {
      const cx = PAD_L + i * slotW + slotW / 2;
      const cy = PAD_T + CHART_H - (yMax > 0 ? (d.acumulado / yMax) * CHART_H : 0);
      return `${cx},${cy}`;
    })
    .join(" ");

  return (
    <div>
      {/* Legend */}
      <div style={{
        display: "flex", gap: 20, fontSize: 11, color: TEXT_COLOR,
        marginBottom: 8, justifyContent: "center",
      }}>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{
            display: "inline-block", width: 10, height: 10,
            background: BAR_COLOR, borderRadius: 2,
          }} />
          Retención del mes
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{
            display: "inline-block", width: 18, height: 0,
            borderTop: `2px dashed ${LINE_COLOR}`, marginBottom: 1,
          }} />
          Acumulado anual
        </span>
      </div>

      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        width="100%"
        aria-label="Progresión de retención mensual"
        style={{ overflow: "visible", display: "block" }}
      >
        {/* Baseline */}
        <line
          x1={PAD_L} y1={PAD_T + CHART_H}
          x2={SVG_W - PAD_R} y2={PAD_T + CHART_H}
          stroke={BASELINE_COLOR} strokeWidth={1}
        />

        {/* Bars + labels */}
        {data.map((d, i) => {
          const barH = yMax > 0 ? (d.retencion / yMax) * CHART_H : 0;
          const x = PAD_L + i * slotW + (slotW - barW) / 2;
          const y = PAD_T + CHART_H - barH;
          const cx = PAD_L + i * slotW + slotW / 2;

          return (
            <g
              key={d.month}
              style={{ cursor: "default" }}
              onMouseEnter={() => setTooltip({ ...d, x: cx })}
              onMouseLeave={() => setTooltip(null)}
            >
              {/* Bar */}
              <rect
                x={x} y={y} width={barW} height={Math.max(barH, 2)} rx={3}
                fill={BAR_COLOR}
              />
              {/* Monthly amount above bar */}
              <text
                x={x + barW / 2} y={y - 7}
                textAnchor="middle" fontSize={10} fill={BAR_COLOR}
                fontWeight="600"
              >
                {fmtShort(d.retencion)}
              </text>
              {/* Month label */}
              <text
                x={cx} y={SVG_H - 8}
                textAnchor="middle" fontSize={11} fill={TEXT_COLOR}
              >
                {d.month}
              </text>
            </g>
          );
        })}

        {/* Cumulative line */}
        <polyline
          points={linePoints}
          fill="none"
          stroke={LINE_COLOR}
          strokeWidth={2}
          strokeDasharray="5 3"
          strokeLinecap="round"
        />

        {/* Cumulative dots + labels */}
        {data.map((d, i) => {
          const cx = PAD_L + i * slotW + slotW / 2;
          const cy = PAD_T + CHART_H - (yMax > 0 ? (d.acumulado / yMax) * CHART_H : 0);
          const isLast = i === data.length - 1;

          return (
            <g key={`acum-${i}`}>
              <circle cx={cx} cy={cy} r={4} fill={LINE_COLOR} />
              {/* Show acumulado label on first and last point */}
              {(i === 0 || isLast) && (
                <text
                  x={cx + (isLast ? -6 : 6)}
                  y={cy - 8}
                  textAnchor={isLast ? "end" : "start"}
                  fontSize={10}
                  fill={LINE_COLOR}
                  fontWeight="500"
                >
                  {fmtShort(d.acumulado)}
                </text>
              )}
            </g>
          );
        })}

        {/* Hover tooltip */}
        {tooltip && (() => {
          const tx = Math.min(Math.max(tooltip.x - 70, 4), SVG_W - 144);
          const lineY = PAD_T + CHART_H - (yMax > 0 ? (tooltip.acumulado / yMax) * CHART_H : 0);
          const ty = Math.max(lineY - 56, 4);
          return (
            <g>
              <rect x={tx} y={ty} width={140} height={52} rx={6}
                fill="#1e293b" stroke="#334155" strokeWidth={1} opacity={0.95}
              />
              <text x={tx + 10} y={ty + 16} fontSize={11} fill="#f1f5f9" fontWeight="600">
                {tooltip.month}
              </text>
              <text x={tx + 10} y={ty + 30} fontSize={10} fill={BAR_COLOR}>
                Mes: {fmtShort(tooltip.retencion)}
              </text>
              <text x={tx + 10} y={ty + 44} fontSize={10} fill={LINE_COLOR}>
                Acum: {fmtShort(tooltip.acumulado)}
              </text>
            </g>
          );
        })()}
      </svg>

      {/* Footnote */}
      <p style={{ fontSize: 11, color: TEXT_COLOR, margin: "6px 0 0", textAlign: "center" }}>
        Barras = retención del mes · Línea = total retenido en el año
      </p>

      {/* Tooltip detail on touch/hover (mobile fallback) */}
      {tooltip && (
        <div style={{
          marginTop: 8, padding: "8px 12px", background: "rgba(30,41,59,0.6)",
          borderRadius: 8, fontSize: 12, display: "flex", gap: 16, justifyContent: "center",
        }}>
          <span style={{ color: BAR_COLOR }}>
            {tooltip.month} mes: <strong>{$(tooltip.retencion)}</strong>
          </span>
          <span style={{ color: LINE_COLOR }}>
            Acum: <strong>{$(tooltip.acumulado)}</strong>
          </span>
        </div>
      )}
    </div>
  );
}
