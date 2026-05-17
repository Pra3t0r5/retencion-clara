import { useState, useEffect } from "react";
import { RECIBO_MAR, RECIBO_ABR, F572 as F572_DEFAULT } from "./data";
import { calcularGap, proyectarAbril, proyectarAnual, hasF572Data, calcularRecuperado, detectarF572Events } from "./engine/calculator";
import type { PayslipData, F572Data } from "./engine/schemas";
import { PayslipData as PayslipSchema, F572Data as F572Schema } from "./engine/schemas";
import { PayslipForm } from "./components/PayslipForm";
import { F572Form } from "./components/F572Form";
import { PDFDropzone } from "./components/PDFDropzone";
import { DetalleCalculo } from "./components/DetalleCalculo";
import { MonthNav } from "./components/MonthNav";
import { ComparacionSIRADIG } from "./components/ComparacionSIRADIG";
import { RetentionChart } from "./components/RetentionChart";
import type { ChartPoint } from "./components/RetentionChart";
import { HeroStats } from "./components/HeroStats";
import { LocalStorageAdapter } from "./storage";
import type { FiscalYearData } from "./storage";
import "./index.css";

const YEAR = 2026;
const MES_ABBR = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const EMPTY_F572: F572Data = { conyuge: false, hijos: 0, cuota_medica: {}, indumentaria: {} };
const adapter = new LocalStorageAdapter();


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

function TabResumen({
  payslip, f572, chartData, recuperado, f572Events,
}: {
  payslip: PayslipData;
  f572: F572Data;
  chartData: ChartPoint[];
  recuperado: number;
  f572Events: Set<string>;
}) {
  const gaps = calcularGap(payslip, f572, payslip.meses);
  const abril = proyectarAbril(payslip, f572);
  const anual = proyectarAnual(payslip, f572);

  return (
    <>
      <HeroStats
        retenido={payslip.retencion_acumulada}
        recuperado={recuperado}
        pendiente={gaps.ahorro_estimado}
        periodoLabel={`Ene–${MES_ABBR[payslip.meses - 1]} ${YEAR}`}
      />

      {chartData.length > 0 && (
        <Card title="📈 Progresión mensual">
          <RetentionChart data={chartData} f572Events={f572Events} />
        </Card>
      )}

      {hasF572Data(f572) && (
        <Card title={gaps.total_gap === 0 ? "📋 F.572 — Todo acreditado ✓" : "📋 F.572 — Pendiente de acreditar"}>
          <Row label="Indumentaria declarada" value={$(gaps.indumentaria_declarada)} />
          <Row label="Aplicada en recibo" value={$(gaps.indumentaria_aplicada)} />
          <Row label="No acreditada" value={$(gaps.indumentaria_gap)} highlight />
          <div className="divider" />
          <Row label="Cuota médica declarada" value={$(gaps.cuota_medica_declarada)} />
          <Row label="Aplicada en recibo" value={$(gaps.cuota_medica_aplicada)} />
          <Row label="No acreditada" value={$(gaps.cuota_medica_gap)} highlight />
          <div className="divider" />
          {gaps.total_gap === 0 ? (
            <>
              <Row label="Estado" value="Todo acreditado ✓" highlight />
              <Row label="Ahorro materializado est." value={$(recuperado)} />
            </>
          ) : (
            <Row
              label={`Total no acreditado × ${pct(gaps.tax_rate)}`}
              value={`${$(gaps.total_gap)} → ahorra ${$(gaps.ahorro_estimado)}`}
              highlight
            />
          )}
        </Card>
      )}

      <Card title="📅 Proyección próximo mes">
        <Row label="Deducción pendiente (retroactiva)" value={$(abril.nuevas_deducciones_ene_mar)} />
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
        <Row label="No acreditado" value={$(Math.max(0, cuotaTotal - payslip.cuota_medica_aplicada))} highlight />
      </Card>

      <Card title="👔 Indumentaria y Equipamiento">
        {mesNames.map(mes => {
          const v = (f572.indumentaria as Record<string, number>)[mes] ?? 0;
          return v > 0 ? <Row key={mes} label={mes.charAt(0).toUpperCase() + mes.slice(1)} value={$(v)} /> : null;
        })}
        <div className="divider" />
        <Row label="Total declarado" value={$(indTotal)} highlight />
        <Row label="Aplicado en recibo" value={$(payslip.indumentaria_aplicada)} />
        <Row label="No acreditado" value={$(Math.max(0, indTotal - payslip.indumentaria_aplicada))} highlight />
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
  const [showManual, setShowManual] = useState(false);
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

      <div className="manual-toggle-row">
        <button className="demo-link" onClick={() => setShowManual(v => !v)}>
          {showManual ? "Ocultar carga manual ↑" : "Cargar datos manualmente ↓"}
        </button>
      </div>

      {showManual && (
        <>
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
  const [tab, setTab] = useState("resumen");
  const [fiscalYear, setFiscalYear] = useState<FiscalYearData>(new Map());
  const [activeMonth, setActiveMonth] = useState<number | null>(null);
  const [f572, setF572] = useState<F572Data | null>(null);
  const [comparacionMeses, setComparacionMeses] = useState<{ a: number; b: number } | null>(null);
  const isDesktop = useIsDesktop();

  useEffect(() => {
    adapter.loadYear(YEAR).then(stored => {
      if (stored.size > 0) {
        setFiscalYear(stored);
        const months = [...stored.keys()].sort((a, b) => a - b);
        setActiveMonth(months[months.length - 1]);
      }
    });
  }, []);

  const activePayslip = activeMonth !== null ? (fiscalYear.get(activeMonth) ?? null) : null;
  const activeF572 = f572 ?? EMPTY_F572;

  const recuperado = hasF572Data(activeF572) ? calcularRecuperado(fiscalYear, activeF572) : 0;
  const f572Events = hasF572Data(activeF572) ? detectarF572Events(fiscalYear, activeF572) : new Set<string>();

  const chartData: ChartPoint[] = Array.from(fiscalYear.entries())
    .sort(([a], [b]) => a - b)
    .map(([, p]) => ({
      month: MES_ABBR[p.meses - 1],
      retencion: p.retencion_mes,
      acumulado: p.retencion_acumulada,
    }));

  function handlePayslipChange(p: PayslipData) {
    const newMap = new Map(fiscalYear);
    newMap.set(p.meses, p);
    setFiscalYear(newMap);
    setActiveMonth(p.meses);
    adapter.saveMonth(YEAR, p.meses, p);
    if (!isDesktop) setTab("resumen");
  }

  function handleF572Change(f: F572Data) {
    setF572(f);
    if (!isDesktop) setTab("resumen");
  }

  function handleLoadDemo() {
    setFiscalYear(new Map([[3, RECIBO_MAR], [4, RECIBO_ABR]]));
    setActiveMonth(4);
    setF572(F572_DEFAULT);
    if (!isDesktop) setTab("resumen");
  }

  function handleClearMonth() {
    if (activeMonth === null) return;
    const newMap = new Map(fiscalYear);
    newMap.delete(activeMonth);
    setFiscalYear(newMap);
    adapter.deleteMonth(YEAR, activeMonth);
    if (newMap.size === 0) {
      setActiveMonth(null);
    } else {
      const remaining = [...newMap.keys()].sort((a, b) => a - b);
      setActiveMonth(remaining[remaining.length - 1]);
    }
  }

  // ── Welcome screen (no payslips loaded) ──────────────────────
  if (fiscalYear.size === 0) {
    return (
      <div className="app">
        <div className="welcome-layout">
          <div className="welcome-left">
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
                  <div className="welcome-step-text">Analizá la deducción no acreditada y la proyección</div>
                </div>
              </div>
              <button className="demo-link" onClick={handleLoadDemo}>
                Probar con datos de ejemplo →
              </button>
            </div>
          </div>
          <div className="welcome-right">
            <UploadForms
              payslip={null}
              f572={null}
              onPayslipChange={handlePayslipChange}
              onF572Change={handleF572Change}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Normal layout (has data) ──────────────────────────────────
  const header = (
    <div className="header">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1>RetenciónClara</h1>
          <p>{activePayslip?.empleador ?? "Sin empleador"} · {activePayslip?.periodo ?? String(YEAR)}</p>
        </div>
        {activeMonth !== null && (
          <button className="btn-clear" onClick={handleClearMonth}>
            Limpiar mes
          </button>
        )}
      </div>
    </div>
  );

  const visibleTabs = isDesktop ? TABS.filter(t => t.id !== "resumen") : TABS;
  // On desktop the right panel always shows resumen; treat "resumen" tab as "f572"
  const activeTab = isDesktop && tab === "resumen" ? "f572" : tab;

  const tabs = (
    <div className="tabs">
      {visibleTabs.map((t) => (
        <button
          key={t.id}
          className={`tab${activeTab === t.id ? " active" : ""}${t.className ? ` ${t.className}` : ""}`}
          onClick={() => setTab(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );

  const leftContent = (
    <>
      {activeTab === "resumen" && (
        activePayslip
          ? <TabResumen payslip={activePayslip} f572={activeF572} chartData={chartData} recuperado={recuperado} f572Events={f572Events} />
          : <EmptyState
              icon="📅"
              title="Ningún mes seleccionado"
              desc="Seleccioná un mes del navegador o cargá un nuevo recibo."
              actionLabel="Agregar mes"
              onAction={() => setTab("datos")}
            />
      )}
      {activeTab === "f572" && (
        activePayslip
          ? <TabF572 f572={activeF572} payslip={activePayslip} onGoToDatos={() => setTab("datos")} />
          : <EmptyState
              icon="📄"
              title="Ningún mes seleccionado"
              desc="Seleccioná un mes para ver el análisis F.572."
            />
      )}
      {activeTab === "datos" && (
        <UploadForms
          payslip={activeMonth !== null ? (fiscalYear.get(activeMonth) ?? null) : null}
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
          <MonthNav
            months={[...fiscalYear.keys()]}
            active={activeMonth}
            onSelect={setActiveMonth}
            onAddMonth={() => { setActiveMonth(null); setTab("datos"); }}
            onComparar={() => {
              const sorted = [...fiscalYear.keys()].sort((a, b) => a - b);
              setComparacionMeses({ a: sorted.at(-2)!, b: sorted.at(-1)! });
            }}
          />
          {tabs}
          {leftContent}
        </div>
        <div className="panel-right">
          {activePayslip
            ? <TabResumen payslip={activePayslip} f572={activeF572} chartData={chartData} recuperado={recuperado} f572Events={f572Events} />
            : <EmptyState
                icon="📅"
                title="Ningún mes seleccionado"
                desc="Seleccioná un mes del navegador o cargá un nuevo recibo."
              />
          }
        </div>
      </div>
      {comparacionMeses !== null &&
        fiscalYear.has(comparacionMeses.a) &&
        fiscalYear.has(comparacionMeses.b) && (
        <ComparacionSIRADIG
          mesA={fiscalYear.get(comparacionMeses.a)!}
          mesB={fiscalYear.get(comparacionMeses.b)!}
          f572A={activeF572}
          f572B={activeF572}
          allMonths={[...fiscalYear.keys()].sort((a, b) => a - b)}
          onChangeMonths={(a, b) => setComparacionMeses({ a, b })}
          onClose={() => setComparacionMeses(null)}
        />
      )}
    </div>
  );
}
