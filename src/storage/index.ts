import type { PayslipData } from '../engine/schemas';

export type FiscalYearData = Map<number, PayslipData>;

export interface StorageAdapter {
  loadYear(year: number): Promise<FiscalYearData>;
  saveMonth(year: number, month: number, data: PayslipData): Promise<void>;
  deleteMonth(year: number, month: number): Promise<void>;
}

export { LocalStorageAdapter } from './local';
