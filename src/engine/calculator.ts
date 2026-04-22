import { TABLAS_2026_H1, type TaxBracket } from '../tablas/2026-H1';
import type { PayslipData, F572Data, GapAnalysis } from './schemas';

export type { GapAnalysis };

export function buscarTramo(gnsi: number): TaxBracket {
  const tramo = TABLAS_2026_H1.tramos.find(t => gnsi >= t.desde && gnsi < t.hasta);
  return tramo ?? TABLAS_2026_H1.tramos[TABLAS_2026_H1.tramos.length - 1];
}

export function calcularGNSI(data: PayslipData): number {
  return Math.max(
    0,
    data.bruto_acumulado
    - data.aportes_acumulados
    - data.indumentaria_aplicada
    - data.cuota_medica_aplicada
    - data.ded_especial
    - data.gni
    - data.ded_conyuge
    - data.ded_hijos
    - data.ded_especial_12,
  );
}

export function calcularImpuesto(gnsi: number): number {
  if (gnsi <= 0) return 0;
  const tramo = buscarTramo(gnsi);
  return tramo.fijo + tramo.pct * (gnsi - tramo.desde);
}

export function calcularRetencionMes(
  impuesto: number,
  retencionAcumuladaAnterior: number,
): number {
  return Math.max(0, impuesto - retencionAcumuladaAnterior);
}

function sumMeses(record: Record<string, number>, meses: number): number {
  const MES_NAMES = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ];
  return MES_NAMES.slice(0, meses).reduce((sum, mes) => sum + (record[mes] ?? 0), 0);
}

export function calcularGap(
  payslip: PayslipData,
  f572: F572Data,
  meses: number,
): GapAnalysis {
  const indumentaria_declarada = sumMeses(f572.indumentaria, meses);
  const cuota_medica_declarada = sumMeses(f572.cuota_medica, meses);

  const indumentaria_gap = Math.max(0, indumentaria_declarada - payslip.indumentaria_aplicada);
  const cuota_medica_gap = Math.max(0, cuota_medica_declarada - payslip.cuota_medica_aplicada);
  const total_gap = indumentaria_gap + cuota_medica_gap;

  const gnsi = calcularGNSI(payslip);
  const tax_rate = buscarTramo(gnsi).pct;
  const ahorro_estimado = total_gap * tax_rate;

  return {
    indumentaria_declarada,
    indumentaria_aplicada: payslip.indumentaria_aplicada,
    indumentaria_gap,
    cuota_medica_declarada,
    cuota_medica_aplicada: payslip.cuota_medica_aplicada,
    cuota_medica_gap,
    total_gap,
    tax_rate,
    ahorro_estimado,
  };
}
