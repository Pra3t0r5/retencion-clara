import { describe, it, expect } from 'vitest';
import { parsePayslipText } from './recibo';
import { RECIBO_MAR } from '../data';

// Text extracted from tests/fixtures/payslip-mar-2026.pdf via pdfjs (pages 1+2 joined)
const PAYSLIP_TEXT = `
RECIBO DE HABERES

Período a Pagar

Fecha de Pago

Marzo 2026

25/03/2026

Centro de Costos

Banco
TECH

SANTANDER (072)
Forma de Pago

Cuenta / CBU

WORMHOLE S.A.
Perú 1735
(C1141) CAPITAL FEDERAL
CUIT: 30-71039556-6

Totales

8.433.172,29

2.000,00

1.908.024,29

Son Pesos

Total Neto

seis millones quinientos veintisiete mil ciento cuarenta y ocho con 0/100

6.527.148,00

WORMHOLE S.A.
Marzo 2026

Detalle de Calculo Impuesto a las Ganancias

TOTAL REMUNERACIONES GRAVADAS

27.432.062,23

Aportes de ley

1.428.343,63

745.062,91

2.173.406,54
Gastos Adq. Indumentaria de Trabajo

71.997,00

71.997,00
Cuota Médica Asistencial

311.947,62

311.947,62
Deducción especial

6.182.163,00

6.182.163,00
Ganancia no imponible

1.287.950,64

1.287.950,64
Conyuge

1,00

1.212.991,17
Hijos

1,00

611.715,87
Deducción Especial (1/12 Deduc. Pers.)

774.568,39

Ganancia neta sujeta a impuesto

14.805.322,00
IMPUESTO DETERMINADO

3.549.634,17
Retenciones anteriores

2.329.360,25
Impuesto de la liquidación

1.220.273,92
Impuesto a retener/devolver en la liquidación

1.220.273,92
SALDO DEL IMPUESTO
Saldo a favor AFIP

0,00
`;

const TOLERANCE = 100;

describe('parsePayslipText', () => {
  it('extracts bruto_acumulado ± 100', () => {
    const r = parsePayslipText(PAYSLIP_TEXT);
    expect(r.bruto_acumulado).toBeGreaterThan(RECIBO_MAR.bruto_acumulado - TOLERANCE);
    expect(r.bruto_acumulado).toBeLessThan(RECIBO_MAR.bruto_acumulado + TOLERANCE);
  });

  it('extracts aportes_acumulados ± 100', () => {
    const r = parsePayslipText(PAYSLIP_TEXT);
    expect(r.aportes_acumulados).toBeGreaterThan(RECIBO_MAR.aportes_acumulados - TOLERANCE);
    expect(r.aportes_acumulados).toBeLessThan(RECIBO_MAR.aportes_acumulados + TOLERANCE);
  });

  it('extracts retencion_mes ± 100', () => {
    const r = parsePayslipText(PAYSLIP_TEXT);
    expect(r.retencion_mes).toBeGreaterThan(RECIBO_MAR.retencion_mes - TOLERANCE);
    expect(r.retencion_mes).toBeLessThan(RECIBO_MAR.retencion_mes + TOLERANCE);
  });

  it('extracts ded_conyuge ± 100', () => {
    const r = parsePayslipText(PAYSLIP_TEXT);
    expect(r.ded_conyuge).toBeGreaterThan(RECIBO_MAR.ded_conyuge - TOLERANCE);
    expect(r.ded_conyuge).toBeLessThan(RECIBO_MAR.ded_conyuge + TOLERANCE);
  });

  it('extracts ded_hijos ± 100', () => {
    const r = parsePayslipText(PAYSLIP_TEXT);
    expect(r.ded_hijos).toBeGreaterThan(RECIBO_MAR.ded_hijos - TOLERANCE);
    expect(r.ded_hijos).toBeLessThan(RECIBO_MAR.ded_hijos + TOLERANCE);
  });

  it('extracts periodo and meses', () => {
    const r = parsePayslipText(PAYSLIP_TEXT);
    expect(r.periodo).toBe('Marzo 2026');
    expect(r.meses).toBe(3);
  });

  it('extracts empleador', () => {
    const r = parsePayslipText(PAYSLIP_TEXT);
    expect(r.empleador).toContain('WORMHOLE');
  });

  it('retencion_acumulada = prev + mes', () => {
    const r = parsePayslipText(PAYSLIP_TEXT);
    expect(r.retencion_acumulada).toBeCloseTo(2_329_360.25 + 1_220_273.92, 0);
  });

  it('no low confidence fields', () => {
    const r = parsePayslipText(PAYSLIP_TEXT);
    expect(r._lowConfidence).toEqual([]);
  });
});
