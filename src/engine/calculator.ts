import { TABLAS_2026_H1, type TaxBracket } from '../tablas/2026-H1';
import type { PayslipData, F572Data, GapAnalysis, DiferenciaAnalisis } from './schemas';

export type ProyeccionAbril = {
  nuevas_deducciones_ene_mar: number;
  nueva_indumentaria_abr: number;
  nueva_cuota_medica_abr: number;
  total_nuevas_deducciones: number;
  reduccion_retencion_estimada: number;
  retencion_abr_estimada: number;
};

export type ProyeccionAnual = {
  bruto_anual: number;
  retencion_acumulada_mar: number;
  retencion_restante_estimada: number;
  retencion_total_anual: number;
  efectiva_rate: number;
};

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

export function proyectarAbril(
  payslip: PayslipData,
  f572: F572Data,
): ProyeccionAbril {
  const gap = calcularGap(payslip, f572, payslip.meses);
  const gnsi = calcularGNSI(payslip);
  const tax_rate = buscarTramo(gnsi).pct;

  const nueva_indumentaria_abr = f572.indumentaria['abril'] ?? 0;
  const nueva_cuota_medica_abr = f572.cuota_medica['abril'] ?? 0;
  const total_nuevas_deducciones = gap.total_gap + nueva_indumentaria_abr + nueva_cuota_medica_abr;
  const reduccion_retencion_estimada = total_nuevas_deducciones * tax_rate;
  const retencion_abr_estimada = Math.max(0, payslip.retencion_mes - reduccion_retencion_estimada);

  return {
    nuevas_deducciones_ene_mar: gap.total_gap,
    nueva_indumentaria_abr,
    nueva_cuota_medica_abr,
    total_nuevas_deducciones,
    reduccion_retencion_estimada,
    retencion_abr_estimada,
  };
}

export function proyectarAnual(payslip: PayslipData, f572: F572Data): ProyeccionAnual {
  const bruto_mensual = payslip.bruto_acumulado / payslip.meses;
  const bruto_anual = bruto_mensual * 12;
  const abril = proyectarAbril(payslip, f572);
  const retencion_may_dic_estimada = payslip.retencion_mes * 0.7 * 8;
  const retencion_restante_estimada = abril.retencion_abr_estimada + retencion_may_dic_estimada;
  const retencion_total_anual = payslip.retencion_acumulada + retencion_restante_estimada;

  return {
    bruto_anual,
    retencion_acumulada_mar: payslip.retencion_acumulada,
    retencion_restante_estimada,
    retencion_total_anual,
    efectiva_rate: retencion_total_anual / bruto_anual,
  };
}

// FR-008: true when F.572 has at least one positive indumentaria or cuota_medica value
export function hasF572Data(f: F572Data): boolean {
  return Object.values(f.indumentaria).some(v => v > 0) ||
         Object.values(f.cuota_medica).some(v => v > 0);
}

export function calcularDiferencia(
  rawA: PayslipData,
  rawB: PayslipData,
  f572A: F572Data,
  f572B: F572Data,
): DiferenciaAnalisis {
  const [mesA, mesB, , fb] = rawA.meses <= rawB.meses
    ? [rawA, rawB, f572A, f572B]
    : [rawB, rawA, f572B, f572A];

  const delta_retencion_mes = mesB.retencion_mes - mesA.retencion_mes;
  const delta_bruto_mensual = (mesB.bruto_acumulado / mesB.meses)
                            - (mesA.bruto_acumulado / mesA.meses);
  const delta_ded_aplicadas = (mesB.indumentaria_aplicada + mesB.cuota_medica_aplicada)
                            - (mesA.indumentaria_aplicada + mesA.cuota_medica_aplicada);

  const causa_efecto_acumulativo    = -mesA.retencion_mes;
  const rate_B                      = buscarTramo(mesB.gnsi).pct;
  const causa_rectificativa_siradig = hasF572Data(fb)
                                    ? -(delta_ded_aplicadas * rate_B) || 0
                                    : 0;
  const delta_impuesto              = mesB.impuesto_determinado - mesA.impuesto_determinado;
  const causa_salario               = delta_impuesto - causa_rectificativa_siradig;
  const causa_bracket               = 0;

  const residuo_inexplicado = delta_retencion_mes
    - (causa_efecto_acumulativo + causa_rectificativa_siradig + causa_salario + causa_bracket);

  const abs_delta     = Math.abs(delta_retencion_mes);
  const clasificacion = (abs_delta === 0 || Math.abs(residuo_inexplicado) < 0.1 * abs_delta)
                      ? 'esperada' as const
                      : 'revisar' as const;

  return {
    mesA: mesA.meses,
    mesB: mesB.meses,
    delta_retencion_mes,
    delta_bruto_mensual,
    delta_ded_aplicadas,
    causa_efecto_acumulativo,
    causa_rectificativa_siradig,
    causa_salario,
    causa_bracket,
    residuo_inexplicado,
    clasificacion,
  };
}
