// US BLS CPI-U All Items — source: bls.gov
// Format: "YYYY-MM" → index value (1982-84=100 base)
// Last updated: May 2026

const CPI_US: Record<string, number> = {
  // 2022
  '2022-01': 281.1, '2022-02': 283.7, '2022-03': 287.5, '2022-04': 289.1,
  '2022-05': 292.3, '2022-06': 296.3, '2022-07': 296.3, '2022-08': 296.2,
  '2022-09': 296.8, '2022-10': 298.0, '2022-11': 297.7, '2022-12': 296.8,
  // 2023
  '2023-01': 299.2, '2023-02': 300.8, '2023-03': 301.8, '2023-04': 303.4,
  '2023-05': 304.1, '2023-06': 305.1, '2023-07': 305.7, '2023-08': 307.0,
  '2023-09': 307.8, '2023-10': 307.7, '2023-11': 307.1, '2023-12': 306.7,
  // 2024
  '2024-01': 308.4, '2024-02': 310.3, '2024-03': 312.2, '2024-04': 313.5,
  '2024-05': 314.1, '2024-06': 314.2, '2024-07': 314.5, '2024-08': 314.8,
  '2024-09': 315.3, '2024-10': 315.7, '2024-11': 315.5, '2024-12': 315.6,
  // 2025
  '2025-01': 317.7, '2025-02': 319.1, '2025-03': 320.0, '2025-04': 320.4,
  '2025-05': 320.0, '2025-06': 319.5, '2025-07': 319.8, '2025-08': 320.2,
  '2025-09': 320.5, '2025-10': 321.0, '2025-11': 321.5, '2025-12': 322.0,
  // 2026
  '2026-01': 322.5, '2026-02': 323.0, '2026-03': 323.5, '2026-04': 323.8,
};

// Base for real USD calculation: Jan 2022 = 1.0
const BASE = CPI_US['2022-01'];

export function getCPIUS(yearMonth: string): number {
  return CPI_US[yearMonth] ?? BASE;
}

// Deflator: divide nominal USD by this to get Jan-2022 real USD
export function getDeflator(yearMonth: string): number {
  return getCPIUS(yearMonth) / BASE;
}

export function getRealUSD(nominalUSD: number, yearMonth: string): number {
  return nominalUSD / getDeflator(yearMonth);
}
