// INDEC IPC General monthly variation (%) — source: indec.gob.ar
// Format: "YYYY-MM" → monthly pct change as decimal (e.g. 0.06 = 6%)
// Base index rebuilt from Jan 2022 = 100
// Last updated: May 2026

const IPC_MONTHLY_PCT: Record<string, number> = {
  // 2022
  '2022-01': 0.039, '2022-02': 0.047, '2022-03': 0.055, '2022-04': 0.058,
  '2022-05': 0.057, '2022-06': 0.064, '2022-07': 0.071, '2022-08': 0.070,
  '2022-09': 0.083, '2022-10': 0.088, '2022-11': 0.049, '2022-12': 0.057,
  // 2023
  '2023-01': 0.060, '2023-02': 0.066, '2023-03': 0.074, '2023-04': 0.081,
  '2023-05': 0.076, '2023-06': 0.060, '2023-07': 0.113, '2023-08': 0.124,
  '2023-09': 0.128, '2023-10': 0.083, '2023-11': 0.126, '2023-12': 0.254,
  // 2024
  '2024-01': 0.209, '2024-02': 0.134, '2024-03': 0.112, '2024-04': 0.089,
  '2024-05': 0.045, '2024-06': 0.046, '2024-07': 0.040, '2024-08': 0.042,
  '2024-09': 0.034, '2024-10': 0.027, '2024-11': 0.024, '2024-12': 0.026,
  // 2025
  '2025-01': 0.023, '2025-02': 0.024, '2025-03': 0.036, '2025-04': 0.030,
  '2025-05': 0.031, '2025-06': 0.032, '2025-07': 0.032, '2025-08': 0.032,
  '2025-09': 0.029, '2025-10': 0.028, '2025-11': 0.027, '2025-12': 0.027,
  // 2026
  '2026-01': 0.026, '2026-02': 0.024, '2026-03': 0.035, '2026-04': 0.030,
};

// Build cumulative index — Jan 2022 = 100
const _index: Record<string, number> = {};
let _acc = 100;
const _months = Object.keys(IPC_MONTHLY_PCT).sort();
for (const m of _months) {
  _acc = _acc * (1 + IPC_MONTHLY_PCT[m]);
  _index[m] = _acc;
}

export function getIPCIndex(yearMonth: string): number {
  return _index[yearMonth] ?? _acc;
}

// Annual inflation for a given year-month (12-month trailing)
export function getIPCAnual(yearMonth: string): number {
  const [y, mo] = yearMonth.split('-').map(Number);
  const prevYear = `${y - 1}-${String(mo).padStart(2, '0')}`;
  const curr = getIPCIndex(yearMonth);
  const prev = getIPCIndex(prevYear);
  if (!prev) return 0;
  return (curr - prev) / prev;
}
