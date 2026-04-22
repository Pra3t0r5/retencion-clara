import { useState } from "react";
import { RECIBO_MAR, F572 } from "./data";
import { calcularGaps, proyectarAbril, proyectarAnual } from "./calculator";

const $ = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

const s = {
  page: { fontFamily: "system-ui, sans-serif", maxWidth: 520, margin: "0 auto", padding: "20px 16px", background: "#f8f9fa", minHeight: "100vh" },
  header: { textAlign: "center" as const, marginBottom: 24 },
  h1: { fontSize: 24, fontWeight: 700, margin: 0, color: "#1a1a2e" },
  sub: { fontSize: 13, color: "#888", marginTop: 4 },
  tabs: { display: "flex", gap: 4, background: "#e9ecef", borderRadius: 10, padding: 4, marginBottom: 20 },
  tab: (active: boolean) => ({
    flex: 1, padding: "8px 4px", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 500,
    background: active ? "#fff" : "transparent", color: active ? "#1a1a2e" : "#888",
    boxShadow: active ? "0 1px 3px rgba(0,0,0,.1)" : "none",
  }),
  card: { background: "#fff", borderRadius: 12, border: "1px solid #e9ecef", padding: 16, marginBottom: 16 },
  cardTitle: { fontWeight: 600, color: "#1a1a2e", marginBottom: 12, fontSize: 15 },
  row: (highlight?: boolean) => ({
    display: "flex", justifyContent: "space-between", padding: "8px 0",
    borderBottom: "1px solid #f0f0f0", fontSize: 13,
    fontWeight: highlight ? 600 : 400,
  }),
  label: { color: "#666" },
  val: (highlight?: boolean) => ({ color: highlight ? "#2563eb" : "#1a1a2e" }),
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 },
  statCard: (color: string) => ({
    background: color, borderRadius: 12, padding: 16, textAlign: "center" as const,
  }),
  statLabel: { fontSize: 11, marginBottom: 4, opacity: 0.8 },
  statValue: { fontSize: 20, fontWeight: 700 },
  statSub: { fontSize: 11, opacity: 0.7, marginTop: 2 },
  divider: { height: 1, background: "#e9ecef", margin: "8px 0" },
  note: { fontSize: 11, color: "#aaa", textAlign: "center" as const, marginTop: 8 },
};

const Row = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div style={s.row(highlight)}>
    <span style={s.label}>{label}</span>
    <span style={s.val(highlight)}>{value}</span>
  </div>
);

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={s.card}>
    <div style={s.cardTitle}>{title}</div>
    {children}
  </div>
);

function TabResumen() {
  const gaps = calcularGaps();
  const abril = proyectarAbril();
  const anual = proyectarAnual();
  const totalAhorroAbril = gaps.ahorro_estimado + (abril.nueva_indumentaria_abr + abril.nueva_cuota_medica_abr) * gaps.tax_rate;

  return (
    <div>
      <div style={s.grid2}>
        <div style={s.statCard("#fff0f0")}>
          <div style={{ ...s.statLabel, color: "#c0392b" }}>Retenido Ene-Mar</div>
          <div style={{ ...s.statValue, color: "#c0392b" }}>{$(RECIBO_MAR.retencion_acumulada)}</div>
          <div style={{ ...s.statSub, color: "#e57373" }}>{$(RECIBO_MAR.retencion_mes)}/mes</div>
        </div>
        <div style={s.statCard("#f0fff4")}>
          <div style={{ ...s.statLabel, color: "#27ae60" }}>Ahorro Abril est.</div>
          <div style={{ ...s.statValue, color: "#27ae60" }}>{$(totalAhorroAbril)}</div>
          <div style={{ ...s.statSub, color: "#81c784" }}>por F.572 rectific.</div>
        </div>
      </div>

      <Card title="📋 Gap F.572 — no aplicado aún">
        <Row label="Indumentaria Ene-Mar declarada" value={$(F572.indumentaria.enero + F572.indumentaria.febrero + F572.indumentaria.marzo)} />
        <Row label="Aplicada en recibo" value={$(RECIBO_MAR.indumentaria_aplicada)} />
        <Row label="Gap" value={$(gaps.indumentaria_gap)} highlight />
        <div style={s.divider} />
        <Row label="Cuota médica Ene-Mar declarada" value={$(F572.cuota_medica.enero + F572.cuota_medica.febrero + F572.cuota_medica.marzo)} />
        <Row label="Aplicada en recibo" value={$(RECIBO_MAR.cuota_medica_aplicada)} />
        <Row label="Gap" value={$(gaps.cuota_medica_gap)} highlight />
        <div style={s.divider} />
        <Row label={`Total gap × ${pct(gaps.tax_rate)}`} value={`${$(gaps.total_gap)} → ahorro ${$(gaps.ahorro_estimado)}`} highlight />
      </Card>

      <Card title="📅 Proyección Abril">
        <Row label="Gap Ene-Mar (rectificativa)" value={$(gaps.total_gap)} />
        <Row label="Indumentaria Abril nueva" value={$(abril.nueva_indumentaria_abr)} />
        <Row label="Cuota médica Abril nueva" value={$(abril.nueva_cuota_medica_abr)} />
        <Row label="Total nuevas deducciones" value={$(abril.total_nuevas_deducciones)} highlight />
        <div style={s.divider} />
        <Row label="Reducción retención" value={$(abril.reduccion_retencion_estimada)} />
        <Row label="Retención Abril estimada" value={$(abril.retencion_abr_estimada)} highlight />
      </Card>

      <Card title="📊 Proyección Anual">
        <Row label="Bruto anual estimado" value={$(anual.bruto_anual)} />
        <Row label="Retenido Ene-Mar (real)" value={$(anual.retencion_acumulada_mar)} />
        <Row label="Retención restante estimada" value={$(anual.retencion_restante_estimada)} />
        <Row label="Total anual estimado" value={$(anual.retencion_total_anual)} highlight />
        <Row label="Tasa efectiva" value={pct(anual.efectiva_rate)} />
      </Card>
    </div>
  );
}

function TabMarzo() {
  return (
    <div>
      <Card title="💰 Recibo Marzo 2026">
        <Row label="Sueldo básico (26 días)" value={$(7_118_911.33)} />
        <Row label="Lic. Vacaciones (4 días)" value={$(1_314_260.55)} />
        <Row label="Reembolso home office" value={$(2_000.00)} />
        <div style={s.divider} />
        <Row label="Total bruto" value={$(8_433_172.29)} highlight />
        <Row label="Aportes jubilación / OS" value={$(687_750.37)} />
        <Row label="Ganancias retenidas" value={$(RECIBO_MAR.retencion_mes)} />
        <div style={s.divider} />
        <Row label="Neto acreditado" value={$(RECIBO_MAR.neto_mes)} highlight />
      </Card>

      <Card title="📊 Detalle cálculo acumulado Ene-Mar">
        <Row label="Total remuneraciones gravadas" value={$(RECIBO_MAR.bruto_acumulado)} />
        <Row label="Aportes de ley" value={`–${$(RECIBO_MAR.aportes_acumulados)}`} />
        <Row label="Indumentaria (aplicada)" value={`–${$(RECIBO_MAR.indumentaria_aplicada)}`} />
        <Row label="Cuota médica (aplicada)" value={`–${$(RECIBO_MAR.cuota_medica_aplicada)}`} />
        <div style={s.divider} />
        <Row label="Deducción especial" value={`–${$(RECIBO_MAR.ded_especial)}`} />
        <Row label="GNI" value={`–${$(RECIBO_MAR.gni)}`} />
        <Row label="Cónyuge" value={`–${$(RECIBO_MAR.ded_conyuge)}`} />
        <Row label="Hijos (1)" value={`–${$(RECIBO_MAR.ded_hijos)}`} />
        <div style={s.divider} />
        <Row label="GNSI" value={$(RECIBO_MAR.gnsi)} highlight />
        <Row label="Tramo 31% (base $10.125.152)" value="31%" />
        <Row label="Impuesto determinado" value={$(RECIBO_MAR.impuesto_determinado)} highlight />
        <Row label="Retenido Ene-Feb anterior" value={$(RECIBO_MAR.retencion_acumulada - RECIBO_MAR.retencion_mes)} />
        <Row label="Retenido en Marzo" value={$(RECIBO_MAR.retencion_mes)} highlight />
      </Card>
    </div>
  );
}

function TabF572() {
  const ind_pendiente =
    (F572.indumentaria.enero - RECIBO_MAR.indumentaria_aplicada) +
    F572.indumentaria.febrero + F572.indumentaria.marzo + F572.indumentaria.abril;
  const med_pendiente =
    F572.cuota_medica.febrero + F572.cuota_medica.marzo + F572.cuota_medica.abril;

  return (
    <div>
      <Card title="👨‍👩‍👧 Cargas de familia">
        <Row label="Cónyuge" value="BENITEZ, PERLA NOEMI · 100%" />
        <Row label="Hija" value="ALBERTENGO, ANYA · 100%" />
        <Row label="Otros empleadores" value="Ninguno" />
      </Card>

      <Card title="🏥 Cuotas Médico Asistenciales">
        <Row label="Enero" value={$(F572.cuota_medica.enero)} />
        <Row label="Febrero" value={$(F572.cuota_medica.febrero)} />
        <Row label="Marzo" value={$(F572.cuota_medica.marzo)} />
        <Row label="Abril" value={$(F572.cuota_medica.abril)} />
        <div style={s.divider} />
        <Row label="Total declarado" value={$(F572.cuota_medica.total)} highlight />
        <Row label="Aplicado en recibo" value={$(RECIBO_MAR.cuota_medica_aplicada)} />
        <Row label="Pendiente de aplicar" value={$(med_pendiente)} highlight />
      </Card>

      <Card title="👔 Indumentaria y Equipamiento">
        <Row label="Enero (EPESF+Avila+MeLi+AMX)" value={$(F572.indumentaria.enero)} />
        <Row label="Febrero (AMX)" value={$(F572.indumentaria.febrero)} />
        <Row label="Marzo (AMX)" value={$(F572.indumentaria.marzo)} />
        <Row label="Abril (EPESF+AMX+ImgDigital)" value={$(F572.indumentaria.abril)} />
        <div style={s.divider} />
        <Row label="Total declarado" value={$(F572.indumentaria.total)} highlight />
        <Row label="Aplicado en recibo" value={$(RECIBO_MAR.indumentaria_aplicada)} />
        <Row label="Pendiente de aplicar" value={$(ind_pendiente)} highlight />
      </Card>

      <div style={s.note}>Rectificativa presentada 13/04/2026 · SiRADIG ARCA</div>
    </div>
  );
}

const TABS = [
  { id: "resumen", label: "Resumen" },
  { id: "marzo", label: "Recibo Mar" },
  { id: "f572", label: "F.572" },
];

export default function App() {
  const [tab, setTab] = useState("resumen");

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.h1}>RetenciónClara</h1>
        <div style={s.sub}>Albertengo · WORMHOLE S.A. · 2026</div>
      </div>

      <div style={s.tabs}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={s.tab(tab === t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "resumen" && <TabResumen />}
      {tab === "marzo" && <TabMarzo />}
      {tab === "f572" && <TabF572 />}
    </div>
  );
}
