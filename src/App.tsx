import { useEffect, useState } from "react";
import { RECIBO_MAR, F572 as F572_DEFAULT } from "./data";
import { calcularGap, proyectarAbril, proyectarAnual } from "./engine/calculator";
import type { PayslipData, F572Data } from "./engine/schemas";
import { PayslipData as PayslipSchema, F572Data as F572Schema } from "./engine/schemas";
import { PayslipForm } from "./components/PayslipForm";
import { F572Form } from "./components/F572Form";
import { PDFDropzone } from "./components/PDFDropzone";
import { DetalleCalculo } from "./components/DetalleCalculo";
import "./index.css";

const $ = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 768
  );
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isDesktop;
}

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

function EmptyState({
  icon, title, desc, actionLabel, onAction,
}: {
  icon: string;
  title: string;
  desc: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <div className="empty-state-title">{title}</div>
      <p className="empty-state-desc">{desc}</p>
      {actionLabel && onAction && (
        <button className="empty-state-action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function TabResumen({ payslip, f572 }: { payslip: PayslipData; f572: F572Data }) {
  const gaps = calcularGap(payslip, f572, payslip.meses);
  const abril = proyectarAbril(payslip, f572);
  const anual = proyectarAnual(payslip, f572);
  const totalAhorroAbril = gaps.ahorro_estimado +
    (abril.nueva_indumentaria_abr + abril.nueva_cuota_medica_abr) * gaps.tax_rate;

  return (
    <>
      <div className="stat-grid">
        <div className="stat-card danger">
          <div className="stat-label">Retenido acumulado</div>
          <div className="stat-value">{$(payslip.retencion_acumulada)}</div>
          <div className="stat-sub">{$(payslip.retencion_mes)}/mes</div>
        </div>
        <div className="stat-card success">
          <div className="stat-label">Ahorro próx. mes est.</div>
          <div className="stat-value">{$(totalAhorroAbril)}</div>
          <div className="stat-sub">por F.572</div>
        </div>
      </div>

      <Card title="📋 Gap F.572 — no aplicado aún">
        <Row label="Indumentaria declarada" value={$(gaps.indumentaria_declarada)} />
        <Row label="Aplicada en recibo" value={$(gaps.indumentaria_aplicada)} />
        <Row label="Gap indumentaria" value={$(gaps.indumentaria_gap)} highlight />
        <div className="divider" />
        <Row label="Cuota médica declarada" value={$(gaps.cuota_medica_declarada)} />
        <Row label="Aplicada en recibo" value={$(gaps.cuota_medica_aplicada)} />
        <Row label="Gap cuota médica" value={$(gaps.cuota_medica_gap)} highlight />
        <div className="divider" />
        <Row
          label={`Total gap × ${pct(gaps.tax_rate)}`}
          value={`${$(gaps.total_gap)} → ahorra ${$(gaps.ahorro_estimado)}`}
          highlight
        />
      </Card>

      <Card title="📅 Proyección próximo mes">
        <Row label="Gap retroactivo (rectificativa)" value={$(abril.nuevas_deducciones_ene_mar)} />
        <Row label="Indumentaria mes siguiente" value={$(abril.nueva_indumentaria_abr)} />
        <Row label="Cuota médica mes siguiente" value={$(abril.nueva_cuota_medica_abr)} />
        <Row label="Total nuevas deducciones" value={$(abril.total_nuevas_deducciones)} highlight />
        <div className="divider" />
        <Row label="Reducción retención estimada" value={$(abril.reduccion_retencion_estimada)} />
        <Row label="Retención próximo mes estimada" value={$(abril.retencion_abr_estimada)} highlight />
      </Card>

      <Card title="📊 Proyección Anual">
        <Row label="Bruto anual estimado" value={$(anual.bruto_anual)} />
        <Row label="Retenido hasta ahora (real)" value={$(anual.retencion_acumulada_mar)} />
        <Row label="Retención restante estimada" value={$(anual.retencion_restante_estimada)} />
        <Row label="Total anual estimado" value={$(anual.retencion_total_anual)} highlight />
        <Row label="Tasa efectiva" value={pct(anual.efectiva_rate)} />
      </Card>

      <DetalleCalculo payslip={payslip} />
    </>
  );
}

function TabF572({
  f572, payslip, onGoToDatos,
}: {
  f572: F572Data;
  payslip: PayslipData;
  onGoToDatos: () => void;
}) {
  const mesNames = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ];
  const cuotaTotal = mesNames.reduce((s, m) => s + ((f572.cuota_medica as Record<string, number>)[m] ?? 0), 0);
  const indTotal   = mesNames.reduce((s, m) => s + ((f572.indumentaria as Record<string, number>)[m] ?? 0), 0);

  const hasF572Data = cuotaTotal > 0 || indTotal > 0 || f572.conyuge || f572.hijos > 0;

  if (!hasF572Data) {
    return (
      <EmptyState
        icon="📄"
        title="Sin declaración F.572"
        desc="No encontramos deducciones cargadas. Ingresá tu F.572 SiRADIG para calcular cuánto podés recuperar en deducciones de cuota médica e indumentaria."
        actionLabel="Ingresar F.572"
        onAction={onGoToDatos}
      />
    );
  }

  return (
    <>
      <Card title="👨‍👩‍👧 Cargas de familia">
        <Row label="Cónyuge" value={f572.conyuge ? "Declarado ✓" : "No declarado"} />
        <Row label="Hijos" value={String(f572.hijos)} />
      </Card>

      <Card title="🏥 Cuotas Médico Asistenciales">
        {mesNames.map(mes => {
          const v = (f572.cuota_medica as Record<string, number>)[mes] ?? 0;
          return v > 0 ? <Row key={mes} label={mes.charAt(0).toUpperCase() + mes.slice(1)} value={$(v)} /> : null;
        })}
        <div className="divider" />
        <Row label="Total declarado" value={$(cuotaTotal)} highlight />
        <Row label="Aplicado en recibo" value={$(payslip.cuota_medica_aplicada)} />
        <Row label="Gap" value={$(Math.max(0, cuotaTotal - payslip.cuota_medica_aplicada))} highlight />
      </Card>

      <Card title="👔 Indumentaria y Equipamiento">
        {mesNames.map(mes => {
          const v = (f572.indumentaria as Record<string, number>)[mes] ?? 0;
          return v > 0 ? <Row key={mes} label={mes.charAt(0).toUpperCase() + mes.slice(1)} value={$(v)} /> : null;
        })}
        <div className="divider" />
        <Row label="Total declarado" value={$(indTotal)} highlight />
        <Row label="Aplicado en recibo" value={$(payslip.indumentaria_aplicada)} />
        <Row label="Gap" value={$(Math.max(0, indTotal - payslip.indumentaria_aplicada))} highlight />
      </Card>
    </>
  );
}

function UploadForms({
  payslip, f572, onPayslipChange, onF572Change,
}: {
  payslip: PayslipData | null;
  f572: F572Data | null;
  onPayslipChange: (d: PayslipData) => void;
  onF572Change: (d: F572Data) => void;
}) {
  const [section, setSection] = useState<"recibo" | "f572">("recibo");
  const [reciboLowConf, setReciboLowConf] = useState<string[]>([]);
  const [f572LowConf, setF572LowConf] = useState<string[]>([]);

  async function handleReciboPDF(file: File) {
    const { extractRecibo } = await import("./extractors/recibo");
    const result = await extractRecibo(file);
    setReciboLowConf(result._lowConfidence);
    try {
      const parsed = PayslipSchema.parse({ ...result, gnsi: result.gnsi ?? 0, impuesto_determinado: result.impuesto_determinado ?? 0 });
      onPayslipChange(parsed);
    } catch { /* low-confidence — user reviews form */ }
    return result;
  }

  async function handleF572PDF(file: File) {
    const { extractF572 } = await import("./extractors/f572");
    const result = await extractF572(file);
    setF572LowConf(result._lowConfidence);
    try {
      const parsed = F572Schema.parse(result);
      onF572Change(parsed);
    } catch { /* user reviews form */ }
    return result;
  }

  return (
    <>
      <PDFDropzone
        label="Recibo de sueldo (PDF)"
        onExtract={handleReciboPDF}
        lowConfidenceFields={reciboLowConf}
      />
      <PDFDropzone
        label="F.572 SiRADIG (PDF)"
        onExtract={handleF572PDF}
        lowConfidenceFields={f572LowConf}
      />

      <div style={{ display: "flex", gap: "var(--space-2)", marginBottom: "var(--space-4)" }}>
        <button
          onClick={() => setSection("recibo")}
          className={`btn-section ${section === "recibo" ? "active" : "idle"}`}
        >
          Recibo de sueldo
        </button>
        <button
          onClick={() => setSection("f572")}
          className={`btn-section ${section === "f572" ? "active" : "idle"}`}
        >
          F.572
        </button>
      </div>

      {section === "recibo" && (
        <PayslipForm initial={payslip ?? undefined} onSubmit={onPayslipChange} />
      )}
      {section === "f572" && (
        <F572Form initial={f572 ?? undefined} onSubmit={onF572Change} />
      )}
    </>
  );
}

const TABS = [
  { id: "resumen", label: "Resumen", className: "tab--resumen" },
  { id: "f572",    label: "F.572",   className: "" },
  { id: "datos",   label: "✏️ Datos", className: "" },
];

export default function App() {
  const [tab, setTab] = useState("datos");
  const [payslip, setPayslip] = useState<PayslipData | null>(RECIBO_MAR);
  const [f572, setF572] = useState<F572Data | null>(F572_DEFAULT);
  const isDesktop = useIsDesktop();

  useEffect(() => {
    if (isDesktop && tab === "resumen") setTab("datos");
  }, [isDesktop]);

  const hasData = payslip !== null && f572 !== null;

  function handlePayslipChange(p: PayslipData) {
    setPayslip(p);
    if (!isDesktop) setTab("resumen");
  }

  function handleF572Change(f: F572Data) {
    setF572(f);
    if (!isDesktop) setTab("resumen");
  }

  // ── Welcome screen (no data) ────────────────────────────────
  if (!hasData) {
    return (
      <div className="app">
        <div className="welcome-layout">
          <div className="welcome-app-name">RetenciónClara</div>

          <div className="welcome-hero">
            <div className="welcome-hero-icon">🧾</div>
            <h2 className="welcome-hero-title">Calculá tu retención de ganancias</h2>
            <p className="welcome-hero-desc">
              Subí tu recibo de sueldo y el F.572 SiRADIG para ver cuánto te retienen,
              cuánto podés recuperar con deducciones pendientes y proyectar los meses que vienen.
            </p>
            <div className="welcome-steps">
              <div className="welcome-step">
                <div className="welcome-step-num">1</div>
                <div className="welcome-step-text">Subí o cargá tu recibo de sueldo</div>
              </div>
              <div className="welcome-step">
                <div className="welcome-step-num">2</div>
                <div className="welcome-step-text">Completá tu declaración F.572</div>
              </div>
              <div className="welcome-step">
                <div className="welcome-step-num">3</div>
                <div className="welcome-step-text">Analizá el gap y la proyección</div>
              </div>
            </div>
          </div>

          <UploadForms
            payslip={payslip}
            f572={f572}
            onPayslipChange={handlePayslipChange}
            onF572Change={handleF572Change}
          />
        </div>
      </div>
    );
  }

  // ── Normal layout (has data) ────────────────────────────────
  const header = (
    <div className="header">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1>RetenciónClara</h1>
          <p>{payslip.empleador ?? "Sin empleador"} · {payslip.periodo ?? "2026"}</p>
        </div>
        <button
          className="btn-clear"
          onClick={() => { setPayslip(null); setF572(null); }}
        >
          Limpiar
        </button>
      </div>
    </div>
  );

  const tabs = (
    <div className="tabs">
      {TABS.map((t) => (
        <button
          key={t.id}
          className={`tab${tab === t.id ? " active" : ""}${t.className ? ` ${t.className}` : ""}`}
          onClick={() => setTab(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );

  const leftContent = (
    <>
      {tab === "resumen" && <TabResumen payslip={payslip} f572={f572} />}
      {tab === "f572" && (
        <TabF572
          f572={f572}
          payslip={payslip}
          onGoToDatos={() => setTab("datos")}
        />
      )}
      {tab === "datos" && (
        <UploadForms
          payslip={payslip}
          f572={f572}
          onPayslipChange={handlePayslipChange}
          onF572Change={handleF572Change}
        />
      )}
    </>
  );

  return (
    <div className="app">
      <div className="app-grid">
        <div className="panel-left">
          {header}
          {tabs}
          {leftContent}
        </div>
        <div className="panel-right">
          <TabResumen payslip={payslip} f572={f572} />
        </div>
      </div>
    </div>
  );
}
