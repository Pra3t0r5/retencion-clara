// @vitest-environment jsdom
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { RECIBO_MAR, RECIBO_ABR } from './data';

// jsdom doesn't implement matchMedia — App uses it via useIsDesktop hook
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

beforeEach(() => {
  localStorage.clear();
});

describe('App — T014: localStorage restore on mount', () => {
  it('restores March + April from localStorage and renders MonthNav with both pills', async () => {
    localStorage.setItem(
      'rc_year_2026',
      JSON.stringify({ '3': RECIBO_MAR, '4': RECIBO_ABR })
    );

    render(<App />);

    // Async: useEffect fires loadYear().then() → setFiscalYear → MonthNav renders
    await waitFor(() => {
      expect(screen.getAllByText('Mar').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Abr').length).toBeGreaterThan(0);
    });
  });

  it('renders welcome screen (no MonthNav) when localStorage is empty', async () => {
    render(<App />);

    // Give the async loadYear time to resolve with empty Map
    await waitFor(() => {
      // MonthNav only renders when fiscalYear.size > 0
      // "+ Agregar mes" button is a MonthNav-only element
      expect(screen.queryByText('+ Agregar mes')).toBeNull();
    });
  });

  it('sets most recent month as active after restore', async () => {
    // App sorts loaded months and sets last one active
    localStorage.setItem(
      'rc_year_2026',
      JSON.stringify({ '3': RECIBO_MAR, '4': RECIBO_ABR })
    );

    render(<App />);

    await waitFor(() => {
      // April (month 4) is last — its pill should have fontWeight 600 (active)
      const abrPills = screen.getAllByText('Abr').filter(
        el => el.tagName === 'BUTTON'
      );
      expect(abrPills.length).toBeGreaterThan(0);
      expect(abrPills[0].style.fontWeight).toBe('600');
    });
  });
});
