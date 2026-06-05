import { describe, it, expect } from 'vitest';
import { parseF572Text } from './f572';
import { F572 } from '../data';

// Text extracted from tests/fixtures/f572-2026.pdf via pdfjs (pages 1+2 joined)
const F572_TEXT = `
RÉGIMEN DE RETENCIONES
4ta. CATEGORÍA

F.572 Web

DECLARACIÓN JURADA

RECTIFICATIVA
CUIT:

20370776378

Apellido y Nombre:

ALBERTENGO, FERNANDO DANIEL

1 - Detalles de las cargas de familia

CUIL

27336335723
BENITEZ, PERLA NOEMI

09/01/1988

Cónyuge
Enero - Diciembre
y próximos períodos

100%
CUIL

27703303841
ALBERTENGO, ANYA

22/06/2024

Hijo/a menor de 18 años
Enero - Diciembre
y próx. períodos hasta
22/06/2042
100%

3 - Deducciones y desgravaciones

Cuotas Médico Asistenciales

$

1.333.083,83

30698414460 - MEDICINA ESENCIAL S A

1.333.083,83
Subtotal:

$

Enero

311.947,62
$
Febrero

330.173,05
$
Marzo

340.275,69
$
Abril

350.687,47
$

Gastos de Adquisición de Indumentaria y Equipamiento para uso exclusivo en el lugar de trabajo

$

1.192.767,97

20301822406 - AVILA ARIEL ALBERTO

35.999,00
Subtotal:

$

Enero

35.999,00
$

30545788167 - EMPRESA PROVINCIAL DE LA ENERGIA DE SANTA FE

591.232,42
Subtotal:

$

Enero

292.114,08
$
Abril

299.118,34
$

30663288497 - AMX ARGENTINA SOCIEDAD ANONIMA

184.538,55
Subtotal:

$

Enero

43.494,05
$
Febrero

43.586,94
$
Marzo

46.100,22
$
Abril

51.357,34
$

30714133353 - IMAGEN DIGITAL SA

345.000,00
Subtotal:

$

Abril

345.000,00
$

30716998947 - MERCADO EN LINEA S.A.S.

35.998,00
Subtotal:

$

Enero

35.998,00
$
`;

const TOLERANCE = 100;

describe('parseF572Text', () => {
  it('detects cónyuge = true', () => {
    const r = parseF572Text(F572_TEXT);
    expect(r.conyuge).toBe(true);
  });

  it('detects hijos = 1', () => {
    const r = parseF572Text(F572_TEXT);
    expect(r.hijos).toBe(1);
  });

  it('extracts cuota_medica enero ± 100', () => {
    const r = parseF572Text(F572_TEXT);
    const v = (r.cuota_medica as Record<string,number>)['enero'] ?? 0;
    expect(v).toBeGreaterThan(F572.cuota_medica.enero - TOLERANCE);
    expect(v).toBeLessThan(F572.cuota_medica.enero + TOLERANCE);
  });

  it('extracts cuota_medica abril ± 100', () => {
    const r = parseF572Text(F572_TEXT);
    const v = (r.cuota_medica as Record<string,number>)['abril'] ?? 0;
    expect(v).toBeGreaterThan(F572.cuota_medica.abril - TOLERANCE);
    expect(v).toBeLessThan(F572.cuota_medica.abril + TOLERANCE);
  });

  it('extracts indumentaria enero (multi-provider sum) ± 100', () => {
    const r = parseF572Text(F572_TEXT);
    const v = (r.indumentaria as Record<string,number>)['enero'] ?? 0;
    expect(v).toBeGreaterThan(F572.indumentaria.enero - TOLERANCE);
    expect(v).toBeLessThan(F572.indumentaria.enero + TOLERANCE);
  });

  it('extracts indumentaria abril (multi-provider sum) ± 500', () => {
    const r = parseF572Text(F572_TEXT);
    const v = (r.indumentaria as Record<string,number>)['abril'] ?? 0;
    // F572_TEXT fixture = pre-Berrini rectificativa: EPESF+AMX+ImagenDigital = 695_475.68
    expect(v).toBeGreaterThan(695_475.68 - 500);
    expect(v).toBeLessThan(695_475.68 + 500);
  });

  it('no low confidence fields', () => {
    const r = parseF572Text(F572_TEXT);
    expect(r._lowConfidence).toEqual([]);
  });
});
