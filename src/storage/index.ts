import type { PayslipData, F572Data } from '../engine/schemas';

export type FiscalYearData = Map<number, PayslipData>;

export interface StorageAdapter {
  loadYear(year: number): Promise<FiscalYearData>;
  saveMonth(year: number, month: number, data: PayslipData): Promise<void>;
  deleteMonth(year: number, month: number): Promise<void>;
  loadF572(year: number): Promise<F572Data | null>;
  saveF572(year: number, data: F572Data): Promise<void>;
}

export { LocalStorageAdapter } from './local';
