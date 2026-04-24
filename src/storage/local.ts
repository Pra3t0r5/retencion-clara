import type { PayslipData } from '../engine/schemas';
import type { StorageAdapter, FiscalYearData } from '.';

export class LocalStorageAdapter implements StorageAdapter {
  private key(year: number): string {
    return `rc_year_${year}`;
  }

  async loadYear(year: number): Promise<FiscalYearData> {
    const raw = localStorage.getItem(this.key(year));
    if (!raw) return new Map();
    const obj: Record<string, PayslipData> = JSON.parse(raw);
    return new Map(Object.entries(obj).map(([k, v]) => [Number(k), v]));
  }

  async saveMonth(year: number, month: number, data: PayslipData): Promise<void> {
    const current = await this.loadYear(year);
    current.set(month, data);
    localStorage.setItem(this.key(year), JSON.stringify(Object.fromEntries(current)));
  }

  async deleteMonth(year: number, month: number): Promise<void> {
    const current = await this.loadYear(year);
    current.delete(month);
    if (current.size === 0) {
      localStorage.removeItem(this.key(year));
    } else {
      localStorage.setItem(this.key(year), JSON.stringify(Object.fromEntries(current)));
    }
  }
}
