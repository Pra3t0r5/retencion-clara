import type { PayslipData } from "../engine/schemas";
import { calcularGNSI, calcularImpuesto, buscarTramo } from "../engine/calculator";

const $ = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

const Row = ({ label, value, indent }: { label: string; value: string; indent?: boolean }) => (
  <div className={`detalle-row${indent ? " indent" : ""}`}>
    <span className="detalle-row-label">{label}</span>
    <span className="detalle-row-value">{value}</span>
  </div>
);

const Divider = () => <div className="detalle-divider" />;

type Props = { payslip: PayslipData; defaultOpen?: boolean };

export function DetalleCalculo({ payslip, defaultOpen = false }: Props) {
  const gnsi = calcularGNSI(payslip);
  const impuesto = calcularImpuesto(gnsi);
  const tramo = buscarTramo(gnsi);
  const pct = `${(tramo.pct * 100).toFixed(0)}%`;

  return (
    <details open={defaultOpen}>
      <summary className="detalle-summary">
        <span>📋 Detalle del cálculo</span>
        <span className="detalle-summary-chevron">▼</span>
      </summary>

      <div className="detalle-details">
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
