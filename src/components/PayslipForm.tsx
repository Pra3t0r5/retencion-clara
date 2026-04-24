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

  function handlePreFill() {
    setRaw(payslipToRaw(RECIBO_MAR));
    setErrors({});
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 10px", fontSize: 14,
    border: "1px solid #d1d5db", borderRadius: 6, boxSizing: "border-box",
    fontFamily: "inherit",
  };
  const errorStyle: React.CSSProperties = { color: "#dc2626", fontSize: 12, marginTop: 2 };
  const labelStyle: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4, color: "#374151" };

  return (
    <form onSubmit={handleSubmit} style={{ padding: "0 0 16px" }}>
      <button
        type="button"
        onClick={handlePreFill}
        style={{
          width: "100%", padding: "10px", marginBottom: 16,
          background: "#eff6ff", border: "1px solid #bfdbfe",
          borderRadius: 8, cursor: "pointer", fontSize: 14, color: "#1d4ed8",
        }}
      >
        Usar datos de Fernando (demo)
      </button>

      {FIELDS.map(({ key, label }) => (
        <div key={key} style={{ marginBottom: 12 }}>
          <label style={labelStyle}>{label}</label>
          <input
            style={{ ...inputStyle, borderColor: errors[key] ? "#dc2626" : "#d1d5db" }}
            value={raw[key] ?? ""}
            onChange={e => handleChange(key, e.target.value)}
            placeholder={key === "periodo" ? "Marzo 2026" : "0"}
          />
          {errors[key] && <div style={errorStyle}>{errors[key]}</div>}
        </div>
      ))}

      <button
        type="submit"
        style={{
          width: "100%", padding: "12px", marginTop: 8,
          background: "#2563eb", color: "#fff", border: "none",
          borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer",
        }}
      >
        Calcular
      </button>
    </form>
  );
}
