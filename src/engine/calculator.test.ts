import { describe, it, expect } from 'vitest';
import { RECIBO_MAR, F572 } from '../data';
import { calcularGNSI, calcularImpuesto, calcularRetencionMes, calcularGap, proyectarAbril } from './calculator';

const TOLERANCE = 100;

describe('calcularGNSI', () => {
  it('returns GNSI matching Fernando Mar 2026 recibo ± 100', () => {
    const result = calcularGNSI(RECIBO_MAR);
    expect(result).toBeGreaterThan(RECIBO_MAR.gnsi - TOLERANCE);
    expect(result).toBeLessThan(RECIBO_MAR.gnsi + TOLERANCE);
  });

  it('returns 0 when all inputs are 0', () => {
    const zero = { ...RECIBO_MAR, bruto_acumulado: 0, aportes_acumulados: 0,
      indumentaria_aplicada: 0, cuota_medica_aplicada: 0, ded_especial: 0,
      gni: 0, ded_conyuge: 0, ded_hijos: 0, ded_especial_12: 0 };
    expect(calcularGNSI(zero)).toBe(0);
  });
});

describe('calcularImpuesto', () => {
  it('returns impuesto matching Fernando Mar 2026 recibo ± 100', () => {
    const gnsi = calcularGNSI(RECIBO_MAR);
    const result = calcularImpuesto(gnsi);
    expect(result).toBeGreaterThan(RECIBO_MAR.impuesto_determinado - TOLERANCE);
    expect(result).toBeLessThan(RECIBO_MAR.impuesto_determinado + TOLERANCE);
  });

  it('returns 0 when GNSI is 0', () => {
    expect(calcularImpuesto(0)).toBe(0);
  });

  it('applies 5% rate for GNSI below first bracket threshold', () => {
    const gnsi = 500_000; // below t₂ ($843,762.69)
    const impuesto = calcularImpuesto(gnsi);
    expect(impuesto).toBeCloseTo(gnsi * 0.05, 0);
  });
});

describe('calcularRetencionMes', () => {
  it('returns retención del mes matching Fernando Mar 2026 recibo ± 100', () => {
    const gnsi = calcularGNSI(RECIBO_MAR);
    const impuesto = calcularImpuesto(gnsi);
    const retenidoAnterior = RECIBO_MAR.retencion_acumulada - RECIBO_MAR.retencion_mes;
    const result = calcularRetencionMes(impuesto, retenidoAnterior);
    expect(result).toBeGreaterThan(RECIBO_MAR.retencion_mes - TOLERANCE);
    expect(result).toBeLessThan(RECIBO_MAR.retencion_mes + TOLERANCE);
  });

  it('never returns negative', () => {
    expect(calcularRetencionMes(100, 1000)).toBe(0);
  });
});

describe('calcularGap', () => {
  it('computes indumentaria gap correctly ± 100', () => {
    const gap = calcularGap(RECIBO_MAR, F572, RECIBO_MAR.meses);
    expect(gap.indumentaria_gap).toBeGreaterThan(425_295 - TOLERANCE);
    expect(gap.indumentaria_gap).toBeLessThan(425_295 + TOLERANCE);
  });

  it('computes cuota médica gap correctly ± 100', () => {
    const gap = calcularGap(RECIBO_MAR, F572, RECIBO_MAR.meses);
    expect(gap.cuota_medica_gap).toBeGreaterThan(670_449 - TOLERANCE);
    expect(gap.cuota_medica_gap).toBeLessThan(670_449 + TOLERANCE);
  });

  it('computes ahorro estimado correctly ± 500', () => {
    const gap = calcularGap(RECIBO_MAR, F572, RECIBO_MAR.meses);
    expect(gap.ahorro_estimado).toBeGreaterThan(339_680 - 500);
    expect(gap.ahorro_estimado).toBeLessThan(339_680 + 500);
  });
});

describe('proyectarAbril', () => {
  it('returns retencion_abr_estimada less than retencion_mes when gap > 0', () => {
    const result = proyectarAbril(RECIBO_MAR, F572);
    expect(result.retencion_abr_estimada).toBeLessThan(RECIBO_MAR.retencion_mes);
  });
});

describe('calcularGap edge cases', () => {
  it('returns zero gap when F572 declared equals payslip applied', () => {
    const noGapF572 = {
      ...F572,
      cuota_medica: { enero: RECIBO_MAR.cuota_medica_aplicada },
      indumentaria:  { enero: RECIBO_MAR.indumentaria_aplicada },
    };
    const gap = calcularGap(RECIBO_MAR, noGapF572, 1);
    expect(gap.total_gap).toBe(0);
    expect(gap.ahorro_estimado).toBe(0);
  });
});
