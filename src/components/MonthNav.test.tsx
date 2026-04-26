// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MonthNav } from './MonthNav';

describe('MonthNav — T008', () => {
  it('renders a pill for each loaded month', () => {
    render(<MonthNav months={[3, 1]} active={3} onSelect={vi.fn()} onAddMonth={vi.fn()} />);
    expect(screen.getByText('Ene')).toBeTruthy();
    expect(screen.getByText('Mar')).toBeTruthy();
  });

  it('renders pills sorted ascending regardless of input order', () => {
    render(<MonthNav months={[3, 1]} active={null} onSelect={vi.fn()} onAddMonth={vi.fn()} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons[0].textContent).toBe('Ene');
    expect(buttons[1].textContent).toBe('Mar');
  });

  it('renders + Agregar mes button', () => {
    render(<MonthNav months={[3, 1]} active={3} onSelect={vi.fn()} onAddMonth={vi.fn()} />);
    expect(screen.getByText('+ Agregar mes')).toBeTruthy();
  });

  it('calls onSelect with correct month number on pill click', () => {
    const onSelect = vi.fn();
    render(<MonthNav months={[3, 1]} active={3} onSelect={onSelect} onAddMonth={vi.fn()} />);
    fireEvent.click(screen.getByText('Ene'));
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it('calls onSelect(3) when Mar clicked', () => {
    const onSelect = vi.fn();
    render(<MonthNav months={[3, 1]} active={1} onSelect={onSelect} onAddMonth={vi.fn()} />);
    fireEvent.click(screen.getByText('Mar'));
    expect(onSelect).toHaveBeenCalledWith(3);
  });

  it('calls onAddMonth when + Agregar mes clicked', () => {
    const onAddMonth = vi.fn();
    render(<MonthNav months={[3, 1]} active={3} onSelect={vi.fn()} onAddMonth={onAddMonth} />);
    fireEvent.click(screen.getByText('+ Agregar mes'));
    expect(onAddMonth).toHaveBeenCalledOnce();
  });

  it('active month pill has fontWeight 600; inactive has 400', () => {
    render(<MonthNav months={[3, 1]} active={3} onSelect={vi.fn()} onAddMonth={vi.fn()} />);
    expect(screen.getByText('Mar').style.fontWeight).toBe('600');
    expect(screen.getByText('Ene').style.fontWeight).toBe('400');
  });

  it('+ Agregar mes has primary border when active is null', () => {
    render(<MonthNav months={[3, 1]} active={null} onSelect={vi.fn()} onAddMonth={vi.fn()} />);
    const addBtn = screen.getByText('+ Agregar mes');
    expect(addBtn.style.border).toBe('1.5px solid var(--primary)');
  });

  it('switching month: onSelect called with new month, not old', () => {
    const onSelect = vi.fn();
    const { rerender } = render(
      <MonthNav months={[3, 1, 4]} active={3} onSelect={onSelect} onAddMonth={vi.fn()} />
    );
    fireEvent.click(screen.getByText('Abr'));
    expect(onSelect).toHaveBeenCalledWith(4);
    expect(onSelect).not.toHaveBeenCalledWith(3);

    // Simulate parent updating active to 4 after click
    rerender(<MonthNav months={[3, 1, 4]} active={4} onSelect={onSelect} onAddMonth={vi.fn()} />);
    expect(screen.getByText('Abr').style.fontWeight).toBe('600');
    expect(screen.getByText('Mar').style.fontWeight).toBe('400');
  });
});
