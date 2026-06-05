import { useState } from "react";
import { PayslipData } from "../engine/schemas";
import { RECIBO_MAR } from "../data";

function parseARS(str: string): number {
  const cleaned = str.replace(/[$\s.]/g, "").replace(",", ".");
  return parseFloat(cleaned);
}

function formatForInput(n: number): string {
  return n.toLocaleString("es-AR");
}

type Field = { key: keyof PayslipData; label: string; optional?: boolean };

const FIELDS: Field[] = [
  { key: "periodo",               label: "Período (ej: Marzo 2026)",   optional: true },
  { key: "meses",                 label: "Meses acumulados" },
  { key: "bruto_acumulado",       label: "Total remuneraciones gravadas" },
  { key: "aportes_acumulados",    label: "Aportes de ley" },
  { key: "indumentaria_aplicada", label: "Indumentaria aplicada" },
  { key: "cuota_medica_aplicada", label: "Cuota médica aplicada" },
  { key: "ded_especial",          label: "Deducción especial" },
  { key: "gni",                   label: "GNI" },
  { key: "ded_conyuge",           label: "Deducción cónyuge" },
  { key: "ded_hijos",             label: "Deducción hijos" },
  { key: "ded_especial_12",       label: "1/12 ded. personales" },
  { key: "retencion_acumulada",   label: "Retención acumulada (año)" },
  { key: "retencion_mes",         label: "Retención del mes" },
];

type RawValues = Record<string, string>;

function payslipToRaw(p: PayslipData): RawValues {
  const out: RawValues = {};
  for (const { key } of FIELDS) {
    const v = p[key];
    out[key] = typeof v === "number" ? formatForInput(v) : String(v ?? "");
  }
  return out;
}

function rawToPayslip(raw: RawValues): PayslipData | null {
  try {
    const data: Record<string, unknown> = {};
    for (const { key } of FIELDS) {
      if (key === "periodo" || key === "empleador") {
        data[key] = raw[key] ?? "";
      } else {
        const n = parseARS(raw[key] ?? "");
        if (isNaN(n)) return null;
        data[key] = n;
      }
    }
    data.gnsi = 0;
    data.impuesto_determinado = 0;
    return PayslipData.parse(data);
  } catch {
    return null;
  }
}

type Props = {
  initial?: PayslipData;
  onSubmit: (data: PayslipData) => void;
};

export function PayslipForm({ initial, onSubmit }: Props) {
  const [raw, setRaw] = useState<RawValues>(
    initial ? payslipToRaw(initial) : payslipToRaw(RECIBO_MAR)
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleChange(key: string, value: string) {
    setRaw(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: "" }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = rawToPayslip(raw);
    if (!result) {
      const newErrors: Record<string, string> = {};
      for (const { key } of FIELDS) {
        if (key === "periodo") continue;
        const n = parseARS(raw[key] ?? "");
        if (isNaN(n)) newErrors[key] = "Valor inválido";
      }
      setErrors(newErrors);
      return;
    }
    onSubmit(result);
  }

  return (
    <form onSubmit={handleSubmit} style={{ padding: "0 0 var(--space-4)" }}>

      {FIELDS.map(({ key, label }, idx) => {
        const isText = key === "periodo" || key === "empleador";
        const isLast = idx === FIELDS.length - 1;
        return (
          <div key={key} style={{ marginBottom: "var(--space-3)" }}>
            <label className="form-label">{label}</label>
            <input
              className={`form-input${errors[key] ? " form-input--error" : ""}`}
              value={raw[key] ?? ""}
              onChange={e => handleChange(key, e.target.value)}
              placeholder={key === "periodo" ? "Marzo 2026" : "0"}
              inputMode={isText ? "text" : "decimal"}
              autoComplete="off"
              enterKeyHint={isLast ? "done" : "next"}
            />
            {errors[key] && <div className="form-error">{errors[key]}</div>}
          </div>
        );
      })}

      <button type="submit" className="form-submit-btn">
        Calcular
      </button>
    </form>
  );
}
