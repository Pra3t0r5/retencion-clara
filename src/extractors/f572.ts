import type { F572Data } from '../engine/schemas';

type MonthKey = 'enero'|'febrero'|'marzo'|'abril'|'mayo'|'junio'|
                'julio'|'agosto'|'septiembre'|'octubre'|'noviembre'|'diciembre';

const MONTH_SET = new Set<string>([
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
]);

function parseARS(str: string): number {
  return parseFloat(str.replace(/\./g, '').replace(',', '.'));
}

function isNumeric(s: string): boolean {
  return /^\d[\d.,]+$/.test(s);
}

export type F572Extracted = Partial<F572Data> & { _lowConfidence: string[] };

export function parseF572Text(text: string): F572Extracted {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const lowConf: string[] = [];

  const cuota_medica: Record<string, number> = {};
  const indumentaria: Record<string, number> = {};

  // Detect cónyuge and hijos from cargas de familia section
  const conyuge = lines.some(l => l === 'Cónyuge');
  const hijos = lines.filter(l => l.startsWith('Hijo/a')).length;

  // State machine: track which deduction section we're in
  type Section = 'none' | 'cuota' | 'ind';
  let section: Section = 'none';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Section headers
    if (line === 'Cuotas Médico Asistenciales') { section = 'cuota'; continue; }
    if (line.startsWith('Gastos de Adquisición de Indumentaria')) { section = 'ind'; continue; }

    // Month + amount accumulation
    if (section !== 'none' && MONTH_SET.has(line)) {
      // Next numeric line is the amount for this month
      for (let j = i + 1; j < Math.min(lines.length, i + 4); j++) {
        if (isNumeric(lines[j])) {
          const key = line.toLowerCase() as MonthKey;
          const amount = parseARS(lines[j]);
          if (section === 'cuota') cuota_medica[key] = (cuota_medica[key] ?? 0) + amount;
          else indumentaria[key] = (indumentaria[key] ?? 0) + amount;
          break;
        }
      }
    }
  }

  if (Object.keys(cuota_medica).length === 0) lowConf.push('cuota_medica');
  if (Object.keys(indumentaria).length === 0) lowConf.push('indumentaria');

  return { conyuge, hijos, cuota_medica, indumentaria, _lowConfidence: lowConf };
}

export async function extractF572(file: File): Promise<F572Extracted> {
  const { loadPDFText } = await import('./_pdf');
  const text = await loadPDFText(file);
  return parseF572Text(text);
}
