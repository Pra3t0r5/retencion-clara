import { RECIBO_MAR, F572 } from "./data";

export interface GapAnalysis {
  indumentaria_gap: number;
  cuota_medica_gap: number;
  total_gap: number;
  ahorro_estimado: number;
  tax_rate: number;
}

export interface ProyeccionAbril {
  bruto_mensual_proyectado: number;
  nuevas_deducciones_ene_mar: number;  // gap from rectificativa
  nueva_indumentaria_abr: number;
  nueva_cuota_medica_abr: number;
  total_nuevas_deducciones: number;
  reduccion_retencion_estimada: number;
  retencion_abr_estimada: number;
}

export interface ProyeccionAnual {
  bruto_anual: number;
  retencion_acumulada_mar: number;
  retencion_restante_estimada: number;
  retencion_total_anual: number;
  efectiva_rate: number;
}

export function calcularGaps(): GapAnalysis {
  const ind_ene_mar = F572.indumentaria.enero + F572.indumentaria.febrero + F572.indumentaria.marzo;
  const med_ene_mar = F572.cuota_medica.enero + F572.cuota_medica.febrero + F572.cuota_medica.marzo;

  const indumentaria_gap = ind_ene_mar - RECIBO_MAR.indumentaria_aplicada;
  const cuota_medica_gap = med_ene_mar - RECIBO_MAR.cuota_medica_aplicada;
  const total_gap = indumentaria_gap + cuota_medica_gap;

  // Current effective rate at GNSI bracket
  const tax_rate = 0.31 /* bracket 8 — replaced by engine in Phase 3 */;
  const ahorro_estimado = total_gap * tax_rate;

  return { indumentaria_gap, cuota_medica_gap, total_gap, ahorro_estimado, tax_rate };
}

export function proyectarAbril(): ProyeccionAbril {
  const gaps = calcularGaps();
  const bruto_mensual_proyectado = RECIBO_MAR.bruto_acumulado / RECIBO_MAR.meses;

  const nueva_indumentaria_abr = F572.indumentaria.abril;
  const nueva_cuota_medica_abr = F572.cuota_medica.abril;

  const total_nuevas_deducciones =
    gaps.total_gap + nueva_indumentaria_abr + nueva_cuota_medica_abr;

  const reduccion_retencion_estimada =
    total_nuevas_deducciones * 0.31 /* bracket 8 — replaced by engine in Phase 3 */;

  const retencion_abr_estimada = Math.max(
    0,
    RECIBO_MAR.retencion_mes - reduccion_retencion_estimada
  );

  return {
    bruto_mensual_proyectado,
    nuevas_deducciones_ene_mar: gaps.total_gap,
    nueva_indumentaria_abr,
    nueva_cuota_medica_abr,
    total_nuevas_deducciones,
    reduccion_retencion_estimada,
    retencion_abr_estimada,
  };
}

export function proyectarAnual(): ProyeccionAnual {
  const bruto_mensual = RECIBO_MAR.bruto_acumulado / RECIBO_MAR.meses;
  const bruto_anual = bruto_mensual * 12;

  const abril = proyectarAbril();
  // Rough estimate: months 5-12 with all deductions properly applied
  const retencion_may_dic_estimada = (RECIBO_MAR.retencion_mes * 0.7) * 8;

  const retencion_restante_estimada =
    abril.retencion_abr_estimada + retencion_may_dic_estimada;

  const retencion_total_anual =
    RECIBO_MAR.retencion_acumulada + retencion_restante_estimada;

  const efectiva_rate = retencion_total_anual / bruto_anual;

  return {
    bruto_anual,
    retencion_acumulada_mar: RECIBO_MAR.retencion_acumulada,
    retencion_restante_estimada,
    retencion_total_anual,
    efectiva_rate,
  };
}
