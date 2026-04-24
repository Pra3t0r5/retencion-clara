import type { PayslipData } from '../engine/schemas';

const MES_A_NUM: Record<string, number> = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
  julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
};

function parseARS(str: string): number {
  return parseFloat(str.replace(/\./g, '').replace(',', '.'));
}

function isNumeric(s: string): boolean {
  return /^\d[\d.,]+$/.test(s);
}

// Finds label in lines, returns LAST numeric token in the immediately following run.
// Stops collecting on first non-numeric non-empty line.
function lastAfter(lines: string[], label: string): number {
  const idx = lines.findIndex(l => l === label);
  if (idx === -1) return NaN;
  let last = NaN;
  for (let i = idx + 1; i < Math.min(lines.length, idx + 10); i++) {
    if (isNumeric(lines[i])) last = parseARS(lines[i]);
    else if (lines[i].length > 0) break;
  }
  return last;
}

// Finds label in lines, returns FIRST numeric token within maxSkip lines.
function firstAfter(lines: string[], label: string, maxSkip = 15): number {
  const idx = lines.findIndex(l => l === label);
  if (idx === -1) return NaN;
  for (let i = idx + 1; i < Math.min(lines.length, idx + maxSkip); i++) {
    if (isNumeric(lines[i])) return parseARS(lines[i]);
  }
  return NaN;
}

export type ReciboExtracted = Partial<PayslipData> & { _lowConfidence: string[] };

export function parsePayslipText(text: string): ReciboExtracted {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const lowConf: string[] = [];

  function get(label: string, key: string, fn = lastAfter): number {
    const v = fn(lines, label);
    if (isNaN(v)) lowConf.push(key);
    return isNaN(v) ? 0 : v;
  }

  const bruto_acumulado      = get('TOTAL REMUNERACIONES GRAVADAS', 'bruto_acumulado');
  const aportes_acumulados   = get('Aportes de ley', 'aportes_acumulados');
  const indumentaria_aplicada = get('Gastos Adq. Indumentaria de Trabajo', 'indumentaria_aplicada');
  const cuota_medica_aplicada = get('Cuota Médica Asistencial', 'cuota_medica_aplicada');
  const ded_especial         = get('Deducción especial', 'ded_especial');
  const gni                  = get('Ganancia no imponible', 'gni');
  const ded_conyuge          = get('Conyuge', 'ded_conyuge');
  const ded_hijos            = get('Hijos', 'ded_hijos');
  const ded_especial_12      = get('Deducción Especial (1/12 Deduc. Pers.)', 'ded_especial_12');
  const gnsi                 = get('Ganancia neta sujeta a impuesto', 'gnsi');
  const impuesto_determinado = get('IMPUESTO DETERMINADO', 'impuesto_determinado');
  const retencion_mes        = get('Impuesto de la liquidación', 'retencion_mes');
  const prev                 = get('Retenciones anteriores', '_prev');
  const retencion_acumulada  = prev + retencion_mes;
  const neto_mes             = get('Total Neto', 'neto_mes', (l, label) => firstAfter(l, label, 15));

  // Period and meses from "Período a Pagar" header or first "Mes YYYY" pattern
  let periodo = '';
  let meses = 1;
  const periodoIdx = lines.findIndex(l => l === 'Período a Pagar');
  if (periodoIdx !== -1) {
    for (let i = periodoIdx + 1; i < Math.min(lines.length, periodoIdx + 6); i++) {
      if (/^[A-ZÁÉÍÓÚ][a-záéíóú]+ \d{4}$/.test(lines[i])) {
        periodo = lines[i];
        meses = MES_A_NUM[lines[i].split(' ')[0].toLowerCase()] ?? 1;
        break;
      }
    }
  }
  if (!periodo) {
    const m = text.match(/\b(Enero|Febrero|Marzo|Abril|Mayo|Junio|Julio|Agosto|Septiembre|Octubre|Noviembre|Diciembre)\s+(\d{4})\b/);
    if (m) { periodo = m[0]; meses = MES_A_NUM[m[1].toLowerCase()] ?? 1; }
  }

  // Employer: first line matching "S.A." / "S.R.L." pattern
  const empLine = lines.find(l => /\bS\.A\b/.test(l) && l.length < 60);
  const empleador = empLine ?? '';

  return {
    periodo, empleador, meses,
    bruto_acumulado, aportes_acumulados,
    indumentaria_aplicada, cuota_medica_aplicada,
    ded_especial, gni, ded_conyuge, ded_hijos, ded_especial_12,
    gnsi, impuesto_determinado,
    retencion_acumulada, retencion_mes, neto_mes,
    _lowConfidence: lowConf,
  };
}

export async function extractRecibo(file: File): Promise<ReciboExtracted> {
  const { loadPDFText } = await import('./_pdf');
  const text = await loadPDFText(file);
  return parsePayslipText(text);
}
