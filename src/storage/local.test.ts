// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageAdapter } from './local';
import { RECIBO_MAR } from '../data';

describe('LocalStorageAdapter', () => {
  const adapter = new LocalStorageAdapter();
  const year = 2026;

  beforeEach(() => {
    localStorage.clear();
  });

  it('loadYear returns empty Map when no data', async () => {
    const result = await adapter.loadYear(year);
    expect(result.size).toBe(0);
  });

  it('saveMonth persists data under key rc_year_2026 with correct month key', async () => {
    await adapter.saveMonth(year, 3, RECIBO_MAR);
    const raw = localStorage.getItem('rc_year_2026');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed['3']).toBeDefined();
    expect(parsed['3'].meses).toBe(3);
  });

  it('loadYear returns correct Map after saveMonth', async () => {
    await adapter.saveMonth(year, 3, RECIBO_MAR);
    const result = await adapter.loadYear(year);
    expect(result.size).toBe(1);
    expect(result.get(3)).toEqual(RECIBO_MAR);
  });

  it('deleteMonth removes entry and leaves others intact', async () => {
    const janData = { ...RECIBO_MAR, meses: 1 };
    await adapter.saveMonth(year, 1, janData);
    await adapter.saveMonth(year, 3, RECIBO_MAR);
    await adapter.deleteMonth(year, 1);
    const result = await adapter.loadYear(year);
    expect(result.size).toBe(1);
    expect(result.has(1)).toBe(false);
    expect(result.get(3)).toEqual(RECIBO_MAR);
  });

  it('deleteMonth on last month clears the key entirely', async () => {
    await adapter.saveMonth(year, 3, RECIBO_MAR);
    await adapter.deleteMonth(year, 3);
    expect(localStorage.getItem('rc_year_2026')).toBeNull();
  });
});
