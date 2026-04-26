// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RetentionChart } from './RetentionChart';
import type { ChartPoint } from './RetentionChart';

const THREE_MONTHS: ChartPoint[] = [
  { month: 'Ene', retencion: 500_000,   acumulado:   500_000 },
  { month: 'Mar', retencion: 1_220_274, acumulado: 1_720_274 },
  { month: 'Abr', retencion:   498_657, acumulado: 2_218_931 },
];

const TWELVE_MONTHS: ChartPoint[] = Array.from({ length: 12 }, (_, i) => ({
  month: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][i],
  retencion: 300_000 + i * 80_000,
  acumulado: Array.from({ length: i + 1 }, (_, j) => 300_000 + j * 80_000)
    .reduce((a, b) => a + b, 0),
}));

describe('RetentionChart', () => {
  it('renders nothing when data is empty', () => {
    const { container } = render(<RetentionChart data={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders single-month message when data.length === 1', () => {
    render(<RetentionChart data={[THREE_MONTHS[0]]} />);
    expect(screen.getByText(/Agregá más meses/)).toBeTruthy();
  });

  it('does not render single-month message for 2+ months', () => {
    render(<RetentionChart data={THREE_MONTHS} />);
    expect(screen.queryByText(/Agregá más meses/)).toBeNull();
  });

  // T012 proxy — SVG structure (visual quality at 375px remains manual)
  it('T012 SVG has aria-label and renders for multi-month data', () => {
    const { container } = render(<RetentionChart data={THREE_MONTHS} />);
    const svg = container.querySelector('svg[aria-label]');
    expect(svg).not.toBeNull();
    expect(svg!.getAttribute('aria-label')).toBe('Progresión de retención mensual');
  });

  it('T012 SVG uses viewBox + width=100% — scales to any container including 375px', () => {
    const { container } = render(<RetentionChart data={THREE_MONTHS} />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('viewBox')).toBe('0 0 560 200');
    expect(svg.getAttribute('width')).toBe('100%');
  });

  it('T012 renders one bar rect per data point', () => {
    const { container } = render(<RetentionChart data={THREE_MONTHS} />);
    const svg = container.querySelector('svg')!;
    // Only month bars are <rect> at static render time (tooltip rects appear on hover only)
    const rects = svg.querySelectorAll('rect');
    expect(rects.length).toBe(THREE_MONTHS.length);
  });

  it('T012 renders month labels for each data point', () => {
    render(<RetentionChart data={THREE_MONTHS} />);
    expect(screen.getByText('Ene')).toBeTruthy();
    expect(screen.getByText('Mar')).toBeTruthy();
    expect(screen.getByText('Abr')).toBeTruthy();
  });

  it('T012 renders cumulative line (polyline) through all points', () => {
    const { container } = render(<RetentionChart data={THREE_MONTHS} />);
    const polyline = container.querySelector('polyline');
    expect(polyline).not.toBeNull();
    // polyline has N points = N months (one per data point)
    const points = polyline!.getAttribute('points')!.trim().split(' ');
    expect(points.length).toBe(THREE_MONTHS.length);
  });

  // T017 proxy — computation + render time (real Slow 4G render stays manual)
  it('T017 renders 12-month chart in < 100ms in jsdom', () => {
    const start = performance.now();
    render(<RetentionChart data={TWELVE_MONTHS} />);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
  });

  it('T017 renders correct bar count for 12 months', () => {
    const { container } = render(<RetentionChart data={TWELVE_MONTHS} />);
    const rects = container.querySelector('svg')!.querySelectorAll('rect');
    expect(rects.length).toBe(12);
  });
});
