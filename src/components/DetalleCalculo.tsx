import type { PayslipData } from "../engine/schemas";
import { calcularGNSI, calcularImpuesto, buscarTramo } from "../engine/calculator";

const $ = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

const Row = ({ label, value, indent }: { label: string; value: string; indent?: boolean }) => (
  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", paddingLeft: indent ? 12 : 0, borderBottom: "1px solid #f3f4f6", fontSize: 13 }}>
    <span style={{ color: "#6b7280" }}>{label}</span>
    <span style={{ fontWeight: 500, color: "#111827" }}>{value}</span>
  </div>
);

const Divider = () => <div style={{ borderTop: "1px solid #e5e7eb", margin: "6px 0" }} />;

type Props = { payslip: PayslipData; defaultOpen?: boolean };

export function DetalleCalculo({ payslip, defaultOpen = false }: Props) {
  const gnsi = calcularGNSI(payslip);
  const impuesto = calcularImpuesto(gnsi);
  const tramo = buscarTramo(gnsi);
  const pct = `${(tramo.pct * 100).toFixed(0)}%`;

  return (
    <details open={defaultOpen} style={{ marginTop: 16 }}>
      <summary style={{
        cursor: "pointer", padding: "10px 14px",
        background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb",
        fontSize: 13, fontWeight: 600, color: "#374151", listStyle: "none",
        display: "flex", justifyContent: "space-between",
      }}>
        <span>📋 Detalle del cálculo</span>
        <span style={{ color: "#9ca3af", fontWeight: 400 }}>▼</span>
      </summary>

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderTop: "none", borderRadius: "0 0 8px 8px", padding: "12px 14px" }}>
        <Row label="Total remuneraciones gravadas" value={$(payslip.bruto_acumulado)} />
        <Row label="Aportes de ley" value={`–${$(payslip.aportes_acumulados)}`} indent />
        <Row label="Indumentaria aplicada" value={`–${$(payslip.indumentaria_aplicada)}`} indent />
        <Row label="Cuota médica aplicada" value={`–${$(payslip.cuota_medica_aplicada)}`} indent />
        <Divider />
        <Row label="Deducción especial" value={`–${$(payslip.ded_especial)}`} indent />
        <Row label="GNI" value={`–${$(payslip.gni)}`} indent />
        <Row label="Cónyuge" value={`–${$(payslip.ded_conyuge)}`} indent />
        <Row label="Hijos" value={`–${$(payslip.ded_hijos)}`} indent />
        <Row label="1/12 ded. personales" value={`–${$(payslip.ded_especial_12)}`} indent />
        <Divider />
        <Row label="GNSI" value={$(gnsi)} />
        <Row label={`Tramo ${pct} — fijo ${$(tramo.fijo)} + ${pct} × excedente`} value={$(impuesto)} />
        <Divider />
        <Row label="Impuesto determinado" value={$(impuesto)} />
        <Row label="Retenciones anteriores" value={`–${$(payslip.retencion_acumulada - payslip.retencion_mes)}`} indent />
        <Row label="Retenido este mes" value={$(payslip.retencion_mes)} />
      </div>
    </details>
  );
}
