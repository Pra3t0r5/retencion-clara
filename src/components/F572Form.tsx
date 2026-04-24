import { useState } from "react";
import { F572Data } from "../engine/schemas";
import { F572 } from "../data";

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
] as const;

function parseARS(str: string): number {
  const n = parseFloat(str.replace(/[$\s.]/g, "").replace(",", "."));
  return isNaN(n) ? 0 : n;
}

function formatForInput(n: number): string {
  return n === 0 ? "" : n.toLocaleString("es-AR");
}

type MonthRaw = Partial<Record<typeof MESES[number], string>>;

function f572ToRaw(f: F572Data): { conyuge: boolean; hijos: string; cuota: MonthRaw; ind: MonthRaw } {
  const cuota: MonthRaw = {};
  const ind: MonthRaw = {};
  for (const mes of MESES) {
    cuota[mes] = formatForInput((f.cuota_medica as Record<string, number>)[mes] ?? 0);
    ind[mes]   = formatForInput((f.indumentaria as Record<string, number>)[mes] ?? 0);
  }
  return { conyuge: f.conyuge, hijos: String(f.hijos), cuota, ind };
}

function rawToF572(conyuge: boolean, hijos: string, cuota: MonthRaw, ind: MonthRaw): F572Data {
  const cuota_medica: Record<string, number> = {};
  const indumentaria: Record<string, number> = {};
  for (const mes of MESES) {
    const c = parseARS(cuota[mes] ?? "");
    const i = parseARS(ind[mes] ?? "");
    if (c > 0) cuota_medica[mes] = c;
    if (i > 0) indumentaria[mes] = i;
  }
  return F572Data.parse({ conyuge, hijos: parseInt(hijos) || 0, cuota_medica, indumentaria });
}

const $ = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

type Props = {
  initial?: F572Data;
  onSubmit: (data: F572Data) => void;
};

export function F572Form({ initial, onSubmit }: Props) {
  const init = initial ?? F572;
  const defaults = f572ToRaw(init);
  const [conyuge, setConyuge] = useState(defaults.conyuge);
  const [hijos, setHijos] = useState(defaults.hijos);
  const [cuota, setCuota] = useState<MonthRaw>(defaults.cuota);
  const [ind, setInd] = useState<MonthRaw>(defaults.ind);

  const cuotaTotal = MESES.reduce((s, m) => s + parseARS(cuota[m] ?? ""), 0);
  const indTotal   = MESES.reduce((s, m) => s + parseARS(ind[m] ?? ""), 0);

  function handlePreFill() {
    const d = f572ToRaw(F572);
    setConyuge(d.conyuge); setHijos(d.hijos); setCuota(d.cuota); setInd(d.ind);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(rawToF572(conyuge, hijos, cuota, ind));
  }

  return (
    <form onSubmit={handleSubmit} style={{ padding: "0 0 var(--space-4)" }}>
      <button
        type="button"
        onClick={handlePreFill}
        className="form-toggle-btn"
        style={{ width: "100%", padding: "var(--space-2) var(--space-3)", marginBottom: "var(--space-4)" }}
      >
        Usar datos de Fernando (demo)
      </button>

      <div className="form-section-title">Cargas de familia</div>
      <label style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-2)", fontSize: "var(--text-base)" }}>
        <input type="checkbox" checked={conyuge} onChange={e => setConyuge(e.target.checked)} />
        Cónyuge / Unión convivencial
      </label>
      <div style={{ marginBottom: "var(--space-3)" }}>
        <label className="form-label">Cantidad de hijos</label>
        <input
          className="form-input"
          style={{ width: 80 }}
          type="number"
          min="0"
          max="20"
          value={hijos}
          onChange={e => setHijos(e.target.value)}
        />
      </div>

      <div className="form-section-title">Cuotas médico-asistenciales — Total: {$(cuotaTotal)}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-2) var(--space-3)", marginBottom: "var(--space-2)" }}>
        {MESES.map(mes => (
          <div key={mes}>
            <label className="form-label">{mes.charAt(0).toUpperCase() + mes.slice(1)}</label>
            <input
              className="form-input"
              value={cuota[mes] ?? ""}
              onChange={e => setCuota(prev => ({ ...prev, [mes]: e.target.value }))}
              placeholder="0"
            />
          </div>
        ))}
      </div>

      <div className="form-section-title">Indumentaria / Equipamiento — Total: {$(indTotal)}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-2) var(--space-3)", marginBottom: "var(--space-4)" }}>
        {MESES.map(mes => (
          <div key={mes}>
            <label className="form-label">{mes.charAt(0).toUpperCase() + mes.slice(1)}</label>
            <input
              className="form-input"
              value={ind[mes] ?? ""}
              onChange={e => setInd(prev => ({ ...prev, [mes]: e.target.value }))}
              placeholder="0"
            />
          </div>
        ))}
      </div>

      <button type="submit" className="form-submit-btn">
        Guardar F.572
      </button>
    </form>
  );
}
