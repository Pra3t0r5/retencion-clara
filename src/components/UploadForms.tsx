import { useState } from "react";
import type { PayslipData, F572Data } from "../engine/schemas";
import { PayslipData as PayslipSchema, F572Data as F572Schema } from "../engine/schemas";
import { PayslipForm } from "./PayslipForm";
import { F572Form } from "./F572Form";
import { PDFDropzone } from "./PDFDropzone";

interface UploadFormsProps {
  payslip: PayslipData | null;
  f572: F572Data | null;
  onPayslipChange: (d: PayslipData) => void;
  onF572Change: (d: F572Data) => void;
}

export function UploadForms({ payslip, f572, onPayslipChange, onF572Change }: UploadFormsProps) {
  const [section, setSection] = useState<"recibo" | "f572">("recibo");
  const [showManual, setShowManual] = useState(false);
  const [reciboLowConf, setReciboLowConf] = useState<string[]>([]);
  const [f572LowConf, setF572LowConf] = useState<string[]>([]);

  async function handleReciboPDF(file: File) {
    const { extractRecibo } = await import("../extractors/recibo");
    const result = await extractRecibo(file);
    setReciboLowConf(result._lowConfidence);
    try {
      const parsed = PayslipSchema.parse({ ...result, gnsi: result.gnsi ?? 0, impuesto_determinado: result.impuesto_determinado ?? 0 });
      onPayslipChange(parsed);
    } catch { /* low-confidence — user reviews form */ }
    return result;
  }

  async function handleF572PDF(file: File) {
    const { extractF572 } = await import("../extractors/f572");
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
              type="button"
              onClick={() => setSection("recibo")}
              className={`btn-section ${section === "recibo" ? "active" : "idle"}`}
            >
              Recibo de sueldo
            </button>
            <button
              type="button"
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
