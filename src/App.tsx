import { useState } from "react";
import { RECIBO_MAR, F572 } from "./data";
import { calcularGaps, proyectarAbril, proyectarAnual } from "./calculator";
import "./index.css";

const $ = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

const Row = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div className={`row${highlight ? " highlight" : ""}`}>
    <span className="row-label">{label}</span>
    <span className="row-value">{value}</span>
  </div>
);

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="card">
    <div className="card-title">{title}</div>
    {children}
  </div>
);

function TabResumen() {
  const gaps = calcularGaps();
  const abril = proyectarAbril();
  const anual = proyectarAnual();
  const totalAhorroAbril = gaps.ahorro_estimado + (abril.nueva_indumentaria_abr + abril.nueva_cuota_medica_abr) * gaps.tax_rate;

  return (
    <>
      <div className="stat-grid">
        <div className="stat-card danger">
          <div className="stat-label">Retenido Ene–Mar</div>
          <div className="stat-value">{$(RECIBO_MAR.retencion_acumulada)}</div>
          <div className="stat-sub">{$(RECIBO_MAR.retencion_mes)}/mes</div>
        </div>
        <div className="stat-card success">
          <div className="stat-label">Ahorro Abril est.</div>
          <div className="stat-value">{$(totalAhorroAbril)}</div>
          <div className="stat-sub">por F.572 rectific.</div>
        </div>
      </div>

      <Card title="📋 Gap F.572 — no aplicado aún">
        <Row label="Indumentaria Ene–Mar declarada" value={$(F572.indumentaria.enero + F572.indumentaria.febrero + F572.indumentaria.marzo)} />
        <Row label="Aplicada en recibo" value={$(RECIBO_MAR.indumentaria_aplicada)} />
        <Row label="Gap" value={$(gaps.indumentaria_gap)} highlight />
        <div className="divider" />
        <Row label="Cuota médica Ene–Mar declarada" value={$(F572.cuota_medica.enero + F572.cuota_medica.febrero + F572.cuota_medica.marzo)} />
        <Row label="Aplicada en recibo" value={$(RECIBO_MAR.cuota_medica_aplicada)} />
        <Row label="Gap" value={$(gaps.cuota_medica_gap)} highlight />
        <div className="divider" />
        <Row label={`Total gap × ${pct(gaps.tax_rate)}`} value={`${$(gaps.total_gap)} → ahorra ${$(gaps.ahorro_estimado)}`} highlight />
      </Card>

      <Card title="📅 Proyección Abril">
        <Row label="Gap Ene–Mar (rectificativa)" value={$(gaps.total_gap)} />
        <Row label="Indumentaria Abril nueva" value={$(abril.nueva_indumentaria_abr)} />
        <Row label="Cuota médica Abril nueva" value={$(abril.nueva_cuota_medica_abr)} />
        <Row label="Total nuevas deducciones" value={$(abril.total_nuevas_deducciones)} highlight />
        <div className="divider" />
        <Row label="Reducción retención" value={$(abril.reduccion_retencion_estimada)} />
        <Row label="Retención Abril estimada" value={$(abril.retencion_abr_estimada)} highlight />
      </Card>

      <Card title="📊 Proyección Anual">
        <Row label="Bruto anual estimado" value={$(anual.bruto_anual)} />
        <Row label="Retenido Ene–Mar (real)" value={$(anual.retencion_acumulada_mar)} />
        <Row label="Retención restante estimada" value={$(anual.retencion_restante_estimada)} />
        <Row label="Total anual estimado" value={$(anual.retencion_total_anual)} highlight />
        <Row label="Tasa efectiva" value={pct(anual.efectiva_rate)} />
      </Card>
    </>
  );
}

function TabMarzo() {
  return (
    <>
      <Card title="💰 Recibo Marzo 2026">
        <Row label="Sueldo básico (26 días)" value={$(7_118_911.33)} />
        <Row label="Lic. Vacaciones (4 días)" value={$(1_314_260.55)} />
        <Row label="Reembolso home office" value={$(2_000)} />
        <div className="divider" />
        <Row label="Total bruto" value={$(8_433_172.29)} highlight />
        <Row label="Aportes jubilación / OS" value={$(687_750.37)} />
        <Row label="Ganancias retenidas" value={$(RECIBO_MAR.retencion_mes)} />
        <div className="divider" />
        <Row label="Neto acreditado" value={$(RECIBO_MAR.neto_mes)} highlight />
      </Card>

      <Card title="📊 Cálculo acumulado Ene–Mar">
        <Row label="Total remuneraciones gravadas" value={$(RECIBO_MAR.bruto_acumulado)} />
        <Row label="Aportes de ley" value={`–${$(RECIBO_MAR.aportes_acumulados)}`} />
        <Row label="Indumentaria aplicada" value={`–${$(RECIBO_MAR.indumentaria_aplicada)}`} />
        <Row label="Cuota médica aplicada" value={`–${$(RECIBO_MAR.cuota_medica_aplicada)}`} />
        <div className="divider" />
        <Row label="Deducción especial" value={`–${$(RECIBO_MAR.ded_especial)}`} />
        <Row label="GNI" value={`–${$(RECIBO_MAR.gni)}`} />
        <Row label="Cónyuge" value={`–${$(RECIBO_MAR.ded_conyuge)}`} />
        <Row label="Hijos (1)" value={`–${$(RECIBO_MAR.ded_hijos)}`} />
        <div className="divider" />
        <Row label="GNSI" value={$(RECIBO_MAR.gnsi)} highlight />
        <Row label="Tramo 31% (base $10.1M)" value="31%" />
        <Row label="Impuesto determinado" value={$(RECIBO_MAR.impuesto_determinado)} highlight />
        <Row label="Retenido Ene–Feb" value={$(RECIBO_MAR.retencion_acumulada - RECIBO_MAR.retencion_mes)} />
        <Row label="Retenido en Marzo" value={$(RECIBO_MAR.retencion_mes)} highlight />
      </Card>
    </>
  );
}

function TabF572() {
  const ind_pendiente =
    (F572.indumentaria.enero - RECIBO_MAR.indumentaria_aplicada) +
    F572.indumentaria.febrero + F572.indumentaria.marzo + F572.indumentaria.abril;
  const med_pendiente =
    F572.cuota_medica.febrero + F572.cuota_medica.marzo + F572.cuota_medica.abril;

  return (
    <>
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
        <div className="divider" />
        <Row label="Total declarado" value={$(F572.cuota_medica.total)} highlight />
        <Row label="Aplicado en recibo" value={$(RECIBO_MAR.cuota_medica_aplicada)} />
        <Row label="Pendiente de aplicar" value={$(med_pendiente)} highlight />
      </Card>

      <Card title="👔 Indumentaria y Equipamiento">
        <Row label="Enero" value={$(F572.indumentaria.enero)} />
        <Row label="Febrero" value={$(F572.indumentaria.febrero)} />
        <Row label="Marzo" value={$(F572.indumentaria.marzo)} />
        <Row label="Abril" value={$(F572.indumentaria.abril)} />
        <div className="divider" />
        <Row label="Total declarado" value={$(F572.indumentaria.total)} highlight />
        <Row label="Aplicado en recibo" value={$(RECIBO_MAR.indumentaria_aplicada)} />
        <Row label="Pendiente de aplicar" value={$(ind_pendiente)} highlight />
      </Card>

      <div className="note">Rectificativa presentada 13/04/2026 · SiRADIG ARCA</div>
    </>
  );
}

const TABS = [
  { id: "resumen", label: "Resumen" },
  { id: "marzo", label: "Recibo" },
  { id: "f572", label: "F.572" },
];

export default function App() {
  const [tab, setTab] = useState("resumen");

  return (
    <div className="app">
      <div className="container">
        <div className="header">
          <h1>RetenciónClara</h1>
          <p>Albertengo · WORMHOLE S.A. · 2026</p>
        </div>

        <div className="tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`tab${tab === t.id ? " active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "resumen" && <TabResumen />}
        {tab === "marzo" && <TabMarzo />}
        {tab === "f572" && <TabF572 />}
      </div>
    </div>
  );
}
