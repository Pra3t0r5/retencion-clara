import type { Transaction } from '../engine/schemas';

// Parser for Fernando's Financial Restructuring Plan CSV export from Google Forms/Sheets
// Columns: Marca temporal,Descripción,Categoría,Moneda,Tipo,Monto,Metodo de pago,
//          Email Address,En ARS,En USD,Cotizacion Mep
//
// Argentine locale quirks:
//   - "En ARS" and "Cotizacion Mep" use format "4.981,49" (dot=thousand, comma=decimal)
//   - "En USD" uses format "3,675833825" (comma=decimal, no thousand sep)
//   - "Monto" is already numeric (no locale formatting)
//   - Dates: "27/08/2025 0:00:00" or "27/08/2025"

function parseARSAmount(raw: string): number {
  if (!raw || raw.trim() === '') return 0;
  // Remove thousand dots, replace decimal comma with period
  return parseFloat(raw.replace(/\./g, '').replace(',', '.')) || 0;
}

function parseUSDAmount(raw: string): number {
  if (!raw || raw.trim() === '') return 0;
  return parseFloat(raw.replace(',', '.')) || 0;
}

function parseDate(raw: string): string {
  // "27/08/2025 0:00:00" or "27/08/2025" → "2025-08-27"
  const parts = raw.trim().split(' ')[0].split('/');
  if (parts.length !== 3) return raw;
  const [d, m, y] = parts;
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

function inferType(raw: string): Transaction['type'] {
  if (raw === 'Ingreso') return 'Ingreso';
  if (raw === 'Transferencia') return 'Transferencia';
  if (raw === 'Inversión' || raw === 'Inversion') return 'Inversión';
  return 'Egreso';
}

export interface ImportResult {
  transactions: Transaction[];
  skipped: number;
  errors: string[];
}

export function parseFRPCSV(csvText: string, importBatch: string): ImportResult {
  const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return { transactions: [], skipped: 0, errors: ['CSV vacío'] };

  // Detect and skip header
  const firstLine = lines[0];
  const startIdx = firstLine.toLowerCase().includes('marca temporal') || firstLine.toLowerCase().includes('timestamp') ? 1 : 0;

  const transactions: Transaction[] = [];
  const errors: string[] = [];
  let skipped = 0;

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    // Parse CSV — handle quoted fields
    const cols = parseCSVLine(line);
    if (cols.length < 8) { skipped++; continue; }

    const [rawDate, description, category, currency, rawType, rawMonto, paymentMethod,, rawARS, rawUSD, rawTC] = cols;

    const date = parseDate(rawDate);
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      errors.push(`Fila ${i + 1}: fecha inválida "${rawDate}"`);
      skipped++;
      continue;
    }

    const type     = inferType(rawType.trim());
    const cur      = currency.trim() as 'ARS' | 'USD';
    const amountARS = parseARSAmount(rawARS);
    const amountUSD = parseUSDAmount(rawUSD);
    const tcMEP    = rawTC ? parseARSAmount(rawTC) : null;
    const native   = parseFloat(rawMonto.replace(',', '.')) || 0;

    transactions.push({
      date,
      description:   description.trim(),
      category:      category.trim() || 'Otros',
      currency:      cur === 'USD' ? 'USD' : 'ARS',
      type,
      amountNative:  native,
      amountARS,
      amountUSD:     amountUSD || (tcMEP && cur === 'ARS' ? amountARS / tcMEP : 0),
      tcMEP,
      paymentMethod: paymentMethod.trim(),
      importBatch,
    });
  }

  return { transactions, skipped, errors };
}

// Minimal CSV parser — handles quoted fields with commas inside
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(field);
      field = '';
    } else {
      field += ch;
    }
  }
  result.push(field);
  return result;
}
